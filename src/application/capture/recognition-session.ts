import type { AppEvents } from '../events/app-events'
import type { Camera } from '../ports/camera'
import { CameraFailure } from '../ports/camera'
import type { Clock } from '../ports/clock'
import type { EventBus } from '../ports/event-bus'
import type { FrameScheduler, FrameSchedulerFactory } from '../ports/frame-scheduler'
import type { HandTracker, TrackerFactory } from '../ports/hand-tracker'
import type { RecognitionService } from '../recognition/recognition-service'

export class RecognitionSession {
  private tracker: HandTracker | null = null
  private scheduler: FrameScheduler | null = null
  private starting = false

  constructor(
    private readonly camera: Camera,
    private readonly trackerFactory: TrackerFactory,
    private readonly schedulerFactory: FrameSchedulerFactory,
    private readonly recognition: RecognitionService,
    private readonly bus: EventBus<AppEvents>,
    private readonly clock: Clock,
  ) {
    this.camera.onPermissionGranted(() => {
      this.bus.emit('cameraStatus', { ok: true })
      void this.start()
    })
  }

  async start(): Promise<void> {
    if (this.starting) return
    this.starting = true
    try {
      const video = await this.camera.start()
      this.bus.emit('cameraStatus', { ok: true })
      this.tracker = await this.trackerFactory.create(video)
      this.scheduler = this.schedulerFactory.create(
        (timestampMs, fps) => this.handleFrame(timestampMs, fps)
      )
      this.scheduler.start()
    } catch (error) {
      const reason = error instanceof CameraFailure ? error.reason : 'other'
      if (!(error instanceof CameraFailure)) console.error('[RecognitionSession]', error)
      this.bus.emit('cameraStatus', { ok: false, reason })
    } finally {
      this.starting = false
    }
  }

  setPaused(paused: boolean): void {
    this.scheduler?.setPaused(paused)
    if (paused) {
      this.recognition.reset(true)
      this.bus.emit('handCleared', undefined)
    }
  }

  private handleFrame(timestampMs: number, fps: number): void {
    if (!this.tracker) return
    const startMs = this.clock.now()
    const detection = this.tracker.detect(timestampMs)
    const detectionLatencyMs = this.clock.now() - startMs
    this.bus.emit('frameCaptured', { detection, timestampMs, fps, detectionLatencyMs })
    void this.recognition.handleDetection(detection)
  }
}