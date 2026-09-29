import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bootstrap } from './bootstrap'

const mocks = vi.hoisted(() => ({
  detectForVideo: vi.fn(() => ({ landmarks: [], handedness: [] })),
  closeTracker: vi.fn(),
  createLandmarker: vi.fn(),
  createSession: vi.fn(),
  getUserMedia: vi.fn(),
}))

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks: vi.fn(async () => ({})) },
  HandLandmarker: { createFromOptions: mocks.createLandmarker },
}))

vi.mock('onnxruntime-web', () => ({
  env: { wasm: { wasmPaths: '' } },
  Tensor: class Tensor {},
  InferenceSession: { create: mocks.createSession },
}))

const MARKUP = `
  <div id="app" data-mode="traductor">
    <button class="mode-tab is-active active" data-tab="traductor" aria-selected="true"></button>
    <button class="mode-tab" data-tab="entrenamiento" aria-selected="false"></button>
    <button class="mode-tab" data-tab="aprendizaje" aria-selected="false"></button>
    <span class="feed__live" data-state="off"></span>
    <video class="input_video"></video>
    <canvas class="output_canvas"></canvas>
    <div id="empty-state" hidden>
      <div id="es-icon-box"></div>
      <div id="es-badge"></div>
      <h3 id="es-title"></h3>
      <p id="es-desc"></p>
      <div id="es-guide"></div>
      <button id="es-retry"></button>
    </div>
    <aside id="tab-traductor" class="tab-panel active"></aside>
    <aside id="tab-entrenamiento" class="tab-panel"></aside>
    <aside id="tab-aprendizaje" class="tab-panel"></aside>
    <div id="final-text"></div>
    <button id="btn-clear"></button>
  </div>
  <div id="splash-screen">
    <span id="splash-step"></span>
    <span id="splash-tip-cat"></span>
    <p id="splash-tip-body"></p>
    <span id="splash-tip-n"></span>
    <div id="splash-drain"></div>
  </div>
  <div id="onboarding-root"></div>
  <div id="toast-root"></div>
  <footer id="site-footer"></footer>
`

const video = (): HTMLVideoElement => document.querySelector<HTMLVideoElement>('.input_video')!

const prepareVideo = (): void => {
  const element = video()
  Object.defineProperty(element, 'videoWidth', { value: 640, configurable: true })
  Object.defineProperty(element, 'videoHeight', { value: 360, configurable: true })
  element.play = vi.fn(async () => {})
  let stream: MediaStream | null = null
  Object.defineProperty(element, 'srcObject', {
    configurable: true,
    get: () => stream,
    set: (value: MediaStream) => {
      stream = value
      queueMicrotask(() => element.onloadedmetadata?.(new Event('loadedmetadata')))
    },
  })
}

describe('bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = MARKUP

    localStorage.clear()
    localStorage.setItem('yoso_purge_manifesto_v10', 'true')
    localStorage.setItem('yosoOnboarded', 'v10_manifesto')

    mocks.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream)
    mocks.createLandmarker.mockResolvedValue({
      detectForVideo: mocks.detectForVideo,
      close: mocks.closeTracker,
    })
    mocks.createSession.mockResolvedValue({
      inputNames: ['input'],
      outputNames: ['output'],
      run: vi.fn(async () => ({ output: { data: new Float32Array(28) } })),
    })

    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: mocks.getUserMedia },
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    prepareVideo()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('loads the model, boots the camera and hides the splash', async () => {
    await bootstrap()

    expect(mocks.createSession).toHaveBeenCalledTimes(1)
    expect(mocks.getUserMedia).toHaveBeenCalledTimes(1)
    expect(mocks.createLandmarker).toHaveBeenCalledTimes(1)
    expect(document.getElementById('splash-screen')?.classList.contains('is-hidden')).toBe(true)
    expect(document.querySelector('.feed__live')?.getAttribute('data-state')).toBe('on')
    expect((document.getElementById('empty-state') as HTMLElement).hidden).toBe(true)
  })

  it('starts the first word when the training mode is entered', async () => {
    vi.useFakeTimers()
    await bootstrap()

    document.querySelector<HTMLButtonElement>('.mode-tab[data-tab="entrenamiento"]')!.click()
    await vi.advanceTimersByTimeAsync(16)

    expect(document.getElementById('app')?.dataset['mode']).toBe('entrenamiento')
    expect(document.getElementById('tab-entrenamiento')?.classList.contains('active')).toBe(true)
    expect(document.getElementById('tab-traductor')?.classList.contains('active')).toBe(false)
    expect(document.getElementById('letra-objetivo')?.textContent ?? '').not.toBe('')
  })

  it('shows the camera error state when the access is denied', async () => {
    mocks.getUserMedia.mockRejectedValue(Object.assign(new Error('denied'), { name: 'NotAllowedError' }))

    await bootstrap()

    const emptyState = document.getElementById('empty-state') as HTMLElement
    expect(emptyState.hidden).toBe(false)
    expect(emptyState.dataset['status']).toBe('denied')
    expect(document.querySelector('.feed__live')?.getAttribute('data-state')).toBe('off')
  })

  it('reports a model load failure without touching the camera', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.createSession.mockRejectedValue(new Error('missing model'))

    await bootstrap()

    expect(document.getElementById('splash-step')?.textContent).toBe('Error al cargar el modelo')
    expect(mocks.getUserMedia).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalled()
  })
})
