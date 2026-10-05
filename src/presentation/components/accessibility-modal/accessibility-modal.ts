import { a11y } from '../../../application/accessibility'

export class AccessibilityModal {
  private panelEl: HTMLElement | null = null
  private floatTriggerEl: HTMLElement | null = null
  private isOpen = false

  constructor() {
    this.createWidget()
    this.bindEvents()
    this.checkWidgetVisibility()
  }

  private createWidget(): void {
    const existing = document.getElementById('a11y-gov-widget')
    if (existing) existing.remove()
    const oldContainer = document.getElementById('a11y-widget-container')
    if (oldContainer) oldContainer.remove()

    const widget = document.createElement('div')
    widget.id = 'a11y-gov-widget'
    widget.className = 'a11y-gov-widget'

    widget.innerHTML = `
      <!-- Pestaña lateral derecha con ícono universal MinTIC -->
      <button id="a11y-float-trigger" class="a11y-gov-tab" type="button" 
              aria-label="Abrir opciones de accesibilidad MinTIC" 
              aria-expanded="false" 
              aria-controls="a11y-gov-dropdown"
              title="Accesibilidad MinTIC (Alt + A)">
        <span class="a11y-gov-tab__circle">
          <svg viewBox="0 0 512 512" width="22" height="22" aria-hidden="true">
            <circle cx="256" cy="256" r="236" fill="none" stroke="#FFFFFF" stroke-width="26"/>
            <circle cx="256" cy="144" r="38" fill="#FFFFFF"/>
            <path d="M136 182 C196 194 316 194 376 182 C386 180 392 195 382 205 C342 220 300 220 292 240 L292 300 L318 382 C323 398 303 408 292 393 L256 318 L220 393 C209 408 189 398 194 382 L220 300 L220 240 C212 220 170 220 130 205 C120 195 126 180 136 182 Z" fill="#FFFFFF"/>
          </svg>
        </span>
      </button>

      <!-- Desplegable Oficial Idéntico a la Captura -->
      <div id="a11y-gov-dropdown" class="a11y-gov-dropdown" role="dialog" aria-modal="false" aria-label="Menú de Accesibilidad" aria-hidden="true">
        
        <!-- Header con bloque azul e ícono a la izquierda + título Accesibilidad -->
        <div class="a11y-gov-dropdown__header">
          <div class="a11y-gov-dropdown__icon-box">
            <svg viewBox="0 0 512 512" width="20" height="20" aria-hidden="true">
              <circle cx="256" cy="256" r="236" fill="none" stroke="#FFFFFF" stroke-width="26"/>
              <circle cx="256" cy="144" r="38" fill="#FFFFFF"/>
              <path d="M136 182 C196 194 316 194 376 182 C386 180 392 195 382 205 C342 220 300 220 292 240 L292 300 L318 382 C323 398 303 408 292 393 L256 318 L220 393 C209 408 189 398 194 382 L220 300 L220 240 C212 220 170 220 130 205 C120 195 126 180 136 182 Z" fill="#FFFFFF"/>
            </svg>
          </div>
          <h3 class="a11y-gov-dropdown__title">Accesibilidad</h3>
          <button id="a11y-btn-close" class="a11y-gov-dropdown__close" type="button" aria-label="Cerrar panel de accesibilidad">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Lista Vertical de Opciones MinTIC -->
        <div class="a11y-gov-dropdown__list" role="menu">
          
          <!-- 1. Agrandar texto -->
          <button class="a11y-gov-row" id="a11y-btn-font-inc" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Agrandar texto</span>
            <span class="a11y-gov-row__badge" id="a11y-font-badge">+0</span>
          </button>

          <!-- 2. Disminuir texto -->
          <button class="a11y-gov-row" id="a11y-btn-font-dec" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Disminuir texto</span>
          </button>

          <!-- 3. Lector de voz (TTS MinTIC) -->
          <button class="a11y-gov-row" id="a11y-btn-tts" type="button" role="menuitem" aria-pressed="false" title="Activar o silenciar el lector de voz (Alt + L lee la transcripción en voz alta)">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Lector de voz (TTS)</span>
            <span class="a11y-gov-row__dot" id="a11y-tts-dot"></span>
          </button>

          <!-- 4. Escala de grises -->
          <button class="a11y-gov-row" id="a11y-btn-grayscale" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Escala de grises</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 5. Contraste alto -->
          <button class="a11y-gov-row" id="a11y-btn-contrast" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Contraste alto</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 6. Fondo Blanco (Modo claro) -->
          <button class="a11y-gov-row" id="a11y-btn-light" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18h6"/>
                <path d="M10 22h4"/>
                <path d="M12 2v1"/>
                <path d="M12 7a5 5 0 0 1 5 5c0 2-1 3.5-2 4.5H9c-1-1-2-2.5-2-4.5a5 5 0 0 1 5-5z"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Fondo Blanco</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 7. Invertir colores -->
          <button class="a11y-gov-row" id="a11y-btn-invert" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Invertir colores</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 8. Enlaces subrayados -->
          <button class="a11y-gov-row" id="a11y-btn-links" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Enlaces subrayados</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 9. Fuente legible -->
          <button class="a11y-gov-row" id="a11y-btn-readable" type="button" role="menuitem">
            <span class="a11y-gov-row__icon font-serif-letter">A</span>
            <span class="a11y-gov-row__text">Fuente legible</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 10. Fuente dislexia -->
          <button class="a11y-gov-row" id="a11y-btn-dyslexia" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Fuente dislexia</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 11. Guía de lectura -->
          <button class="a11y-gov-row" id="a11y-btn-reading-guide" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="7" y2="6"/>
                <line x1="3" y1="18" x2="7" y2="18"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Guía de lectura</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 12. Sin animaciones -->
          <button class="a11y-gov-row" id="a11y-btn-no-anim" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Sin animaciones</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 13. Destello visual (LSC) -->
          <button class="a11y-gov-row" id="a11y-btn-flash" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Destello visual</span>
            <span class="a11y-gov-row__dot"></span>
          </button>

          <!-- 14. Restablecer -->
          <button class="a11y-gov-row a11y-gov-row--reset" id="a11y-btn-reset-all" type="button" role="menuitem">
            <span class="a11y-gov-row__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </span>
            <span class="a11y-gov-row__text">Restablecer</span>
          </button>

        </div>
      </div>
    `

    document.body.appendChild(widget)
    this.floatTriggerEl = document.getElementById('a11y-float-trigger')
    this.panelEl = document.getElementById('a11y-gov-dropdown')
  }

