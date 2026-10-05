export class HUD {
  private mConf:      HTMLElement | null = null
  private feedFpsVal: HTMLElement | null = null
  private feedFpsHud: HTMLElement | null = null
  private roiEl:      HTMLElement | null = null

  // ~30fps: solo escribir DOM si el valor cambió
  private _prevPct = -1
  private _prevRoi = ''
  private _prevFps = ''
  private _limpio  = false

  constructor() {
    queueMicrotask(() => this.bind())
  }

  private bind(): void {
    this.mConf      = document.getElementById('m-conf')
    this.feedFpsVal = document.getElementById('feed-fps-val')
    this.feedFpsHud = document.getElementById('feed-fps-hud')
    this.roiEl      = document.querySelector('.feed__roi')
  }

  actualizarPrediccion(confianza: number): void {
    this._limpio = false

    const pct = Math.round(confianza * 100)
    if (this.mConf && pct !== this._prevPct) {
      this._prevPct = pct
      // Solo el nodo de texto: el <span class="unit"> no se repite cada frame.
      if (this.mConf.firstChild) this.mConf.firstChild.textContent = String(pct)
      else this.mConf.textContent = String(pct)
      this.mConf.dataset.state = confianza >= 0.82 ? 'high' : 'on'
    }
  }

  limpiarMano(): void {
    if (this._limpio) return
    this._limpio  = true
    this._prevPct = -1
    if (this.mConf) { this.mConf.innerHTML = ''; delete this.mConf.dataset.state }
  }

  actualizarROI(fueraZona: boolean): void {
    if (!this.roiEl) return
    const estado = fueraZona ? 'warning' : 'ok'
    if (estado === this._prevRoi) return
    this._prevRoi = estado
    this.roiEl.setAttribute('data-state', estado)
    const label = this.roiEl.querySelector('.feed__roi-label')
    if (label) label.textContent = fueraZona ? 'fuera del rango' : 'zona de detección'
  }

  limpiarROI(): void {
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
