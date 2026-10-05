import { a11y } from '../../../application/accessibility'

const CIRCUMFERENCE = 364.42 // Para r = 58 (2 * Math.PI * 58)

const DICCIONARIO_BASE = [
  'HOLA', 'GRACIAS', 'POR FAVOR', 'BUENOS DIAS', 'BUENAS NOCHES',
  'AMIGO', 'FAMILIA', 'COLOMBIA', 'SINCELEJO', 'LENGUA', 'SEÑAS',
  'AYUDA', 'NOMBRE', 'APRENDER', 'ENTENDER', 'BIEN', 'SALUD',
  'TRABAJO', 'CASA', 'ESTUDIAR', 'TIEMPO', 'PERSONA', 'MUNDO',
  'CIUDAD', 'FELIZ', 'COMER', 'AGUA', 'ESCUELA', 'UNIVERSIDAD',
  'MAÑANA', 'TARDE', 'NOCHE', 'DONDE', 'COMO', 'CUANDO',
  'QUIEN', 'QUE', 'PORQUE', 'MUCHO', 'POCO', 'HOY', 'AHORA', 'SIEMPRE'
]

export class OutputPanel {
  private letterEl:        HTMLElement | null = null
  private hintMsgEl:       HTMLElement | null = null
  private textEl:          HTMLElement | null = null
  private ringFillEl:      SVGCircleElement | null = null
  private progressCountEl: HTMLElement | null = null
  private stabilityFillEl: HTMLElement | null = null
  private confEl:          HTMLElement | null = null
  private predictListEl:   HTMLElement | null = null
  private handIzqEl:       HTMLElement | null = null
  private handDerEl:       HTMLElement | null = null

  private letras: string[] = []
  private letraActual = '·'
  private letraTimer = 0
  private debounceTimer = 0
  private cacheSugerencias = new Map<string, string[]>()
  private ultimaLateralidad: boolean | null = null

  // Guards por frame: el motor reporta ~30×/s; el DOM solo se toca si cambió.
  private _prevMano       = ''
  private _prevMsg: string | null = null
  private _prevMsgEstado  = ''
  private _prevCuenta     = -1
  private _prevPct        = -1

  constructor() {
    const root = document.getElementById('tab-traductor')
    if (!root) return
    this.render(root)
    this.letterEl        = document.getElementById('prediction')
    this.hintMsgEl       = document.getElementById('detect-human-msg')
    this.textEl          = document.getElementById('final-text')
    this.ringFillEl      = document.getElementById('def-ring-fill') as SVGCircleElement | null
    this.progressCountEl = document.getElementById('def-progress-count')
    this.stabilityFillEl = document.getElementById('def-stability-fill')
    this.confEl          = document.getElementById('m-conf')
    this.predictListEl   = document.getElementById('def-predict-list')
    this.handIzqEl       = document.getElementById('def-hand-izq')
    this.handDerEl       = document.getElementById('def-hand-der')

    this.vincularAcciones()
  }

