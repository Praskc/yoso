export type ToastKind = 'info' | 'warn' | 'error' | 'success'

const LABELS: Record<ToastKind, string> = {
  info:    'SISTEMA',
  warn:    'AVISO',
  error:   'ERROR',
  success: 'ÉXITO',
}

const ICONS: Record<ToastKind, string> = {
  info: `<svg class="toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  warn: `<svg class="toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  error: `<svg class="toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  success: `<svg class="toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
}

export class Toast {
  private root: HTMLElement | null
  private active = new Map<string, { el: HTMLElement; timer: number }>()

  constructor() {
    this.root = document.getElementById('toast-root')
  }

  show(id: string, message: string, kind: ToastKind = 'info', durationMs = 5000): void {
    if (!this.root) return
    this.hide(id)

    const el = document.createElement('div')
    el.className = 'toast'
    el.dataset.type = kind
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status')
    el.innerHTML = `
      <div class="toast__content">
        <div class="toast__header">
          <span class="toast__icon-box">${ICONS[kind]}</span>
          <span class="toast__eyebrow">${LABELS[kind]}</span>
          <button type="button" class="toast__close" aria-label="Cerrar notificación">&times;</button>
        </div>
        <p class="toast__msg"></p>
      </div>
    `
    el.querySelector('.toast__msg')!.textContent = message
    el.querySelector<HTMLButtonElement>('.toast__close')?.addEventListener('click', () => {
      this.hide(id)
    })

    this.root.appendChild(el)
    const timer = durationMs > 0 ? window.setTimeout(() => this.hide(id), durationMs) : 0
    this.active.set(id, { el, timer })
  }

  hide(id: string): void {
    const entry = this.active.get(id)
    if (!entry) return
    clearTimeout(entry.timer)
    entry.el.classList.add('is-leaving')
    setTimeout(() => entry.el.remove(), 220)
    this.active.delete(id)
  }
}
