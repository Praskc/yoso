const NIVELES_META = [
  { label: 'NOVATO',   roman: 'I',   desc: 'Adquisición elemental (3–4 letras)', req: 3,  idx: 0 },
  { label: 'BÁSICO',   roman: 'II',  desc: 'Rango intermedio (4–5 letras)',     req: 5,  idx: 1 },
  { label: 'MEDIO',    roman: 'III', desc: 'Fluidez de transición (5–6 letras)', req: 7,  idx: 2 },
  { label: 'AVANZADO', roman: 'IV',  desc: 'Precisión léxica (6–7 letras)',     req: 9,  idx: 3 },
  { label: 'MAESTRO',  roman: 'V',   desc: 'Dominio dactilológico (7–9 letras)',req: 12, idx: 4 },
]

// Nodos para viewBox 0 0 340 80
const STAR_NODES = [
  { x: 34,  y: 48 },  // I: Novato
  { x: 102, y: 28 },  // II: Básico
  { x: 170, y: 52 },  // III: Medio
  { x: 238, y: 24 },  // IV: Avanzado
  { x: 306, y: 42 },  // V: Maestro
]

export class GamePanel {
  private historyList:      HTMLElement | null = null
  private palabrasHistorial: string[] = []
  private nivelActual = 0

  constructor() {
    this.render()
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
    this.vincularEventos()
  }

  private buildConstellation(nivelIdx: number): string {
    let svg = ''

    // Guías de constelación astronómica (coordenadas tenues)
    svg += `<g class="lvl-guides" opacity="0.3">
      <line x1="10" y1="20" x2="330" y2="20" stroke="var(--hairline)" stroke-width="0.5" stroke-dasharray="3 6"/>
      <line x1="10" y1="40" x2="330" y2="40" stroke="var(--hairline)" stroke-width="0.5" stroke-dasharray="3 6"/>
      <line x1="10" y1="60" x2="330" y2="60" stroke="var(--hairline)" stroke-width="0.5" stroke-dasharray="3 6"/>
    </g>`

    // Líneas entre nodos
    for (let i = 0; i < STAR_NODES.length - 1; i++) {
      const p1 = STAR_NODES[i]
      const p2 = STAR_NODES[i + 1]
      const done = i < nivelIdx
      const lineClass = done ? 'lvl-line lvl-line--done' : 'lvl-line'
      const dash = done ? '' : 'stroke-dasharray="3 4"'

      svg += `<line class="${lineClass}" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" ${dash}/>`
    }

    // Nodos celestes
    for (let i = 0; i < STAR_NODES.length; i++) {
      const p = STAR_NODES[i]
      const done    = i < nivelIdx
      const current = i === nivelIdx
      const nodeClass = done ? 'lvl-node lvl-node--done' : current ? 'lvl-node lvl-node--current' : 'lvl-node lvl-node--locked'
      const labelClass = done ? 'lvl-label lvl-label--done' : current ? 'lvl-label lvl-label--current' : 'lvl-label lvl-label--locked'

      svg += `<g class="lvl-station" data-level="${i}">`
      if (current) {
        svg += `<circle class="lvl-node--current-glow" cx="${p.x}" cy="${p.y}" r="14"/>`
        svg += `<circle class="lvl-node--current-orbit" cx="${p.x}" cy="${p.y}" r="9"/>`
      }
      svg += `<circle class="${nodeClass}" cx="${p.x}" cy="${p.y}" r="${current ? 6.5 : done ? 5 : 4}"/>`
      if (current) {
        svg += `<circle cx="${p.x}" cy="${p.y}" r="2" fill="var(--warm)"/>`
      }
      const labelY = p.y > 40 ? p.y - 12 : p.y + 18
      svg += `<text class="${labelClass}" x="${p.x}" y="${labelY}" text-anchor="middle">${NIVELES_META[i].label.toLowerCase()}</text>`
      svg += `</g>`
    }

    return svg
  }

  private vincularEventos(): void {
    document.getElementById('btn-palabra-prev')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('yoso:juego:anterior'))
    })
    document.getElementById('btn-palabra-next')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('yoso:juego:siguiente'))
    })

    window.addEventListener('yoso:juego', (e) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail
      switch (d.tipo) {
        case 'nivel':
          if (typeof d.nivelIdx === 'number' && d.nivelIdx !== this.nivelActual) {
            this.nivelActual = d.nivelIdx
            this.actualizarConstelacion(d.nivelIdx)
          }
          break
        case 'palabra':
          if (typeof d.palabra === 'string') this.agregarPalabraHistorial(d.palabra)
          if (typeof d.racha === 'number') this.setRacha(d.racha)
          break
        case 'omitida':
          this.setRacha(0)
          break
        case 'intentos':
          if (typeof d.errores === 'number') this.setIntentos(d.errores)
          break
        case 'fuente':
          this.setFuente(d.fuente === 'datamuse' ? 'datamuse' : 'banco local')
          break
      }
    })
  }

  private actualizarConstelacion(nivelIdx: number): void {
    const svg = document.getElementById('levels-svg')
    if (!svg) return
    svg.innerHTML = this.buildConstellation(nivelIdx)

    const sub = document.getElementById('levels-sub')
    if (sub) sub.textContent = `nivel ${nivelIdx + 1} / 5`
  }

  private agregarPalabraHistorial(palabra: string): void {
    this.palabrasHistorial.push(palabra)
    if (!this.historyList) return

    const countEl = document.getElementById('history-count')
    if (countEl) countEl.textContent = String(this.palabrasHistorial.length)

    const prev = this.historyList.querySelector('.history__word--latest')
    if (prev) prev.classList.remove('history__word--latest')

    const span = document.createElement('span')
    span.className = 'history__word history__word--latest'
    span.textContent = palabra.toLowerCase()
    this.historyList.appendChild(span)
  }

  private setRacha(racha: number): void {
    const el = document.getElementById('racha-valor')
    if (el) el.textContent = String(racha)
  }

  private setIntentos(errores: number): void {
    const dots = document.querySelectorAll<HTMLElement>('.attempts__dot')
    dots.forEach((dot, i) => dot.classList.toggle('attempts__dot--used', i < errores))
  }

  private setFuente(fuente: string): void {
    const el = document.querySelector('.word-card__source')
    if (el) {
      const icon = fuente === 'datamuse' ? 'api' : 'ai'
      el.innerHTML = `<span class="word-card__source-icon">${icon}</span>${fuente}`
    }
  }
}
