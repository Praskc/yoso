const TIPS_LSC = [
  {
    cat: 'cultura sorda',
    body: 'La Lengua de Señas Colombiana (LSC) es una lengua natural con su propia gramática, sintaxis y estructura visual.'
  },
  {
    cat: 'dactilológico',
    body: 'El alfabeto manual se usa principalmente para nombres propios, siglas y conceptos técnicos sin seña asignada.'
  },
  {
    cat: 'ergonomía visual',
    body: 'Mantén la mano a la altura del pecho y dentro del encuadre para una articulación clara y sin fatiga física.'
  },
  {
    cat: 'gramática visual',
    body: 'La orientación de la palma y la expresión facial son componentes gramaticales fundamentales en la LSC.'
  },
  {
    cat: 'interacción',
    body: 'Al comunicarte con una persona sorda, mantén contacto visual directo y nunca tapes tu rostro ni la boca.'
  },
  {
    cat: 'diversidad lingüística',
    body: 'Cada país posee su propia lengua de señas: la LSC de Colombia tiene identidad y señas autóctonas únicas.'
  },
  {
    cat: 'fluidez',
    body: 'Articula las letras con soltura y precisión geométrica, evitando tensiones rígidas en los nudillos.'
  },
  {
    cat: 'espacio de señación',
    body: 'El espacio tridimensional frente al torso es donde se organizan las relaciones y el discurso en señas.'
  },
  {
    cat: 'identidad',
    body: 'Las personas sordas reciben un "nombre en señas" otorgado por la comunidad a partir de un rasgo distintivo.'
  },
  {
    cat: 'origen yoso',
    body: 'YOSO nace en Sincelejo, Sucre, como un instrumento de puente y respeto lingüístico, 100% libre y local.'
  },
  {
    cat: 'comunicación',
    body: 'La comunidad sorda no "no escucha": se comunica en una dimensión visual rica, estructurada y completa.'
  },
  {
    cat: 'derecho humano',
    body: 'El acceso a la lengua de señas es un derecho fundamental que garantiza la equidad y la plena inclusión.'
  }
]

export type TipoEstadoCamara = 'denied' | 'dismissed' | 'not-found' | 'in-use' | 'other'

const ICONO_CANDADO_SVG = `<svg class="es-icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`

const ICONO_TUNE_SVG = `<svg class="es-icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><circle cx="8" cy="7" r="2.8" fill="currentColor"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="16" cy="17" r="2.8" fill="currentColor"/></svg>`

export class Splash {
  private root: HTMLElement | null
  private stepEl: HTMLElement | null = null
  private tipCatEl: HTMLElement | null = null
  private tipBodyEl: HTMLElement | null = null
  private tipNEl: HTMLElement | null = null
  private drainEl: HTMLElement | null = null
  private emptyEl: HTMLElement | null = null
  private timerTip: number | null = null
  private tipIdx = 0

  constructor() {
    this.root = document.getElementById('splash-screen')
    if (this.root) {
      this.stepEl    = document.getElementById('splash-step')
      this.tipCatEl  = document.getElementById('splash-tip-cat')
      this.tipBodyEl = document.getElementById('splash-tip-body')
      this.tipNEl    = document.getElementById('splash-tip-n')
      this.drainEl   = document.getElementById('splash-drain')

      this.mostrarTip(0)
      this.iniciarRotacionTips()
    }
  }

  private iniciarRotacionTips(): void {
    this.timerTip = window.setInterval(() => {
      this.tipIdx = (this.tipIdx + 1) % TIPS_LSC.length
      this.mostrarTip(this.tipIdx)
    }, 4000)
  }

  private mostrarTip(idx: number): void {
    const tip = TIPS_LSC[idx]
    if (this.tipCatEl)  this.tipCatEl.textContent  = tip.cat
    if (this.tipBodyEl) this.tipBodyEl.textContent = tip.body
    if (this.tipNEl)    this.tipNEl.textContent    = `${idx + 1} / ${TIPS_LSC.length}`
    if (this.drainEl) {
      this.drainEl.style.animation = 'none'
      void this.drainEl.offsetWidth
      this.drainEl.style.animation = 'drain-bar 4s linear'
    }
  }

