import * as ort                                          from 'onnxruntime-web'
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import type { HandLandmarkerResult }                     from '@mediapipe/tasks-vision'
import { MotorInferencia, BORRAR }                       from '../engine/inference'
import { GameManager }                                   from '../game/game'
import { RenderizadorUI }                                from '../ui'
import type { Lateralidad, Punto }                       from '../engine/types'
import type { WorkerInMsg, WorkerOutMsg }                from '../workers/protocol'

const LIMITE_SUPERIOR  = 0.10
const LIMITE_IZQUIERDO = 0.15
const LIMITE_DERECHO   = 0.85

const UMBRAL_LUZ = 40

export class YOSOApp {
  private readonly motor: MotorInferencia
  private readonly juego: GameManager
  private readonly ui:    RenderizadorUI

  private readonly video:  HTMLVideoElement
  private readonly canvas: HTMLCanvasElement
  private readonly ctx:    CanvasRenderingContext2D
  private _drawingUtils:   DrawingUtils | null = null

  private modo: 'traductor' | 'entrenamiento' | 'aprendizaje' = 'traductor'
  private anchoCanvas  = 0
  private altoCanvas   = 0
  private prevMunecaX  = 0
  private prevMunecaY  = 0

  private _pausado = false
  private _iniciandoCamara = false
  private _stream: MediaStream | null = null

  // Pipeline dual: GPU/main-thread cuando hay WebGL útil, worker+CPU cuando no.
  private _landmarker:       HandLandmarker | null = null
  private _worker:           Worker | null = null
  private _workerListo       = false
  private _workerOcupado     = false
  private _cambiandoAWorker  = false
  private _fpsActual         = 0
  private readonly _muestrasMp: number[] = []

  private readonly _canvasLuz: HTMLCanvasElement
  private readonly _ctxLuz:    CanvasRenderingContext2D
  private _frameCount    = 0
  private _toastLuzVivo  = false

  // Circular buffer sin push/shift por frame
  private readonly _fpsBuf = new Float64Array(60)
  private _fpsHead = 0
  private _fpsFill = 0

  constructor() {
    this.motor  = new MotorInferencia()
    // UI primero: crea los IDs que GameManager consulta en su constructor.
    this.ui     = new RenderizadorUI()
    this.juego  = new GameManager()

    this.video  = document.querySelector('.input_video')!
    this.canvas = document.querySelector('.output_canvas')!
    this.ctx    = this.canvas.getContext('2d')!

    this._canvasLuz         = document.createElement('canvas')
    this._canvasLuz.width   = 32
    this._canvasLuz.height  = 18
    this._ctxLuz = this._canvasLuz.getContext('2d', { willReadFrequently: true })!

    document.addEventListener('visibilitychange', () => this._alCambiarVisibilidad())
    // pagehide cubre cierre/recarga/navegación: libera la cámara para que el indicador del SO se apague.
    window.addEventListener('pagehide', () => this._detenerCamara())
    document.getElementById('app')?.setAttribute('data-mode', this.modo)
    document.body.setAttribute('data-mode', this.modo)
    this._vincularEventos()
  }