  private render(root: HTMLElement): void {
    root.innerHTML = `
      <div class="traductor-definitive">
        
        <!-- PISO 1: Tarjeta Protagonista (Letra Detectada + Círculo de Confianza) -->
        <div class="def-hero" id="def-hero" data-status="idle">
          
          <div class="def-hero__header">
            <span class="def-hero__title">PANEL DE INFERENCIA</span>
          </div>

          <div class="def-hero__stage">
            <!-- Letra / Caracter Detectado (Izquierda, Protagonista) -->
            <div class="def-hero__letter-card" id="def-letter-card">
              <div class="def-hero__letter" id="prediction" aria-live="polite" data-idle="true">
                <span class="def-hero__idle-dash">—</span>
              </div>
              <div class="def-hero__letter-meta">
                <span class="def-hero__letter-caption">LETRA DETECTADA</span>
              </div>
            </div>

            <!-- Círculo Radial con Porcentaje de Confianza (Derecha) -->
            <div class="def-hero__ring-wrapper">
              <svg class="def-hero__svg" viewBox="0 0 140 140">
                <defs>
                  <linearGradient id="def-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#38BDF8"/>
                    <stop offset="60%" stop-color="#60A5FA"/>
                    <stop offset="100%" stop-color="#4ADE80"/>
                  </linearGradient>
                </defs>
                <circle class="def-hero__ring-bg" cx="70" cy="70" r="58" />
                <circle class="def-hero__ring-fill" id="def-ring-fill" cx="70" cy="70" r="58"
                  stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}" />
              </svg>

              <div class="def-hero__conf-inside">
                <span class="def-hero__conf-pct" id="m-conf">0<span class="unit">%</span></span>
                <span class="def-hero__conf-lbl">CONFIANZA</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PISO 2: Tarjeta Interactiva de Confirmación de Seña -->
        <div class="def-card def-buffer" id="def-buffer-card">
          <div class="def-buffer__header">
            <span class="def-buffer__state-text is-idle" id="def-buffer-status">ESPERANDO SEÑA</span>
            <div class="def-buffer__pill" id="def-buffer-pill">
              <span class="def-buffer__count" id="def-progress-count">0<span class="denom">/9 VOTOS</span></span>
            </div>
          </div>

          <!-- Medidor LED Segmentado con Mayor Altura y Fuerza Lumínica -->
          <div class="def-led-meter" id="def-led-meter">
            ${Array.from({ length: 9 }, (_, i) => `
              <div class="def-led-col" data-idx="${i + 1}" title="Voto ${i + 1} de 9">
                <div class="def-led-bar">
                  <span class="def-led-core"></span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PISO 3: Indicador de Postura y Estabilidad (Tarjetas Biométricas Heroicas + Barra Inferior) -->
        <div class="def-card def-stability" id="def-stability-card">
          <div class="def-stability__header">
            <span class="def-sec-label">POSTURA Y ESTABILIDAD</span>
          </div>

          <!-- Dos Paneles de Mano Biométricos con Medidor Integrado -->
          <div class="def-dummy-hands">
            <!-- Mano Izquierda -->
            <div class="def-dummy-card is-idle" id="def-hand-izq" title="Mano Izquierda">
              <div class="def-dummy-card__icon-wrap">
                <span class="def-hand-pulse-ring"></span>
                <svg class="def-dummy-hand-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6"/>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                </svg>
              </div>
              <span class="def-dummy-card__title">IZQUIERDA</span>
              
              <!-- Ribbon de Señal / Estado LED Integrado -->
              <div class="def-hand-meter is-idle" id="def-hand-izq-meter">
                <div class="def-hand-meter__leds">
                  <span class="def-hand-led-seg"></span>
                  <span class="def-hand-led-seg"></span>
                  <span class="def-hand-led-seg"></span>
                </div>
                <span class="def-hand-meter__txt" id="def-hand-izq-txt">EN REPOSO</span>
              </div>
            </div>

            <!-- Mano Derecha -->
            <div class="def-dummy-card is-idle" id="def-hand-der" title="Mano Derecha">
              <div class="def-dummy-card__icon-wrap">
                <span class="def-hand-pulse-ring"></span>
                <svg class="def-dummy-hand-svg is-mirror" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6"/>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                </svg>
              </div>
              <span class="def-dummy-card__title">DERECHA</span>

              <!-- Ribbon de Señal / Estado LED Integrado -->
              <div class="def-hand-meter is-idle" id="def-hand-der-meter">
                <div class="def-hand-meter__leds">
                  <span class="def-hand-led-seg"></span>
                  <span class="def-hand-led-seg"></span>
                  <span class="def-hand-led-seg"></span>
                </div>
                <span class="def-hand-meter__txt" id="def-hand-der-txt">EN REPOSO</span>
              </div>
            </div>
          </div>

          <!-- Barra de Calibración Inferior con Labels debajo -->
          <div class="def-stability__gauge-section">
            <div class="def-stability__track" title="Zona óptima de estabilidad">
              <div class="def-stability__target-zone"></div>
              <div class="def-stability__needle" id="def-stability-fill" style="left: 50%;"></div>
            </div>
            <div class="def-stability__labels">
              <span>INESTABLE</span>
              <span class="center-label">ZONA ÓPTIMA</span>
              <span>INESTABLE</span>
            </div>
          </div>
        </div>

        <!-- PISO 4: Sugerencias Predictivas con Datamuse -->
        <div class="def-card def-predict" id="def-predict-card">
          <div class="def-predict__header">
            <span class="def-sec-label">SUGERENCIAS</span>
          </div>
          <div class="def-predict__list" id="def-predict-list">
            <span class="def-predict__empty">Escribe letras para ver sugerencias…</span>
          </div>
        </div>

        <!-- PISO 5: Barra de Herramientas de Escritura Rápida -->
        <div class="def-actions">
          <button class="def-btn" id="btn-def-space" type="button" title="Insertar espacio en el texto">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
            </svg>
            <span>Espacio</span>
          </button>
          <button class="def-btn" id="btn-def-backspace" type="button" title="Borrar último caracter">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
              <path d="M22 21H7"/>
              <path d="m5 11 9 9"/>
            </svg>
            <span>Borrar</span>
          </button>
          <button class="def-btn" id="btn-def-copy" type="button" title="Copiar texto al portapapeles">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span id="btn-copy-label">Copiar</span>
          </button>
        </div>

      </div>
    `
  }

  private vincularAcciones(): void {
    document.getElementById('btn-def-space')?.addEventListener('click', () => {
      this.agregarLetra(' ', false)
    })

    document.getElementById('btn-def-backspace')?.addEventListener('click', () => {
      this.agregarLetra('', true)
    })

    document.getElementById('transcript-btn-clear')?.addEventListener('click', () => {
      this.limpiarTexto()
      window.dispatchEvent(new CustomEvent('yoso:texto-clear'))
    })

    const copyBtn = document.getElementById('btn-def-copy')
    const copyLabel = document.getElementById('btn-copy-label')
    copyBtn?.addEventListener('click', async () => {
      const texto = this.letras.join('')
      if (!texto) return
      try {
        await navigator.clipboard.writeText(texto)
        if (copyLabel) {
          copyLabel.textContent = '¡Copiado!'
          setTimeout(() => { copyLabel.textContent = 'Copiar' }, 1800)
        }
      } catch {
        // Fallback
      }
    })
  }

  setLetra(letra: string): void {
    const display = letra && letra !== '-' ? letra.toUpperCase() : '·'
    if (!this.letterEl) return

    if (display === this.letraActual) return
    this.letraActual = display

    this.letterEl.dataset.changing = 'true'
    clearTimeout(this.letraTimer)
    this.letraTimer = window.setTimeout(() => {
      if (!this.letterEl) return
      const card = document.getElementById('def-letter-card')
      if (this.letraActual === '·') {
        this.letterEl.innerHTML = `<span class="def-hero__idle-dash">—</span>`
        this.letterEl.setAttribute('data-idle', 'true')
        if (card) card.removeAttribute('data-active')
      } else {
        this.letterEl.textContent = this.letraActual
        this.letterEl.removeAttribute('data-idle')
        if (card) card.setAttribute('data-active', 'true')
      }
      this.letterEl.dataset.changing = 'false'
    }, 25)
  }

  setMano(esIzquierda: boolean | null, estado: 'good' | 'jitter' | 'roi' | 'idle' = 'idle'): void {
    const firma = `${esIzquierda}|${estado}`
    if (firma === this._prevMano) return
    this._prevMano = firma
    this.ultimaLateralidad = esIzquierda
    const izqMeter = document.getElementById('def-hand-izq-meter')
    const derMeter = document.getElementById('def-hand-der-meter')
    const izqTxt   = document.getElementById('def-hand-izq-txt')
    const derTxt   = document.getElementById('def-hand-der-txt')

    if (esIzquierda === null || estado === 'idle') {
      if (this.handIzqEl) this.handIzqEl.className = 'def-dummy-card is-idle'
      if (this.handDerEl) this.handDerEl.className = 'def-dummy-card is-idle'
      if (izqMeter) izqMeter.className = 'def-hand-meter is-idle'
      if (derMeter) derMeter.className = 'def-hand-meter is-idle'
      if (izqTxt) izqTxt.textContent = 'EN REPOSO'
      if (derTxt) derTxt.textContent = 'EN REPOSO'
      if (this.stabilityFillEl) {
        this.stabilityFillEl.style.left = '50%'
        this.stabilityFillEl.className = 'def-stability__needle'
      }
      return
    }

    let clase = 'is-stable'
    let meterCls = 'def-hand-meter is-stable'
    let texto = 'ÓPTIMA'
    let needlePos = '50%'
    let needleCls = 'def-stability__needle is-stable'

    if (estado === 'jitter') {
      clase = 'is-jitter'
      meterCls = 'def-hand-meter is-jitter'
      texto = 'AQUIETA'
      needlePos = '18%'
      needleCls = 'def-stability__needle is-warn'
    } else if (estado === 'roi') {
      clase = 'is-roi'
      meterCls = 'def-hand-meter is-roi'
      texto = 'ENCUADRE'
      needlePos = '85%'
      needleCls = 'def-stability__needle is-warn'
    }

    if (this.stabilityFillEl) {
      this.stabilityFillEl.style.left = needlePos
      this.stabilityFillEl.className = needleCls
    }

    if (esIzquierda) {
      if (this.handIzqEl) this.handIzqEl.className = `def-dummy-card ${clase}`
      if (this.handDerEl) this.handDerEl.className = 'def-dummy-card is-idle'
      if (izqMeter) izqMeter.className = meterCls
      if (derMeter) derMeter.className = 'def-hand-meter is-idle'
      if (izqTxt) izqTxt.textContent = texto
      if (derTxt) derTxt.textContent = 'INACTIVA'
    } else {
      if (this.handDerEl) this.handDerEl.className = `def-dummy-card ${clase}`
      if (this.handIzqEl) this.handIzqEl.className = 'def-dummy-card is-idle'
      if (derMeter) derMeter.className = meterCls
      if (izqMeter) izqMeter.className = 'def-hand-meter is-idle'
      if (derTxt) derTxt.textContent = texto
      if (izqTxt) izqTxt.textContent = 'INACTIVA'
    }
  }

  setManoEstadoActual(estado: 'good' | 'jitter' | 'roi' | 'idle'): void {
    if (this.ultimaLateralidad !== null) {
      this.setMano(this.ultimaLateralidad, estado)
    }
  }

  setMensajeHumano(msg: string, estado: 'idle' | 'good' | 'warn' | 'correct' = 'idle'): void {
    if (msg === this._prevMsg && estado === this._prevMsgEstado) return
    this._prevMsg      = msg
    this._prevMsgEstado = estado
    if (this.hintMsgEl) {
      this.hintMsgEl.textContent = msg
    }
    const hero = document.getElementById('def-hero')
    if (hero) hero.setAttribute('data-status', estado)

    if (this.stabilityFillEl) {
      if (estado === 'good') {
        this.stabilityFillEl.style.left = '50%'
        this.stabilityFillEl.className = 'def-stability__needle is-stable'
      } else if (estado === 'warn') {
        this.stabilityFillEl.style.left = '82%'
        this.stabilityFillEl.className = 'def-stability__needle is-warn'
      } else {
        this.stabilityFillEl.style.left = '15%'
        this.stabilityFillEl.className = 'def-stability__needle'
      }
    }
  }

  setBuffer(votos: number, total = 9): void {
    const cuenta = Math.min(votos, total)
    if (cuenta === this._prevCuenta) return
    this._prevCuenta = cuenta

    if (this.progressCountEl) {
      this.progressCountEl.innerHTML = `${cuenta}<span class="denom">/${total} VOTOS</span>`
    }

    const bufferCard = document.getElementById('def-buffer-card')
    const bufferPill = document.getElementById('def-buffer-pill')
    const statusTxt  = document.getElementById('def-buffer-status')

    if (statusTxt) {
      if (cuenta === 0) {
        statusTxt.textContent = 'ESPERANDO SEÑA'
        statusTxt.className = 'def-buffer__state-text is-idle'
      } else if (cuenta < total) {
        statusTxt.textContent = 'TRADUCIENDO…'
        statusTxt.className = 'def-buffer__state-text is-charging'
      } else {
        statusTxt.textContent = '¡TRANSCRITO!'
        statusTxt.className = 'def-buffer__state-text is-success'
      }
    }

    if (bufferCard) {
      if (cuenta >= total) {
        bufferCard.setAttribute('data-full', 'true')
        bufferPill?.classList.add('is-full')
        setTimeout(() => {
          bufferCard.removeAttribute('data-full')
          bufferPill?.classList.remove('is-full')
        }, 450)
      } else if (cuenta > 0) {
        bufferCard.setAttribute('data-active', 'true')
        bufferPill?.classList.remove('is-full')
      } else {
        bufferCard.removeAttribute('data-active')
        bufferPill?.classList.remove('is-full')
      }
    }

    const leds = document.querySelectorAll<HTMLElement>('.def-led-col')
    leds.forEach((led, idx) => {
      const ledNum = idx + 1
      if (ledNum < cuenta) {
        led.setAttribute('data-state', 'filled')
      } else if (ledNum === cuenta) {
        led.setAttribute('data-state', 'active')
      } else {
        led.removeAttribute('data-state')
      }
    })
  }

  actualizarStream(confianza: number): void {
    const pct = confianza > 0 ? Math.round(confianza * 100) : 0
    if (pct === this._prevPct) return
    this._prevPct = pct
    if (this.confEl) {
      this.confEl.innerHTML = `${pct}<span class="unit">%</span>`
    }

    if (this.ringFillEl) {
      const offset = CIRCUMFERENCE * (1 - (confianza > 0 ? confianza : 0))
      this.ringFillEl.style.strokeDashoffset = String(offset)
    }
  }

  agregarLetra(letra: string, borrar: boolean): void {
    if (borrar) {
      this.letras.pop()
    } else if (letra) {
      if (letra === ' ') {
        const palabra = this.obtenerPalabraActual()
        if (palabra) a11y.notificarPalabra(palabra)
      }
      this.letras.push(letra)
    }
    this.actualizarTexto()
  }

  limpiarTexto(): void {
    this.letras = []
    this.actualizarTexto()
  }

  private actualizarTexto(): void {
    if (!this.textEl) return
    const txt = this.letras.join('')
    this.textEl.innerHTML = `${this.escape(txt)}<span class="transcript__caret"></span>`
    this.actualizarSugerencias()
  }

  // El transcript se inyecta con innerHTML: escapar evita que un '&', '<' o '>'
  // se interprete como markup.
  private escape(s: string): string {
    return s.replace(/[&<>]/g, c => ({ '&': '\u0026amp;', '<': '\u0026lt;', '>': '\u0026gt;' }[c]!))
  }

  private obtenerPalabraActual(): string {
    const txt = this.letras.join('')
    const palabras = txt.split(' ')
    return (palabras[palabras.length - 1] || '').trim().toUpperCase()
  }

  private actualizarSugerencias(): void {
    if (!this.predictListEl) return
    const prefijo = this.obtenerPalabraActual()

    if (!prefijo || prefijo.length < 1) {
      this.predictListEl.innerHTML = `<span class="def-predict__empty">Escribe letras para ver sugerencias…</span>`
      return
    }

    // 1. Coincidencias inmediatas del diccionario base
    const locales = DICCIONARIO_BASE.filter(w => w.startsWith(prefijo) && w !== prefijo).slice(0, 5)
    this.renderizarSugerencias(locales)

    // 2. Consulta a Datamuse con caché y debounce
    if (this.cacheSugerencias.has(prefijo)) {
      const enCache = this.cacheSugerencias.get(prefijo) || []
      const unidas = Array.from(new Set([...locales, ...enCache])).slice(0, 6)
      this.renderizarSugerencias(unidas)
      return
    }

    clearTimeout(this.debounceTimer)
    this.debounceTimer = window.setTimeout(async () => {
      try {
        const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(prefijo.toLowerCase())}*&v=es&max=8`)
        if (!res.ok) return
        const data = await res.json() as Array<{ word: string }>
        const palabras = data
          .map(item => item.word.toUpperCase())
          .filter(w => w.startsWith(prefijo) && w.length > prefijo.length && !w.includes(' '))
          .slice(0, 6)

