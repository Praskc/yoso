const FPS_SAMPLE_COUNT = 60
const VIDEO_READY_STATE = 2

interface VideoFrameCallbackHost {
  requestVideoFrameCallback(callback: () => void): number
}

export class FrameLoop {
  private readonly usesVideoFrameCallback: boolean
  private readonly fpsTimestamps = new Float64Array(FPS_SAMPLE_COUNT)
  private fpsHead = 0
  private fpsFill = 0
  private paused = false
  private started = false
  private lastVideoTime = -1

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly onFrame: (timestampMs: number, fps: number) => void,
  ) {
    this.usesVideoFrameCallback =
      typeof (video as Partial<VideoFrameCallbackHost>).requestVideoFrameCallback === 'function'
  }

  setPaused(paused: boolean): void {
    this.paused = paused
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.scheduleNext()
  }

  stop(): void {
    this.started = false
  }

  private scheduleNext(): void {
    if (!this.started) return
    if (this.usesVideoFrameCallback) {
      ;(this.video as unknown as VideoFrameCallbackHost).requestVideoFrameCallback(this.tick)
    } else {
      requestAnimationFrame(this.tick)
    }
  }

  private readonly tick = (): void => {
    this.scheduleNext()
    if (this.paused || this.video.readyState < VIDEO_READY_STATE) return
    if (this.video.currentTime === this.lastVideoTime) return
    this.lastVideoTime = this.video.currentTime

    const now = performance.now()
    this.onFrame(now, this.recordFps(now))
  }

  private recordFps(now: number): number {
    const oldest = this.fpsFill >= 2
      ? this.fpsTimestamps[this.fpsFill < FPS_SAMPLE_COUNT ? 0 : this.fpsHead]
      : 0
    this.fpsTimestamps[this.fpsHead] = now
    this.fpsHead = (this.fpsHead + 1) % FPS_SAMPLE_COUNT
    if (this.fpsFill < FPS_SAMPLE_COUNT) this.fpsFill++
    return this.fpsFill >= 2 ? (this.fpsFill - 1) / ((now - oldest) / 1000) : 0
  }
}