import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TypedEventBus } from '../../shared/typed-event-bus'
import type { AppEvents, GameEvent } from '../events/app-events'
import type { WordSource } from '../ports/word-source'
import { GameController } from './game-controller'

const eventsOfType = <T extends GameEvent['type']>(
  events: GameEvent[],
  type: T
): Extract<GameEvent, { type: T }>[] =>
  events.filter((event): event is Extract<GameEvent, { type: T }> => event.type === type)

const createHarness = () => {
  const bus = new TypedEventBus<AppEvents>()
  const events: GameEvent[] = []
  bus.on('gameEvent', event => events.push(event))

  const wordSource: WordSource = {
    id: 'datamuse',
    getWords: async () => ({ words: ['SOL', 'MAR', 'PAZ'], source: 'datamuse' }),
  }
  const controller = new GameController(bus, wordSource)

  const feedbacks = () =>
    eventsOfType(events, 'feedback').map(event => event.feedback)

  return { bus, events, controller, feedbacks }
}

describe('GameController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads the pool and starts the first word', async () => {
    const harness = createHarness()
    await harness.controller.start()

    const started = eventsOfType(harness.events, 'word-started')
    expect(started).toHaveLength(1)
    expect(started[0].word).toBe('PAZ')
    expect(started[0].levelIndex).toBe(0)
    expect(eventsOfType(harness.events, 'source')).toEqual([{ type: 'source', source: 'datamuse' }])
    expect(harness.feedbacks().at(-1)).toEqual({ kind: 'waiting' })
  })

  it('emits detected feedback while the expected letter is being signed', async () => {
    const harness = createHarness()
    await harness.controller.start()

    harness.bus.emit('prediction', {
      letter: 'P',
      effectiveConfidence: 0.9,
      inferenceLatencyMs: 1,
      isLeftHand: false,
    })

    expect(harness.feedbacks().at(-1)).toEqual({ kind: 'detected', letter: 'P', confidence: 0.9 })
  })

  it('completes a word after matching every letter', async () => {
    const harness = createHarness()
    await harness.controller.start()

    harness.bus.emit('letterConfirmed', { letter: 'P' })
    harness.bus.emit('letterConfirmed', { letter: 'A' })
    harness.bus.emit('letterConfirmed', { letter: 'Z' })

    expect(eventsOfType(harness.events, 'letter-matched').map(event => event.position))
      .toEqual([1, 2, 3])
    expect(eventsOfType(harness.events, 'word-completed')).toEqual([
      { type: 'word-completed', word: 'PAZ', streak: 1, score: 30 },
    ])
    expect(eventsOfType(harness.events, 'progress')).toContainEqual(
      { type: 'progress', completed: 1, required: 3 }
    )

    vi.advanceTimersByTime(1400)
    expect(eventsOfType(harness.events, 'word-started')).toHaveLength(2)
  })

  it('reports attempts and skips the word after three mistakes', async () => {
    const harness = createHarness()
    await harness.controller.start()

    harness.bus.emit('letterConfirmed', { letter: 'X' })
    harness.bus.emit('letterConfirmed', { letter: 'X' })
    harness.bus.emit('letterConfirmed', { letter: 'X' })

    expect(eventsOfType(harness.events, 'attempts').map(event => event.errors))
      .toEqual([0, 1, 2, 3])
    expect(harness.feedbacks()).toContainEqual(
      { kind: 'needs-letter', signed: 'X', expected: 'P', attemptsLeft: 2 }
    )
    expect(eventsOfType(harness.events, 'word-skipped')).toHaveLength(1)

    vi.advanceTimersByTime(1200)
    expect(eventsOfType(harness.events, 'word-started')).toHaveLength(2)
  })

  it('promotes a level after completing the required words', async () => {
    const harness = createHarness()
    await harness.controller.start()

    for (const word of ['PAZ', 'MAR', 'SOL']) {
      for (const letter of word) harness.bus.emit('letterConfirmed', { letter })
      await Promise.resolve()
      vi.advanceTimersByTime(1400)
    }

    expect(eventsOfType(harness.events, 'level-changed')).toEqual([
      { type: 'level-changed', levelIndex: 1 },
    ])
    expect(harness.feedbacks()).toContainEqual({ kind: 'level-up', levelIndex: 1 })

    await Promise.resolve()
    vi.advanceTimersByTime(1600)
    const started = eventsOfType(harness.events, 'word-started')
    expect(started.at(-1)?.levelIndex).toBe(1)
  })

  it('stops reacting to letters and timers after stop', async () => {
    const harness = createHarness()
    await harness.controller.start()
    harness.bus.emit('letterConfirmed', { letter: 'P' })
    harness.bus.emit('letterConfirmed', { letter: 'A' })
    harness.bus.emit('letterConfirmed', { letter: 'Z' })

    harness.controller.stop()
    vi.advanceTimersByTime(10_000)

    expect(eventsOfType(harness.events, 'word-started')).toHaveLength(1)
    expect(eventsOfType(harness.events, 'hint-hidden')).toHaveLength(1)

    const attemptsBefore = eventsOfType(harness.events, 'attempts').length
    harness.bus.emit('letterConfirmed', { letter: 'X' })
    expect(eventsOfType(harness.events, 'attempts')).toHaveLength(attemptsBefore)
  })

  it('navigates back to the previous word', async () => {
    const harness = createHarness()
    await harness.controller.start()
    harness.controller.nextWord()

    expect(eventsOfType(harness.events, 'word-started').at(-1)?.word).toBe('MAR')

    harness.controller.previousWord()
    expect(eventsOfType(harness.events, 'word-started').at(-1)?.word).toBe('PAZ')
  })

  it('does nothing when navigating without history', async () => {
    const harness = createHarness()
    await harness.controller.start()
    harness.controller.previousWord()

    expect(eventsOfType(harness.events, 'word-started')).toHaveLength(1)
  })
})