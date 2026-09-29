import { isCommand } from '../alphabet'
import type { RecognitionConfig } from './config'

export interface CooldownPolicy {
  canConfirm(letter: string, nowMs: number): boolean
  markConfirmed(letter: string, nowMs: number): void
  reset(): void
}

export function createCooldownPolicy(config: RecognitionConfig): CooldownPolicy {
  let lastLetter = ''
  let lastTimeMs = 0

  return {
    canConfirm(letter, nowMs) {
      const cooldown = isCommand(letter)
        ? config.commandCooldownMs
        : letter === lastLetter
          ? config.sameLetterCooldownMs
          : config.cooldownMs
      return nowMs - lastTimeMs >= cooldown
    },
    markConfirmed(letter, nowMs) {
      lastLetter = letter
      lastTimeMs = nowMs
    },
    reset() {
      lastLetter = ''
      lastTimeMs = 0
    },
  }
}