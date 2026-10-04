export class SiteFooter {
  constructor() {
    this.render()
  }

  private render(): void {
    const root = document.getElementById('site-footer')
    if (!root) return
    root.innerHTML = `
      <div class="foot-grid">
        <div class="foot-brand">
          <span class="foot-brand__name">YOSO</span>
          <span class="foot-brand__full">You Only Sign Once</span>
          <p class="foot-brand__desc">Reconocimiento del alfabeto dactilológico LSC
            en tiempo real, 100% en tu navegador. Sin servidores, sin cámaras ajenas.</p>
        </div>
        <div class="foot-col">
          <span class="foot-col__title">modos</span>
          <a class="foot-link" data-tab="traductor">Traductor</a>
          <a class="foot-link" data-tab="entrenamiento">Entrenamiento</a>
          <a class="foot-link" data-tab="aprendizaje">Aprendizaje</a>
        </div>
        <div class="foot-col">
          <span class="foot-col__title">ayuda</span>
          <a class="foot-link" data-action="onboarding">Cómo usar YOSO</a>
          <a class="foot-link" data-action="alfabeto">Alfabeto LSC</a>
          <span class="foot-note">Todo procesamiento es local</span>
        </div>
        <div class="foot-col">
          <span class="foot-col__title">contacto</span>
          <a class="foot-link foot-link--icon" href="mailto:coteraprascaesteban@gmail.com">
            coteraprascaesteban@gmail.com</a>
          <a class="foot-link foot-link--icon" href="tel:+573212363080">+57 321 236 3080</a>
          <span class="foot-note">San Marcos, Colombia</span>
        </div>
      </div>
      <div class="foot-bar">
        <span>© 2026 YOSO</span>
        <span class="foot-bar__sig">
          <span class="lead">Developed by</span> Esteban Cotera
          <a href="https://github.com/Praskc" target="_blank" rel="noopener" aria-label="GitHub @Praskc" class="foot-gh">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
        </span>
      </div>
    `

    // Navegación por tabs desde el footer
    root.querySelectorAll<HTMLAnchorElement>('.foot-link[data-tab]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const tab = link.dataset['tab']
        if (tab) {
          const tabBtn = document.querySelector<HTMLButtonElement>(`.mode-tab[data-tab="${tab}"]`)
          tabBtn?.click()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      })
    })

    // Acciones de ayuda
    root.querySelector<HTMLAnchorElement>('[data-action="onboarding"]')?.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('topbar-btn-onboarding')?.click()
    })

    root.querySelector<HTMLAnchorElement>('[data-action="alfabeto"]')?.addEventListener('click', (e) => {
      e.preventDefault()
      const tabBtn = document.querySelector<HTMLButtonElement>('.mode-tab[data-tab="aprendizaje"]')
      tabBtn?.click()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
}
