export interface EventBus<Events extends Record<string, unknown>> {
  emit<K extends keyof Events & string>(type: K, payload: Events[K]): void
  on<K extends keyof Events & string>(type: K, handler: (payload: Events[K]) => void): () => void
}