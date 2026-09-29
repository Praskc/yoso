import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { TypedEventBus } from '../../../shared/typed-event-bus'
import type { AppEvents } from '../../../application/events/app-events'
import type { AppMode } from '../../../application/modes/mode-controller'
import { ModeTabs } from './mode-tabs'

const MARKUP = `
  <div id="app" data-mode="traductor">
    <button class="mode-tab is-active active" data-tab="traductor" aria-selected="true"></button>
    <button class="mode-tab" data-tab="entrenamiento" aria-selected="false"></button>
    <button class="mode-tab" data-tab="aprendizaje" aria-selected="false"></button>
    <aside id="tab-traductor" class="tab-panel active"></aside>
    <aside id="tab-entrenamiento" class="tab-panel"></aside>
    <aside id="tab-aprendizaje" class="tab-panel"></aside>
  </div>
`

const buttonByTab = (tab: string): HTMLButtonElement =>
  document.querySelector<HTMLButtonElement>(`.mode-tab[data-tab="${tab}"]`)!

describe('ModeTabs', () => {
  let bus: TypedEventBus<AppEvents>
  let onSelectMode: Mock<(mode: AppMode) => void>

  beforeEach(() => {
    document.body.innerHTML = MARKUP
    bus = new TypedEventBus<AppEvents>()
    onSelectMode = vi.fn<(mode: AppMode) => void>()
    new ModeTabs(bus, onSelectMode)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reports the mode of the clicked tab', () => {
    buttonByTab('entrenamiento').click()

    expect(onSelectMode).toHaveBeenCalledWith('training')
  })

  it('reports the mode of a footer tab selection', () => {
    const tabs = new ModeTabs(bus, onSelectMode)

    tabs.selectTab('aprendizaje')

    expect(onSelectMode).toHaveBeenCalledWith('learning')
  })

  it('ignores unknown tabs', () => {
    const tabs = new ModeTabs(bus, onSelectMode)

    tabs.selectTab('inexistente')

    expect(onSelectMode).not.toHaveBeenCalled()
  })

  it('applies the mode to the shell, the tabs and the panels', () => {
    bus.emit('modeChanged', { mode: 'learning' })

    expect(document.getElementById('app')?.dataset['mode']).toBe('aprendizaje')
    expect(document.body.dataset['mode']).toBe('aprendizaje')
    expect(buttonByTab('aprendizaje').classList.contains('active')).toBe(true)
    expect(buttonByTab('aprendizaje').classList.contains('is-active')).toBe(true)
    expect(buttonByTab('aprendizaje').getAttribute('aria-selected')).toBe('true')
    expect(buttonByTab('traductor').classList.contains('active')).toBe(false)
    expect(buttonByTab('traductor').getAttribute('aria-selected')).toBe('false')
    expect(document.getElementById('tab-aprendizaje')?.classList.contains('active')).toBe(true)
    expect(document.getElementById('tab-traductor')?.classList.contains('active')).toBe(false)
  })
})
