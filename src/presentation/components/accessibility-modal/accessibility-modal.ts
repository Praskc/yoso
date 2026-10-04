import { a11y } from '../../../application/accessibility'

export class AccessibilityModal {
  private panelEl: HTMLElement | null = null
  private triggerBtn: HTMLElement | null = null
  private isOpen = false

  constructor() {
    this.createPanel()
    this.bindEvents()
    this.checkWidgetVisibility()
  }

  private createPanel(): void {
    const existing = document.getElementById('a11y-panel-widget')
    if (existing) existing.remove()

    const panel = document.createElement('div')
    panel.id = 'a11y-panel-widget'
    panel.className = 'a11y-widget-panel'
    panel.setAttribute('aria-hidden', 'true')

    panel.innerHTML = `
      <div class="a11y-wcard">
        <!-- Header con Icono SVG Accesibilidad Universal -->
        <div class="a11y-wcard__header">
          <div class="a11y-wcard__brand">
            <span class="a11y-wcard__icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 512 512" width="22" height="22">
                <circle cx="256" cy="256" r="246" fill="#1D4ED8"/>
                <circle cx="256" cy="256" r="212" stroke="#FFFFFF" stroke-width="24" fill="none"/>
                <circle cx="256" cy="144" r="36" fill="#FFFFFF"/>
                <path d="M136 182 C196 194 316 194 376 182 C386 180 392 195 382 205 C342 220 300 220 292 240 L292 300 L318 382 C323 398 303 408 292 393 L256 318 L220 393 C209 408 189 398 194 382 L220 300 L220 240 C212 220 170 220 130 205 C120 195 126 180 136 182 Z" fill="#FFFFFF"/>
              </svg>
            </span>
            <h3 class="a11y-wcard__title">Accesibilidad</h3>
          </div>
          <button class="a11y-wcard__close" id="a11y-btn-close" type="button" aria-label="Cerrar panel de accesibilidad">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="a11y-wcard__body">
          <!-- 1. Ajustes de Tipografía / Texto -->
          <div class="a11y-wcard__steppers">
            <!-- Tamaño de fuente -->
            <div class="a11y-stepper-row">
              <span class="a11y-stepper-label">Tamaño de fuente</span>
              <div class="a11y-stepper-ctrl">
                <button class="a11y-step-btn" id="a11y-font-dec" type="button" aria-label="Disminuir tamaño de fuente">−</button>
                <span class="a11y-step-val" id="a11y-font-val">+0</span>
                <button class="a11y-step-btn" id="a11y-font-inc" type="button" aria-label="Aumentar tamaño de fuente">+</button>
              </div>
            </div>

            <!-- Altura de línea -->
            <div class="a11y-stepper-row">
              <span class="a11y-stepper-label">Altura de línea</span>
              <div class="a11y-stepper-ctrl">
                <button class="a11y-step-btn" id="a11y-line-dec" type="button" aria-label="Disminuir altura de línea">−</button>
                <span class="a11y-step-val" id="a11y-line-val">+0</span>
                <button class="a11y-step-btn" id="a11y-line-inc" type="button" aria-label="Aumentar altura de línea">+</button>
              </div>
            </div>

            <!-- Espaciado letras -->
            <div class="a11y-stepper-row">
              <span class="a11y-stepper-label">Espaciado letras</span>
              <div class="a11y-stepper-ctrl">
                <button class="a11y-step-btn" id="a11y-spacing-dec" type="button" aria-label="Disminuir espaciado de letras">−</button>
                <span class="a11y-step-val" id="a11y-spacing-val">+0</span>
                <button class="a11y-step-btn" id="a11y-spacing-inc" type="button" aria-label="Aumentar espaciado de letras">+</button>
              </div>
            </div>
          </div>

          <!-- 2. 🎨 Contraste y Color -->
          <div class="a11y-wsec">
            <div class="a11y-wsec__title">🎨 Contraste y Color</div>
            <div class="a11y-grid-cards">
              <!-- Alto contraste -->
              <button class="a11y-card-btn" id="a11y-btn-contrast" type="button">
                <span class="a11y-card-icon">◑</span>
                <span class="a11y-card-txt">Alto contraste</span>
              </button>

              <!-- Invertir colores -->
              <button class="a11y-card-btn" id="a11y-btn-invert" type="button">
                <span class="a11y-card-icon">⬛</span>
                <span class="a11y-card-txt">Invertir colores</span>
              </button>

              <!-- Escala de grises -->
              <button class="a11y-card-btn" id="a11y-btn-grayscale" type="button">
                <span class="a11y-card-icon">▣</span>
                <span class="a11y-card-txt">Escala de grises</span>
              </button>

              <!-- Resaltar enlaces -->
              <button class="a11y-card-btn" id="a11y-btn-links" type="button">
                <span class="a11y-card-icon">🔗</span>
                <span class="a11y-card-txt">Resaltar enlaces</span>
              </button>

              <!-- Resaltar títulos -->
              <button class="a11y-card-btn" id="a11y-btn-headings" type="button">
                <span class="a11y-card-icon font-h1">H₁</span>
                <span class="a11y-card-txt">Resaltar títulos</span>
              </button>

              <!-- Fuente legible -->
              <button class="a11y-card-btn" id="a11y-btn-readable" type="button">
                <span class="a11y-card-icon">🔤</span>
                <span class="a11y-card-txt">Fuente legible</span>
              </button>
            </div>
          </div>

          <!-- 3. 🖼️ Elementos de página -->
          <div class="a11y-wsec">
            <div class="a11y-wsec__title">🖼️ Elementos de página</div>
            <div class="a11y-grid-cards">
              <!-- Ocultar imágenes -->
              <button class="a11y-card-btn" id="a11y-btn-hide-imgs" type="button">
                <span class="a11y-card-icon">🚫</span>
                <span class="a11y-card-txt">Ocultar imágenes</span>
              </button>

              <!-- Sin animaciones -->
              <button class="a11y-card-btn" id="a11y-btn-no-anim" type="button">
                <span class="a11y-card-icon">⏸</span>
                <span class="a11y-card-txt">Sin animaciones</span>
              </button>

              <!-- Cursor grande -->
              <button class="a11y-card-btn" id="a11y-btn-big-cursor" type="button">
                <span class="a11y-card-icon">🖱️</span>
                <span class="a11y-card-txt">Cursor grande</span>
              </button>
            </div>
          </div>

          <!-- 4. ⏱️ Ocultar widget -->
          <div class="a11y-wsec">
            <div class="a11y-wsec__title">⏱️ Ocultar widget</div>
            <div class="a11y-hide-btns">
              <button class="a11y-time-btn" data-hours="1" type="button">1 hora</button>
              <button class="a11y-time-btn" data-hours="8" type="button">8 horas</button>
              <button class="a11y-time-btn" data-hours="24" type="button">24 horas</button>
            </div>
          </div>
        </div>

        <!-- Footer: Restablecer todo -->
        <div class="a11y-wcard__footer">
          <button class="a11y-btn-reset-all" id="a11y-btn-reset-all" type="button">
            <span class="a11y-reset-icon">↺</span>
            <span>Restablecer todo</span>
          </button>
        </div>
      </div>
    `

    document.body.appendChild(panel)
    this.panelEl = panel
  }

