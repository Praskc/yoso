import type { HandDetection } from '../../domain/recognition/types'

export interface HandTracker {
  detect(timestampMs: number): HandDetection | null
  close(): void
}

export interface TrackerFactory {
  create(video: HTMLVideoElement): Promise<HandTracker>
}