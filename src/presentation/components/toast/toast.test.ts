import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toast } from './toast'

describe('Toast', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="toast-root"></div>'
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('auto hides the notification after the given duration', () => {
    const toast = new Toast()

    toast.show('luz', 'Poca luz detectada', 'warn', 1000)
    vi.advanceTimersByTime(1000)

    expect(document.querySelector('.toast')?.classList.contains('is-leaving')).toBe(true)
  })

  it('keeps the notification until it is hidden explicitly', () => {
    const toast = new Toast()

    toast.show('luz', 'Poca luz detectada', 'warn', 0)
    vi.advanceTimersByTime(60_000)
    expect(document.querySelector('.toast')?.classList.contains('is-leaving')).toBe(false)

    toast.hide('luz')

    expect(document.querySelector('.toast')?.classList.contains('is-leaving')).toBe(true)
  })

  it('replaces a notification with the same id', () => {
    const toast = new Toast()

    toast.show('luz', 'primero', 'info', 0)
    toast.show('luz', 'segundo', 'info', 0)

    expect(document.querySelectorAll('.toast')).toHaveLength(2)
    expect(document.querySelector('.toast:last-child .toast__msg')?.textContent).toBe('segundo')
  })
})
