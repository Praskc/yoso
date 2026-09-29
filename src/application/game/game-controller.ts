import { BACKSPACE, NO_DETECTION, SPACE } from '../../domain/alphabet'
import { GameSession } from '../../domain/game/game-session'
import type { AppEvents, GameEvent, GameFeedback } from '../events/app-events'
import type { ModeHandler } from '../modes/mode-controller'
import type { EventBus } from '../ports/event-bus'
import type { WordSource } from '../ports/word-source'

const HINT_DELAY_MS = 6000
const CORRECT_FEEDBACK_MS = 500
const WRONG_FEEDBACK_MS = 900
const NEXT_WORD_DELAY_MS = 1400
const LEVEL_UP_DELAY_MS = 1600
const SKIPPED_WORD_DELAY_MS = 300
const ABORTED_WORD_DELAY_MS = 1200
const FALLBACK_FEEDBACK_MS = 1500

export class GameController implements ModeHandler {
  private readonly session = new GameSession()
  private pool: string[] = []
  private active = false
  private hintTimer: number | null = null
  private readonly pendingTimers = new Set<number>()

  constructor(
    private readonly bus: EventBus<AppEvents>,
    private readonly wordSource: WordSource,
  ) {
    bus.on('prediction', payload => this.onPrediction(payload.letter, payload.effectiveConfidence))
    bus.on('letterConfirmed', payload => this.onLetterConfirmed(payload.letter))
  }

  onEnter(): void {
    void this.start()
  }

  onExit(): void {
    this.stop()
  }

  async start(): Promise<void> {
    this.active = true
    this.session.startRun()
    this.pool = []
    this.emitFeedback({ kind: 'loading' })
    this.emit({ type: 'score', score: 0 })
    await this.loadPool()
    this.startNextWord()
  }

  stop(): void {
    this.active = false
    this.clearHintTimer()
    for (const timer of this.pendingTimers) clearTimeout(timer)
    this.pendingTimers.clear()
    this.emit({ type: 'hint-hidden' })
  }

  skipWord(): void {
    if (!this.active || this.session.blocked) return
    this.session.abortWord()
    this.clearHintTimer()
    this.emit({ type: 'word-skipped' })
    this.emitFeedback({ kind: 'word-skipped' })
    this.schedule(() => this.startNextWord(), SKIPPED_WORD_DELAY_MS)
  }

  previousWord(): void {
    if (!this.active) return
    const previous = this.session.takePreviousWord()
    if (previous === null) return
    if (this.session.word && this.session.word !== previous) this.pool.push(this.session.word)
    this.clearHintTimer()
    this.session.setWord(previous)
    this.emit({ type: 'attempts', errors: 0 })
    this.emit({ type: 'word-started', word: previous, levelIndex: this.session.levelIndex })
    this.emitProgress()
  }

  nextWord(): void {
    if (!this.active) return
    this.clearHintTimer()
    this.startNextWord()
  }

  private startNextWord(): void {
    if (!this.active) return
    this.clearHintTimer()
    this.session.recordCurrentWord()
    if (this.pool.length === 0) {
      void this.loadPool().then(() => {
        if (this.pool.length > 0) this.startNextWord()
      })
      return
    }

    const word = this.pool.pop() ?? ''
    if (!word) return
    this.session.setWord(word)
    this.emit({ type: 'attempts', errors: 0 })
    this.emit({ type: 'word-started', word, levelIndex: this.session.levelIndex })
    this.emitProgress()
    this.emitFeedback({ kind: 'waiting' })
    this.scheduleHint()
  }

  private async loadPool(): Promise<void> {
    const definition = this.session.levelDefinition
    try {
      const pool = await this.wordSource.getWords(
        definition.index + 1,
        definition.minWordLength,
        definition.maxWordLength
      )
      this.pool = [...pool.words]
      this.emit({ type: 'source', source: pool.source })
      if (pool.source !== 'datamuse') {
        this.emitFeedback({ kind: 'fallback-bank' })
        this.schedule(() => this.emitFeedback({ kind: 'waiting' }), FALLBACK_FEEDBACK_MS)
      }
    } catch {
      this.pool = []
    }
  }

  private onPrediction(letter: string, confidence: number): void {
    if (!this.active || this.session.blocked) return
    if (letter === NO_DETECTION || letter === SPACE || letter === BACKSPACE) return
    if (letter === this.session.expectedLetter()) {
      this.emitFeedback({ kind: 'detected', letter, confidence })
    }
  }

  private onLetterConfirmed(letter: string): void {
    if (!this.active || this.session.blocked) return
    if (letter === SPACE || letter === BACKSPACE) return

    const outcome = this.session.applyLetter(letter)
    if (outcome.kind === 'matched') {
      this.emit({ type: 'letter-matched', position: outcome.position })
      if (outcome.wordCompleted) {
        this.completeWord()
      } else {
        this.emitFeedback({ kind: 'correct' })
        this.scheduleWaitingFeedback(CORRECT_FEEDBACK_MS)
      }
      return
    }

    if (outcome.kind === 'wrong') {
      this.emit({ type: 'attempts', errors: this.session.errors })
      if (outcome.wordExhausted) {
        this.session.abortWord()
        this.clearHintTimer()
        this.emit({ type: 'word-skipped' })
        this.emitFeedback({ kind: 'word-skipped' })
        this.schedule(() => this.startNextWord(), ABORTED_WORD_DELAY_MS)
      } else {
        this.emitFeedback({
          kind: 'needs-letter',
          signed: letter,
          expected: this.session.expectedLetter(),
          attemptsLeft: outcome.attemptsLeft,
        })
        this.scheduleWaitingFeedback(WRONG_FEEDBACK_MS)
      }
    }
  }

  private completeWord(): void {
    this.clearHintTimer()
    this.emit({
      type: 'word-completed',
      word: this.session.word,
      streak: this.session.streak,
      score: this.session.score,
    })

    if (this.session.promoteLevel()) {
      this.emit({ type: 'level-changed', levelIndex: this.session.levelIndex })
      this.emitFeedback({ kind: 'level-up', levelIndex: this.session.levelIndex })
      void this.loadPool().then(() => {
        this.schedule(() => this.startNextWord(), LEVEL_UP_DELAY_MS)
      })
    } else {
      this.emitFeedback({ kind: 'word-complete' })
      this.emitProgress()
      this.schedule(() => this.startNextWord(), NEXT_WORD_DELAY_MS)
    }
  }

  private scheduleWaitingFeedback(delayMs: number): void {
    this.schedule(() => {
      if (this.active && !this.session.blocked) this.emitFeedback({ kind: 'waiting' })
    }, delayMs)
  }

  private scheduleHint(): void {
    this.clearHintTimer()
    this.hintTimer = setTimeout(() => {
      this.hintTimer = null
      if (this.active && !this.session.blocked) this.emitFeedback({ kind: 'show-guide' })
    }, HINT_DELAY_MS)
  }

  private clearHintTimer(): void {
    if (this.hintTimer === null) return
    clearTimeout(this.hintTimer)
    this.hintTimer = null
  }

  private schedule(action: () => void, delayMs: number): void {
    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer)
      action()
    }, delayMs)
    this.pendingTimers.add(timer)
  }

  private emitProgress(): void {
    const { completed, required } = this.session.progress
    this.emit({ type: 'progress', completed, required })
  }

  private emitFeedback(feedback: GameFeedback): void {
    this.emit({ type: 'feedback', feedback })
  }

  private emit(event: GameEvent): void {
    this.bus.emit('gameEvent', event)
  }
}