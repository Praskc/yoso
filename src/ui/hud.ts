const ARC_CIRCUMFERENCE = 282.7 // Coincide con SVG r=45 en Piso 1 (2 * PI * 45)

export class HUD {
  private mTime:    HTMLElement | null = null
  private mHand:    HTMLElement | null = null
  private mEstado:  HTMLElement | null = null
  private mConf:    HTMLElement | null = null
  private arcFill:    SVGCircleElement | null = null
  private mFps:       HTMLElement | null = null
  private feedFpsVal: HTMLElement | null = null
  private feedFpsHud: HTMLElement | null = null
  private roiEl:      HTMLElement | null = null
  private _fueraZona  = false

  // ~30fps: solo escribir DOM si el valor cambió
  private _prevPct    = -1
  private _prevMano   = ''
  private _prevEstado = ''
  private _prevRoi    = ''
  private _prevLat    = ''
  private _prevFps    = ''
  private _limpioKey  = ''

  constructor() {
    queueMicrotask(() => this.bind())
  }

  private bind(): void {
    this.mTime      = document.getElementById('m-time')
    this.mHand      = document.getElementById('m-hand')
    this.mEstado    = document.getElementById('m-estado')
    this.mConf      = document.getElementById('m-conf')
    this.arcFill    = document.getElementById('conf-arc-fill') as SVGCircleElement | null
    this.mFps       = document.getElementById('m-fps')
    this.feedFpsVal = document.getElementById('feed-fps-val')
    this.feedFpsHud = document.getElementById('feed-fps-hud')
    this.roiEl      = document.querySelector('.feed__roi')
  }

  estadoListo(_estado: 'idle' | 'signing' | 'warning'): void {}

  actualizarPrediccion(_letra: string, confianza: number, latencia: number, esIzquierda: boolean): void {
    this._limpioKey = ''

    const pct = Math.round(confianza * 100)
    if (this.mConf && pct !== this._prevPct) {
      this._prevPct = pct
      // Solo el nodo de texto: el <span class="unit"> no se repite cada frame.
      if (this.mConf.firstChild) this.mConf.firstChild.textContent = String(pct)
      else this.mConf.textContent = String(pct)
      this.mConf.dataset.state = confianza >= 0.82 ? 'high' : 'on'
      if (this.arcFill) {
        this.arcFill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE * (1 - pct / 100))
      }
    }
    if (this.mTime) {
      const lat = latencia.toFixed(0)
      if (lat !== this._prevLat) {
        this._prevLat = lat
        if (this.mTime.firstChild) this.mTime.firstChild.textContent = lat
        else this.mTime.textContent = lat
      }
    }

    const mano = esIzquierda ? 'mano izq.' : 'mano der.'
    if (this.mHand && mano !== this._prevMano) {
      this._prevMano = mano
      this.mHand.textContent = mano
      this.mHand.dataset.state = 'on'
    }
  }

  estadoMano(_estado: string, esOptimo: boolean): void {
    if (!this.mEstado) return
    const estado = esOptimo ? 'óptimo' : 'en movimiento'
    if (estado === this._prevEstado) return
    this._prevEstado = estado
    this.mEstado.textContent = estado
    this.mEstado.dataset.state = esOptimo ? 'on' : 'warn'
  }

  limpiarMano(): void {
    const clave = `limpio:${this._fueraZona}`
    if (this._limpioKey === clave) return
    this._limpioKey  = clave
    this._prevPct    = -1
    this._prevMano   = ''
    this._prevEstado = ''
    this._prevLat    = ''

    if (this.mHand) {
      this.mHand.textContent = 'sin mano'
      this.mHand.dataset.state = 'off'
    }
    if (this.mEstado) {
      if (this._fueraZona) {
        this.mEstado.textContent = 'fuera de zona'
        this.mEstado.dataset.state = 'warn'
      } else {
        this.mEstado.textContent = 'motor listo'
        this.mEstado.dataset.state = 'off'
      }
    }
    if (this.arcFill) this.arcFill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE)
    if (this.mConf)  { this.mConf.innerHTML = ''; delete this.mConf.dataset.state }
    if (this.mTime)  this.mTime.innerHTML = `--<span class="unit">ms</span>`
  }

  actualizarROI(fueraZona: boolean): void {
    this._fueraZona = fueraZona
    if (!this.roiEl) return
    const estado = fueraZona ? 'warning' : 'ok'
    if (estado === this._prevRoi) return
    this._prevRoi = estado
    this.roiEl.setAttribute('data-state', estado)
    const label = this.roiEl.querySelector('.feed__roi-label')
    if (label) label.textContent = fueraZona ? 'fuera del rango' : 'zona de detección'
  }

  limpiarROI(): void {
    this._fueraZona = false
    if (!this.roiEl || this._prevRoi === '') return
    this._prevRoi = ''
    this.roiEl.removeAttribute('data-state')
    const label = this.roiEl.querySelector('.feed__roi-label')
    if (label) label.textContent = 'zona de detección'
  }

  agregarLetra(letra: string, borrar: boolean): void {
    window.dispatchEvent(new CustomEvent('yoso:letra', { detail: { letra, borrar } }))
  }

  limpiarTexto(): void {
    window.dispatchEvent(new CustomEvent('yoso:texto-clear'))
  }

  actualizarFps(fps: number): void {
    const fpsRound = fps.toFixed(0)
    if (fpsRound === this._prevFps) return
    this._prevFps = fpsRound
    if (this.mFps) this.mFps.textContent = fpsRound
    if (this.feedFpsVal) this.feedFpsVal.textContent = fpsRound
    if (this.feedFpsHud) {
      if (fps >= 24) {
        this.feedFpsHud.removeAttribute('data-perf')
      } else if (fps >= 15) {
        this.feedFpsHud.setAttribute('data-perf', 'mid')
      } else {
        this.feedFpsHud.setAttribute('data-perf', 'low')
      }
    }
  }
}