  mensaje(msg: string, esError = false): void {
    if (this.stepEl) {
      this.stepEl.textContent = msg
      this.stepEl.dataset.error = String(esError)
    }
  }

  ocultar(): void {
    if (this.timerTip) {
      clearInterval(this.timerTip)
      this.timerTip = null
    }
    if (!this.root) return
    this.root.classList.add('is-hidden')
    const root = this.root
    setTimeout(() => { root.style.display = 'none' }, 350)
  }

  mostrarEstadoVacio(_err: DOMException | null, onReintentar: () => void, estado: TipoEstadoCamara | boolean = 'other'): void {
    this.emptyEl = document.getElementById('empty-state')
    if (!this.emptyEl) return
    this.emptyEl.hidden = false

    const tipo: TipoEstadoCamara = typeof estado === 'boolean'
      ? (estado ? 'denied' : 'other')
      : estado

    this.emptyEl.dataset.status = tipo

    const iconBox = this.emptyEl.querySelector<HTMLElement>('#es-icon-box')
    const badge   = this.emptyEl.querySelector<HTMLElement>('#es-badge')
    const title   = this.emptyEl.querySelector<HTMLElement>('#es-title')
    const desc    = this.emptyEl.querySelector<HTMLElement>('#es-desc')
    const guide   = this.emptyEl.querySelector<HTMLElement>('#es-guide')
    const retry   = this.emptyEl.querySelector<HTMLButtonElement>('#es-retry')

    if (tipo === 'dismissed') {
      if (iconBox) {
        iconBox.innerHTML = `
          <svg class="empty-state__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            <circle cx="8.5" cy="12" r="2.5"/>
          </svg>
        `
      }
      if (badge) badge.textContent = 'SOLICITUD CERRADA'
      if (title) title.textContent = 'Cerraste la ventana de permiso'
      if (desc)  desc.textContent = 'Para reconocerte las señas, YOSO necesita que autorices el acceso a la cámara en tu navegador.'
      if (guide) {
        guide.innerHTML = `
          <div class="empty-state__step">
            <span class="step-num">1</span>
            <span>Haz clic en el botón azul <strong>"Abrir ventana de permiso"</strong> aquí abajo.</span>
          </div>
          <div class="empty-state__step">
            <span class="step-num">2</span>
            <span>En la ventanita emergente que aparecerá arriba en tu navegador, selecciona <strong>"Permitir"</strong>.</span>
          </div>
        `
      }
      if (retry) {
        retry.className = 'empty-state__btn-retry empty-state__btn-primary'
        retry.innerHTML = `<span>Abrir ventana de permiso</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
      }
    } else if (tipo === 'denied') {
      if (iconBox) {
        iconBox.innerHTML = `
          <svg class="empty-state__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 2 20 20"/>
            <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1"/>
            <path d="M9.5 4h5L16 7H8l1.5-3Z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        `
      }
      if (badge) badge.textContent = 'PERMISO BLOQUEADO'
      if (title) title.textContent = 'El navegador bloqueó la cámara'
      if (desc)  desc.textContent = 'El acceso a la cámara fue bloqueado en este sitio. Para habilitarlo fácilmente, sigue estos 4 pasos:'
      if (guide) {
        guide.innerHTML = `
          <div class="empty-state__step">
            <span class="step-num">1</span>
            <span><strong>Ubica la barra superior:</strong> En la parte de arriba de tu pantalla, a la izquierda de la dirección web, busca el icono de <span class="es-icon-badge">${ICONO_TUNE_SVG} Ajustes</span> o el de <span class="es-icon-badge">${ICONO_CANDADO_SVG} Candado</span>.</span>
          </div>
          <div class="empty-state__step">
            <span class="step-num">2</span>
            <span><strong>Haz clic sobre el icono:</strong> Púlsalo con el ratón para desplegar el menú de permisos del sitio.</span>
          </div>
          <div class="empty-state__step">
            <span class="step-num">3</span>
            <span><strong>Activa la Cámara:</strong> En el menú, busca la línea <strong>Cámara</strong> y cámbiala a <strong>"Permitir"</strong> (o enciende el interruptor a azul).</span>
          </div>
          <div class="empty-state__step">
            <span class="step-num">4</span>
            <span><strong>Reconecta:</strong> Haz clic en el botón azul <strong>"Reintentar conexión"</strong> de abajo (o recarga esta pestaña con F5).</span>
          </div>
        `
      }
      if (retry) {
        retry.className = 'empty-state__btn-retry'
        retry.innerHTML = `<span>Reintentar conexión</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
      }
    } else if (tipo === 'not-found') {
      if (iconBox) {
        iconBox.innerHTML = `
          <svg class="empty-state__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 2 20 20"/>
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        `
      }
      if (badge) badge.textContent = 'CÁMARA NO ENCONTRADA'
      if (title) title.textContent = 'No encontramos ninguna cámara'
      if (desc)  desc.textContent = 'No hay ninguna cámara web conectada o habilitada en este equipo.'
      if (guide) {
        guide.innerHTML = `
          <div class="empty-state__step">
            <span class="step-num">1</span>
            <span>Conecta tu cámara web o verifica que el interruptor físico de privacidad no esté apagado.</span>
          </div>
          <div class="empty-state__step">
            <span class="step-num">2</span>
            <span>Comprueba que tu equipo reconozca el dispositivo y pulsa reintentar.</span>
          </div>
        `
      }
      if (retry) {
        retry.className = 'empty-state__btn-retry'
        retry.innerHTML = `<span>Reintentar conexión</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
      }
    } else if (tipo === 'in-use') {
      if (iconBox) {
        iconBox.innerHTML = `
          <svg class="empty-state__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        `
      }
      if (badge) badge.textContent = 'CÁMARA OCUPADA'
      if (title) title.textContent = 'La cámara está en uso por otra app'
      if (desc)  desc.textContent = 'Otra aplicación puede estar bloqueando el sensor de video de tu equipo.'
      if (guide) {
        guide.innerHTML = `
          <div class="empty-state__step">
            <span class="step-num">1</span>
            <span>Cierra programas como <strong>Zoom, Teams, Meet o Skype</strong>.</span>
          </div>
          <div class="empty-state__step">
            <span class="step-num">2</span>
            <span>Vuelve a esta ventana y pulsa <strong>"Reintentar conexión"</strong>.</span>
          </div>
        `
      }
      if (retry) {
        retry.className = 'empty-state__btn-retry'
        retry.innerHTML = `<span>Reintentar conexión</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
      }
    } else {
      if (iconBox) {
        iconBox.innerHTML = `
          <svg class="empty-state__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        `
      }
      if (badge) badge.textContent = 'CÁMARA REQUERIDA'
      if (title) title.textContent = 'No pudimos conectar tu cámara'
      if (desc)  desc.textContent = 'YOSO necesita ver tus manos para reconocer las señas en tiempo real.'
      if (guide) {
        guide.innerHTML = `
          <div class="empty-state__step">
            <span class="step-num">1</span>
            <span>Haz clic en el botón de abajo para solicitar el acceso.</span>
          </div>
          <div class="empty-state__step">
            <span class="step-num">2</span>
            <span>En la ventana del navegador, pulsa <strong>"Permitir"</strong>.</span>
          </div>
        `
      }
      if (retry) {
        retry.className = 'empty-state__btn-retry empty-state__btn-primary'
        retry.innerHTML = `<span>Abrir ventana de permiso</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
      }
    }

    if (retry) {
      retry.onclick = () => {
        retry.disabled = true
        const btnHtmlOriginal = retry.innerHTML
        retry.innerHTML = `<span>Abriendo solicitud…</span>`
        setTimeout(() => {
          retry.disabled = false
          retry.innerHTML = btnHtmlOriginal
        }, 1200)
        onReintentar()
      }
    }
  }

  ocultarEstadoVacio(): void {
    if (this.emptyEl) this.emptyEl.hidden = true
  }
}
