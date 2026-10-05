export class SiteFooter {
  constructor() {
    this.render()
  }

  private render(): void {
    const root = document.getElementById('site-footer')
    if (!root) return
    root.innerHTML = `
      <div class="foot-body">
        <div class="foot-content">

          <!-- Fila de marca gigante YOSO + iconos sociales a la derecha -->
          <div class="foot-head">
            <h2 class="foot-big-title">YOSO</h2>
            <div class="foot-socials">
              <a href="https://github.com/Praskc/yoso" target="_blank" rel="noopener" class="foot-social-btn" aria-label="Repositorio GitHub YOSO" title="Repositorio GitHub">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </a>
              <a href="mailto:coteraprascaesteban@gmail.com" class="foot-social-btn" aria-label="Enviar correo electrónico" title="Correo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>
              <a href="tel:+573212363080" class="foot-social-btn" aria-label="Llamar por teléfono" title="Teléfono">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Columnas con títulos en mayúscula (Quiénes Somos, Plataforma y Contacto) -->
          <div class="foot-cols">
            <div class="foot-col foot-col--about">
              <span class="foot-col-title">QUIÉNES SOMOS</span>
              <p class="foot-about-p">
                Somos una iniciativa de desarrollo tecnológico y accesibilidad web creada en Sincelejo, Sucre, dedicada a cerrar brechas de comunicación e impulsar la inclusión social de la comunidad sorda a través de la Lengua de Señas Colombiana (LSC).
              </p>
              <span class="foot-info-line">Iniciativa abierta para desarrolladores, diseñadores y traductores.</span>
              <a class="foot-work-link" href="https://github.com/Praskc/yoso" target="_blank" rel="noopener">
                <span>Trabaja con nosotros</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
              </a>
            </div>

            <div class="foot-col">
              <span class="foot-col-title">PLATAFORMA</span>
              <button type="button" class="foot-link" data-tab="traductor">Traductor en vivo</button>
              <button type="button" class="foot-link" data-tab="entrenamiento">Modo entrenamiento</button>
              <button type="button" class="foot-link" data-tab="aprendizaje">Alfabeto dactilológico</button>
              <button type="button" class="foot-link" data-action="onboarding">Guía de uso</button>
            </div>

            <div class="foot-col">
              <span class="foot-col-title">CONTACTO</span>
              <a class="foot-link" href="mailto:coteraprascaesteban@gmail.com">coteraprascaesteban@gmail.com</a>
              <a class="foot-link" href="tel:+573212363080">+57 321 236 3080</a>
              <span class="foot-info-line">Sincelejo, Sucre · Colombia</span>
              <span class="foot-info-line">Esteban Cotera y colaboradores</span>
            </div>
          </div>

          <!-- Sub-barra final de derechos de autor (sin acrónimo) -->
          <div class="foot-copy-bar">
            <span>© 2026 YOSO · Reconocimiento de Lengua de Señas Colombiana.</span>
          </div>

        </div>
      </div>
    `

    // Navegación por tabs desde el footer
    root.querySelectorAll<HTMLElement>('.foot-link[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const tab = btn.dataset['tab']
        if (tab) {
          const tabBtn = document.querySelector<HTMLButtonElement>(`.mode-tab[data-tab="${tab}"]`)
          tabBtn?.click()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      })
    })

    // Acciones de ayuda
    root.querySelector<HTMLElement>('[data-action="onboarding"]')?.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('topbar-btn-onboarding')?.click()
    })
  }
}
