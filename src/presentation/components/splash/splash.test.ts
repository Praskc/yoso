import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Splash } from './splash'

const MARKUP = `
  <div id="splash-screen">
    <span id="splash-spin"></span>
    <span id="splash-step">Iniciando runtime…</span>
    <span id="splash-tip-cat">lsc</span>
    <p id="splash-tip-body">…</p>
    <span id="splash-tip-n">1 / 12</span>
    <div id="splash-drain"></div>
  </div>
  <div id="empty-state" hidden>
    <div id="es-icon-box"></div>
    <div id="es-badge">CÁMARA REQUERIDA</div>
    <h3 id="es-title"></h3>
    <p id="es-desc"></p>
    <div id="es-guide"></div>
    <button id="es-retry"></button>
  </div>
`

const text = (id: string): string => document.getElementById(id)?.textContent ?? ''

describe('Splash', () => {
  beforeEach(() => {
    document.body.innerHTML = MARKUP
    vi.useFakeTimers()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('rotates the LSC tips while loading', () => {
    const splash = new Splash()

    expect(text('splash-tip-cat')).toBe('cultura sorda')
    expect(text('splash-tip-n')).toBe('1 / 12')

    vi.advanceTimersByTime(4000)

    expect(text('splash-tip-n')).toBe('2 / 12')
    splash.hide()
  })

  it('reports the model loading status', () => {
    const splash = new Splash()

    splash.showLoadingModel()

    expect(text('splash-step')).toBe('Cargando modelo…')
    expect(document.getElementById('splash-step')?.dataset['error']).toBe('false')
    splash.hide()
  })

  it('flags the model load error', () => {
    const splash = new Splash()

    splash.showModelLoadError()

    expect(text('splash-step')).toBe('Error al cargar el modelo')
    expect(document.getElementById('splash-step')?.dataset['error']).toBe('true')
    splash.hide()
  })

  it('hides the splash and stops the tip rotation', () => {
    const splash = new Splash()

    splash.hide()

    expect(document.getElementById('splash-screen')?.classList.contains('is-hidden')).toBe(true)
    vi.advanceTimersByTime(350)
    expect((document.getElementById('splash-screen') as HTMLElement).style.display).toBe('none')

    const tipBefore = text('splash-tip-cat')
    vi.advanceTimersByTime(8000)
    expect(text('splash-tip-cat')).toBe(tipBefore)
  })

  it('shows the camera error state with the retry callback', () => {
    const splash = new Splash()
    const onRetry = vi.fn()

    splash.showCameraError('dismissed', onRetry)

    const emptyState = document.getElementById('empty-state') as HTMLElement
    expect(emptyState.hidden).toBe(false)
    expect(emptyState.dataset['status']).toBe('dismissed')
    expect(text('es-badge')).toBe('SOLICITUD CERRADA')
    expect(text('es-title')).toBe('Cerraste la ventana de permiso')

    document.getElementById('es-retry')!.click()

    expect(onRetry).toHaveBeenCalledTimes(1)
    splash.hideCameraError()
  })

  it('hides the camera error state', () => {
    const splash = new Splash()
    splash.showCameraError('denied', vi.fn())

    splash.hideCameraError()

    expect((document.getElementById('empty-state') as HTMLElement).hidden).toBe(true)
  })
})
