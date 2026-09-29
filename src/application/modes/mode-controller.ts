export type AppMode = 'translator' | 'training' | 'learning'

export interface ModeHandler {
  onEnter(): void
  onExit(): void
}

export class ModeController {
  private readonly handlers = new Map<AppMode, ModeHandler[]>()
  private current: AppMode = 'translator'

  get mode(): AppMode {
    return this.current
  }

  register(mode: AppMode, handler: ModeHandler): void {
    const handlers = this.handlers.get(mode) ?? []
    handlers.push(handler)
    this.handlers.set(mode, handlers)
  }

  setMode(mode: AppMode): void {
    if (mode === this.current) return
    for (const handler of this.handlers.get(this.current) ?? []) handler.onExit()
    this.current = mode
    for (const handler of this.handlers.get(mode) ?? []) handler.onEnter()
  }
}