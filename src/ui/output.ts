export class OutputPanel {
  private letterEl:    HTMLElement | null = null
  private textEl:      HTMLElement | null = null
  private bufferCells: HTMLElement[] = []
  private bufferCount: HTMLElement | null = null
  private streamCanvas: HTMLCanvasElement | null = null
  private streamCtx:    CanvasRenderingContext2D | null = null
  private streamAvg:    HTMLElement | null = null

  private letras: string[] = []
  private letraActual = '·'
  private letraTimer = 0
  private bufferPrev = 0
  private bufferHoldTimer = 0

  private streamHistory: number[] = []
  private readonly maxStreamPoints = 40

  constructor() {
    const root = document.getElementById('tab-traductor')
    if (!root) return
    this.render(root)
    this.letterEl     = document.getElementById('prediction')
    this.textEl       = document.getElementById('final-text')
    this.bufferCells  = Array.from(root.querySelectorAll<HTMLElement>('.buffer-block__cell'))
    this.bufferCount  = root.querySelector('.buffer-block__count')
    this.streamCanvas = document.getElementById('stream-canvas') as HTMLCanvasElement | null
    if (this.streamCanvas) {
      this.streamCtx = this.streamCanvas.getContext('2d')
    }
    this.streamAvg    = document.getElementById('stream-avg')

    document.getElementById('btn-clear')?.addEventListener('click', () => this.limpiarTexto())
  }

  private render(root: HTMLElement): void {
    root.innerHTML = `
      <div class="detection">
        <div class="detection__letter">
          <span class="detection__label">letra detectada</span>
          <span class="detection__value" id="prediction" aria-live="polite">·</span>
          <span class="detection__sub">esperando seña…</span>
        </div>
        <div class="confidence-arc">
          <svg class="confidence-arc__svg" viewBox="0 0 100 100">
            <circle class="confidence-arc__track" cx="50" cy="50" r="42"/>
            <circle class="confidence-arc__fill" id="conf-arc-fill" cx="50" cy="50" r="42"
              stroke-dasharray="263.9" stroke-dashoffset="263.9"/>
          </svg>
          <div class="confidence-arc__center">
            <span class="confidence-arc__pct" id="m-conf">0<span class="unit">%</span></span>
          </div>
        </div>
      </div>
      <div class="buffer-block" id="buffer-block">
        <div class="buffer-block__head">
          <div class="buffer-block__meta">
            <span class="buffer-block__icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </span>
            <div class="buffer-block__title-group">
              <span class="buffer-block__label">Confirmar letra</span>
              <span class="buffer-block__sub">Mantén la mano quieta</span>
            </div>
          </div>
          <div class="buffer-block__pill">
            <span class="buffer-block__count">00<span class="denom">/09</span></span>
          </div>
        </div>
        <div class="buffer-block__bar">
          ${Array.from({ length: 9 }, (_, idx) => `<span class="buffer-block__cell" data-index="${idx + 1}"></span>`).join('')}
        </div>
        <div class="buffer-block__footer">
          <span class="buffer-block__hint">
            <span class="buffer-block__hint-dot"></span>
            Deja la mano quieta un momento
          </span>
          <span class="buffer-block__guide">Se escribe sola al completarse</span>
        </div>
      </div>
      <div class="metrics">
        <div class="metric"><div class="metric__label">lat</div>
          <div class="metric__value" id="m-time">·<span class="unit">ms</span></div></div>
        <div class="metric"><div class="metric__label">fps</div>
          <div class="metric__value" id="m-fps">·</div></div>
        <div class="metric"><div class="metric__label">mano</div>
          <div class="metric__value" id="m-hand" data-state="off">ND</div></div>
        <div class="metric"><div class="metric__label">estado</div>
          <div class="metric__value metric__value--sm" id="m-estado" data-state="off">·</div></div>
      </div>
      <div class="stream">
        <div class="stream__head">
          <span class="stream__label">confianza · tendencia</span>
          <span class="stream__avg" id="stream-avg">avg --<span class="unit">%</span></span>
        </div>
        <div class="stream__plot">
          <div class="stream__y-axis"><span>100</span><span>50</span><span>0</span></div>
          <div class="stream__chart"><canvas id="stream-canvas" class="stream__canvas" width="260" height="60"></canvas></div>
        </div>
        <div class="stream__x-axis"><span></span>
          <div class="stream__x-axis-inner"><span>anterior</span><span></span><span>ahora</span></div>
        </div>
      </div>
    `
  }

  setLetra(letra: string): void {
    if (!this.letterEl) return
    const display = letra || '·'
    if (display === this.letraActual) return

    this.letraActual = display
    this.letterEl.dataset.changing = 'true'
    clearTimeout(this.letraTimer)
    this.letraTimer = window.setTimeout(() => {
      if (!this.letterEl) return
      this.letterEl.textContent = this.letraActual
      this.letterEl.dataset.changing = 'false'
    }, 40)
  }

  setBuffer(votos: number, total = 9): void {
    const cuenta = Math.min(votos, total)
    const texto  = `${String(cuenta).padStart(2, '0')}<span class="denom">/${String(total).padStart(2, '0')}</span>`
    if (this.bufferCount && this.bufferCount.innerHTML !== texto) {
      this.bufferCount.innerHTML = texto
    }

    const bufferContainer = document.getElementById('buffer-block')
    if (bufferContainer) {
      if (cuenta >= total) {
        bufferContainer.setAttribute('data-full', 'true')
        bufferContainer.setAttribute('data-active', 'true')
      } else if (cuenta > 0) {
        bufferContainer.removeAttribute('data-full')
        bufferContainer.setAttribute('data-active', 'true')
      } else {
        bufferContainer.removeAttribute('data-full')
        bufferContainer.removeAttribute('data-active')
      }
    }

    if (cuenta > this.bufferPrev) {
      clearTimeout(this.bufferHoldTimer)
      this.bufferCells.forEach((c, i) => {
        if (i < cuenta) {
          c.dataset.on = 'true'
        } else if (i === cuenta) {
          c.dataset.on = 'partial'
        } else {
          c.removeAttribute('data-on')
        }
      })
    } else if (cuenta === 0 && this.bufferPrev > 0) {
      this.bufferHoldTimer = window.setTimeout(() => {
        this.bufferCells.forEach(c => c.removeAttribute('data-on'))
      }, 120)
    } else {
      this.bufferCells.forEach((c, i) => {
        if (i < cuenta) {
          c.dataset.on = 'true'
        } else {
          c.removeAttribute('data-on')
        }
      })
    }
    this.bufferPrev = cuenta
  }

  actualizarStream(confianza: number): void {
    this.streamHistory.push(confianza)
    if (this.streamHistory.length > this.maxStreamPoints) {
      this.streamHistory.shift()
    }

    const sum = this.streamHistory.reduce((a, b) => a + b, 0)
    const avg = Math.round((sum / this.streamHistory.length) * 100)
    if (this.streamAvg) {
      this.streamAvg.innerHTML = `avg ${avg}<span class="unit">%</span>`
    }

    if (!this.streamCanvas || !this.streamCtx) return
    const w = this.streamCanvas.width
    const h = this.streamCanvas.height
    const ctx = this.streamCtx

    ctx.clearRect(0, 0, w, h)
    if (this.streamHistory.length < 2) return

    ctx.strokeStyle = '#5B8BD5'
    ctx.lineWidth = 1.5
    ctx.beginPath()

    const step = w / (this.maxStreamPoints - 1)
    const offset = this.maxStreamPoints - this.streamHistory.length

    this.streamHistory.forEach((val, i) => {
      const x = (offset + i) * step
      const y = h - (val * (h - 8) + 4)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  }

  agregarLetra(letra: string, borrar: boolean): void {
    if (borrar) {
      this.letras.pop()
    } else if (letra) {
      this.letras.push(letra)
    }
    this.actualizarTexto()
  }

  limpiarTexto(): void {
    this.letras = []
    this.actualizarTexto()
  }

  private actualizarTexto(): void {
    if (!this.textEl) return
    const txt = this.letras.join('')
    this.textEl.innerHTML = `${txt}<span class="transcript__caret"></span>`
  }
}
