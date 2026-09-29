import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CapturedFrame } from '../../../application/events/app-events'
import type { AppEvents } from '../../../application/events/app-events'
import type { HandDetection, Point } from '../../../domain/recognition/types'
import { TypedEventBus } from '../../../shared/typed-event-bus'
import type { Toast } from '../toast/toast'
import { CameraOverlay } from './camera-overlay'

const LIGHT_CANVAS_PIXELS = 32 * 18

const createFakeContext = (lightness: number) => {
  const data = new Uint8ClampedArray(LIGHT_CANVAS_PIXELS * 4)
  data.fill(lightness)
  return {
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    getImageData: vi.fn(() => ({ data })),
  }
}

const detectionWith = (first: Point): HandDetection => ({
  points: Array.from({ length: 21 }, (_, index) => (index === 0 ? first : { x: 0.5, y: 0.5, z: 0 })),
  handedness: { label: 'Right', score: 0.99 },
})

const frame = (detection: HandDetection | null): CapturedFrame => ({
  detection,
  timestampMs: 0,
  fps: 30,
  detectionLatencyMs: 2,
})

describe('CameraOverlay', () => {
  let bus: TypedEventBus<AppEvents>
  let context: ReturnType<typeof createFakeContext>
  let video: HTMLVideoElement
  let canvas: HTMLCanvasElement
  let toast: { show: ReturnType<typeof vi.fn>; hide: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    bus = new TypedEventBus<AppEvents>()
    context = createFakeContext(10)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D)

    video = document.createElement('video')
    Object.defineProperty(video, 'videoWidth', { value: 100, configurable: true })
    Object.defineProperty(video, 'videoHeight', { value: 50, configurable: true })

    canvas = document.createElement('canvas')
    toast = { show: vi.fn(), hide: vi.fn() }
    new CameraOverlay(bus, toast as unknown as Toast, video, canvas)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sizes the canvas to the video and mirrors the frame', () => {
    bus.emit('frameCaptured', frame(null))

    expect(canvas.width).toBe(100)
    expect(canvas.height).toBe(50)
    expect(context.drawImage).toHaveBeenCalledWith(video, 0, 0, 100, 50)
    expect(context.scale).toHaveBeenCalledWith(-1, 1)
  })

  it('draws the hand skeleton mirrored', () => {
    bus.emit('frameCaptured', frame(detectionWith({ x: 0.25, y: 0.5, z: 0 })))

    expect(context.moveTo).toHaveBeenCalled()
    expect(context.lineTo).toHaveBeenCalled()
    expect(context.stroke).toHaveBeenCalled()
    expect(context.arc).toHaveBeenCalledWith(75, 25, 3, 0, Math.PI * 2)
  })

  it('draws no hand when the detection is empty', () => {
    bus.emit('frameCaptured', frame(null))

    expect(context.arc).not.toHaveBeenCalled()
    expect(context.stroke).not.toHaveBeenCalled()
  })

  it('skips the frame while the video has no dimensions', () => {
    Object.defineProperty(video, 'videoWidth', { value: 0, configurable: true })

    bus.emit('frameCaptured', frame(null))

    expect(context.drawImage).not.toHaveBeenCalled()
  })

  it('warns once when the scene is too dark', () => {
    for (let i = 0; i < 90; i++) bus.emit('frameCaptured', frame(null))

    expect(toast.show).toHaveBeenCalledTimes(1)
    expect(toast.show).toHaveBeenCalledWith('light', expect.any(String), 'warn', 0)
    expect(toast.hide).not.toHaveBeenCalled()
  })

  it('hides the warning when the scene brightens', () => {
    for (let i = 0; i < 90; i++) bus.emit('frameCaptured', frame(null))

    context.getImageData.mockReturnValue({ data: new Uint8ClampedArray(LIGHT_CANVAS_PIXELS * 4).fill(200) })
    for (let i = 0; i < 90; i++) bus.emit('frameCaptured', frame(null))

    expect(toast.hide).toHaveBeenCalledWith('light')
  })
})
