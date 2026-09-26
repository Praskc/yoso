import type { WorkerOutMsg }           from '../workers/messages'
import { BORRAR }                       from '../engine/types'
import { GameManager }                                   from '../game/game'
import { RenderizadorUI }                                from '../ui'
import type { Punto }                       from '../engine/types'

const LIMITE_SUPERIOR  = 0.10
const LIMITE_IZQUIERDO = 0.15
const LIMITE_DERECHO   = 0.85

const UMBRAL_LUZ = 40

export class YOSOApp {
  private readonly juego: GameManager
  private readonly ui:    RenderizadorUI

  private readonly video:  HTMLVideoElement
  private readonly canvas: HTMLCanvasElement
  private readonly ctx:    CanvasRenderingContext2D


  private modo: 'traductor' | 'entrenamiento' | 'aprendizaje' = 'traductor'
  private anchoCanvas  = 0
  private altoCanvas   = 0
  private prevMunecaX  = 0
  private prevMunecaY  = 0

  private _pausado = false
  private _iniciandoCamara = false
  private _stream: MediaStream | null = null

  private _worker:        Worker | null = null
  private _workerListo    = false
  private _workerOcupado  = false
  private _fpsActual      = 0

  private readonly _canvasLuz: HTMLCanvasElement
  private readonly _ctxLuz:    CanvasRenderingContext2D
  private _frameCount    = 0
  private _toastLuzVivo  = false

  // Circular buffer sin push/shift por frame
  private readonly _fpsBuf = new Float64Array(60)
  private _fpsHead = 0
  private _fpsFill = 0

  constructor() {
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
    this._vincularEventos()
  }

