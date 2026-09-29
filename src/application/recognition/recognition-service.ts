import { MODEL_CLASSES, NO_DETECTION, isCommand } from '../../domain/alphabet'
import { extractFeatures, FEATURE_COUNT } from '../../domain/recognition/extract-features'
import { requiredWeightFor, type RecognitionConfig } from '../../domain/recognition/config'
import { createCooldownPolicy } from '../../domain/recognition/cooldown-policy'
import { createGrayZoneFilter, type GrayZoneOutcome } from '../../domain/recognition/gray-zone-filter'
import { createJitterMeter } from '../../domain/recognition/jitter'
import { indexCentroidsByClass } from '../../domain/recognition/centroids'
import { isWithinDetectionRange } from '../../domain/recognition/range-check'
import { judgeUorR } from '../../domain/recognition/ur-judge'
import { softmax } from '../../domain/recognition/softmax'
import { createVotingBuffer, DISCARD_VOTE } from '../../domain/recognition/voting-buffer'
import type { HandDetection, TopPrediction } from '../../domain/recognition/types'
import type { AppEvents } from '../events/app-events'
import type { Clock } from '../ports/clock'
import type { EventBus } from '../ports/event-bus'
import type { RecognitionModel } from '../ports/recognition-model-source'

const CLASS_COUNT = MODEL_CLASSES.length
const TOP_PREDICTION_COUNT = 3

export class RecognitionService {
  private readonly features = new Float32Array(FEATURE_COUNT)
  private readonly probabilities = new Float32Array(CLASS_COUNT)
  private readonly projectedVotes: string[]
  private readonly topPredictions: TopPrediction[]
  private readonly outcome: GrayZoneOutcome = { effectiveConfidence: 0, distance: null, distRef: null }
  private readonly votingBuffer
  private readonly cooldown
  private readonly grayZoneFilter
  private readonly jitterMeter
  private readonly requiredWeight: number
  private classifier: RecognitionModel['classifier'] | null = null
  private centroidsByClass = indexCentroidsByClass(null)
  private processing = false

  constructor(
    private readonly bus: EventBus<AppEvents>,
    private readonly clock: Clock,
    private readonly config: RecognitionConfig,
  ) {
    this.votingBuffer = createVotingBuffer(config)
    this.cooldown = createCooldownPolicy(config)
    this.grayZoneFilter = createGrayZoneFilter(config)
    this.jitterMeter = createJitterMeter()
    this.requiredWeight = requiredWeightFor(config)
    this.projectedVotes = new Array<string>(config.bufferSize).fill('')
    this.topPredictions = Array.from(
      { length: TOP_PREDICTION_COUNT },
      () => ({ letter: '', probability: 0 })
    )
  }

  useModel(model: RecognitionModel): void {
    this.classifier = model.classifier
    this.centroidsByClass = indexCentroidsByClass(model.centroids)
  }

  reset(full = false): void {
    this.votingBuffer.reset()
    if (full) this.cooldown.reset()
  }

  async handleDetection(detection: HandDetection | null): Promise<void> {
    if (!detection) {
      this.bus.emit('rangeState', { status: 'none' })
      this.bus.emit('handCleared', undefined)
      this.votingBuffer.reset()
      return
    }

    const withinRange = isWithinDetectionRange(detection.points, this.config.range)
    this.bus.emit('rangeState', { status: withinRange ? 'in-range' : 'out-of-range' })

    if (!withinRange) {
      this.bus.emit('handCleared', undefined)
      this.votingBuffer.reset()
      return
    }

    const jitter = this.jitterMeter.measure(detection.points[0])
    this.bus.emit('handStability', { stable: jitter <= this.config.stabilityJitterThreshold })

    await this.processFrame(detection, jitter)
  }

  private async processFrame(detection: HandDetection, jitter: number): Promise<void> {
    if (!this.classifier || this.processing) return
    this.processing = true
    try {
      const isLeftHand = detection.handedness.label === 'Left'
      if (!extractFeatures(detection.points, isLeftHand, this.features)) return

      const inferenceStartMs = this.clock.now()
      const logits = await this.classifier.classify(this.features)
      const inferenceLatencyMs = this.clock.now() - inferenceStartMs

      const peakIndex = softmax(logits, this.probabilities)
      const networkConfidence = this.probabilities[peakIndex]

      const judgedLetter = judgeUorR(MODEL_CLASSES[peakIndex], detection.points, isLeftHand)
      const letterIndex = MODEL_CLASSES.indexOf(judgedLetter)

      this.grayZoneFilter.apply(
        this.centroidsByClass[letterIndex],
        this.features,
        networkConfidence,
        this.outcome
      )
      const effectiveConfidence = this.outcome.effectiveConfidence

      let detectedLetter = effectiveConfidence >= this.config.confidenceThreshold
        ? judgedLetter
        : NO_DETECTION
      if (isCommand(detectedLetter) && jitter > this.config.kineticJitterThreshold) {
        detectedLetter = NO_DETECTION
      }

      this.fillTopPredictions()

      const voteIndex = detectedLetter === NO_DETECTION ? DISCARD_VOTE : MODEL_CLASSES.indexOf(detectedLetter)
      const voteWeight = detectedLetter === NO_DETECTION ? 0 : effectiveConfidence
      this.votingBuffer.push(voteIndex, voteWeight)
      const tally = this.votingBuffer.tally()

      this.bus.emit('prediction', {
        letter: detectedLetter,
        effectiveConfidence,
        inferenceLatencyMs,
        isLeftHand,
      })

      this.votingBuffer.projectVotesInto(this.projectedVotes)
      this.bus.emit('debugUpdated', {
        networkConfidence,
        effectiveConfidence,
        distance: this.outcome.distance,
        distRef: this.outcome.distRef,
        voteBuffer: this.projectedVotes,
        topPredictions: this.topPredictions,
        bufferProgress: tally.progress,
      })

      if (!tally.full) return
      if (tally.candidateWeight < this.requiredWeight) return

      const candidate = MODEL_CLASSES[tally.candidateIndex]
      const nowMs = this.clock.now()
      if (!this.cooldown.canConfirm(candidate, nowMs)) return

      this.cooldown.markConfirmed(candidate, nowMs)
      this.votingBuffer.reset()
      this.bus.emit('letterConfirmed', { letter: candidate })
    } catch (error) {
      console.error('[RecognitionService]', error)
    } finally {
      this.processing = false
    }
  }

  private fillTopPredictions(): void {
    let i0 = 0
    let i1 = 0
    let i2 = 0
    let p0 = -Infinity
    let p1 = -Infinity
    let p2 = -Infinity
    for (let i = 0; i < this.probabilities.length; i++) {
      const p = this.probabilities[i]
      if (p > p0) {
        p2 = p1
        i2 = i1
        p1 = p0
        i1 = i0
        p0 = p
        i0 = i
      } else if (p > p1) {
        p2 = p1
        i2 = i1
        p1 = p
        i1 = i
      } else if (p > p2) {
        p2 = p
        i2 = i
      }
    }
    this.topPredictions[0].letter = MODEL_CLASSES[i0]
    this.topPredictions[0].probability = p0
    this.topPredictions[1].letter = MODEL_CLASSES[i1]
    this.topPredictions[1].probability = p1
    this.topPredictions[2].letter = MODEL_CLASSES[i2]
    this.topPredictions[2].probability = p2
  }
}