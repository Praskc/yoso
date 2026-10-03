const ALFABETO: string[] = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M','N',
  'Ñ','O','P','Q','R','S','T','U','V','W','X','Y','Z',
]

export class AlphabetLearn {
  private celdas: HTMLElement[] = []
  private vistas = new Set<string>()
  private actual: string | null = 'A'
  private letraIdx: number = 0
  private countEl: HTMLElement | null = null
  private letterEl: HTMLElement | null = null
  private _prevFirma = ''

  constructor() {
    this.render()
  }

  private render(): void {
    const panel = document.getElementById('tab-aprendizaje')
    if (!panel) return
    panel.innerHTML = `
      <div class="learn-detail">
        <div class="learn-detail__head">
          <span class="learn-detail__label">letra en estudio</span>
          <div class="learn-detail__progress">
            <span id="learn-seen-count">0</span><span class="denom">/27 vistas</span>
          </div>
        </div>
        <div class="learn-detail__display">
          <span class="learn-detail__letter" id="learn-letter">A</span>
        </div>
        <div class="learn-detail__actions">
          <button class="learn-action-btn" id="btn-learn-prev" type="button" aria-label="Letra anterior">
            <svg class="learn-action-btn__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span>anterior</span>
          </button>
          <button class="learn-action-btn" id="btn-learn-next" type="button" aria-label="Siguiente letra">
            <span>siguiente</span>
            <svg class="learn-action-btn__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div class="alphabet-section">
        <div class="alphabet-section__head">
          <p class="alphabet-header">Alfabeto LSC</p>
        </div>
        <div class="alphabet-grid" id="alphabet-grid" role="list">
          ${ALFABETO.map(l => `
            <button class="alphabet-cell" data-letter="${l}" type="button" role="listitem" aria-label="Letra ${l}">${l.toLowerCase()}</button>
          `).join('')}
        </div>
      </div>
    `
    this.celdas = Array.from(panel.querySelectorAll<HTMLElement>('.alphabet-cell'))
    this.countEl = document.getElementById('learn-seen-count')
    this.letterEl = document.getElementById('learn-letter')

    // Eventos de botones
    document.getElementById('btn-learn-prev')?.addEventListener('click', () => this.anteriorLetra())
    document.getElementById('btn-learn-next')?.addEventListener('click', () => this.siguienteLetra())

    // Eventos de clic en celdas
    this.celdas.forEach(cell => {
      cell.addEventListener('click', () => {
        const l = cell.dataset.letter
        if (l) this.seleccionarLetra(l)
      })
    })

    this.repaint()
  }

  seleccionarLetra(l: string): void {
    const idx = ALFABETO.indexOf(l.toUpperCase())
    if (idx !== -1) {
      this.letraIdx = idx
      this.actual = ALFABETO[idx]
      this.vistas.add(this.actual)
      this.repaint()
    }
  }

  anteriorLetra(): void {
    this.letraIdx = (this.letraIdx - 1 + ALFABETO.length) % ALFABETO.length
    this.seleccionarLetra(ALFABETO[this.letraIdx])
  }

  siguienteLetra(): void {
    this.letraIdx = (this.letraIdx + 1) % ALFABETO.length
    this.seleccionarLetra(ALFABETO[this.letraIdx])
  }

  saltarLetra(): void {
    const pendientes = ALFABETO.filter(l => !this.vistas.has(l))
    const pool = pendientes.length > 0 ? pendientes : ALFABETO.filter(l => l !== this.actual)
    const random = pool[Math.floor(Math.random() * pool.length)] ?? ALFABETO[0]
    this.seleccionarLetra(random)
  }

  resaltar(letra: string): void {
    const l = letra ? letra.toUpperCase() : null
    if (!l) return
    const idx = ALFABETO.indexOf(l)
    if (idx !== -1) {
      this.letraIdx = idx
      this.actual = l
      this.vistas.add(l)
      this.repaint()
    }
  }

  limpiar(): void {
    // Mantiene la letra seleccionada pero quita el estado activo del tracking
    this.repaint()
  }

  private repaint(): void {
    // resaltar/limpiar llegan por frame de detección: solo repintar si la
    // firma (letra activa + vistas) cambió de verdad.
    const firma = `${this.actual ?? ''}|${this.vistas.size}`
    if (firma === this._prevFirma) return
    this._prevFirma = firma

    if (this.letterEl && this.actual) this.letterEl.textContent = this.actual
    for (const cell of this.celdas) {
      const l = cell.dataset.letter!
      if (l === this.actual) {
        cell.dataset.state = 'active'
      } else if (this.vistas.has(l)) {
        cell.dataset.state = 'seen'
      } else {
        delete cell.dataset.state
      }
    }
    if (this.countEl) {
      this.countEl.textContent = String(this.vistas.size)
    }
  }
}
