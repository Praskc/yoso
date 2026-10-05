export interface AccessibilityState {
  fontSizeDelta: number // -2, -1, 0, +1, +2, +3, +4, +5, +6
  altoContraste: boolean
  invertirColores: boolean
  escalaGrises: boolean
  modoClaro: boolean
  resaltarEnlaces: boolean
  fuenteLegible: boolean
  fuenteDislexia: boolean
  sinAnimaciones: boolean
  guiaLectura: boolean
  ttsHabilitado: boolean
  flashVisual: boolean
}

const STORAGE_KEY = 'yoso_accessibility_v4'

const DEFAULT_STATE: AccessibilityState = {
  fontSizeDelta: 0,
  altoContraste: false,
  invertirColores: false,
  escalaGrises: false,
  modoClaro: false,
  resaltarEnlaces: false,
  fuenteLegible: false,
  fuenteDislexia: false,
  sinAnimaciones: false,
  guiaLectura: false,
  ttsHabilitado: true,
  flashVisual: true,
}

export class AccessibilityService {
  private static instance: AccessibilityService
  private state: AccessibilityState
  private _flashTimer: number | null = null
  private _guiaEl: HTMLElement | null = null
  private _mouseMoveHandler: ((e: MouseEvent) => void) | null = null

  private constructor() {
    this.state = this.cargarState()
    // Foco visible destacado (MinTIC CC17) — permanente, no existe toggle en UI.
    document.documentElement.classList.add('a11y-focus-visible')
    this.aplicarClasesDOM()
    this.inicializarEventosGlobales()
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService()
    }
    return AccessibilityService.instance
  }

  getState(): AccessibilityState {
    return { ...this.state }
  }

  actualizar(parcial: Partial<AccessibilityState>): void {
    this.state = { ...this.state, ...parcial }
    this.guardarState()
    this.aplicarClasesDOM()
  }

  // Ajuste incremental de texto (WCAG / MinTIC CC4: pasos de 10% hasta 200%)
  ajustarFontSize(delta: number): number {
    const val = Math.max(-2, Math.min(10, this.state.fontSizeDelta + delta))
    this.actualizar({ fontSizeDelta: val })
    return val
  }

  // Toggles de Contraste y Color (WCAG / MinTIC CC5)
  toggleAltoContraste(): boolean {
    const val = !this.state.altoContraste
    this.actualizar({ altoContraste: val, invertirColores: false, modoClaro: false })
    return val
  }

  toggleInvertirColores(): boolean {
    const val = !this.state.invertirColores
    this.actualizar({ invertirColores: val, altoContraste: false })
    return val
  }

  toggleEscalaGrises(): boolean {
    const val = !this.state.escalaGrises
    this.actualizar({ escalaGrises: val })
    return val
  }

  toggleModoClaro(): boolean {
    const val = !this.state.modoClaro
    this.actualizar({ modoClaro: val, altoContraste: false })
    return val
  }

  toggleResaltarEnlaces(): boolean {
    const val = !this.state.resaltarEnlaces
    this.actualizar({ resaltarEnlaces: val })
    return val
  }

  toggleFuenteLegible(): boolean {
    const val = !this.state.fuenteLegible
    this.actualizar({ fuenteLegible: val, fuenteDislexia: false })
    return val
  }

  toggleFuenteDislexia(): boolean {
    const val = !this.state.fuenteDislexia
    this.actualizar({ fuenteDislexia: val, fuenteLegible: false })
    return val
  }

  // Toggles de Elementos de Página y Ayudas
  toggleSinAnimaciones(): boolean {
    const val = !this.state.sinAnimaciones
    this.actualizar({ sinAnimaciones: val })
    return val
  }

  toggleGuiaLectura(): boolean {
    const val = !this.state.guiaLectura
    this.actualizar({ guiaLectura: val })
    this.actualizarGuiaLecturaDOM()
    return val
  }

  // Toggle de TTS
  toggleTTS(): boolean {
    const val = !this.state.ttsHabilitado
    this.actualizar({ ttsHabilitado: val })
    if (!val) {
      this.detenerTTS()
    }
    return val
  }

  toggleFlashVisual(): boolean {
    const val = !this.state.flashVisual
    this.actualizar({ flashVisual: val })
    return val
  }

  restablecerTodo(): void {
    this.state = { ...DEFAULT_STATE }
    this.guardarState()
    this.aplicarClasesDOM()
    this.actualizarGuiaLecturaDOM()
    this.detenerTTS()
  }

  private cargarState(): AccessibilityState {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado) {
        return { ...DEFAULT_STATE, ...JSON.parse(guardado) }
      }
    } catch {
      // Ignorar
    }
    return { ...DEFAULT_STATE }
  }

  private guardarState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // Ignorar
    }
  }

  aplicarClasesDOM(): void {
    const root = document.documentElement
    const body = document.body

    // 1. Tamaño de fuente (escala accesible MinTIC CC4: pasos de 10% de 80% a 200%).
    //    line-height y letter-spacing tienen valores por defecto en accessibility.css
    //    (--a11y-line-height: 1.4; --a11y-letter-spacing: 0em) y no varían.
    const baseScale = Math.max(0.80, Math.min(2.0, 1.0 + (this.state.fontSizeDelta * 0.10)))
    root.style.setProperty('--a11y-scale', `${baseScale.toFixed(2)}`)

    // 2. Alto contraste
    root.classList.toggle('a11y-high-contrast', this.state.altoContraste)
    body.classList.toggle('a11y-high-contrast', this.state.altoContraste)

    // 3. Invertir colores
    root.classList.toggle('a11y-invert', this.state.invertirColores)

    // 4. Escala de grises
    root.classList.toggle('a11y-grayscale', this.state.escalaGrises)

    // 5. Modo claro accesible
    root.classList.toggle('a11y-light-mode', this.state.modoClaro)
    body.classList.toggle('a11y-light-mode', this.state.modoClaro)

    // 6. Resaltar enlaces
    root.classList.toggle('a11y-highlight-links', this.state.resaltarEnlaces)

    // 7. Fuente legible / dislexia
    root.classList.toggle('a11y-readable-font', this.state.fuenteLegible)
    root.classList.toggle('a11y-dyslexia-font', this.state.fuenteDislexia)

    // 8. Sin animaciones (reducir movimiento)
    root.classList.toggle('a11y-no-animations', this.state.sinAnimaciones)
  }

  private inicializarEventosGlobales(): void {
    // Atajo de teclado: Alt + A para abrir accesibilidad
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('yoso:a11y:toggle'))
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('yoso:a11y:read-text'))
      }
    })
  }

  private actualizarGuiaLecturaDOM(): void {
    if (this.state.guiaLectura) {
      if (!this._guiaEl) {
        const el = document.createElement('div')
        el.id = 'a11y-reading-guide'
        el.className = 'a11y-reading-guide'
        document.body.appendChild(el)
        this._guiaEl = el
      }
      this._guiaEl.style.display = 'block'
      if (!this._mouseMoveHandler) {
        this._mouseMoveHandler = (e: MouseEvent) => {
          if (this._guiaEl) {
            this._guiaEl.style.top = `${e.clientY}px`
          }
        }
        window.addEventListener('mousemove', this._mouseMoveHandler, { passive: true })
      }
    } else {
      if (this._guiaEl) {
        this._guiaEl.style.display = 'none'
      }
      if (this._mouseMoveHandler) {
        window.removeEventListener('mousemove', this._mouseMoveHandler)
        this._mouseMoveHandler = null
      }
    }
  }

  // ── Síntesis de Voz (TTS) ──────────────────────────────────────────────────
  leerTexto(texto: string): void {
    if (!('speechSynthesis' in window)) return
    const limpio = texto.trim()
    if (!limpio) return

    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(limpio)
    u.lang = 'es-CO'
    u.rate = 1.0
    u.pitch = 1.0

    // Intentar seleccionar voz en español
    const voces = window.speechSynthesis.getVoices()
    const vozEs = voces.find(v => v.lang.startsWith('es-CO') || v.lang.startsWith('es-419') || v.lang.startsWith('es'))
    if (vozEs) u.voice = vozEs

    window.speechSynthesis.speak(u)
  }

  detenerTTS(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  notificarLetraCapturada(letra: string): void {
    if (this.state.flashVisual) {
      this.dispararFlashVisual()
    }
    if (this.state.ttsHabilitado && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(letra)
      u.lang = 'es-CO'
      u.rate = 1.0
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    }
  }

  notificarPalabra(palabra: string): void {
    if (this.state.ttsHabilitado && 'speechSynthesis' in window && palabra.trim()) {
      const u = new SpeechSynthesisUtterance(palabra.trim())
      u.lang = 'es-CO'
      u.rate = 1.0
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    }
  }

  // Corrección crítica del halo verde: garantizar timeout seguro y remover la clase
  dispararFlashVisual(): void {
    let flashEl = document.getElementById('a11y-screen-flash')
    if (!flashEl) {
      flashEl = document.createElement('div')
      flashEl.id = 'a11y-screen-flash'
      flashEl.className = 'a11y-screen-flash'
      document.body.appendChild(flashEl)
    }

    if (this._flashTimer !== null) {
      window.clearTimeout(this._flashTimer)
      this._flashTimer = null
    }

    flashEl.classList.remove('is-active')
    void flashEl.offsetWidth
    flashEl.classList.add('is-active')

    this._flashTimer = window.setTimeout(() => {
      flashEl?.classList.remove('is-active')
      this._flashTimer = null
    }, 450)
  }
}

export const a11y = AccessibilityService.getInstance()
