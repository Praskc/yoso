import { RecognitionSession } from '../application/capture/recognition-session'
import type { AppEvents } from '../application/events/app-events'
import { GameController } from '../application/game/game-controller'
import { ModeController, type AppMode } from '../application/modes/mode-controller'
import { OnboardingService } from '../application/onboarding/onboarding-service'
import { RecognitionService } from '../application/recognition/recognition-service'
import { DEFAULT_RECOGNITION_CONFIG } from '../domain/recognition/config'
import { BrowserCamera } from '../infrastructure/camera/browser-camera'
import { FrameLoop } from '../infrastructure/capture/frame-loop'
import { PerformanceClock } from '../infrastructure/clock/performance-clock'
import { purgeLegacyState } from '../infrastructure/lifecycle/cache-purge'
import { MediaPipeHandTracker } from '../infrastructure/mediapipe/mediapipe-hand-tracker'
import { OnnxModelSource } from '../infrastructure/onnx/onnx-model-source'
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter'
import { DatamuseWordSource } from '../infrastructure/words/datamuse-word-source'
import { FallbackWordSource } from '../infrastructure/words/fallback-word-source'
import { LocalBankWordSource } from '../infrastructure/words/local-bank-word-source'
import { CameraOverlay } from '../presentation/components/camera-overlay/camera-overlay'
import { DebugPanel } from '../presentation/components/debug-panel/debug-panel'
import { GamePanel } from '../presentation/components/game-panel/game-panel'
import { Hud } from '../presentation/components/hud/hud'
import { LearnPanel } from '../presentation/components/learn-panel/learn-panel'
import { LiveIndicator } from '../presentation/components/live-indicator'
import { ModeTabs } from '../presentation/components/mode-tabs/mode-tabs'
import { Onboarding } from '../presentation/components/onboarding/onboarding'
import { OutputPanel } from '../presentation/components/output-panel/output-panel'
import { SiteFooter } from '../presentation/components/site-footer/site-footer'
import { Splash } from '../presentation/components/splash/splash'
import { Toast } from '../presentation/components/toast/toast'
import { TypedEventBus } from '../shared/typed-event-bus'

const MODEL_URL = './YOSO.onnx'
const CENTROIDS_URL = './Centroides.json'
const ORT_WASM_PATH = '/ort/'
const MEDIAPIPE_WASM_PATH = '/mediapipe'
const HAND_LANDMARKER_MODEL_URL = '/mediapipe/hand_landmarker.task'

export async function bootstrap(): Promise<void> {
  const video = document.querySelector<HTMLVideoElement>('.input_video')
  const canvas = document.querySelector<HTMLCanvasElement>('.output_canvas')
  if (!video || !canvas) {
    console.error('[YOSO] No se encontraron los elementos de cámara en el documento')
    return
  }

  const storage = new LocalStorageAdapter()
  await purgeLegacyState(storage)

  const bus = new TypedEventBus<AppEvents>()
  const clock = new PerformanceClock()
  const toast = new Toast()
  const splash = new Splash()
  const onboarding = new Onboarding(new OnboardingService(storage))

  const recognition = new RecognitionService(bus, clock, DEFAULT_RECOGNITION_CONFIG)
  const modes = new ModeController()
  const game = new GameController(bus, new FallbackWordSource(new DatamuseWordSource(), new LocalBankWordSource()))
  const modelSource = new OnnxModelSource({
    modelUrl: MODEL_URL,
    centroidsUrl: CENTROIDS_URL,
    wasmPath: ORT_WASM_PATH,
    threadCount: Math.min(2, navigator.hardwareConcurrency ?? 2),
  })

  const session = new RecognitionSession(
    new BrowserCamera(video),
    { create: target => MediaPipeHandTracker.create(target, MEDIAPIPE_WASM_PATH, HAND_LANDMARKER_MODEL_URL) },
    { create: onFrame => new FrameLoop(video, onFrame) },
    recognition,
    bus,
    clock,
  )

  const selectMode = (mode: AppMode): void => {
    if (mode === modes.mode) return
    modes.setMode(mode)
    bus.emit('modeChanged', { mode })
  }

  modes.register('training', game)
  modes.register('learning', new LearnPanel(bus))

  // El panel de salida pinta los IDs que el HUD bindea: su orden de montaje importa.
  new OutputPanel(bus)
  new Hud(bus)
  new GamePanel(bus, game)
  new DebugPanel(bus)
  new LiveIndicator(bus)
  new CameraOverlay(bus, toast, video, canvas)

  const modeTabs = new ModeTabs(bus, selectMode)
  new SiteFooter({
    onSelectTab: tab => modeTabs.selectTab(tab),
    onOpenOnboarding: () => void onboarding.show(true),
  })

  const openOnboarding = (): void => void onboarding.show(true)
  document.getElementById('topbar-btn-onboarding')?.addEventListener('click', openOnboarding)

  bus.on('modeChanged', () => {
    recognition.reset(true)
    bus.emit('handCleared', undefined)
  })

  bus.on('cameraStatus', status => {
    splash.hide()
    if (status.ok) {
      splash.hideCameraError()
      return
    }
    splash.showCameraError(status.reason, () => void session.start())
  })

  document.addEventListener('visibilitychange', () => session.setPaused(document.hidden))

  splash.showLoadingModel()

  let model
  try {
    model = await modelSource.load()
  } catch (error) {
    console.error('[YOSO] Arranque fallido:', error)
    splash.showModelLoadError()
    return
  }

  recognition.useModel(model)
  splash.hide()

  await onboarding.show()
  await session.start()
}