        this.cacheSugerencias.set(prefijo, palabras)
        const combinadas = Array.from(new Set([...locales, ...palabras])).slice(0, 6)
        this.renderizarSugerencias(combinadas)
      } catch {
        // En caso de error de red, el diccionario local ya cubrió la vista
      }
    }, 180)
  }

  private renderizarSugerencias(sugerencias: string[]): void {
    if (!this.predictListEl) return
    if (sugerencias.length === 0) {
      this.predictListEl.innerHTML = `<span class="def-predict__empty">Sin sugerencias para este prefijo</span>`
      return
    }

    this.predictListEl.innerHTML = sugerencias.map(palabra => `
      <button class="def-predict__pill" type="button" data-word="${palabra}" title="Autocompletar «${palabra}»">
        <span class="def-predict__txt">${palabra}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    `).join('')

    this.predictListEl.querySelectorAll<HTMLButtonElement>('.def-predict__pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const palabra = btn.dataset.word
        if (palabra) {
          this.completarPalabra(palabra)
        }
      })
    })
  }

  private completarPalabra(palabra: string): void {
    const txt = this.letras.join('')
    const palabras = txt.split(' ')
    palabras[palabras.length - 1] = palabra
    const nuevoTexto = palabras.join(' ') + ' '
    this.letras = nuevoTexto.split('')
    this.actualizarTexto()
    a11y.notificarPalabra(palabra)
  }
}
