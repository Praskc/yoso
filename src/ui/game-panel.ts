import { signURI } from '../lib/signs'

// Nodos para viewBox 0 0 340 104 — Mayor altura, amplitud y legibilidad de texto
const CONSTELLATION_NODES = [
  { x: 36,  y: 64, roman: 'I',   label: 'NOVATO' },
  { x: 102, y: 28, roman: 'II',  label: 'BÁSICO' },
  { x: 170, y: 66, roman: 'III', label: 'MEDIO' },
  { x: 238, y: 28, roman: 'IV',  label: 'AVANZADO' },
  { x: 304, y: 60, roman: 'V',   label: 'MAESTRO' },
]

export class GamePanel {
  private historyList:      HTMLElement | null = null
  private palabrasHistorial: string[] = []
  private puntosTotales = 0
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
        </div>
        <div class="word" id="letra-objetivo" aria-live="polite"></div>
        <div class="attempts">
          <span class="attempts__label">fallos: <strong id="intentos-count">0/3</strong></span>
          <span class="attempts__dots">
            <span class="attempts__dot"></span>
            <span class="attempts__dot"></span>
            <span class="attempts__dot"></span>
          </span>
          <span class="attempts__hint">3 max</span>
        </div>
        <div class="word-card__progress">
          <div class="word-card__progress-label">
            <span>palabras para subir</span>
            <span class="word-card__progress-count" id="progreso-texto">0 / 3</span>
          </div>
          <div class="word-card__progress-bar"><div class="word-card__progress-fill" id="progreso-bar"></div></div>
        </div>
        <div class="word-card__actions">
          <button class="game-action-btn game-action-btn--prev" id="btn-palabra-prev" type="button" aria-label="Palabra anterior">
            <svg class="game-action-btn__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span>anterior</span>
          </button>
          <button class="game-action-btn game-action-btn--skip" id="btn-palabra-skip" type="button" aria-label="Omitir palabra" data-tooltip="Pierde la racha">
            <span>omitir</span>
          </button>
          <button class="game-action-btn game-action-btn--next" id="btn-palabra-next" type="button" aria-label="Siguiente palabra">
            <span>siguiente</span>
            <svg class="game-action-btn__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div class="word-card__feedback-strip fb-idle" id="feedback-mensaje" role="status" style="display:none!important">
        <span class="feedback-dot"></span>
        <span class="feedback-text"></span>
      </div>
      <img id="imagen-pista" hidden alt="" style="display:none!important"/>
      <div class="levels" id="levels-block">
        <div class="levels__head">
          <span class="levels__label">PROGRESIÓN DE NIVEL</span>
        </div>
        <div class="levels__map">
          <svg class="levels__svg" id="levels-svg" viewBox="0 0 340 104" preserveAspectRatio="xMidYMid meet">
            ${this.buildConstellation(0)}
          </svg>
        </div>
      </div>
      <div class="history">
        <div class="history__head">
          <div class="history__title-group">
            <span class="history__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </span>
            <span class="history__label">PALABRAS DE LA SESIÓN</span>
          </div>
          <span class="history__summary" id="history-summary"></span>
        </div>
        <div class="history__list" id="history-list">
          <div class="ghost-chip" id="ghost-chip-1"><span class="ghost-hand">🖐</span><span class="ghost-slots"><span></span><span></span><span></span></span></div>
          <div class="ghost-chip" id="ghost-chip-2"><span class="ghost-hand">🖐</span><span class="ghost-slots"><span></span><span></span><span></span></span></div>
          <div class="ghost-chip" id="ghost-chip-3"><span class="ghost-hand">🖐</span><span class="ghost-slots"><span></span><span></span><span></span></span></div>
          <span class="ghost-caption" id="ghost-caption">se deletrea aquí</span>
        </div>
      </div>
    `

    this.historyList = document.getElementById('history-list')
    this.vincularEventos()
  }

  private buildConstellation(nivelIdx: number, celebrateNew = false): string {
    // Curva Bézier continua y suave a través de los 5 puntos con mayor amplitud
    const fullPathD = `M 36 64 C 62 64, 76 28, 102 28 C 128 28, 144 66, 170 66 C 196 66, 212 28, 238 28 C 264 28, 278 60, 304 60`

    // Tramos Bézier suaves correspondientes a cada nivel
    const activeSubPaths = [
      '', // Nivel 0
      `M 36 64 C 62 64, 76 28, 102 28`, // Nivel 1 (Básico)
      `M 36 64 C 62 64, 76 28, 102 28 C 128 28, 144 66, 170 66`, // Nivel 2 (Medio)
      `M 36 64 C 62 64, 76 28, 102 28 C 128 28, 144 66, 170 66 C 196 66, 212 28, 238 28`, // Nivel 3 (Avanzado)
      `M 36 64 C 62 64, 76 28, 102 28 C 128 28, 144 66, 170 66 C 196 66, 212 28, 238 28 C 264 28, 278 60, 304 60`, // Nivel 4 (Maestro)
    ]

    let svg = ''

    // 1. Camino curvo base suave (tenue)
    svg += `<path class="cst-path-base" d="${fullPathD}" fill="none" />`

    // 2. Curva encendida en tono cálido hasta el nivel alcanzado
    const activeD = activeSubPaths[Math.min(nivelIdx, activeSubPaths.length - 1)]
    if (activeD) {
      svg += `<path class="cst-path-active" d="${activeD}" fill="none" />`
    }

    // 3. Nodos estelares
    CONSTELLATION_NODES.forEach((p, i) => {
      const isDone = i < nivelIdx
      const isCurr = i === nivelIdx
      const isCelebrated = isCurr && celebrateNew

      svg += `<g class="cst-node-group" data-level="${i}">`

      if (isCurr) {
        // Halo pulsante y onda de choque si subió de nivel
        svg += `<circle class="cst-halo ${isCelebrated ? 'cst-halo--burst' : ''}" cx="${p.x}" cy="${p.y}" r="20"/>`
      }

      if (isDone) {
        // Nivel completado: Estrella dorada llena ★
        svg += `
          <circle class="cst-star-done-bg" cx="${p.x}" cy="${p.y}" r="12.5"/>
          <path class="cst-star-icon" transform="translate(${p.x - 7.5}, ${p.y - 7.5}) scale(0.75)"
            d="M 10 1 L 12.8 6.8 L 19 7.7 L 14.5 12.1 L 15.6 18.2 L 10 15.3 L 4.4 18.2 L 5.5 12.1 L 1 7.7 L 7.2 6.8 Z" fill="#E2D3B3"/>
        `
      } else if (isCurr) {
        // Nivel actual: Azul acento luminoso con pop+bounce
        svg += `
          <circle class="cst-star-current ${isCelebrated ? 'cst-star-celebrate' : 'cst-pop'}" cx="${p.x}" cy="${p.y}" r="13"/>
          <text class="cst-roman cst-roman--curr" x="${p.x}" y="${p.y + 4}" text-anchor="middle">${p.roman}</text>
        `
      } else {
        // Niveles futuros: Estrellas vacías con contorno fino y numeral romano
        svg += `
          <circle class="cst-star-future" cx="${p.x}" cy="${p.y}" r="11.5"/>
          <text class="cst-roman cst-roman--future" x="${p.x}" y="${p.y + 4}" text-anchor="middle">${p.roman}</text>
        `
      }

      // Nombre del rango siempre visible y con excelente contraste/tamaño
      const labelY = p.y > 40 ? p.y + 25 : p.y - 14
      const titleClass = isCurr ? 'cst-label cst-label--curr' : isDone ? 'cst-label cst-label--done' : 'cst-label cst-label--future'
      svg += `<text class="${titleClass}" x="${p.x}" y="${labelY}" text-anchor="middle">${p.label}</text>`

      svg += `</g>`
    })

    return svg
  }

  private vincularEventos(): void {
    document.getElementById('btn-palabra-prev')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('yoso:juego:anterior'))
    })
    document.getElementById('btn-palabra-skip')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('yoso:juego:saltar'))
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
            this.actualizarConstelacion(d.nivelIdx, true)
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
      }
    })
  }

  private actualizarConstelacion(nivelIdx: number, celebrate = false): void {
    const svg = document.getElementById('levels-svg')
    if (svg) svg.innerHTML = this.buildConstellation(nivelIdx, celebrate)
  }

  private agregarPalabraHistorial(palabra: string): void {
    const limpia = palabra.trim().toUpperCase()
    this.palabrasHistorial.push(limpia)
    const pts = limpia.length * 10
    this.puntosTotales += pts

    if (!this.historyList) return

    // Desplazar / remover un ghost chip en cada nueva palabra completada
    const count = this.palabrasHistorial.length
    const ghost = document.getElementById(`ghost-chip-${count}`)
    if (ghost) {
      ghost.classList.add('ghost-chip--displace')
      setTimeout(() => ghost.remove(), 240)
    }
    if (count >= 3) {
      document.getElementById('ghost-caption')?.remove()
    }

    // Header sin ruido en 0, activado en primera palabra: "✓ 1 · 40 pts"
    const summaryEl = document.getElementById('history-summary')
    if (summaryEl) {
      summaryEl.textContent = `✓ ${this.palabrasHistorial.length} · ${this.puntosTotales} pts`
      summaryEl.classList.add('is-active')
    }

    const prev = this.historyList.querySelector('.history__word--latest')
    if (prev) prev.classList.remove('history__word--latest')

    // Chip real con animación de deslizamiento + bounce
    const firstLetter = limpia[0] || 'A'
    const signSrc = signURI(firstLetter)

    const chip = document.createElement('div')
    chip.className = 'history-chip history-chip--enter history__word--latest'
    chip.innerHTML = `
      <img class="history-chip__sign" src="${signSrc}" alt="${firstLetter}" aria-hidden="true" />
      <span class="history-chip__check">✓</span>
      <span class="history-chip__word">${limpia.toLowerCase()}</span>
      <span class="history-chip__pts">+${pts}</span>
    `
    // Insertar al inicio de la lista desplazando a los ghosts
    this.historyList.insertBefore(chip, this.historyList.firstChild)
  }

  private setRacha(racha: number): void {
    const el = document.getElementById('racha-valor')
    if (!el) return
    const prev = parseInt(el.textContent || '0', 10)
    el.textContent = String(racha)
    if (racha === 0 && prev > 0) {
      el.classList.remove('racha-drop')
      void el.offsetWidth
      el.classList.add('racha-drop')
    }
  }

  private setIntentos(errores: number): void {
    const count = document.getElementById('intentos-count')
    if (count) count.textContent = `${errores}/3`
    const dots = document.querySelectorAll<HTMLElement>('.attempts__dot')
    dots.forEach((dot, i) => dot.classList.toggle('attempts__dot--used', i < errores))
  }
}
