export class PanelLeft {
  private liveEl: HTMLElement | null = null
  private _prev = ''

  constructor() {
    this.liveEl = document.getElementById('feed-cam-led') || document.querySelector('.feed__cam-led')
    this.setLive(false)
  }

  setLive(activo: boolean): void {
    if (!this.liveEl) {
      this.liveEl = document.getElementById('feed-cam-led') || document.querySelector('.feed__cam-led')
    }
    if (!this.liveEl) return
    const estado = activo ? 'on' : 'off'
    if (estado === this._prev) return
    this._prev = estado
    this.liveEl.dataset.state = estado
    this.liveEl.setAttribute('title', activo ? 'Cámara activa' : 'Cámara apagada')
    this.liveEl.setAttribute('aria-label', activo ? 'Cámara activa' : 'Cámara apagada')
  }
}
