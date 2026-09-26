const STREAM_W   = 300
const STREAM_H   = 130
const STREAM_MAX = 150  // ~5s a 30fps

// Coordenadas X precalculadas como números (ya no strings para SVG).
const STREAM_XS: number[] = Array.from(
  { length: STREAM_MAX },
  (_, i) => (i / (STREAM_MAX - 1)) * STREAM_W
)

// Y del umbral de confianza (82%) precalculado
const STREAM_THRESHOLD_Y = STREAM_H * (1 - 0.82)

export class OutputPanel {
  private letterEl:    HTMLElement | null = null
  private textEl:      HTMLElement | null = null
  private bufferCells: HTMLElement[] = []
  private bufferCount: HTMLElement | null = null
  private streamCanvas: HTMLCanvasElement | null = null
  private streamCtx:    CanvasRenderingContext2D | null = null
  private streamAvg:   HTMLElement | null = null
  private letras: string[] = []
  private letraActual = '·'
  private letraTimer = 0
  private bufferPrev = 0
  private bufferHoldTimer = 0
  private streamBuf: number[] = []
  private streamSum = 0
  private _lastStreamTs = 0

  constructor() {
    const root = document.getElementById('tab-traductor')
    if (!root) return
    this.render(root)
    this.letterEl    = document.getElementById('prediction')
    this.textEl      = document.getElementById('final-text')
    this.bufferCells = Array.from(root.querySelectorAll<HTMLElement>('.buffer-block__cell'))
    this.bufferCount = root.querySelector('.buffer-block__count')
    this.streamCanvas = document.getElementById('stream-canvas') as HTMLCanvasElement | null
    if (this.streamCanvas) {
      this.streamCanvas.width  = STREAM_W
      this.streamCanvas.height = STREAM_H
      this.streamCtx = this.streamCanvas.getContext('2d')
    }
    this.streamAvg   = document.getElementById('stream-avg')

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
            <circle class="confidence-arc__fill" id="conf-arc-fill"
              cx="50" cy="50" r="42"
              stroke-dasharray="263.9"
              stroke-dashoffset="263.9"/>
          </svg>
          <div class="confidence-arc__center">
            <span class="confidence-arc__pct" id="m-conf">0<span class="unit">%</span></span>
          </div>
        </div>
      </div>

      <div class="buffer-block">
        <div class="buffer-block__head">
          <span class="buffer-block__label">buffer</span>
          <span class="buffer-block__count">00<span class="denom">/09</span></span>
        </div>
        <div class="buffer-block__bar">
          ${Array.from({ length: 9 }, () => '<span class="buffer-block__cell"></span>').join('')}
        </div>
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="metric__label">lat</div>
          <div class="metric__value" id="m-time">·<span class="unit">ms</span></div>
        </div>
        <div class="metric">
          <div class="metric__label">fps</div>
          <div class="metric__value" id="m-fps">·</div>
        </div>
        <div class="metric">
          <div class="metric__label">mano</div>
          <div class="metric__value" id="m-hand" data-state="off">ND</div>
        </div>
        <div class="metric">
          <div class="metric__label">estado</div>
          <div class="metric__value metric__value--sm" id="m-estado" data-state="off">·</div>
        </div>
      </div>

      <div class="stream">
        <div class="stream__head">
          <span class="stream__label">confianza · tendencia</span>
          <span class="stream__avg" id="stream-avg">avg --<span class="unit">%</span></span>
        </div>
        <div class="stream__plot">
          <div class="stream__y-axis">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
          <div class="stream__chart">
            <canvas id="stream-canvas" class="stream__canvas"></canvas>
          </div>
        </div>
        <div class="stream__x-axis">
          <span></span>
          <div class="stream__x-axis-inner">
            <span>anterior</span>
            <span></span>
            <span>ahora</span>
          </div>
        </div>
      </div>
    `
  }

  setLetra(letra: string): void {
    if (!this.letterEl) return
    const display = letra || '·'
    if (display === this.letraActual) return
    this.letraActual = display
    clearTimeout(this.letraTimer)
    this.letterEl.dataset.changing = 'true'
    const el = this.letterEl
    this.letraTimer = window.setTimeout(() => {
      el.textContent = display
      el.dataset.changing = 'false'
    }, 180)
  }

  agregarLetra(letra: string, borrar: boolean): void {
    if (borrar) {
      this.letras.pop()
    } else {
      this.letras.push(letra)
    }
    this.renderText()
  }

  limpiarTexto(): void {
    this.letras = []
    this.renderText()
  }

  private renderText(): void {
    if (!this.textEl) return
    const completo = this.letras.join('')
    if (!completo) {
      this.textEl.innerHTML = '<span class="transcript__caret"></span>'
      return
    }
    this.textEl.innerHTML = this.escape(completo) + '<span class="transcript__caret"></span>'
  }

  setBuffer(activos: number, total = 9): void {
    if (this.bufferCells.length === 0 || !this.bufferCount) return
    if (activos < this.bufferPrev) {
      clearTimeout(this.bufferHoldTimer)
      this.bufferHoldTimer = window.setTimeout(() => {
        this.applyBuffer(0, total)
        this.bufferPrev = 0
      }, 420)
      return
    }
    clearTimeout(this.bufferHoldTimer)
    if (activos === this.bufferPrev) return
    this.bufferPrev = activos
    this.applyBuffer(activos, total)
  }

  private applyBuffer(activos: number, total: number): void {
    if (!this.bufferCount) return
    this.bufferCells.forEach((c, i) => {
      if (i < activos - 1) {
        c.dataset.on = 'true'
      } else if (i === activos - 1 && activos > 0) {
        c.dataset.on = 'partial'
      } else {
        c.removeAttribute('data-on')
      }
    })
    this.bufferCount.innerHTML = `${String(activos).padStart(2, '0')}<span class="denom">/${total}</span>`
  }

  actualizarStream(confianza: number): void {
    this.streamBuf.push(confianza)
    this.streamSum += confianza
    if (this.streamBuf.length > STREAM_MAX) {
      this.streamSum -= this.streamBuf.shift()!
    }
    const now = performance.now()
    if (now - this._lastStreamTs < 45) return
    this._lastStreamTs = now
    this.renderStream()
  }

  private renderStream(): void {
    const ctx = this.streamCtx
    const buf = this.streamBuf
    const n = buf.length
    if (n < 2 || !ctx) return

    ctx.clearRect(0, 0, STREAM_W, STREAM_H)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 0);            ctx.lineTo(STREAM_W, 0)
    ctx.moveTo(0, STREAM_H / 2); ctx.lineTo(STREAM_W, STREAM_H / 2)
    ctx.moveTo(0, STREAM_H);     ctx.lineTo(STREAM_W, STREAM_H)
    ctx.stroke()

    // Threshold line (dashed)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(0, STREAM_THRESHOLD_Y)
    ctx.lineTo(STREAM_W, STREAM_THRESHOLD_Y)
    ctx.stroke()
    ctx.setLineDash([])

    // Threshold label
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '500 8.5px monospace'
    ctx.textAlign = 'right'
    ctx.fillText('umbral 82', STREAM_W - 4, STREAM_THRESHOLD_Y - 4)

    // Build line path
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = STREAM_XS[i]
      const y = STREAM_H * (1 - buf[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    // Area fill (gradient under line)
    const xLast = STREAM_XS[n - 1]
    ctx.lineTo(xLast, STREAM_H)
    ctx.lineTo(STREAM_XS[0], STREAM_H)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, STREAM_H)
    grad.addColorStop(0, 'rgba(56,189,248,0.35)')
    grad.addColorStop(1, 'rgba(56,189,248,0)')
    ctx.fillStyle = grad
    ctx.fill()

    // Line stroke
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = STREAM_XS[i]
      const y = STREAM_H * (1 - buf[i])
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = '#38BDF8'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Dot at last point
    const yLast = STREAM_H * (1 - buf[n - 1])
    ctx.beginPath()
    ctx.arc(xLast, yLast, 3, 0, 2 * Math.PI)
    ctx.fillStyle = '#38BDF8'
    ctx.fill()

    // Avg text
    if (this.streamAvg) {
      this.streamAvg.innerHTML = `avg ${Math.round((this.streamSum / n) * 100)}<span class="unit">%</span>`
    }
  }

  private escape(s: string): string {
    return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  }
}
