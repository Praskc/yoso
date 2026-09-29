import { BACKSPACE } from '../../../domain/alphabet'
import type { AppEvents } from '../../../application/events/app-events'
import type { EventBus } from '../../../application/ports/event-bus'

export class OutputPanel {
  private letterEl: HTMLElement | null = null
  private textEl: HTMLElement | null = null
  private bufferCells: HTMLElement[] = []
  private bufferCountEl: HTMLElement | null = null
  private streamCanvas: HTMLCanvasElement | null = null
  private streamCtx: CanvasRenderingContext2D | null = null
  private streamAvg: HTMLElement | null = null

  private letters: string[] = []
  private currentLetter = '·'
  private letterTimer = 0
  private previousBufferCount = 0
  private bufferHoldTimer = 0

  private streamHistory: number[] = []
  private readonly maxStreamPoints = 40

  constructor(bus: EventBus<AppEvents>) {
    const root = document.getElementById('tab-traductor')
    if (root) {
      this.render(root)
      this.letterEl = document.getElementById('prediction')
      this.textEl = document.getElementById('final-text')
      this.bufferCells = Array.from(root.querySelectorAll<HTMLElement>('.buffer-block__cell'))
      this.bufferCountEl = root.querySelector('.buffer-block__count')
      this.streamCanvas = document.getElementById('stream-canvas') as HTMLCanvasElement | null
      if (this.streamCanvas) {
        this.streamCtx = this.streamCanvas.getContext('2d')
      }
      this.streamAvg = document.getElementById('stream-avg')
      document.getElementById('btn-clear')?.addEventListener('click', () => this.clearText())
    }

    bus.on('prediction', payload => {
      this.setLetter(payload.letter)
      this.updateStream(payload.effectiveConfidence)
    })
    bus.on('letterConfirmed', payload => this.appendLetter(payload.letter, payload.letter === BACKSPACE))
    bus.on('handCleared', () => this.setLetter(''))
    bus.on('modeChanged', () => this.clearText())
    bus.on('debugUpdated', payload => {
      const votes = payload.voteBuffer.filter(entry => entry !== '').length
      this.updateBuffer(votes, payload.voteBuffer.length)
    })
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

  setLetter(letter: string): void {
    if (!this.letterEl) return
    const display = letter || '·'
    if (display === this.currentLetter) return

    this.currentLetter = display
    this.letterEl.dataset.changing = 'true'
    clearTimeout(this.letterTimer)
    this.letterTimer = window.setTimeout(() => {
      if (!this.letterEl) return
      this.letterEl.textContent = this.currentLetter
      this.letterEl.dataset.changing = 'false'
    }, 40)
  }

  updateBuffer(count: number, total: number): void {
    const clamped = Math.min(count, total)
    const text = `${String(clamped).padStart(2, '0')}<span class="denom">/${String(total).padStart(2, '0')}</span>`
    if (this.bufferCountEl && this.bufferCountEl.innerHTML !== text) {
      this.bufferCountEl.innerHTML = text
    }

    const bufferContainer = document.getElementById('buffer-block')
    if (bufferContainer) {
      if (clamped >= total) {
        bufferContainer.setAttribute('data-full', 'true')
        bufferContainer.setAttribute('data-active', 'true')
      } else if (clamped > 0) {
        bufferContainer.removeAttribute('data-full')
        bufferContainer.setAttribute('data-active', 'true')
      } else {
        bufferContainer.removeAttribute('data-full')
        bufferContainer.removeAttribute('data-active')
      }
    }

    if (clamped > this.previousBufferCount) {
      clearTimeout(this.bufferHoldTimer)
      this.bufferCells.forEach((cell, index) => {
        if (index < clamped) {
          cell.dataset.on = 'true'
        } else if (index === clamped) {
          cell.dataset.on = 'partial'
        } else {
          cell.removeAttribute('data-on')
        }
      })
    } else if (clamped === 0 && this.previousBufferCount > 0) {
      this.bufferHoldTimer = window.setTimeout(() => {
        this.bufferCells.forEach(cell => cell.removeAttribute('data-on'))
      }, 120)
    } else {
      this.bufferCells.forEach((cell, index) => {
        if (index < clamped) {
          cell.dataset.on = 'true'
        } else {
          cell.removeAttribute('data-on')
        }
      })
    }
    this.previousBufferCount = clamped
  }

  updateStream(confidence: number): void {
    this.streamHistory.push(confidence)
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

  appendLetter(letter: string, remove: boolean): void {
    if (remove) {
      this.letters.pop()
    } else if (letter) {
      this.letters.push(letter)
    }
    this.renderText()
  }

  clearText(): void {
    this.letters = []
    this.renderText()
  }

  private renderText(): void {
    if (!this.textEl) return
    const text = this.letters.join('')
    this.textEl.innerHTML = `${text}<span class="transcript__caret"></span>`
  }
}
