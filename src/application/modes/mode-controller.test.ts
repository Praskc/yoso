import { describe, expect, it, vi } from 'vitest'
import { ModeController } from './mode-controller'

describe('ModeController', () => {
  it('starts in translator mode', () => {
    expect(new ModeController().mode).toBe('translator')
  })

  it('exits the previous mode before entering the new one', () => {
    const controller = new ModeController()
    const order: string[] = []
    const training = { onEnter: () => order.push('enter-training'), onExit: () => order.push('exit-training') }
    const learning = { onEnter: () => order.push('enter-learning'), onExit: () => order.push('exit-learning') }

    controller.register('training', training)
    controller.register('learning', learning)
    controller.setMode('training')
    controller.setMode('learning')

    expect(order).toEqual(['enter-training', 'exit-training', 'enter-learning'])
    expect(controller.mode).toBe('learning')
  })

  it('does nothing when the mode does not change', () => {
    const controller = new ModeController()
    const handler = { onEnter: vi.fn(), onExit: vi.fn() }
    controller.register('training', handler)

    controller.setMode('translator')

    expect(handler.onEnter).not.toHaveBeenCalled()
    expect(handler.onExit).not.toHaveBeenCalled()
  })

  it('supports several handlers for the same mode', () => {
    const controller = new ModeController()
    const first = { onEnter: vi.fn(), onExit: vi.fn() }
    const second = { onEnter: vi.fn(), onExit: vi.fn() }
    controller.register('training', first)
    controller.register('training', second)

    controller.setMode('training')

    expect(first.onEnter).toHaveBeenCalledTimes(1)
    expect(second.onEnter).toHaveBeenCalledTimes(1)
  })
})