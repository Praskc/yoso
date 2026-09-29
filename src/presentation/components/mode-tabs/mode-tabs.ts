import type { AppEvents } from '../../../application/events/app-events'
import type { AppMode } from '../../../application/modes/mode-controller'
import type { EventBus } from '../../../application/ports/event-bus'

const TAB_BY_MODE: Record<AppMode, string> = {
  translator: 'traductor',
  training: 'entrenamiento',
  learning: 'aprendizaje',
}

const MODE_BY_TAB: Record<string, AppMode> = {
  traductor: 'translator',
  entrenamiento: 'training',
  aprendizaje: 'learning',
}

export class ModeTabs {
  private readonly buttons: HTMLButtonElement[] = []
  private readonly panels: HTMLElement[] = []

  constructor(
    bus: EventBus<AppEvents>,
    private readonly onSelectMode: (mode: AppMode) => void,
  ) {
    this.buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.mode-tab'))
    this.panels = Array.from(document.querySelectorAll<HTMLElement>('.tab-panel'))

    for (const button of this.buttons) {
      button.addEventListener('click', () => {
        const mode = MODE_BY_TAB[button.dataset['tab'] ?? '']
        if (mode) this.onSelectMode(mode)
      })
    }

    bus.on('modeChanged', payload => this.apply(payload.mode))
  }

  selectTab(tab: string): void {
    const mode = MODE_BY_TAB[tab]
    if (mode) this.onSelectMode(mode)
  }

  private apply(mode: AppMode): void {
    const tab = TAB_BY_MODE[mode]
    document.getElementById('app')?.setAttribute('data-mode', tab)
    document.body.dataset['mode'] = tab

    for (const button of this.buttons) {
      const isActive = button.dataset['tab'] === tab
      button.classList.toggle('active', isActive)
      button.classList.toggle('is-active', isActive)
      button.setAttribute('aria-selected', String(isActive))
    }

    for (const panel of this.panels) {
      panel.classList.toggle('active', panel.id === `tab-${tab}`)
    }
  }
}