  public async iniciar(): Promise<void> {
    ort.env.wasm.wasmPaths = '/ort/'

    try {
      this.ui.mensajeSplash('Cargando modelo…')

      // Solo WASM: el modelo es demasiado pequeño para que WebGPU amortice su overhead por frame.
      const hilos = Math.min(2, navigator.hardwareConcurrency ?? 2)
      const [sesion, centroidesRaw] = await Promise.all([
        ort.InferenceSession.create('./YOSO.onnx', {
          executionProviders:     ['wasm'],
          graphOptimizationLevel: 'all',
          enableCpuMemArena:      true,
          intraOpNumThreads:      hilos
        }),
        fetch('./Centroides.json')
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      ])

      const centroides = centroidesRaw
        ? Object.fromEntries(
            Object.entries(centroidesRaw as Record<string, { coords: number[]; dist_ref: number }>)
              .map(([k, v]) => [k, { coords: new Float32Array(v.coords), dist_ref: v.dist_ref }])
          )
        : null

      this.motor.iniciar({
        sesion,
        centroides,
        callbacks: {
          alConfirmarLetra:  (l)                              => this._alConfirmarLetra(l),
          alDetectarLetra:   (l, c, lat, _latP, esIzquierda) => this._alDetectarLetra(l, c, lat, esIzquierda),
          alActualizarDebug: (p)                              => this.ui.actualizarDebug(p)
        }
      })

      this.ui.ocultarSplash()

    } catch (err) {
      this.ui.mensajeSplash('Error al cargar el modelo', true)
      console.error('[YOSO] Arranque fallido:', err)
      return
    }

    await this.ui.mostrarOnboarding()
    await this._iniciarCamara()
  }

