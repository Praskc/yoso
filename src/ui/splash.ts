const TIPS = [
  { cat: 'colombia',  t: 'Colombia tiene más de 1 millón de personas sordas. Para muchas, el LSC es su primera lengua, no el español.' },
  { cat: 'historia',  t: 'El LSC fue reconocido como lengua oficial en 1996. Antes, muchas escuelas colombianas prohibían su uso en el aula.' },
  { cat: 'lenguas',   t: 'No existe una lengua de señas universal. Hay más de 300 en el mundo: el LSC, el ASL y el LSE son completamente distintos.' },
  { cat: 'lsc',       t: 'La gramática del LSC no sigue el orden del español. Usa el espacio frente al cuerpo para indicar quién hace qué y cuándo.' },
  { cat: 'sincelejo', t: 'Sincelejo, Sucre, tiene una de las comunidades sordas más organizadas y activas del Caribe colombiano.' },
  { cat: 'colombia',  t: 'El 96 % de los niños sordos nacen en familias oyentes. Su primera exposición al LSC suele ocurrir en la escuela, no en casa.' },
  { cat: 'colombia',  t: 'En Colombia hay menos de 500 intérpretes de LSC certificados. Formarlos toma entre 3 y 5 años de estudio especializado.' },
  { cat: 'lsc',       t: 'La Ñ tiene seña propia en el LSC. No existe en el ASL ni en la mayoría de lenguas de señas del mundo.' },
  { cat: 'lenguas',   t: 'Las lenguas de señas no son gestos improvisados. Tienen fonología, morfología y sintaxis propias, igual que cualquier lengua oral.' },
  { cat: 'historia',  t: 'Las señas cambian con el tiempo, igual que las palabras habladas. Algunas señas de hace 30 años ya no se reconocen en ciertas ciudades.' },
  { cat: 'lsc',       t: 'M y N tienen configuraciones similares en el LSC. El contexto de la frase es clave para distinguirlas.' },
  { cat: 'colombia',  t: 'Colombia fue uno de los primeros países latinoamericanos en otorgar reconocimiento constitucional a la comunidad sorda.' },
]

const STEPS = [
  'Iniciando runtime…',
  'Descargando modelo · 2.4 MB…',
  'Compilando sesión ONNX…',
  'Cargando centroides…',
  'Preparando inferencia…',
]

export class Splash {
  private readonly root:    HTMLElement | null
  private readonly spinEl:  HTMLElement | null
  private readonly stepEl:  HTMLElement | null
  private readonly catEl:   HTMLElement | null
  private readonly bodyEl:  HTMLElement | null
  private readonly nEl:     HTMLElement | null
  private readonly drainEl: HTMLElement | null
  private emptyEl:          HTMLElement | null = null

  private tipIdx    = 0
  private tipTimer: ReturnType<typeof setInterval> | null  = null
  private stepIdx   = 0
  private stepTimer: ReturnType<typeof setInterval> | null = null
  private hasError  = false

  constructor() {
    this.root    = document.getElementById('splash-screen')
    this.spinEl  = document.getElementById('splash-spin')
    this.stepEl  = document.getElementById('splash-step')
    this.catEl   = document.getElementById('splash-tip-cat')
    this.bodyEl  = document.getElementById('splash-tip-body')
    this.nEl     = document.getElementById('splash-tip-n')
    this.drainEl = document.getElementById('splash-drain')

    this._startSteps()
    this._startTips()
  }

  private _resetDrain(): void {
    if (!this.drainEl) return
    this.drainEl.style.animation = 'none'
    void this.drainEl.offsetWidth
    this.drainEl.style.animation = ''
  }

  private _startSteps(): void {
    if (this.stepTimer) clearInterval(this.stepTimer)
    this.stepTimer = setInterval(() => {
      if (this.hasError || this.stepIdx >= STEPS.length - 1) return
      this.stepIdx++
      if (this.stepEl) this.stepEl.textContent = STEPS[this.stepIdx]
    }, 900)
  }

  private _goToTip(i: number): void {
    if (this.hasError || !this.bodyEl) return
    const next = ((i % TIPS.length) + TIPS.length) % TIPS.length
    this.bodyEl.classList.add('out')
    setTimeout(() => {
      this.tipIdx = next
      if (this.bodyEl) this.bodyEl.textContent = TIPS[next].t
      if (this.catEl)  this.catEl.textContent  = TIPS[next].cat
      if (this.nEl)    this.nEl.textContent    = `${next + 1} / 12`
      this.bodyEl!.classList.remove('out')
      this.bodyEl!.classList.add('in')
      requestAnimationFrame(() => requestAnimationFrame(() => this.bodyEl!.classList.remove('in')))
      this._resetDrain()
    }, 140)
  }

  private _startTips(): void {
    if (this.tipTimer) clearInterval(this.tipTimer)
    this.tipTimer = setInterval(() => this._goToTip(this.tipIdx + 1), 4000)
  }

  mensaje(msg: string, esError = false): void {
    if (!esError) {
      if (this.stepEl) this.stepEl.textContent = msg
      return
    }
    this.hasError = true
    if (this.tipTimer)  clearInterval(this.tipTimer)
    if (this.stepTimer) clearInterval(this.stepTimer)
    if (this.drainEl)   this.drainEl.style.animation = 'none'
    this.spinEl?.setAttribute('data-error', '')
    this.stepEl?.setAttribute('data-error', '')
    this.catEl?.setAttribute('data-error', '')
    if (this.stepEl) this.stepEl.textContent = msg
    this.bodyEl?.classList.add('out')
    setTimeout(() => {
      if (!this.bodyEl) return
      this.bodyEl.textContent = 'No se pudo cargar el modelo. Recarga la página para reintentar.'
      this.bodyEl.classList.remove('out')
      this.bodyEl.classList.add('err', 'in')
      requestAnimationFrame(() => requestAnimationFrame(() => this.bodyEl!.classList.remove('in')))
    }, 140)
  }

  ocultar(): void {
    if (this.tipTimer)  clearInterval(this.tipTimer)
    if (this.stepTimer) clearInterval(this.stepTimer)
    if (!this.root) return
    this.root.classList.add('is-hidden')
    const root = this.root
    setTimeout(() => { root.style.display = 'none' }, 400)
  }

  mostrarEstadoVacio(err: DOMException | null, onReintentar: () => void, _bloqueado = false): void {
    this.emptyEl = document.getElementById('empty-state')
    if (!this.emptyEl) return
    this.emptyEl.hidden = false
    const title = this.emptyEl.querySelector<HTMLElement>('.empty-state__title')
    if (title && err?.name === 'NotAllowedError') {
      title.textContent = 'YOSO necesita permiso para acceder a tu cámara.'
    }
    const retry = this.emptyEl.querySelector<HTMLButtonElement>('#es-retry')
    if (retry) retry.onclick = onReintentar
  }

  ocultarEstadoVacio(): void {
    if (this.emptyEl) this.emptyEl.hidden = true
  }
}
