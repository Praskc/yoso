import type { CameraError } from '../ports/camera'
import type { AppMode } from '../modes/mode-controller'
import type { HandDetection, TopPrediction } from '../../domain/recognition/types'

export interface PredictionSnapshot {
  letter: string
  effectiveConfidence: number
  inferenceLatencyMs: number
  isLeftHand: boolean
}

export interface DebugSnapshot {
  networkConfidence: number
  effectiveConfidence: number
  distance: number | null
  distRef: number | null
  voteBuffer: string[]
  topPredictions: TopPrediction[]
  bufferProgress: number
}

export interface CapturedFrame {
  detection: HandDetection | null
  timestampMs: number
  fps: number
  detectionLatencyMs: number
}

export type CameraStatus = { ok: true } | { ok: false; reason: CameraError }

export type RangeStatus = 'in-range' | 'out-of-range' | 'none'

export type GameFeedback =
  | { kind: 'waiting' }
  | { kind: 'loading' }
  | { kind: 'detected'; letter: string; confidence: number }
  | { kind: 'correct' }
  | { kind: 'needs-letter'; signed: string; expected: string; attemptsLeft: number }
  | { kind: 'word-complete' }
  | { kind: 'level-up'; levelIndex: number }
  | { kind: 'word-skipped' }
  | { kind: 'fallback-bank' }
  | { kind: 'show-guide' }

export type GameEvent =
  | { type: 'word-started'; word: string; levelIndex: number }
  | { type: 'letter-matched'; position: number }
  | { type: 'attempts'; errors: number }
  | { type: 'progress'; completed: number; required: number }
  | { type: 'word-completed'; word: string; streak: number; score: number }
  | { type: 'level-changed'; levelIndex: number }
  | { type: 'word-skipped' }
  | { type: 'hint-hidden' }
  | { type: 'score'; score: number }
  | { type: 'source'; source: string }
  | { type: 'feedback'; feedback: GameFeedback }

export interface AppEvents extends Record<string, unknown> {
  frameCaptured: CapturedFrame
  rangeState: { status: RangeStatus }
  handStability: { stable: boolean }
  handCleared: undefined
  prediction: PredictionSnapshot
  letterConfirmed: { letter: string }
  debugUpdated: DebugSnapshot
  cameraStatus: CameraStatus
  modeChanged: { mode: AppMode }
  gameEvent: GameEvent
}