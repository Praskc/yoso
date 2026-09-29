export interface FrameScheduler {
  start(): void
  stop(): void
  setPaused(paused: boolean): void
}

export interface FrameSchedulerFactory {
  create(onFrame: (timestampMs: number, fps: number) => void): FrameScheduler
}