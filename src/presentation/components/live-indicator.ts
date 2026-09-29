import type { AppEvents } from '../../application/events/app-events'
import type { EventBus } from '../../application/ports/event-bus'

export class LiveIndicator {
  private liveEl: HTMLElement | null = null
  private previous = ''

  constructor(bus: EventBus<AppEvents>) {
    this.liveEl = document.querySelector('.feed__live')
    bus.on('cameraStatus', status => this.setLive(status.ok))
  }

  setLive(active: boolean): void {
    if (!this.liveEl) return
    const state = active ? 'on' : 'off'
    if (state === this.previous) return
    this.previous = state
    this.liveEl.dataset.state = state
  }
}
