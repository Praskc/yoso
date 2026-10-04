export interface AccessibilityState {
  fontSizeDelta: number // -2, -1, 0, +1, +2, +3, +4
  lineHeightDelta: number // 0, +1, +2, +3, +4
  letterSpacingDelta: number // 0, +1, +2, +3, +4
  altoContraste: boolean
  invertirColores: boolean
  escalaGrises: boolean
  resaltarEnlaces: boolean
  resaltarTitulos: boolean
  fuenteLegible: boolean
  ocultarImagenes: boolean
  sinAnimaciones: boolean
  cursorGrande: boolean
  ocultarHastaTimestamp: number // Para ocultar 1h, 8h, 24h
  ttsHabilitado: boolean
  flashVisual: boolean
}

const STORAGE_KEY = 'yoso_accessibility_v3'

const DEFAULT_STATE: AccessibilityState = {
  fontSizeDelta: 0,
  lineHeightDelta: 0,
  letterSpacingDelta: 0,
  altoContraste: false,
  invertirColores: false,
  escalaGrises: false,
  resaltarEnlaces: false,
  resaltarTitulos: false,
  fuenteLegible: false,
  ocultarImagenes: false,
  sinAnimaciones: false,
  cursorGrande: false,
  ocultarHastaTimestamp: 0,
  ttsHabilitado: true,
  flashVisual: true,
}

export class AccessibilityService {
  private static instance: AccessibilityService
  private state: AccessibilityState

  private constructor() {
    this.state = this.cargarState()
    this.aplicarClasesDOM()
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

  // Ajustes incrementales de texto
  ajustarFontSize(delta: number): number {
    const val = Math.max(-2, Math.min(6, this.state.fontSizeDelta + delta))
    this.actualizar({ fontSizeDelta: val })
    return val
  }

  ajustarLineHeight(delta: number): number {
    const val = Math.max(0, Math.min(5, this.state.lineHeightDelta + delta))
    this.actualizar({ lineHeightDelta: val })
    return val
  }

  ajustarLetterSpacing(delta: number): number {
    const val = Math.max(0, Math.min(5, this.state.letterSpacingDelta + delta))
    this.actualizar({ letterSpacingDelta: val })
    return val
  }

  // Toggles de Contraste y Color
  toggleAltoContraste(): boolean {
    const val = !this.state.altoContraste
    this.actualizar({ altoContraste: val, invertirColores: false })
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

  toggleResaltarEnlaces(): boolean {
    const val = !this.state.resaltarEnlaces
    this.actualizar({ resaltarEnlaces: val })
    return val
  }

  toggleResaltarTitulos(): boolean {
    const val = !this.state.resaltarTitulos
    this.actualizar({ resaltarTitulos: val })
    return val
  }

  toggleFuenteLegible(): boolean {
    const val = !this.state.fuenteLegible
    this.actualizar({ fuenteLegible: val })
    return val
  }

  // Toggles de Elementos de Página
  toggleOcultarImagenes(): boolean {
    const val = !this.state.ocultarImagenes
    this.actualizar({ ocultarImagenes: val })
    return val
  }

  toggleSinAnimaciones(): boolean {
    const val = !this.state.sinAnimaciones
    this.actualizar({ sinAnimaciones: val })
    return val
  }

  toggleCursorGrande(): boolean {
    const val = !this.state.cursorGrande
    this.actualizar({ cursorGrande: val })
    return val
  }

  // Ocultar Widget por tiempo
  ocultarWidgetPorHoras(horas: number): void {
    const hasta = Date.now() + horas * 60 * 60 * 1000
    this.actualizar({ ocultarHastaTimestamp: hasta })
  }

  estaWidgetOculto(): boolean {
    if (!this.state.ocultarHastaTimestamp) return false
    return Date.now() < this.state.ocultarHastaTimestamp
  }

  mostrarWidget(): void {
    this.actualizar({ ocultarHastaTimestamp: 0 })
  }

  restablecerTodo(): void {
    this.state = { ...DEFAULT_STATE, ocultarHastaTimestamp: this.state.ocultarHastaTimestamp }
    this.guardarState()
    this.aplicarClasesDOM()
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

    // 1. Tamaño de fuente, altura de línea, espaciado
    const baseScale = 1 + (this.state.fontSizeDelta * 0.08)
    const lineHeightVal = 1.4 + (this.state.lineHeightDelta * 0.15)
    const letterSpacingVal = `${this.state.letterSpacingDelta * 0.05}em`

    root.style.setProperty('--a11y-scale', `${baseScale}`)
    root.style.setProperty('--a11y-line-height', `${lineHeightVal}`)
    root.style.setProperty('--a11y-letter-spacing', letterSpacingVal)

    // 2. Alto contraste
    root.classList.toggle('a11y-high-contrast', this.state.altoContraste)
    body.classList.toggle('a11y-high-contrast', this.state.altoContraste)

    // 3. Invertir colores
    root.classList.toggle('a11y-invert', this.state.invertirColores)

    // 4. Escala de grises
    root.classList.toggle('a11y-grayscale', this.state.escalaGrises)

    // 5. Resaltar enlaces
    root.classList.toggle('a11y-highlight-links', this.state.resaltarEnlaces)

    // 6. Resaltar títulos
    root.classList.toggle('a11y-highlight-headings', this.state.resaltarTitulos)

    // 7. Fuente legible
    root.classList.toggle('a11y-readable-font', this.state.fuenteLegible)

    // 8. Ocultar imágenes
    root.classList.toggle('a11y-hide-images', this.state.ocultarImagenes)

    // 9. Sin animaciones
    root.classList.toggle('a11y-no-animations', this.state.sinAnimaciones)

    // 10. Cursor grande
    root.classList.toggle('a11y-big-cursor', this.state.cursorGrande)
  }

  // Notificaciones de feedback
  notificarLetraCapturada(letra: string): void {
    if (this.state.flashVisual) {
      this.dispararFlashVisual()
    }
    if (this.state.ttsHabilitado && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(letra)
      u.lang = 'es-CO'
      window.speechSynthesis.speak(u)
    }
  }

  notificarPalabra(palabra: string): void {
    if (this.state.ttsHabilitado && 'speechSynthesis' in window && palabra.trim()) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(palabra.trim())
      u.lang = 'es-CO'
      window.speechSynthesis.speak(u)
    }
  }

  dispararFlashVisual(): void {
    let flashEl = document.getElementById('a11y-screen-flash')
    if (!flashEl) {
      flashEl = document.createElement('div')
      flashEl.id = 'a11y-screen-flash'
      flashEl.className = 'a11y-screen-flash'
      document.body.appendChild(flashEl)
    }
    flashEl.classList.remove('is-active')
    void flashEl.offsetWidth
    flashEl.classList.add('is-active')
  }
}

export const a11y = AccessibilityService.getInstance()