  private async _iniciarCamara(): Promise<void> {
    if (this._iniciandoCamara) return
    this._iniciandoCamara = true
    try {
      // pointer:coarse + maxTouchPoints detecta táctiles incluyendo iPadOS 13+, que reporta UA "Macintosh"
      const esMobil = matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0
      const constraints: MediaStreamConstraints = esMobil
        ? { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }
        : { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        const domErr = err as DOMException

        let estadoPermiso: 'granted' | 'denied' | 'prompt' = 'prompt'
        try {
          if (navigator.permissions && navigator.permissions.query) {
            const perm = await navigator.permissions.query({ name: 'camera' as any })
            estadoPermiso = perm.state
            perm.onchange = () => {
              if (perm.state === 'granted') {
                this.ui.ocultarEstadoVacio()
                void this._iniciarCamara()
              }
            }
          }
        } catch {
          // Permissions API query no soportado para camera en este browser
        }

        const errName = domErr.name || ''
        const errMsg  = (domErr.message || '').toLowerCase()

        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          // Si el estado en el navegador sigue siendo 'prompt', o el mensaje es por dismiss/cancel/closed,
          // significa que el usuario cerró el pop-up (le dio a la X) y NO seleccionó "Bloquear".
          // En este caso el navegador permite relanzar el pop-up al hacer clic en "Abrir ventana de permiso".
          const fueDescartado = estadoPermiso === 'prompt' || errMsg.includes('dismiss') || errMsg.includes('cancel')
          this.ui.mostrarEstadoVacio(domErr, () => void this._iniciarCamara(), fueDescartado ? 'dismissed' : 'denied')
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          this.ui.mostrarEstadoVacio(domErr, () => void this._iniciarCamara(), 'not-found')
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          this.ui.mostrarEstadoVacio(domErr, () => void this._iniciarCamara(), 'in-use')
        } else {
          this.ui.mostrarEstadoVacio(domErr, () => void this._iniciarCamara(), 'other')
        }
        return
      }

      this.ui.ocultarEstadoVacio()
      this._stream = stream

      // MediaPipe con delegate 'GPU' degrada silenciosamente a WASM/CPU-cuando-WebGL-falta:
      // sin check previo pagarías ese degradado EN el hilo principal. Sin WebGL,
      // arranca directo en worker. Con WebGL, el monitor adaptativo decide luego.
      if (this._gpuDisponible()) {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe')
        this._landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.80,
          minHandPresenceConfidence:  0.70,
          minTrackingConfidence:      0.70
        })
      } else {
        await this._crearWorker()
        this.ui.mostrarToast('modo-compat', 'Modo compatibilidad: detección en segundo hilo (CPU)', 'info', 4000)
      }

      this._drawingUtils = new DrawingUtils(this.ctx)

      this.video.srcObject = stream
      await new Promise<void>(resolve => { this.video.onloadedmetadata = () => resolve() })
      await this.video.play()
      this.ui.setLive(true)

      let ultimoVideoTime = -1

      // rVFC = callback exacto por frame de video, sin depender del refresh rate del display.
      // Fallback a rAF en Safari iOS <17.
      const usaVFC = typeof (this.video as any).requestVideoFrameCallback === 'function'
      const programar = usaVFC
        ? () => (this.video as any).requestVideoFrameCallback(loop)
        : () => requestAnimationFrame(loop)

      const loop = () => {
        programar()
        if (this._pausado || this.video.readyState < 2) return
        if (this.video.currentTime === ultimoVideoTime) return
        ultimoVideoTime = this.video.currentTime

        const ahora = performance.now()

        const oldest = this._fpsFill >= 2
          ? this._fpsBuf[this._fpsFill < 60 ? 0 : this._fpsHead]
          : 0
        this._fpsBuf[this._fpsHead] = ahora
        this._fpsHead = (this._fpsHead + 1) % 60
        if (this._fpsFill < 60) this._fpsFill++
        const fps = this._fpsFill >= 2
          ? (this._fpsFill - 1) / ((ahora - oldest) / 1000)
          : 0
        this._fpsActual = fps

        if (this._worker) {
          // CPU/worker: un ImageBitmap transferable por frame, sin copias.
          // Timing de detección e inferencia vuelven en el mensaje 'resultado'.
          if (this._workerListo && !this._workerOcupado) {
            this._workerOcupado = true
            // El stream llega a 720/1080p (constraints HD): reducir el bitmap
            // antes de transferir mantiene liviano el puente al worker.
            createImageBitmap(this.video, { resizeWidth: 640, resizeHeight: 360, resizeQuality: 'low' })
              .then(bitmap => this._worker!.postMessage({ type: 'frame', bitmap, timestamp: ahora }, [bitmap]))
              .catch(() => { this._workerOcupado = false })
          }
          return
        }

        if (this._landmarker) {
          const t0       = performance.now()
          const resultado = this._landmarker.detectForVideo(this.video, ahora)
          const mpMs     = performance.now() - t0

          // Monitor adaptativo: si la mediana del costo de detección supera 22 ms,
          // este dispositivo está corriendo MediaPipe en CPU dentro del main thread
          // (GPU delegate silencioso degradado). Se conmuta en caliente a worker.
          if (this._muestrasMp.length < 120) {
            this._muestrasMp.push(mpMs)
            if (this._muestrasMp.length === 120) {
              const s = [...this._muestrasMp.slice(20)].sort((a, b) => a - b)
              const mediana = s[Math.floor(s.length / 2)]
              if (mediana > 22) this._activarModoWorker()
            }
          }

          this._alRecibirResultados(resultado)
          this.ui.actualizarPerfFrame(mpMs, fps)
        }
      }
      programar()
    } finally {
      this._iniciandoCamara = false
    }
  }

  private _alCambiarVisibilidad(): void {
    this._pausado = document.hidden
    this.ui.setLive(!document.hidden)
    if (document.hidden) {
      this.motor.reiniciar(true)
      this.ui.estadoListo('idle')
      this.ui.limpiarMano()
    }
  }

  private _detenerCamara(): void {
    this._stream?.getTracks().forEach(track => track.stop())
    this._stream = null
    this._worker?.terminate()
    this._worker = null
    this._workerListo = false
    this._pausado = true
  }

  // El GPU delegate de MediaPipe degrada silenciosamente a CPU cuando WebGL falta;
  // medir la plataforma antes de crear el landmarker evita pagar ese degradado en main.
  private _gpuDisponible(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    } catch {
      return false
    }
  }

  private _crearWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      const w = new Worker(new URL('../workers/engine.worker.ts', import.meta.url), { type: 'module' })
      const timeout = window.setTimeout(
        () => reject(new Error('El worker de detección no respondió a tiempo')),
        20000
      )

      w.onmessage = (e: MessageEvent<WorkerOutMsg>) => {
        const m = e.data
        if (m.type === 'ready') {
          window.clearTimeout(timeout)
          this._workerListo = true
          resolve()
          return
        }
        if (m.type === 'error') {
          this._workerOcupado = false
          if (!this._workerListo) {
            window.clearTimeout(timeout)
            reject(new Error(m.message))
          } else {
            console.error('[Worker detección]', m.message)
          }
          return
        }
        this._workerOcupado = false
        this._alRecibirResultados(this._aResultadoWorker(m))
        this.ui.actualizarPerfFrame(m.mpMs, this._fpsActual)
      }

      w.onerror = (e) => {
        this._workerOcupado = false
        if (!this._workerListo) {
          window.clearTimeout(timeout)
          reject(new Error(e.message))
        } else {
          console.error('[Worker detección] onerror', e.message)
        }
      }

      this._worker = w
      const initMsg: WorkerInMsg = { type: 'init' }
      w.postMessage(initMsg)
    })
  }

  private _activarModoWorker(): void {
    if (this._worker || this._cambiandoAWorker) return
    this._cambiandoAWorker = true
    this._crearWorker()
      .then(() => {
        this._landmarker?.close()
        this._landmarker = null
        this.motor.reiniciar(true)
        this.ui.mostrarToast('modo-compat', 'Dispositivo lento detectado: detección movida a segundo hilo', 'warn', 4500)
      })
      .catch((err) => {
        this._cambiandoAWorker = false
        this._worker = null
        this._workerListo = false
        console.error('[YOSO] Fallback a worker falló; se mantiene hilo principal:', err)
      })
  }

  private _aResultadoWorker(m: Extract<WorkerOutMsg, { type: 'resultado' }>): HandLandmarkerResult {
    if (!m.landmarks) return { landmarks: [], handedness: [] } as unknown as HandLandmarkerResult
    return {
      landmarks:  [m.landmarks],
      handedness: [[{ categoryName: m.lateralidad ?? 'Right', score: m.score }]]
    } as unknown as HandLandmarkerResult
  }

  private _verificarLuminosidad(): void {
    if (this.video.videoWidth === 0) return
    try {
      this._ctxLuz.drawImage(this.video, 0, 0, 32, 18)
      const data = this._ctxLuz.getImageData(0, 0, 32, 18).data
      let suma = 0
      for (let i = 0; i < data.length; i += 4) {
        suma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      }
      const promedio = suma / (data.length / 4)
      const oscuro   = promedio < UMBRAL_LUZ
      if (oscuro !== this._toastLuzVivo) {
        this._toastLuzVivo = oscuro
        oscuro
          ? this.ui.mostrarToast('luz', 'Enciende una luz frontal para que la cámara detecte tus señas con mayor precisión y velocidad.', 'light', 0)
          : this.ui.ocultarToast('luz')
      }
    } catch {
      // SecurityError posible en contextos cross-origin
    }
  }

  private _vincularEventos(): void {
    document.querySelectorAll<HTMLButtonElement>('.mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const pestaña = btn.dataset['tab'] as typeof this.modo
        document.querySelectorAll('.mode-tab').forEach(b => {
          b.classList.remove('active', 'is-active')
          b.setAttribute('aria-selected', 'false')
        })
        btn.classList.add('active', 'is-active')
        btn.setAttribute('aria-selected', 'true')
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        document.getElementById(`tab-${pestaña}`)?.classList.add('active')

        if (pestaña !== this.modo) {
          this.modo = pestaña
          document.getElementById('app')?.setAttribute('data-mode', pestaña)
          document.body.setAttribute('data-mode', pestaña)

          this.ui.limpiarTexto()
          this.ui.limpiarSena()
          this.motor.reiniciar(true)
          pestaña === 'entrenamiento' ? void this.juego.activar() : this.juego.desactivar()
        }
      })
    })

    document.getElementById('topbar-btn-onboarding')?.addEventListener('click', () => {
      void this.ui.mostrarOnboarding(true)
    })
  }

  private _alDetectarLetra(letra: string, confianza: number, latencia: number, esIzquierda: boolean): void {
    this.ui.actualizarPrediccion(letra, confianza, latencia, esIzquierda)
    if (this.modo === 'aprendizaje') {
      letra !== '-' ? this.ui.resaltarSena(letra) : this.ui.limpiarSena()
    } else if (this.modo === 'entrenamiento') {
      this.juego.onLetraDetectada(letra, confianza)
    }
  }

  private _alConfirmarLetra(letra: string): void {
    if (this.modo === 'entrenamiento') { this.juego.onLetraConfirmada(letra); return }
    if (this.modo === 'aprendizaje')   return
    this.ui.agregarLetra(letra, letra === BORRAR)
  }

  private _alRecibirResultados(resultado: HandLandmarkerResult): void {
    const ancho = this.video.videoWidth
    const alto  = this.video.videoHeight
    if (ancho !== this.anchoCanvas || alto !== this.altoCanvas) {
      this.canvas.width  = ancho
      this.canvas.height = alto
      this.anchoCanvas   = ancho
      this.altoCanvas    = alto
    }

    if (++this._frameCount % 90 === 0) this._verificarLuminosidad()

    const ac = this.canvas.width, al = this.canvas.height
    this.ctx.save()
    this.ctx.clearRect(0, 0, ac, al)
    // El video NO se dibuja aquí: .input_video ya está espejado por CSS
    // (transform: scaleX(-1)) y el canvas es un overlay transparente que
    // solo carga el esqueleto — evita el blit de ~900KB/frame en main.

    if (resultado.landmarks.length > 0) {
      const rawLandmarks = resultado.landmarks[0]
      const puntos        = rawLandmarks as unknown as Punto[]
      const lateralidad: Lateralidad = {
        label: resultado.handedness[0][0].categoryName as 'Left' | 'Right',
        score: resultado.handedness[0][0].score
      }

      const displayLandmarks = rawLandmarks.map(lm => ({ x: 1 - lm.x, y: lm.y, z: lm.z, visibility: lm.visibility }))
      this._drawingUtils!.drawConnectors(displayLandmarks, HandLandmarker.HAND_CONNECTIONS,
        { color: 'rgba(56,189,248,0.80)', lineWidth: 2 })
      this._drawingUtils!.drawLandmarks(displayLandmarks,
        { color: '#38BDF8', lineWidth: 0.5, radius: 3 })

      let minX = 1, minY = 1, maxX = 0
      for (const pt of puntos) {
        if (pt.x < minX) minX = pt.x
        if (pt.y < minY) minY = pt.y
        if (pt.x > maxX) maxX = pt.x
      }
      const fueraZona = minY < LIMITE_SUPERIOR || minX < LIMITE_IZQUIERDO || maxX > LIMITE_DERECHO

      this.ui.actualizarROI(fueraZona)

      if (fueraZona) {
        this.ui.estadoListo('warning')
        this.ui.limpiarMano()
        this.motor.reiniciar()
        this.ctx.restore()
        return
      }

      this.ui.estadoListo('signing')

      const muneca = puntos[0]
      const jitter = Math.abs(muneca.x - this.prevMunecaX) + Math.abs(muneca.y - this.prevMunecaY)
      this.prevMunecaX = muneca.x
      this.prevMunecaY = muneca.y

      this.ui.estadoMano(jitter > 0.03 ? 'Inestable' : 'Óptimo', jitter <= 0.03)

      void this.motor.procesar(puntos, lateralidad, jitter)

    } else {
      this.ui.estadoListo('idle')
      this.ui.limpiarROI()
      this.ui.limpiarMano()
      this.motor.reiniciar()
    }

    this.ctx.restore()
  }
}
