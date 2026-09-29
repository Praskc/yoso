import { describe, expect, it } from 'vitest'
import { DEFAULT_RECOGNITION_CONFIG } from './config'
import { createCooldownPolicy } from './cooldown-policy'

describe('cooldown policy', () => {
  it('blocks confirmations until the base cooldown elapses from zero', () => {
    const policy = createCooldownPolicy(DEFAULT_RECOGNITION_CONFIG)

    expect(policy.canConfirm('A', 500)).toBe(false)
    expect(policy.canConfirm('A', 800)).toBe(true)
  })

  it('applies a longer cooldown when the same letter repeats', () => {
    const policy = createCooldownPolicy(DEFAULT_RECOGNITION_CONFIG)
    policy.markConfirmed('A', 1000)

    expect(policy.canConfirm('A', 2000)).toBe(false)
    expect(policy.canConfirm('A', 2799)).toBe(false)
    expect(policy.canConfirm('A', 2800)).toBe(true)
    expect(policy.canConfirm('B', 1801)).toBe(true)
  })

  it('applies the short cooldown to commands', () => {
    const policy = createCooldownPolicy(DEFAULT_RECOGNITION_CONFIG)
    policy.markConfirmed('A', 1000)

    expect(policy.canConfirm(' ', 1300)).toBe(false)
    expect(policy.canConfirm(' ', 1400)).toBe(true)
    expect(policy.canConfirm('⌫', 1399)).toBe(false)
    expect(policy.canConfirm('⌫', 1400)).toBe(true)
  })

  it('keeps the command cooldown for a repeated command', () => {
    const policy = createCooldownPolicy(DEFAULT_RECOGNITION_CONFIG)
    policy.markConfirmed(' ', 1000)

    expect(policy.canConfirm(' ', 1300)).toBe(false)
    expect(policy.canConfirm(' ', 1400)).toBe(true)
  })

  it('restores the initial state on reset', () => {
    const policy = createCooldownPolicy(DEFAULT_RECOGNITION_CONFIG)
    policy.markConfirmed('A', 5000)
    policy.reset()

    expect(policy.canConfirm('A', 799)).toBe(false)
    expect(policy.canConfirm('A', 800)).toBe(true)
  })
})