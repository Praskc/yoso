import type { AppEvents, CapturedFrame } from '../../../application/events/app-events'
import type { EventBus } from '../../../application/ports/event-bus'
import { HAND_CONNECTIONS } from '../../assets/hand-connections'
import type { Toast } from '../toast/toast'

const CONNECTOR_COLOR = 'rgba(56,189,248,0.80)'
const CONNECTOR_WIDTH = 2
const LANDMARK_COLOR = '#38BDF8'
const LANDMARK_RADIUS = 3
const LIGHT_CHECK_INTERVAL_FRAMES = 90
const LIGHT_SAMPLE_WIDTH = 32
const LIGHT_SAMPLE_HEIGHT = 18
const LIGHT_THRESHOLD = 40
const LOW_LIGHT_TOAST_ID = 'light'
const LOW_LIGHT_TOAST_MESSAGE =
  'Poca luz detectada: busca una fuente de luz frente a ti para mejorar la precisión.'

export class CameraOverlay {
  private readonly ctx: CanvasRenderingContext2D | null
  private readonly lightCanvas: HTMLCanvasElement
  private readonly lightCtx: CanvasRenderingContext2D | null
  private frameCount = 0
  private lowLightVisible = false

  constructor(
    bus: EventBus<AppEvents>,
    private readonly toast: Toast,
    private readonly video: HTMLVideoElement,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.ctx = canvas.getContext('2d')
    this.lightCanvas = document.createElement('canvas')
    this.lightCanvas.width = LIGHT_SAMPLE_WIDTH
    this.lightCanvas.height = LIGHT_SAMPLE_HEIGHT
    this.lightCtx = this.lightCanvas.getContext('2d', { willReadFrequently: true })
    bus.on('frameCaptured', payload => this.render(payload))
  }

  private render(payload: CapturedFrame): void {
    if (!this.ctx) return
    const width = this.video.videoWidth
    const height = this.video.videoHeight
    if (width === 0 || height === 0) return

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }

    this.frameCount++
    if (this.frameCount % LIGHT_CHECK_INTERVAL_FRAMES === 0) this.checkLight()

    const ctx = this.ctx
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(this.video, 0, 0, width, height)
    ctx.restore()

    if (payload.detection) this.drawHand(payload.detection.points, width, height)
  }

  private drawHand(points: readonly { x: number; y: number }[], width: number, height: number): void {
    const ctx = this.ctx
    if (!ctx) return

    ctx.save()
    ctx.strokeStyle = CONNECTOR_COLOR
    ctx.lineWidth = CONNECTOR_WIDTH
    ctx.beginPath()
    for (const [from, to] of HAND_CONNECTIONS) {
      const origin = points[from]
      const target = points[to]
      if (!origin || !target) continue
      ctx.moveTo((1 - origin.x) * width, origin.y * height)
      ctx.lineTo((1 - target.x) * width, target.y * height)
    }
    ctx.stroke()

    ctx.fillStyle = LANDMARK_COLOR
    for (const point of points) {
      ctx.beginPath()
      ctx.arc((1 - point.x) * width, point.y * height, LANDMARK_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private checkLight(): void {
    if (!this.lightCtx || this.video.videoWidth === 0) return

    let dark: boolean
    try {
      this.lightCtx.drawImage(this.video, 0, 0, LIGHT_SAMPLE_WIDTH, LIGHT_SAMPLE_HEIGHT)
      const { data } = this.lightCtx.getImageData(0, 0, LIGHT_SAMPLE_WIDTH, LIGHT_SAMPLE_HEIGHT)
      let total = 0
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      }
      dark = total / (data.length / 4) < LIGHT_THRESHOLD
    } catch {
      return
    }

    if (dark === this.lowLightVisible) return
    this.lowLightVisible = dark
    if (dark) {
      this.toast.show(LOW_LIGHT_TOAST_ID, LOW_LIGHT_TOAST_MESSAGE, 'warn', 0)
    } else {
      this.toast.hide(LOW_LIGHT_TOAST_ID)
    }
  }
}
