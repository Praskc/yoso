import { BACKSPACE, SPACE } from '../alphabet'
import { LEVELS } from './levels'

export const MAX_ATTEMPTS = 3
const HISTORY_LIMIT = 40

export type LetterOutcome =
  | { kind: 'matched'; position: number; wordCompleted: boolean }
  | { kind: 'wrong'; attemptsLeft: number; wordExhausted: boolean }
  | { kind: 'ignored' }

export class GameSession {
  private levelIndexValue = 0
  private scoreValue = 0
  private wordsCompletedValue = 0
  private streakValue = 0
  private errorsValue = 0
  private blockedValue = false
  private wordValue = ''
  private positionValue = 0
  private historyWords: string[] = []

  get levelIndex(): number {
    return this.levelIndexValue
  }

  get score(): number {
    return this.scoreValue
  }

  get wordsCompleted(): number {
    return this.wordsCompletedValue
  }

  get streak(): number {
    return this.streakValue
  }

  get errors(): number {
    return this.errorsValue
  }

  get blocked(): boolean {
    return this.blockedValue
  }

  get word(): string {
    return this.wordValue
  }

  get position(): number {
    return this.positionValue
  }

  get progress(): { completed: number; required: number } {
    return {
      completed: this.wordsCompletedValue,
      required: LEVELS[this.levelIndexValue].wordsRequired,
    }
  }

  get levelDefinition() {
    return LEVELS[this.levelIndexValue]
  }

  startRun(): void {
    this.levelIndexValue = 0
    this.scoreValue = 0
    this.wordsCompletedValue = 0
    this.streakValue = 0
    this.errorsValue = 0
    this.blockedValue = false
    this.wordValue = ''
    this.positionValue = 0
    this.historyWords = []
  }

  expectedLetter(): string {
    if (!this.wordValue || this.positionValue >= this.wordValue.length) return ''
    return this.wordValue[this.positionValue]
  }

  recordCurrentWord(): void {
    if (!this.wordValue) return
    if (this.historyWords[this.historyWords.length - 1] === this.wordValue) return
    this.historyWords.push(this.wordValue)
    if (this.historyWords.length > HISTORY_LIMIT) this.historyWords.shift()
  }

  setWord(word: string): void {
    this.wordValue = word
    this.positionValue = 0
    this.errorsValue = 0
    this.blockedValue = false
  }

  takePreviousWord(): string | null {
    if (this.historyWords.length === 0) return null
    return this.historyWords.pop() ?? null
  }

  applyLetter(letter: string): LetterOutcome {
    if (this.blockedValue || !this.wordValue) return { kind: 'ignored' }
    if (letter === SPACE || letter === BACKSPACE) return { kind: 'ignored' }

    if (letter === this.expectedLetter()) {
      this.errorsValue = 0
      this.positionValue += 1
      const wordCompleted = this.positionValue >= this.wordValue.length
      if (wordCompleted) {
        this.blockedValue = true
        this.scoreValue += this.wordValue.length * 10
        this.wordsCompletedValue += 1
        this.streakValue += 1
      }
      return { kind: 'matched', position: this.positionValue, wordCompleted }
    }

    this.errorsValue += 1
    return {
      kind: 'wrong',
      attemptsLeft: MAX_ATTEMPTS - this.errorsValue,
      wordExhausted: this.errorsValue >= MAX_ATTEMPTS,
    }
  }

  abortWord(): void {
    this.errorsValue = 0
    this.blockedValue = true
    this.streakValue = 0
  }

  promoteLevel(): boolean {
    const definition = LEVELS[this.levelIndexValue]
    if (this.wordsCompletedValue < definition.wordsRequired) return false
    if (this.levelIndexValue >= LEVELS.length - 1) return false
    this.levelIndexValue += 1
    this.wordsCompletedValue = 0
    return true
  }
}