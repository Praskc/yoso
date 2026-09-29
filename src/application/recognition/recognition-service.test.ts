import { describe, expect, it } from 'vitest'
import { DEFAULT_RECOGNITION_CONFIG } from '../../domain/recognition/config'
import { MODEL_CLASSES, NO_DETECTION } from '../../domain/alphabet'
import type { HandDetection } from '../../domain/recognition/types'
import { TypedEventBus } from '../../shared/typed-event-bus'
import type { AppEvents, PredictionSnapshot } from '../events/app-events'
import type { Classifier } from '../ports/classifier'
import { RecognitionService } from './recognition-service'

class FakeClassifier implements Classifier {
  readonly logits = new Float32Array(MODEL_CLASSES.length)

  async classify(): Promise<Float32Array> {
    return this.logits
  }
}

const detectionAt = (x: number, y: number): HandDetection => {
  const points = Array.from({ length: 21 }, () => ({ x, y, z: 0 }))
  points[9] = { x: x + 0.1, y, z: 0 }
  return { points, handedness: { label: 'Right', score: 0.9 } }
}

const createService = () => {
  const bus = new TypedEventBus<AppEvents>()
  const classifier = new FakeClassifier()
  let nowMs = 1000
  const clock = { now: () => nowMs }
  const service = new RecognitionService(bus, clock, DEFAULT_RECOGNITION_CONFIG)
  service.useModel({ classifier, centroids: null })

  const predictions: PredictionSnapshot[] = []
  const confirmed: string[] = []
  const rangeStates: string[] = []
  const stability: boolean[] = []
  let clearedCount = 0

  bus.on('prediction', payload => predictions.push({ ...payload }))
  bus.on('letterConfirmed', payload => confirmed.push(payload.letter))
  bus.on('rangeState', payload => rangeStates.push(payload.status))
  bus.on('handStability', payload => stability.push(payload.stable))
  bus.on('handCleared', () => { clearedCount += 1 })

  return {
    bus,
    service,
    classifier,
    clock,
    predictions,
    confirmed,
    rangeStates,
    stability,
    cleared: () => clearedCount,
    setTime: (value: number) => { nowMs = value },
  }
}

describe('RecognitionService', () => {
  it('clears state when no hand is detected', async () => {
    const harness = createService()
    await harness.service.handleDetection(null)

    expect(harness.rangeStates).toEqual(['none'])
    expect(harness.cleared()).toBe(1)
    expect(harness.predictions).toHaveLength(0)
  })

  it('warns and clears when the hand leaves the detection range', async () => {
    const harness = createService()
    await harness.service.handleDetection(detectionAt(0.05, 0.5))

    expect(harness.rangeStates).toEqual(['out-of-range'])
    expect(harness.cleared()).toBe(1)
    expect(harness.predictions).toHaveLength(0)
  })

  it('emits a prediction for a confident letter', async () => {
    const harness = createService()
    harness.classifier.logits[0] = 10
    await harness.service.handleDetection(detectionAt(0.5, 0.5))

    expect(harness.rangeStates).toEqual(['in-range'])
    expect(harness.stability).toEqual([false])
    expect(harness.predictions).toHaveLength(1)
    expect(harness.predictions[0].letter).toBe('A')
    expect(harness.predictions[0].effectiveConfidence).toBeGreaterThan(0.82)
    expect(harness.predictions[0].isLeftHand).toBe(false)
  })

  it('reports no detection when confidence is below the threshold', async () => {
    const harness = createService()
    await harness.service.handleDetection(detectionAt(0.5, 0.5))

    expect(harness.predictions[0].letter).toBe(NO_DETECTION)
    expect(harness.predictions[0].effectiveConfidence).toBeLessThan(0.82)
  })

  it('confirms a letter only after the voting buffer fills', async () => {
    const harness = createService()
    harness.classifier.logits[0] = 10

    for (let i = 0; i < 8; i++) await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.confirmed).toEqual([])

    await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.confirmed).toEqual(['A'])

    await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.confirmed).toEqual(['A'])
  })

  it('lets the cooldown elapse before confirming the same letter again', async () => {
    const harness = createService()
    harness.classifier.logits[0] = 10

    for (let i = 0; i < 9; i++) await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.confirmed).toEqual(['A'])

    harness.setTime(1000 + 1800)
    for (let i = 0; i < 9; i++) await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.confirmed).toEqual(['A', 'A'])
  })

  it('applies the kinetic shield to commands on the first frames', async () => {
    const harness = createService()
    harness.classifier.logits[26] = 10

    await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.predictions[0].letter).toBe(NO_DETECTION)

    await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.predictions[1].letter).toBe(' ')
  })

  it('clears the cooldown on a full reset', async () => {
    const harness = createService()
    harness.classifier.logits[0] = 10

    for (let i = 0; i < 9; i++) await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.confirmed).toEqual(['A'])

    harness.service.reset(true)
    for (let i = 0; i < 9; i++) await harness.service.handleDetection(detectionAt(0.5, 0.5))
    expect(harness.confirmed).toEqual(['A', 'A'])
  })
})