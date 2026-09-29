import type { AppEvents, GameEvent, GameFeedback } from '../../../application/events/app-events'
import type { EventBus } from '../../../application/ports/event-bus'
import type { GameController } from '../../../application/game/game-controller'
import { signUri } from '../../assets/sign-uris'

const LEVEL_LABELS = ['NOVATO', 'BÁSICO', 'MEDIO', 'AVANZADO', 'MAESTRO']

const STAR_NODES = [
  { x: 34,  y: 48 },
  { x: 102, y: 28 },
  { x: 170, y: 52 },
  { x: 238, y: 24 },
  { x: 306, y: 42 },
]

const FEEDBACK_STYLES: Record<GameFeedback['kind'], string> = {
  waiting: 'idle',
  loading: 'idle',
  detected: 'success',
  correct: 'success',
  'needs-letter': 'error',
  'word-complete': 'success',
  'level-up': 'success',
  'word-skipped': 'warn',
  'fallback-bank': 'warn',
  'show-guide': 'warn',
}

const feedbackCopy = (feedback: GameFeedback): string => {
  switch (feedback.kind) {
    case 'waiting': return 'HAZ LA SEÑA...'
    case 'loading': return 'CARGANDO...'
    case 'detected': return `DETECTADA "${feedback.letter}" (${Math.round(feedback.confidence * 100)}%) · MANTÉN LA SEÑA`
    case 'correct': return 'CORRECTO'
    case 'needs-letter': return `"${feedback.signed}" - NECESITAS "${feedback.expected}" · ${feedback.attemptsLeft} intentos`
    case 'word-complete': return 'PALABRA COMPLETA'
    case 'level-up': return `NIVEL: ${LEVEL_LABELS[feedback.levelIndex]}`
    case 'word-skipped': return 'PALABRA OMITIDA'
    case 'fallback-bank': return 'BANCO LOCAL ACTIVO'
    case 'show-guide': return 'MIRA LA GUÍA'
  }
}

export class GamePanel {
  private historyList: HTMLElement | null = null
  private hintImage: HTMLImageElement | null = null
  private levelLabelEl: HTMLElement | null = null
  private scoreEl: HTMLElement | null = null
  private streakEl: HTMLElement | null = null
  private feedbackEl: HTMLElement | null = null
  private wordEl: HTMLElement | null = null
  private progressTextEl: HTMLElement | null = null
  private progressFillEl: HTMLElement | null = null
  private completedWords: string[] = []
  private currentWord = ''
  private previousScore = 0

  constructor(
    bus: EventBus<AppEvents>,
    private readonly controller: GameController,
  ) {
    this.render()
    bus.on('gameEvent', event => this.handleGameEvent(event))
  }