  public async iniciar(): Promise<void> {
    this.ui.mensajeSplash('Iniciando sistema...')
    this.ui.ocultarSplash()
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
        ? { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 60, min: 30 } }, audio: false }
        : { video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 60, min: 30 } }, audio: false }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        const domErr = err as DOMException
        if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
          this.ui.mostrarEstadoVacio(domErr, () => void this._iniciarCamara(), true)
        } else {
          this.ui.mostrarEstadoVacio(domErr, () => void this._iniciarCamara(), false)
        }
        return
      }

      this.ui.ocultarEstadoVacio()
      this._stream = stream

      this._worker = new Worker('/mediapipe-worker.js')

      await new Promise<void>((resolve, reject) => {
        this._worker!.onmessage = (e: MessageEvent<WorkerOutMsg>) => {
          if (e.data.type === 'ready') { this._workerListo = true; resolve() }
          if (e.data.type === 'error') reject(new Error(e.data.message))
        }
        this._worker!.postMessage({ type: 'init' })
      })

      this._worker.onmessage = (e: MessageEvent<WorkerOutMsg>) => {
        const { data } = e
        if (data.type === 'result') {
          this._workerOcupado = false
          this._alRecibirResultados(data)
          this.ui.actualizarPerfFrame(this._fpsActual)
        }
        if (data.type === 'inference_result') {
          this.ui.actualizarDebug(data.inference.debug)
          this._alDetectarLetra(
            data.inference.letraDetectada,
            data.inference.confianzaEfectiva,
            data.inference.latInferencia,
            data.inference.esCamaraIzquierda
          )
          if (data.inference.letraConfirmada !== null) {
            this._alConfirmarLetra(data.inference.letraConfirmada)
          }
        }
        if (data.type === 'error') {
          this._workerOcupado = false
          console.error('[Worker MP]', data.message)
        }
      }

      // Libera el flag si el worker crashea fuera del flujo de mensajes.
      this._worker.onerror = (e) => {
        this._workerOcupado = false
        console.error('[Worker MP] onerror', e.message)
      }



      this.video.srcObject = stream
      await new Promise<void>(resolve => { this.video.onloadedmetadata = () => resolve() })
      await this.video.play()

      let ultimoVideoTime = -1

      // rVFC: un callback por frame de video sin atarse al refresh del display, con fallback a rAF.
      const usaVFC = typeof this.video.requestVideoFrameCallback === 'function'
      const programar = usaVFC
        ? () => this.video.requestVideoFrameCallback(loop)
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
        this._fpsActual = this._fpsFill >= 2
          ? (this._fpsFill - 1) / ((ahora - oldest) / 1000)
          : 0

        if (this._workerListo && !this._workerOcupado) {
          this._workerOcupado = true
          createImageBitmap(this.video).then(bitmap => {
            this._worker!.postMessage({ type: 'frame', bitmap, timestamp: ahora }, [bitmap])
          }).catch(() => { this._workerOcupado = false })
        }
      }
      programar()
    } finally {
      this._iniciandoCamara = false
    }
  }

  private _alCambiarVisibilidad(): void {
    this._pausado = document.hidden
    if (document.hidden) {
      if (this._workerListo) this._worker!.postMessage({ type: 'reiniciar', forzar: true })
      this.ui.estadoListo('idle')
      this.ui.limpiarMano()
    }
  }

  private _detenerCamara(): void {
    this._stream?.getTracks().forEach(track => track.stop())
    this._stream = null
    this._pausado = true
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
          ? this.ui.mostrarToast('luz', 'Poca luz detectada: busca una fuente de luz frente a ti para mejorar la precisión.', 'warn', 0)
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
          this.ui.limpiarTexto()
          this.ui.limpiarSena()
          if (this._workerListo) this._worker!.postMessage({ type: 'reiniciar', forzar: true })
          pestaña === 'entrenamiento' ? void this.juego.activar() : this.juego.desactivar()
        }
      })
    })
  }

  private _alDetectarLetra(letra: string, confianza: number, latencia: number, esIzquierda: boolean): void {
    this.ui.actualizarPrediccion(letra, confianza, latencia, esIzquierda)
    if (this.modo === 'aprendizaje') {
      letra !== '-' ? this.ui.resaltarSena(letra) : this.ui.limpiarSena()
    }
  }

  private _alConfirmarLetra(letra: string): void {
    if (this.modo === 'entrenamiento') { this.juego.onLetraConfirmada(letra); return }
    if (this.modo === 'aprendizaje')   return
    this.ui.agregarLetra(letra, letra === BORRAR)
  }

  private _alRecibirResultados(data: Extract<WorkerOutMsg, { type: 'result' }>): void {
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
    this.ctx.clearRect(0, 0, ac, al)

    if (data.hasHand) {
      const puntos = data.landmarks as unknown as Punto[]

      this.ctx.lineWidth = 2
      this.ctx.strokeStyle = 'rgba(56,189,248,0.80)'
      this.ctx.fillStyle = '#38BDF8'
      
      const conns = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]
      
      this.ctx.beginPath()
      for (let i = 0; i < conns.length; i++) {
        const p1 = puntos[conns[i][0]]
        const p2 = puntos[conns[i][1]]
        this.ctx.moveTo((1 - p1.x) * ac, p1.y * al)
        this.ctx.lineTo((1 - p2.x) * ac, p2.y * al)
      }
      this.ctx.stroke()

      for (let i = 0; i < puntos.length; i++) {
        const p = puntos[i]
        this.ctx.beginPath()
        this.ctx.arc((1 - p.x) * ac, p.y * al, 3, 0, 2 * Math.PI)
        this.ctx.fill()
      }

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
        this._worker!.postMessage({ type: 'reiniciar', forzar: false })
        return
      }

      this.ui.estadoListo('signing')

      const muneca = puntos[0]
      const jitter = Math.abs(muneca.x - this.prevMunecaX) + Math.abs(muneca.y - this.prevMunecaY)
      this.prevMunecaX = muneca.x
      this.prevMunecaY = muneca.y

      this.ui.estadoMano(jitter > 0.03 ? 'Inestable' : 'Óptimo', jitter <= 0.03)

    } else {
      this.ui.estadoListo('idle')
      this.ui.limpiarROI()
      this.ui.limpiarMano()
      // Worker will auto-reset when landmarks.length === 0, so no need to postMessage
    }
  }
}
