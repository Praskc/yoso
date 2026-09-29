import type { AppEvents } from '../../../application/events/app-events'
import type { EventBus } from '../../../application/ports/event-bus'
import type { ModeHandler } from '../../../application/modes/mode-controller'
import { DISPLAY_LETTERS, NO_DETECTION } from '../../../domain/alphabet'

export class LearnPanel implements ModeHandler {
  private cells: HTMLElement[] = []
  private seen = new Set<string>()
  private current: string | null = 'A'
  private letterIndex = 0
  private countEl: HTMLElement | null = null
  private letterEl: HTMLElement | null = null
  private active = false

  constructor(bus: EventBus<AppEvents>) {
    this.render()
    bus.on('prediction', payload => {
      if (!this.active) return
      if (payload.letter === NO_DETECTION) {
        this.clear()
      } else {
        this.highlight(payload.letter)
      }
    })
  }

  onEnter(): void {
    this.active = true
  }

  onExit(): void {
    this.active = false
    this.clear()
  }

  private render(): void {
    const panel = document.getElementById('tab-aprendizaje')
    if (!panel) return
    const total = DISPLAY_LETTERS.length
    panel.innerHTML = `
      <div class="learn-detail">
        <div class="learn-detail__head">
          <span class="learn-detail__label">letra en estudio</span>
          <div class="learn-detail__progress">
            <span id="learn-seen-count">0</span><span class="denom">/${total} vistas</span>
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
        <p class="learn-detail__hint">haz la seña frente a la cámara o navega por el catálogo</p>
      </div>
      <div class="alphabet-section">
        <div class="alphabet-section__head">
          <p class="alphabet-header">Alfabeto LSC · ${total} letras</p>
          <span class="alphabet-header__sub">clic en celda para enfocar</span>
        </div>
        <div class="alphabet-grid" id="alphabet-grid" role="list">
          ${DISPLAY_LETTERS.map(letter => `
            <button class="alphabet-cell" data-letter="${letter}" type="button" role="listitem" aria-label="Letra ${letter}">${letter.toLowerCase()}</button>
          `).join('')}
        </div>
      </div>
    `
    this.cells = Array.from(panel.querySelectorAll<HTMLElement>('.alphabet-cell'))
    this.countEl = document.getElementById('learn-seen-count')
    this.letterEl = document.getElementById('learn-letter')

    document.getElementById('btn-learn-prev')?.addEventListener('click', () => this.previousLetter())
    document.getElementById('btn-learn-next')?.addEventListener('click', () => this.nextLetter())

    this.cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const letter = cell.dataset['letter']
        if (letter) this.selectLetter(letter)
      })
    })

    this.repaint()
  }

  selectLetter(letter: string): void {
    const index = DISPLAY_LETTERS.indexOf(letter.toUpperCase())
    if (index !== -1) {
      this.letterIndex = index
      this.current = DISPLAY_LETTERS[index]
      this.seen.add(this.current)
      if (this.letterEl) {
        this.letterEl.textContent = this.current
      }
      this.repaint()
    }
  }

  previousLetter(): void {
    this.letterIndex = (this.letterIndex - 1 + DISPLAY_LETTERS.length) % DISPLAY_LETTERS.length
    this.selectLetter(DISPLAY_LETTERS[this.letterIndex])
  }

  nextLetter(): void {
    this.letterIndex = (this.letterIndex + 1) % DISPLAY_LETTERS.length
    this.selectLetter(DISPLAY_LETTERS[this.letterIndex])
  }

  randomLetter(): void {
    const pending = DISPLAY_LETTERS.filter(letter => !this.seen.has(letter))
    const pool = pending.length > 0 ? pending : DISPLAY_LETTERS.filter(letter => letter !== this.current)
    const random = pool[Math.floor(Math.random() * pool.length)] ?? DISPLAY_LETTERS[0]
    this.selectLetter(random)
  }

  highlight(letter: string): void {
    const upper = letter ? letter.toUpperCase() : null
    if (!upper) return
    const index = DISPLAY_LETTERS.indexOf(upper)
    if (index !== -1) {
      this.letterIndex = index
      this.current = upper
      this.seen.add(upper)
      if (this.letterEl) {
        this.letterEl.textContent = upper
      }
      this.repaint()
    }
  }

  clear(): void {
    this.repaint()
  }

  private repaint(): void {
    for (const cell of this.cells) {
      const letter = cell.dataset['letter']!
      if (letter === this.current) {
        cell.dataset.state = 'active'
      } else if (this.seen.has(letter)) {
        cell.dataset.state = 'seen'
      } else {
        delete cell.dataset.state
      }
    }
    if (this.countEl) {
      this.countEl.textContent = String(this.seen.size)
    }
  }
}
