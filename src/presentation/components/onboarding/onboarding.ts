
import type { OnboardingService } from '../../../application/onboarding/onboarding-service'

export interface OnboardingStep {
  badge: string
  title: string
  desc: string
  points: { icon: string; title: string; text: string }[]
  previewHtml: string
}

export class Onboarding {
  private currentStep = 0
  private readonly steps: OnboardingStep[] = [
    {
      badge: 'PASO 1 DE 3 · LOS 3 MODOS',
      title: '¿Qué puedes hacer en cada modo?',
      desc: 'Elige arriba el modo que quieras usar según lo que busques practicar:',
      points: [
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
          title: 'Aprendizaje',
          text: 'Aprende el abecedario de señas (<strong>deletreo o fingerspelling</strong>) letra por letra, viendo la posición exacta de cada una.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
          title: 'Entrenamiento',
          text: '¡Un juego de práctica! Te da <strong>palabras al azar</strong> para que las deletrees con tus manos y ganes agilidad.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>`,
          title: 'Traductor (Modo libre)',
          text: 'Deletrea <strong>lo que tú quieras libremente</strong> frente a la cámara y el sistema lo irá escribiendo en la pantalla.',
        },
      ],
      previewHtml: `
        <div class="onb-preview-frame">
          <div class="onb-modes-guide">
            <div class="onb-mode-card is-active">
              <span class="mode-tag mode-tag--free">Libre</span>
              <strong>Traductor</strong>
              <small>Deletrea cualquier frase</small>
            </div>
            <div class="onb-mode-card">
              <span class="mode-tag mode-tag--game">Juego</span>
              <strong>Entrenamiento</strong>
              <small>Palabras al azar</small>
            </div>
            <div class="onb-mode-card">
              <span class="mode-tag mode-tag--learn">Guía</span>
              <strong>Aprendizaje</strong>
              <small>Aprende el abecedario</small>
            </div>
          </div>
          <span class="onb-preview-caption">Cambia de modo cuando quieras desde la barra de arriba</span>
        </div>
      `,
    },
    {
      badge: 'PASO 2 DE 3 · TU MANO EN LA CÁMARA',
      title: 'Cómo poner tu mano',
      desc: 'Para que la cámara te entienda rápido y clarito:',
      points: [
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`,
          title: 'Dentro del recuadro',
          text: 'Pon tu mano en el <strong>centro del cuadro</strong> que aparece en el video de la cámara.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/></svg>`,
          title: 'Distancia y luz',
          text: 'Quédate a medio metro de la pantalla (donde se vea bien tu mano) y con <strong>buena luz</strong>.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11V4a1.5 1.5 0 0 1 3 0v6"/><path d="M10 7.5V3a1.5 1.5 0 0 1 3 0v4.5"/><path d="M13 8V4.5a1.5 1.5 0 0 1 3 0V9"/><path d="M16 10.5V6a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.6-3.8L5 11.2a1.5 1.5 0 0 1 2.4-1.6L9 12"/></svg>`,
          title: 'Cualquiera de las dos manos',
          text: 'Puedes usar tu <strong>mano derecha o la izquierda</strong>, la app reconoce ambas por igual.',
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
          <span class="onb-preview-caption">Mantén tu mano dentro del área de la cámara</span>
        </div>
      `,
    },
    {
      badge: 'PASO 3 DE 3 · CÓMO SE ESCRIBEN LAS LETRAS',
      title: '¡No tienes que tocar nada!',
      desc: 'Las letras se escriben solitas mientras haces las señas:',
      points: [
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
          title: 'Haz la seña y quédate quieto',
          text: 'Forma la letra con tu mano y <strong>mantenla quieta un segundo</strong> frente a la cámara.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
          title: 'Las barritas se llenan',
          text: 'Verás unas <strong>barritas que se van llenando</strong> mientras mantienes la mano quieta.',
        },
        {
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
          title: '¡Se escribe sola!',
          text: 'Cuando las barritas se completan, la letra <strong>se escribe solita en la pantalla</strong>. Sin presionar botones.',
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
            <span class="onb-demo-counter">MANO QUIETA · SE ESCRIBE SOLA</span>
          </div>
        </div>
      `,
    },
  ]

  constructor(private readonly service: OnboardingService) {}

  async show(force = false): Promise<void> {
    const root = document.getElementById('onboarding-root')
    if (!root) return

    const alreadySeen = this.service.hasSeenCurrentVersion()
    if (!force && alreadySeen) return

    return new Promise(resolve => {
      if (!force) {
        this.showFirstVisitManifest(root, resolve)
      } else {
        this.showTutorialCards(root, resolve)
      }
    })
  }

