import type { EventBus } from '../application/ports/event-bus'

export class TypedEventBus<Events extends Record<string, unknown>> implements EventBus<Events> {
  private readonly listeners = new Map<keyof Events, Set<(payload: never) => void>>()

  emit<K extends keyof Events & string>(type: K, payload: Events[K]): void {
    const handlers = this.listeners.get(type)
    if (!handlers) return
    for (const handler of handlers) handler(payload as never)
  }

  on<K extends keyof Events & string>(type: K, handler: (payload: Events[K]) => void): () => void {
    let handlers = this.listeners.get(type)
    if (!handlers) {
      handlers = new Set()
      this.listeners.set(type, handlers)
    }
    const typedHandler = handler as (payload: never) => void
    handlers.add(typedHandler)
    return () => {
      handlers.delete(typedHandler)
    }
  }
}