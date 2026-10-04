export type TipoToast = 'info' | 'warn' | 'error' | 'success' | 'light'

const ICONOS: Record<TipoToast, string> = {
  info: `<svg class="toast__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  warn: `<svg class="toast__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  error: `<svg class="toast__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  success: `<svg class="toast__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  light: `<svg class="toast__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
}

const TITULOS_DEFAULT: Record<TipoToast, string> = {
  info: 'Aviso del Sistema',
  warn: 'Atención recomendada',
  error: 'Error de detección',
  success: 'Operación completada',
  light: 'Iluminación reducida',
}

export class Toast {
  private root: HTMLElement | null
  private activos = new Map<string, { el: HTMLElement; timer: number }>()

  constructor() {
    this.root = document.getElementById('toast-root')
  }

  mostrar(id: string, msg: string, tipo: TipoToast = 'info', dur = 5000, tituloPersonalizado?: string, accion?: { texto: string; alClic: () => void }): void {
    if (!this.root) return
    this.ocultar(id)

    const tipoFinal: TipoToast = id === 'luz' ? 'light' : tipo
    const titulo = tituloPersonalizado || TITULOS_DEFAULT[tipoFinal]

    const el = document.createElement('div')
    el.className = `toast toast--${tipoFinal}`
    el.dataset.type = tipoFinal
    el.dataset.id = id
    el.setAttribute('role', tipoFinal === 'error' ? 'alert' : 'status')

    el.innerHTML = `
      <div class="toast__icon-badge">
        ${ICONOS[tipoFinal]}
      </div>
      <div class="toast__content">
        <div class="toast__header">
          <span class="toast__title">${titulo}</span>
          <button type="button" class="toast__close-btn" aria-label="Cerrar notificación">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <p class="toast__msg">${msg}</p>
      </div>
      ${accion ? `<button type="button" class="toast__action-btn">${accion.texto}</button>` : ''}
      ${dur > 0 ? `<div class="toast__progress-track"><div class="toast__progress-bar" style="animation-duration: ${dur}ms;"></div></div>` : ''}
    `

    el.querySelector<HTMLButtonElement>('.toast__close-btn')?.addEventListener('click', () => {
      this.ocultar(id)
    })

    if (accion) {
      el.querySelector<HTMLButtonElement>('.toast__action-btn')?.addEventListener('click', () => {
        this.ocultar(id)
        accion.alClic()
      })
    }

    this.root.appendChild(el)

    let timer = 0
    if (dur > 0) {
      timer = window.setTimeout(() => this.ocultar(id), dur)
    }
    this.activos.set(id, { el, timer })
  }

  ocultar(id: string): void {
    const entry = this.activos.get(id)
    if (!entry) return
    if (entry.timer) clearTimeout(entry.timer)
    entry.el.classList.add('is-leaving')
    setTimeout(() => entry.el.remove(), 220)
    this.activos.delete(id)
  }
}
