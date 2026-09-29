import type { RangeConfig } from './range-check'

export interface RecognitionConfig {
  confidenceThreshold: number
  geoPenaltyWeight: number
  bufferSize: number
  requiredVotes: number
  cooldownMs: number
  sameLetterCooldownMs: number
  commandCooldownMs: number
  kineticJitterThreshold: number
  stabilityJitterThreshold: number
  range: RangeConfig
}

export const DEFAULT_RECOGNITION_CONFIG: RecognitionConfig = {
  confidenceThreshold: 0.82,
  geoPenaltyWeight: 0.20,
  bufferSize: 9,
  requiredVotes: 7,
  cooldownMs: 800,
  sameLetterCooldownMs: 1800,
  commandCooldownMs: 400,
  kineticJitterThreshold: 0.02,
  stabilityJitterThreshold: 0.03,
  range: { topLimit: 0.10, leftLimit: 0.15, rightLimit: 0.85 },
}

export function requiredWeightFor(config: RecognitionConfig): number {
  return config.requiredVotes * config.confidenceThreshold
}