  private showFirstVisitManifest(root: HTMLElement, resolve: () => void): void {
    root.innerHTML = `
      <div class="onboarding-card onb-manifesto-card" role="dialog" aria-modal="true" aria-labelledby="manifesto-title">
        <button type="button" class="onboarding-dismiss" id="onb-manifesto-close" aria-label="close bienvenida">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="onb-og-frame" aria-hidden="true">
          <span class="onb-og-tag-y">Y</span>
          <img src="/hand_sign_y.jpg" alt="Seña Y en LSC" class="onb-og-hand-img" />
        </div>

        <h2 class="onb-manifesto-title" id="manifesto-title">Deberías saber esto de YOSO</h2>
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

    const closeDirectly = (): void => {
      this.service.markCurrentVersionSeen()
      root.dataset.open = 'false'
      root.style.display = 'none'
      root.innerHTML = ''
      document.removeEventListener('keydown', onKey)
      resolve()
    }

    const goToCards = (): void => {
      this.service.markCurrentVersionSeen()
      document.removeEventListener('keydown', onKey)
      this.showTutorialCards(root, resolve)
    }

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeDirectly()
    }

    root.querySelector<HTMLButtonElement>('#onb-manifesto-close')?.addEventListener('click', closeDirectly)
    root.querySelector<HTMLButtonElement>('#onb-first-skip')?.addEventListener('click', closeDirectly)
    root.querySelector<HTMLButtonElement>('#onb-first-continue')?.addEventListener('click', goToCards)
    document.addEventListener('keydown', onKey)

    root.dataset.open = 'true'
    root.style.display = 'flex'
  }

  private showTutorialCards(root: HTMLElement, resolve: () => void): void {
    this.currentStep = 0

    const render = (): void => {
      const step = this.steps[this.currentStep]
      const isLast = this.currentStep === this.steps.length - 1
      const isFirst = this.currentStep === 0

      root.innerHTML = `
        <div class="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onb-title">
          <button type="button" class="onboarding-dismiss" id="onb-close" aria-label="close tutorial">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div class="onb-header">
            <span class="onb-badge">${step.badge}</span>
            <h2 class="onb-title" id="onb-title">${step.title}</h2>
            <p class="onb-subtitle">${step.desc}</p>
          </div>
          <div class="onb-body">
            ${step.previewHtml}

            <ul class="onb-steps">
              ${step.points
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
          <div class="onboarding-footer">
            <div class="onb-dots" role="tablist" aria-label="steps del tutorial">
              ${this.steps
                .map(
                  (_, idx) => `
                <button type="button" class="onb-dot ${idx === this.currentStep ? 'is-active' : ''}" data-step="${idx}" aria-label="Ir al paso ${idx + 1}"></button>
              `
                )
                .join('')}
            </div>

            <div class="onb-actions">
              ${
                !isFirst
                  ? `<button type="button" class="onb-btn-secondary" id="onb-prev">Anterior</button>`
                  : `<button type="button" class="onb-btn-secondary" id="onb-skip">Saltar</button>`
              }
              <button type="button" class="onb-btn-primary" id="onb-next">
                ${isLast ? '¡Empezar!' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      `
      const btnClose = root.querySelector<HTMLButtonElement>('#onb-close')
      if (btnClose) {
        btnClose.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          close()
        }
      }

      const btnSkip = root.querySelector<HTMLButtonElement>('#onb-skip')
      if (btnSkip) {
        btnSkip.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          close()
        }
      }

      root.querySelector<HTMLButtonElement>('#onb-prev')?.addEventListener('click', () => {
        if (this.currentStep > 0) {
          this.currentStep--
          render()
        }
      })

      root.querySelector<HTMLButtonElement>('#onb-next')?.addEventListener('click', () => {
        if (isLast) {
          close()
        } else {
          this.currentStep++
          render()
        }
      })

      root.querySelectorAll<HTMLButtonElement>('.onb-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          const step = Number(dot.dataset.step)
          if (!isNaN(step) && step >= 0 && step < this.steps.length) {
            this.currentStep = step
            render()
          }
        })
      })
    }

    const close = (): void => {
      root.dataset.open = 'false'
      root.style.display = 'none'
      root.innerHTML = ''
      document.removeEventListener('keydown', onKey)
      root.removeEventListener('click', onRootClick)
      this.service.markCurrentVersionSeen()
      resolve()
    }

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        close()
      } else if (e.key === 'ArrowRight') {
        if (this.currentStep < this.steps.length - 1) {
          this.currentStep++
          render()
        }
      } else if (e.key === 'ArrowLeft') {
        if (this.currentStep > 0) {
          this.currentStep--
          render()
        }
      }
    }

    const onRootClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null
      if (target === root || target?.closest('#onb-close') || target?.closest('#onb-skip')) {
        e.preventDefault()
        e.stopPropagation()
        close()
      }
    }

    render()
    root.dataset.open = 'true'
    root.style.display = 'flex'

    root.addEventListener('click', onRootClick)
    document.addEventListener('keydown', onKey)
  }
}
