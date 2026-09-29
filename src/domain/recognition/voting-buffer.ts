import { MODEL_CLASSES, NO_DETECTION } from '../alphabet'
import { requiredWeightFor, type RecognitionConfig } from './config'

export const DISCARD_VOTE = -1

export interface VotingTally {
  candidateIndex: number
  candidateWeight: number
  progress: number
  full: boolean
}

export interface VotingBuffer {
  push(voteIndex: number, weight: number): void
  tally(): VotingTally
  projectVotesInto(out: string[]): void
  reset(): void
}

export function createVotingBuffer(config: RecognitionConfig): VotingBuffer {
  const size = config.bufferSize
  const requiredWeight = requiredWeightFor(config)
  const voteIndices = new Int8Array(size)
  const voteWeights = new Float32Array(size)
  const weightPerLetter = new Float32Array(MODEL_CLASSES.length)
  let head = 0
  let full = false
  const result: VotingTally = { candidateIndex: DISCARD_VOTE, candidateWeight: 0, progress: 0, full: false }

  const reset = (): void => {
    voteIndices.fill(DISCARD_VOTE)
    voteWeights.fill(0)
    head = 0
    full = false
  }
  reset()

  return {
    push(voteIndex, weight) {
      voteIndices[head] = voteIndex
      voteWeights[head] = weight
      head = (head + 1) % size
      if (head === 0) full = true
    },
    tally() {
      weightPerLetter.fill(0)
      result.candidateIndex = DISCARD_VOTE
      result.candidateWeight = 0
      result.full = full
      const limit = full ? size : head
      for (let slot = 0; slot < limit; slot++) {
        const letterIndex = voteIndices[slot]
        if (letterIndex === DISCARD_VOTE) continue
        const accumulated = weightPerLetter[letterIndex] + voteWeights[slot]
        weightPerLetter[letterIndex] = accumulated
        if (accumulated > result.candidateWeight) {
          result.candidateWeight = accumulated
          result.candidateIndex = letterIndex
        }
      }
      result.progress = full ? Math.min(result.candidateWeight / requiredWeight, 1.0) : 0
      return result
    },
    projectVotesInto(out) {
      for (let i = 0; i < size; i++) {
        if (!full && i >= head) {
          out[i] = ''
          continue
        }
        const slot = full ? (head + i) % size : i
        const letterIndex = voteIndices[slot]
        out[i] = letterIndex === DISCARD_VOTE ? NO_DETECTION : MODEL_CLASSES[letterIndex]
      }
    },
    reset,
  }
}