  private render(): void {
    const panel = document.getElementById('tab-entrenamiento')
    if (!panel) return
    panel.innerHTML = `
      <div class="game-stats">
        <div class="game-stat"><div class="game-stat__label">nivel</div>
          <div class="game-stat__value" id="nivel-label">NOVATO</div></div>
        <div class="game-stat"><div class="game-stat__label">puntos</div>
          <div class="game-stat__value" id="puntuacion">0</div></div>
        <div class="game-stat"><div class="game-stat__label">racha</div>
          <div class="game-stat__value" id="racha-valor">0</div></div>
      </div>
      <div class="word-card">
        <div class="word-card__head">
          <span class="word-card__label">deletrea</span>
          <span class="word-card__source"><span class="word-card__source-icon">ai</span>banco local</span>
        </div>
        <div class="word" id="letra-objetivo" aria-live="polite"></div>
        <div class="attempts">
          <span class="attempts__label">intentos</span>
          <span class="attempts__dots"><span class="attempts__dot"></span><span class="attempts__dot"></span><span class="attempts__dot"></span></span>
          <span class="attempts__hint">3 max</span>
        </div>
        <div class="word-card__progress">
          <div class="word-card__progress-label">
            <span>progreso del nivel</span>
            <span class="word-card__progress-count" id="progreso-texto">0<span class="denom">/10</span></span>
          </div>
          <div class="word-card__progress-bar"><div class="word-card__progress-fill" id="progreso-bar"></div></div>
        </div>
        <div class="word-card__actions">
          <button class="game-action-btn" id="btn-palabra-prev" type="button" aria-label="Palabra anterior">
            <svg class="game-action-btn__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span>anterior</span>
          </button>
          <button class="game-action-btn" id="btn-palabra-next" type="button" aria-label="Siguiente palabra">
            <span>siguiente</span>
            <svg class="game-action-btn__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div class="game-feedback fb-idle" id="feedback-mensaje" role="status">haz la seña…</div>
      <img id="imagen-pista" hidden alt="" style="display:none!important"/>
      <div class="levels" id="levels-block">
        <div class="levels__head">
          <span class="levels__label">progresión</span>
          <span class="levels__sub" id="levels-sub">nivel 1 / 5</span>
        </div>
        <div class="levels__map">
          <svg class="levels__svg" id="levels-svg" viewBox="0 0 340 80" preserveAspectRatio="xMidYMid meet">
            ${this.buildConstellation(0)}
          </svg>
        </div>
      </div>
      <div class="history">
        <div class="history__head">
          <span class="history__label">palabras de la sesión</span>
          <span class="history__count" id="history-count">0</span>
        </div>
        <div class="history__list" id="history-list"></div>
      </div>
    `

    this.historyList = document.getElementById('history-list')
    this.hintImage = document.getElementById('imagen-pista') as HTMLImageElement | null
    this.levelLabelEl = document.getElementById('nivel-label')
    this.scoreEl = document.getElementById('puntuacion')
    this.streakEl = document.getElementById('racha-valor')
    this.feedbackEl = document.getElementById('feedback-mensaje')
    this.wordEl = document.getElementById('letra-objetivo')
    this.progressTextEl = document.getElementById('progreso-texto')
    this.progressFillEl = document.getElementById('progreso-bar')

    document.getElementById('btn-palabra-prev')?.addEventListener('click', () => this.controller.previousWord())
    document.getElementById('btn-palabra-next')?.addEventListener('click', () => this.controller.nextWord())
  }

  private buildConstellation(levelIndex: number): string {
    let svg = `<g class="lvl-guides" opacity="0.3">
      <line x1="10" y1="20" x2="330" y2="20" stroke="var(--hairline)" stroke-width="0.5" stroke-dasharray="3 6"/>
      <line x1="10" y1="40" x2="330" y2="40" stroke="var(--hairline)" stroke-width="0.5" stroke-dasharray="3 6"/>
      <line x1="10" y1="60" x2="330" y2="60" stroke="var(--hairline)" stroke-width="0.5" stroke-dasharray="3 6"/>
    </g>`

    for (let i = 0; i < STAR_NODES.length - 1; i++) {
      const from = STAR_NODES[i]
      const to = STAR_NODES[i + 1]
      const done = i < levelIndex
      const lineClass = done ? 'lvl-line lvl-line--done' : 'lvl-line'
      const dash = done ? '' : 'stroke-dasharray="3 4"'

      svg += `<line class="${lineClass}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" ${dash}/>`
    }

    for (let i = 0; i < STAR_NODES.length; i++) {
      const node = STAR_NODES[i]
      const done = i < levelIndex
      const current = i === levelIndex
      const nodeClass = done ? 'lvl-node lvl-node--done' : current ? 'lvl-node lvl-node--current' : 'lvl-node lvl-node--locked'
      const labelClass = done ? 'lvl-label lvl-label--done' : current ? 'lvl-label lvl-label--current' : 'lvl-label lvl-label--locked'

      svg += `<g class="lvl-station" data-level="${i}">`
      if (current) {
        svg += `<circle class="lvl-node--current-glow" cx="${node.x}" cy="${node.y}" r="14"/>`
        svg += `<circle class="lvl-node--current-orbit" cx="${node.x}" cy="${node.y}" r="9"/>`
      }
      svg += `<circle class="${nodeClass}" cx="${node.x}" cy="${node.y}" r="${current ? 6.5 : done ? 5 : 4}"/>`
      if (current) {
        svg += `<circle cx="${node.x}" cy="${node.y}" r="2" fill="var(--warm)"/>`
      }
      const labelY = node.y > 40 ? node.y - 12 : node.y + 18
      svg += `<text class="${labelClass}" x="${node.x}" y="${labelY}" text-anchor="middle">${LEVEL_LABELS[i].toLowerCase()}</text>`
      svg += `</g>`
    }

    return svg
  }