  private bindEvents(): void {
    this.floatTriggerEl?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.toggle()
    })

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Si el clic ocurrió sobre algún disparador de accesibilidad, no cerrar
      if (target.closest('[data-a11y-trigger], [data-action="a11y"]')) {
        return
      }

      if (this.isOpen && this.panelEl && !this.panelEl.contains(target) && !this.floatTriggerEl?.contains(target)) {
        this.close()
      }
    })

    document.getElementById('a11y-btn-close')?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.close()
    })

    window.addEventListener('yoso:a11y:toggle', () => this.toggle())
    window.addEventListener('yoso:a11y:open', () => this.open())
    window.addEventListener('yoso:a11y:close', () => this.close())
    window.addEventListener('yoso:a11y:read-text', () => this.leerTranscripcionActual())
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close()
    })

    // 1. Agrandar texto
    document.getElementById('a11y-btn-font-inc')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarFontSize(+1)
      this.updateUI()
    })

    // 2. Disminuir texto
    document.getElementById('a11y-btn-font-dec')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.ajustarFontSize(-1)
      this.updateUI()
    })

    // 3. Lector de voz (TTS): toggle real de síntesis de voz.
    // Al activar lee la transcripción como confirmación; al desactivar,
    // toggleTTS() cancela cualquier locución en curso (detenerTTS).
    document.getElementById('a11y-btn-tts')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const activo = a11y.toggleTTS()
      if (activo) this.leerTranscripcionActual()
      this.updateUI()
    })

    // 4. Escala de grises
    document.getElementById('a11y-btn-grayscale')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleEscalaGrises()
      this.updateUI()
    })

    // 5. Contraste alto
    document.getElementById('a11y-btn-contrast')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleAltoContraste()
      this.updateUI()
    })

    // 6. Fondo blanco (Modo claro)
    document.getElementById('a11y-btn-light')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleModoClaro()
      this.updateUI()
    })

    // 7. Invertir colores
    document.getElementById('a11y-btn-invert')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleInvertirColores()
      this.updateUI()
    })

    // 8. Enlaces subrayados
    document.getElementById('a11y-btn-links')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleResaltarEnlaces()
      this.updateUI()
    })

    // 9. Fuente legible
    document.getElementById('a11y-btn-readable')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleFuenteLegible()
      this.updateUI()
    })

    // 10. Fuente dislexia
    document.getElementById('a11y-btn-dyslexia')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleFuenteDislexia()
      this.updateUI()
    })

    // 11. Guía de lectura
    document.getElementById('a11y-btn-reading-guide')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleGuiaLectura()
      this.updateUI()
    })

    // 12. Sin animaciones
    document.getElementById('a11y-btn-no-anim')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleSinAnimaciones()
      this.updateUI()
    })

    // 13. Destello visual
    document.getElementById('a11y-btn-flash')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.toggleFlashVisual()
      if (a11y.getState().flashVisual) {
        a11y.dispararFlashVisual()
      }
      this.updateUI()
    })

    // 14. Restablecer
    document.getElementById('a11y-btn-reset-all')?.addEventListener('click', (e) => {
      e.stopPropagation()
      a11y.restablecerTodo()
      this.updateUI()
    })
  }

  private leerTranscripcionActual(): void {
    const textEl = document.getElementById('final-text')
    const texto = textEl?.textContent?.replace(/\s+/g, ' ').trim() || ''
    if (texto) {
      a11y.leerTexto(texto)
    } else {
      a11y.leerTexto('Transcripción vacía. Haz señas frente a la cámara.')
    }
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
    this.floatTriggerEl?.classList.add('is-active')
    this.floatTriggerEl?.setAttribute('aria-expanded', 'true')
    this.isOpen = true
  }

  close(): void {
    if (!this.panelEl) return
    this.panelEl.classList.remove('is-open')
    this.panelEl.setAttribute('aria-hidden', 'true')
    this.floatTriggerEl?.classList.remove('is-active')
    this.floatTriggerEl?.setAttribute('aria-expanded', 'false')
    this.isOpen = false
  }

  private checkWidgetVisibility(): void {
    if (this.floatTriggerEl) {
      if (a11y.estaWidgetOculto()) {
        this.floatTriggerEl.style.display = 'none'
      } else {
        this.floatTriggerEl.style.display = ''
      }
    }
  }

  private formatDelta(num: number): string {
    if (num > 0) return `+${num * 10}%`
    if (num < 0) return `${num * 10}%`
    return '100%'
  }

  private updateUI(): void {
    const state = a11y.getState()

    // Font badge con porcentaje real de escala
    const fontBadge = document.getElementById('a11y-font-badge')
    if (fontBadge) {
      if (state.fontSizeDelta !== 0) {
        fontBadge.textContent = this.formatDelta(state.fontSizeDelta)
        fontBadge.style.display = 'inline-block'
      } else {
        fontBadge.style.display = 'none'
      }
    }

    // Toggle items active state
    this.setItemActive('a11y-btn-tts', state.ttsHabilitado)
    this.setItemActive('a11y-btn-grayscale', state.escalaGrises)
    this.setItemActive('a11y-btn-contrast', state.altoContraste)
    this.setItemActive('a11y-btn-light', state.modoClaro)
    this.setItemActive('a11y-btn-invert', state.invertirColores)
    this.setItemActive('a11y-btn-links', state.resaltarEnlaces)
    this.setItemActive('a11y-btn-readable', state.fuenteLegible)
    this.setItemActive('a11y-btn-dyslexia', state.fuenteDislexia)
    this.setItemActive('a11y-btn-reading-guide', state.guiaLectura)
    this.setItemActive('a11y-btn-no-anim', state.sinAnimaciones)
    this.setItemActive('a11y-btn-flash', state.flashVisual)
  }

  private setItemActive(id: string, active: boolean): void {
    const el = document.getElementById(id)
    if (el) {
      el.classList.toggle('is-active', active)
      el.setAttribute('aria-pressed', String(active))
    }
  }
}