  private bindEvents(): void {
    // Escucha delegada global para el botón de accesibilidad
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const trigger = target.closest('#topbar-btn-a11y, .topbar__btn-a11y, [data-a11y-trigger]') as HTMLElement | null
      if (trigger) {
        e.preventDefault()
        e.stopPropagation()
        this.triggerBtn = trigger
        this.toggle()
        return
      }

      // Si hace clic fuera del widget panel
      if (this.isOpen && this.panelEl && !this.panelEl.contains(target)) {
        this.close()
      }
    })

    // Botón cerrar
    document.getElementById('a11y-btn-close')?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.close()
    })

    // Steppers de Texto
    document.getElementById('a11y-font-inc')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarFontSize(+1)
      this.updateUI()
    })
    document.getElementById('a11y-font-dec')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarFontSize(-1)
      this.updateUI()
    })

    document.getElementById('a11y-line-inc')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarLineHeight(+1)
      this.updateUI()
    })
    document.getElementById('a11y-line-dec')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarLineHeight(-1)
      this.updateUI()
    })

    document.getElementById('a11y-spacing-inc')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarLetterSpacing(+1)
      this.updateUI()
    })
    document.getElementById('a11y-spacing-dec')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarLetterSpacing(-1)
      this.updateUI()
    })

    // Contraste y color
    document.getElementById('a11y-btn-contrast')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleAltoContraste()
      this.updateUI()
    })

    document.getElementById('a11y-btn-invert')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleInvertirColores()
      this.updateUI()
    })

    document.getElementById('a11y-btn-grayscale')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleEscalaGrises()
      this.updateUI()
    })

    document.getElementById('a11y-btn-links')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleResaltarEnlaces()
      this.updateUI()
    })

    document.getElementById('a11y-btn-headings')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleResaltarTitulos()
      this.updateUI()
    })

    document.getElementById('a11y-btn-readable')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleFuenteLegible()
      this.updateUI()
    })

    // Elementos de página
    document.getElementById('a11y-btn-hide-imgs')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleOcultarImagenes()
      this.updateUI()
    })

    document.getElementById('a11y-btn-no-anim')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleSinAnimaciones()
      this.updateUI()
    })

    document.getElementById('a11y-btn-big-cursor')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleCursorGrande()
      this.updateUI()
    })

    // Ocultar por tiempo
    document.querySelectorAll<HTMLButtonElement>('.a11y-time-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const hours = parseInt(btn.dataset.hours || '1', 10)
        a11y.ocultarWidgetPorHoras(hours)
        this.close()
        this.checkWidgetVisibility()
      })
    })

    // Restablecer todo
    document.getElementById('a11y-btn-reset-all')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.restablecerTodo()
      this.updateUI()
    })

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close()
    })
  }

  toggle(): void {
    if (this.isOpen) this.close()
    else this.open()
  }

  open(): void {
    if (!this.panelEl) return
    this.updateUI()
    this.panelEl.classList.add('is-open')
    this.panelEl.setAttribute('aria-hidden', 'false')
    this.triggerBtn?.classList.add('is-active')
    this.isOpen = true
  }

  close(): void {
    if (!this.panelEl) return
    this.panelEl.classList.remove('is-open')
    this.panelEl.setAttribute('aria-hidden', 'true')
    this.triggerBtn?.classList.remove('is-active')
    this.isOpen = false
  }

  private checkWidgetVisibility(): void {
    const trigger = document.getElementById('topbar-btn-a11y')
    if (trigger) {
      if (a11y.estaWidgetOculto()) {
        trigger.style.display = 'none'
      } else {
        trigger.style.display = ''
      }
    }
  }

  private formatDelta(num: number): string {
    if (num > 0) return `+${num}`
    if (num < 0) return `${num}`
    return '+0'
  }

  private updateUI(): void {
    const state = a11y.getState()

    // Stepper values
    const fontVal = document.getElementById('a11y-font-val')
    if (fontVal) fontVal.textContent = this.formatDelta(state.fontSizeDelta)

    const lineVal = document.getElementById('a11y-line-val')
    if (lineVal) lineVal.textContent = this.formatDelta(state.lineHeightDelta)

    const spacingVal = document.getElementById('a11y-spacing-val')
    if (spacingVal) spacingVal.textContent = this.formatDelta(state.letterSpacingDelta)

    // Card Toggles
    this.setCardActive('a11y-btn-contrast', state.altoContraste)
    this.setCardActive('a11y-btn-invert', state.invertirColores)
    this.setCardActive('a11y-btn-grayscale', state.escalaGrises)
    this.setCardActive('a11y-btn-links', state.resaltarEnlaces)
    this.setCardActive('a11y-btn-headings', state.resaltarTitulos)
    this.setCardActive('a11y-btn-readable', state.fuenteLegible)
    this.setCardActive('a11y-btn-hide-imgs', state.ocultarImagenes)
    this.setCardActive('a11y-btn-no-anim', state.sinAnimaciones)
    this.setCardActive('a11y-btn-big-cursor', state.cursorGrande)
  }

  private setCardActive(id: string, active: boolean): void {
    const el = document.getElementById(id)
    if (el) {
      el.classList.toggle('is-active', active)
    }
  }
}