  private handleGameEvent(event: GameEvent): void {
    switch (event.type) {
      case 'word-started':
        this.currentWord = event.word
        this.renderWord(0)
        this.setLevelLabel(event.levelIndex)
        this.hideHint()
        break
      case 'letter-matched':
        this.renderWord(event.position)
        break
      case 'attempts':
        this.updateAttempts(event.errors)
        break
      case 'progress':
        this.updateProgress(event.completed, event.required)
        break
      case 'word-completed':
        this.appendHistory(event.word)
        this.updateStreak(event.streak)
        this.updateScore(event.score, true)
        this.hideHint()
        break
      case 'level-changed':
        this.updateConstellation(event.levelIndex)
        break
      case 'word-skipped':
        this.hideHint()
        this.updateStreak(0)
        break
      case 'hint-hidden':
        this.hideHint()
        break
      case 'score':
        this.updateScore(event.score, false)
        break
      case 'source':
        this.updateSource(event.source)
        break
      case 'feedback':
        this.showFeedback(event.feedback)
        break
    }
  }

  private renderWord(position: number): void {
    if (!this.wordEl) return
    this.wordEl.textContent = ''
    this.currentWord.split('').forEach((character, index) => {
      const span = document.createElement('span')
      span.textContent = character
      span.className = index < position ? 'gw-done'
        : index === position ? 'gw-current'
        : 'gw-pending'
      this.wordEl?.appendChild(span)
    })
    if (position < this.currentWord.length && this.hintImage) {
      this.hintImage.src = signUri(this.currentWord[position])
    }
  }

  private setLevelLabel(levelIndex: number): void {
    if (this.levelLabelEl) this.levelLabelEl.textContent = LEVEL_LABELS[levelIndex]
  }

  private updateAttempts(errors: number): void {
    const dots = document.querySelectorAll<HTMLElement>('.attempts__dot')
    dots.forEach((dot, index) => dot.classList.toggle('attempts__dot--used', index < errors))
  }

  private updateProgress(completed: number, required: number): void {
    const percent = Math.round((completed / required) * 100)
    if (this.progressTextEl) this.progressTextEl.textContent = `${completed}/${required}`
    if (this.progressFillEl) this.progressFillEl.style.width = `${percent}%`
  }

  private appendHistory(word: string): void {
    this.completedWords.push(word)
    if (!this.historyList) return

    const countEl = document.getElementById('history-count')
    if (countEl) countEl.textContent = String(this.completedWords.length)

    const previousLatest = this.historyList.querySelector('.history__word--latest')
    if (previousLatest) previousLatest.classList.remove('history__word--latest')

    const span = document.createElement('span')
    span.className = 'history__word history__word--latest'
    span.textContent = word.toLowerCase()
    this.historyList.appendChild(span)
  }

  private updateStreak(streak: number): void {
    if (this.streakEl) this.streakEl.textContent = String(streak)
  }

  private updateScore(score: number, bump: boolean): void {
    if (!this.scoreEl) return
    this.scoreEl.textContent = String(score)
    if (bump && score !== this.previousScore) {
      this.scoreEl.classList.remove('score-bump')
      void this.scoreEl.offsetWidth
      this.scoreEl.classList.add('score-bump')
    }
    this.previousScore = score
  }

  private updateConstellation(levelIndex: number): void {
    const svg = document.getElementById('levels-svg')
    if (svg) svg.innerHTML = this.buildConstellation(levelIndex)

    const sub = document.getElementById('levels-sub')
    if (sub) sub.textContent = `nivel ${levelIndex + 1} / 5`
  }

  private updateSource(source: string): void {
    const el = document.querySelector('.word-card__source')
    if (el) {
      const label = source === 'datamuse' ? 'datamuse' : 'banco local'
      const icon = source === 'datamuse' ? 'api' : 'ai'
      el.innerHTML = `<span class="word-card__source-icon">${icon}</span>${label}`
    }
  }

  private showFeedback(feedback: GameFeedback): void {
    if (this.feedbackEl) {
      this.feedbackEl.textContent = feedbackCopy(feedback)
      this.feedbackEl.className = `game-feedback fb-${FEEDBACK_STYLES[feedback.kind]}`
    }
    if (feedback.kind === 'show-guide') this.showHint()
  }

  private showHint(): void {
    this.hintImage?.classList.add('visible')
  }

  private hideHint(): void {
    this.hintImage?.classList.remove('visible')
  }
}