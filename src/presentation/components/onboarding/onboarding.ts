const ONBOARD_KEY = 'yosoOnboarded'
const ONBOARD_VERSION = 'v12_manifesto'

export interface OnboardingStep {
  badge: string
  title: string
  desc: string
  points: { icon: string; title: string; text: string }[]
  previewHtml: string
}

export class Onboarding {
  private pasoActual = 0
  private readonly pasos: OnboardingStep[] = [
    {
      badge: 'MODOS DE USO',
      title: 'Elige cómo practicar',
      desc: 'Tres formas integradas de interactuar con el alfabeto LSC:',
      points: [
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
          title: 'Aprendizaje',
          text: 'Consulta el abecedario de señas y la <strong>postura exacta de cada letra</strong> con ejemplos visuales.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
          title: 'Entrenamiento',
          text: 'Supera retos con <strong>palabras aleatorias</strong> para ganar velocidad y agilidad con tus manos.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>`,
          title: 'Traductor (Modo libre)',
          text: 'Deletrea <strong>frases completas libremente</strong> frente a la cámara con transcripción en vivo.',
        },
      ],
      previewHtml: `
        <div class="onb-preview-frame">
          <div class="onb-modes-guide">
            <div class="onb-mode-card is-active">
              <span class="mode-tag mode-tag--free">Libre</span>
              <strong>Traductor</strong>
              <small>Transcripción en vivo</small>
            </div>
            <div class="onb-mode-card">
              <span class="mode-tag mode-tag--game">Juego</span>
              <strong>Entrenamiento</strong>
              <small>Retos por tiempo</small>
            </div>
            <div class="onb-mode-card">
              <span class="mode-tag mode-tag--learn">Guía</span>
              <strong>Aprendizaje</strong>
              <small>Catálogo de señas</small>
            </div>
          </div>
          <span class="onb-preview-caption">Cambia de modo al instante desde la barra superior</span>
        </div>
      `,
    },
    {
      badge: 'CALIBRACIÓN Y POSTURA',
      title: 'Colocación de tu mano',
      desc: 'Recomendaciones para una detección instantánea y sin demoras:',
      points: [
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
          title: 'Dentro del encuadre',
          text: 'Ubica tu palma en el <strong>centro del recuadro guía</strong> de la cámara.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/></svg>`,
          title: 'Distancia e iluminación',
          text: 'Sitúate a medio metro de la pantalla con <strong>luz clara y uniforme</strong> sobre tu mano.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11V4a1.5 1.5 0 0 1 3 0v6"/><path d="M10 7.5V3a1.5 1.5 0 0 1 3 0v4.5"/><path d="M13 8V4.5a1.5 1.5 0 0 1 3 0V9"/><path d="M16 10.5V6a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.6-3.8L5 11.2a1.5 1.5 0 0 1 2.4-1.6L9 12"/></svg>`,
          title: 'Uso ambidiestro',
          text: 'Puedes deletrear con tu <strong>mano derecha o izquierda</strong>; la red neuronal reconoce ambas.',
        },
      ],
      previewHtml: `
        <div class="onb-preview-frame">
          <div class="onb-roi-box">
            <div class="onb-roi-reticle"></div>
            <div class="onb-roi-hand-anim">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 11V4a1.5 1.5 0 0 1 3 0v6"/>
                <path d="M10 7.5V3a1.5 1.5 0 0 1 3 0v4.5"/>
                <path d="M13 8V4.5a1.5 1.5 0 0 1 3 0V9"/>
                <path d="M16 10.5V6a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.6-3.8L5 11.2a1.5 1.5 0 0 1 2.4-1.6L9 12"/>
              </svg>
            </div>
          </div>
          <span class="onb-preview-caption">Mantén la palma de frente y centrada en el visor</span>
        </div>
      `,
    },
    {
      badge: 'PASO 3 · DETECCIÓN',
      title: '¿Cómo se escribe cada letra?',
      desc: 'Solo haz la seña con tu mano y la app la escribirá por ti:',
      points: [
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
          title: '1. Haz la seña',
          text: 'Forma la letra con tu mano y <strong>déjala quieta un instante</strong> frente a la cámara.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
          title: '2. Mira la barra',
          text: 'Verás que la <strong>barra de carga se llena</strong> rápidamente mientras mantienes la postura.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
          title: '3. ¡Letra escrita!',
          text: 'Al completarse la barra, la letra <strong>se añade al texto en la pantalla</strong> sin tocar nada.',
        },
      ],
      previewHtml: `
        <div class="onb-preview-frame">
          <div class="onb-buffer-demo">
            <div class="onb-demo-hud">
              <span class="onb-demo-letter">A</span>
              <span class="onb-demo-conf">¡Seña detectada!</span>
            </div>
            <div class="onb-demo-bar">
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-fill"></span>
              <span class="onb-demo-cell onb-cell-pulse"></span>
            </div>
            <span class="onb-demo-counter">MANTÉN LA SEÑA FIJA HASTA LLENAR LA BARRA</span>
          </div>
        </div>
      `,
    },
  ]

  async mostrar(forzado = false): Promise<void> {
    const root = document.getElementById('onboarding-root')
    if (!root) return

    const yaVisto = localStorage.getItem(ONBOARD_KEY) === ONBOARD_VERSION

    // Si no es forzado y ya se vio en esta versión, no mostrar nada
    if (!forzado && yaVisto) return

    return new Promise(resolve => {
      if (!forzado) {
        // Primera vez que entra a la app: Manifiesto OG con descargos y filosofía
        this.mostrarManifiestoPrimeraVez(root, resolve)
      } else {
        // Acceso desde botón "cómo usar": va directo a las tarjetas explicativas
        this.mostrarTarjetasTutorial(root, resolve)
      }
    })
  }

  /**
   * Pantalla de Primera Vez (OG):
   * Ilustración de la mano desde la perspectiva del usuario (dorso de la mano: meñique a la izq, pulgar a la der),
   * descargos de privacidad biométrica y vocabulario, filosofía YOSO, y bifurcación limpia:
   * - "saltar, exploraré solo" -> va directo a la app.
   * - "COMENZAR" -> abre las tarjetas de tutorial.
   */
  private mostrarManifiestoPrimeraVez(root: HTMLElement, resolve: () => void): void {
    root.innerHTML = `
      <div class="onboarding-card onb-manifesto-card" role="dialog" aria-modal="true" aria-labelledby="manifesto-title">
        <button type="button" class="onboarding-dismiss" id="onb-manifesto-close" aria-label="Cerrar bienvenida">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <!-- Marco con ilustración oficial de la seña Y (Deaf-Alphabet-Y con paleta YOSO) -->
        <div class="onb-og-frame" aria-hidden="true">
          <span class="onb-og-tag-y">Y</span>
          <div class="onb-og-hand-svg">
            <svg width="240" height="175" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="yosoHandGrad" x1="10" y1="10" x2="110" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#93C5FD"/>
                  <stop offset="40%" stop-color="#3B82F6"/>
                  <stop offset="100%" stop-color="#1E3A8A"/>
                </linearGradient>
                <linearGradient id="yosoShadeGrad" x1="20" y1="40" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.8"/>
                  <stop offset="100%" stop-color="#0F172A" stop-opacity="0.9"/>
                </linearGradient>
                <linearGradient id="yosoLineGrad" x1="10" y1="10" x2="100" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#E0F2FE"/>
                  <stop offset="100%" stop-color="#93C5FD"/>
                </linearGradient>
              </defs>

              <!-- Silueta Principal de la Mano en Seña Y -->
              <!-- 1. Meñique extendido (izquierda) -->
              <path d="M 23 8 C 16 10 13 20 18 30 L 25 43 C 27 46 31 46 33 43 L 38 32 C 40 27 38 20 34 14 C 30 9 26 7 23 8 Z" fill="url(#yosoHandGrad)" stroke="#60A5FA" stroke-width="2" stroke-linejoin="round"/>
              <path d="M 20 17 L 31 13" stroke="url(#yosoLineGrad)" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M 23 25 L 34 21" stroke="url(#yosoLineGrad)" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M 26 34 L 37 30" stroke="url(#yosoLineGrad)" stroke-width="1.8" stroke-linecap="round"/>

              <!-- 2. Dedo Anular flexionado -->
              <path d="M 37 28 C 37 18 45 13 52 14 C 59 15 62 22 61 30 L 59 44 C 57 48 48 48 44 45 L 37 38 Z" fill="url(#yosoHandGrad)" stroke="#60A5FA" stroke-width="2" stroke-linejoin="round"/>
              <path d="M 42 22 C 47 21 53 22 57 23" stroke="url(#yosoLineGrad)" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M 40 33 C 46 32 52 33 56 34" stroke="url(#yosoLineGrad)" stroke-width="1.6" stroke-linecap="round"/>

              <!-- 3. Dedo Medio flexionado -->
              <path d="M 58 24 C 58 14 66 10 74 11 C 81 12 84 18 83 26 L 81 42 C 79 46 70 47 66 44 L 58 35 Z" fill="url(#yosoHandGrad)" stroke="#60A5FA" stroke-width="2" stroke-linejoin="round"/>
              <path d="M 64 19 C 69 18 75 19 79 20" stroke="url(#yosoLineGrad)" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M 62 30 C 67 29 73 30 77 31" stroke="url(#yosoLineGrad)" stroke-width="1.6" stroke-linecap="round"/>

              <!-- 4. Dedo Índice flexionado -->
              <path d="M 79 22 C 80 14 88 10 95 12 C 101 14 104 20 102 28 L 98 44 C 95 48 87 48 83 44 L 79 32 Z" fill="url(#yosoHandGrad)" stroke="#60A5FA" stroke-width="2" stroke-linejoin="round"/>
              <path d="M 85 19 C 90 19 95 20 99 22" stroke="url(#yosoLineGrad)" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M 83 30 C 88 30 93 31 96 33" stroke="url(#yosoLineGrad)" stroke-width="1.6" stroke-linecap="round"/>

              <!-- 5. Palma Central y Dorso -->
              <path d="M 28 42 C 22 50 25 68 32 78 L 44 94 L 74 94 L 88 78 C 96 66 98 52 94 42 L 80 44 C 74 48 64 48 58 44 C 52 48 42 47 38 43 Z" fill="url(#yosoHandGrad)" stroke="#60A5FA" stroke-width="2" stroke-linejoin="round"/>

              <!-- 6. Pulgar extendido (derecha) -->
              <path d="M 90 42 C 96 36 104 28 111 25 C 117 23 120 28 116 36 C 110 48 102 60 94 68 L 86 60 C 88 52 89 46 90 42 Z" fill="url(#yosoHandGrad)" stroke="#60A5FA" stroke-width="2" stroke-linejoin="round"/>
              <path d="M 103 33 C 107 38 111 44 113 49" stroke="url(#yosoLineGrad)" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M 96 44 C 100 48 104 54 106 59" stroke="url(#yosoLineGrad)" stroke-width="1.8" stroke-linecap="round"/>

              <!-- Sombreado anatómico en pliegues de palma y muñeca -->
              <path d="M 44 94 L 46 82 C 54 84 64 84 72 82 L 74 94 Z" fill="url(#yosoShadeGrad)" stroke="#38BDF8" stroke-width="1.5"/>
              <path d="M 36 62 C 45 68 62 68 76 60" stroke="#38BDF8" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
              <path d="M 40 73 C 48 78 60 78 70 72" stroke="#38BDF8" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
            </svg>
          </div>
        </div>

        <h2 class="onb-manifesto-title" id="manifesto-title">Deberías saber esto de YOSO</h2>

        <!-- Pilares: Descargo de Biometría, Descargo de Vocabulario y Filosofía LSC -->
        <ul class="onb-manifesto-list">
          <li class="onb-manifesto-item">
            <span class="onb-manifesto-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <div class="onb-manifesto-text">
              <strong>Descargo de Privacidad y Biometría:</strong> La inferencia opera 100% de manera local en tu navegador. <strong>No se realiza grabación de video ni captura de datos biométricos</strong>, y ninguna imagen o información personal es transmitida a servidores o terceros.
            </div>
          </li>

          <li class="onb-manifesto-item">
            <span class="onb-manifesto-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <div class="onb-manifesto-text">
              <strong>Descargo de Contenido de Retos:</strong> Las palabras de entrenamiento se generan automáticamente de forma aleatoria mediante una biblioteca abierta; ocasionalmente pueden surgir términos coloquiales, sensibles o malsonantes fuera del control de la plataforma.
            </div>
          </li>

          <li class="onb-manifesto-item">
            <span class="onb-manifesto-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </span>
            <div class="onb-manifesto-text">
              <strong>Filosofía y Propósito:</strong> YOSO es una iniciativa comunitaria y libre diseñada para tender puentes y fomentar el aprendizaje de la Lengua de Señas Colombiana (LSC), con absoluto respeto hacia la comunidad sorda.
            </div>
          </li>
        </ul>

        <div class="onboarding-footer">
          <button type="button" class="onb-btn-secondary onb-btn-secondary--mono" id="onb-first-skip">
            saltar, exploraré solo
          </button>
          <button type="button" class="onb-btn-primary" id="onb-first-continue">
            COMENZAR
          </button>
        </div>
      </div>
    `

    const cerrarDirecto = (): void => {
      localStorage.setItem(ONBOARD_KEY, ONBOARD_VERSION)
      root.dataset.open = 'false'
      root.style.display = 'none'
      root.innerHTML = ''
      document.removeEventListener('keydown', onKey)
      resolve()
    }

    const irATarjetas = (): void => {
      localStorage.setItem(ONBOARD_KEY, ONBOARD_VERSION)
      document.removeEventListener('keydown', onKey)
      this.mostrarTarjetasTutorial(root, resolve)
    }

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') cerrarDirecto()
    }

    root.querySelector<HTMLButtonElement>('#onb-manifesto-close')?.addEventListener('click', cerrarDirecto)
    root.querySelector<HTMLButtonElement>('#onb-first-skip')?.addEventListener('click', cerrarDirecto)
    root.querySelector<HTMLButtonElement>('#onb-first-continue')?.addEventListener('click', irATarjetas)
    document.addEventListener('keydown', onKey)

    root.dataset.open = 'true'
    root.style.display = 'flex'
  }

  /**
   * Tutorial guiado paso a paso con las 3 tarjetas informativas ("Cómo usar YOSO")
   */
  private mostrarTarjetasTutorial(root: HTMLElement, resolve: () => void): void {
    this.pasoActual = 0

    const render = (): void => {
      const paso = this.pasos[this.pasoActual]
      const esUltimo = this.pasoActual === this.pasos.length - 1
      const esPrimero = this.pasoActual === 0

      root.innerHTML = `
        <div class="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onb-title">
          <button type="button" class="onboarding-dismiss" id="onb-close" aria-label="Cerrar tutorial">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <!-- Encabezado con Badge de progreso -->
          <div class="onb-header">
            <span class="onb-badge">${paso.badge}</span>
            <h2 class="onb-title" id="onb-title">${paso.title}</h2>
            <p class="onb-subtitle">${paso.desc}</p>
          </div>

          <!-- Contenido Visual y Puntos -->
          <div class="onb-body">
            ${paso.previewHtml}

            <ul class="onb-steps">
              ${paso.points
                .map(
                  p => `
                <li class="onb-step">
                  <span class="onb-step__icon-box">${p.icon}</span>
                  <div class="onb-step__content">
                    <span class="onb-step__title">${p.title}</span>
                    <span class="onb-step__text">${p.text}</span>
                  </div>
                </li>
              `
                )
                .join('')}
            </ul>
          </div>

          <!-- Footer: Indicador de pasos + Controles de Navegación -->
          <div class="onboarding-footer">
            <div class="onb-dots" role="tablist" aria-label="Pasos del tutorial">
              ${this.pasos
                .map(
                  (_, idx) => `
                <button type="button" class="onb-dot ${idx === this.pasoActual ? 'is-active' : ''}" data-step="${idx}" aria-label="Ir al paso ${idx + 1}"></button>
              `
                )
                .join('')}
            </div>

            <div class="onb-actions">
              ${
                !esPrimero
                  ? `<button type="button" class="onb-btn-secondary" id="onb-prev">Anterior</button>`
                  : `<button type="button" class="onb-btn-secondary" id="onb-skip">Saltar</button>`
              }
              <button type="button" class="onb-btn-primary" id="onb-next">
                ${esUltimo ? '¡Empezar!' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      `

      // Bind events
      const btnClose = root.querySelector<HTMLButtonElement>('#onb-close')
      if (btnClose) {
        btnClose.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          cerrar()
        }
      }

      const btnSkip = root.querySelector<HTMLButtonElement>('#onb-skip')
      if (btnSkip) {
        btnSkip.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          cerrar()
        }
      }

      root.querySelector<HTMLButtonElement>('#onb-prev')?.addEventListener('click', () => {
        if (this.pasoActual > 0) {
          this.pasoActual--
          render()
        }
      })

      root.querySelector<HTMLButtonElement>('#onb-next')?.addEventListener('click', () => {
        if (esUltimo) {
          cerrar()
        } else {
          this.pasoActual++
          render()
        }
      })

      root.querySelectorAll<HTMLButtonElement>('.onb-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          const step = Number(dot.dataset.step)
          if (!isNaN(step) && step >= 0 && step < this.pasos.length) {
            this.pasoActual = step
            render()
          }
        })
      })
    }

    const cerrar = (): void => {
      root.dataset.open = 'false'
      root.style.display = 'none'
      root.innerHTML = ''
      document.removeEventListener('keydown', onKey)
      root.removeEventListener('click', onRootClick)
      localStorage.setItem(ONBOARD_KEY, ONBOARD_VERSION)
      resolve()
    }

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        cerrar()
      } else if (e.key === 'ArrowRight') {
        if (this.pasoActual < this.pasos.length - 1) {
          this.pasoActual++
          render()
        }
      } else if (e.key === 'ArrowLeft') {
        if (this.pasoActual > 0) {
          this.pasoActual--
          render()
        }
      }
    }

    const onRootClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null
      if (target === root || target?.closest('#onb-close') || target?.closest('#onb-skip')) {
        e.preventDefault()
        e.stopPropagation()
        cerrar()
      }
    }

    render()
    root.dataset.open = 'true'
    root.style.display = 'flex'

    root.addEventListener('click', onRootClick)
    document.addEventListener('keydown', onKey)
  }
}
