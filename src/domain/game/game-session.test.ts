import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import { GameSession } from './game-session'

const sessionWithWord = (word: string): GameSession => {
  const session = new GameSession()
  session.startRun()
  session.setWord(word)
  return session
}

describe('GameSession', () => {
  it('starts at level zero with a clean state', () => {
    const session = new GameSession()
    session.setWord('SOL')
    session.startRun()

    expect(session.levelIndex).toBe(0)
    expect(session.score).toBe(0)
    expect(session.streak).toBe(0)
    expect(session.word).toBe('')
    expect(session.progress).toEqual({ completed: 0, required: 3 })
  })

  it('advances the position on a matching letter', () => {
    const session = sessionWithWord('SOL')

    expect(session.applyLetter('S')).toEqual({ kind: 'matched', position: 1, wordCompleted: false })
    expect(session.expectedLetter()).toBe('O')
    expect(session.applyLetter('O')).toEqual({ kind: 'matched', position: 2, wordCompleted: false })
  })

  it('scores, streaks and blocks when the word is completed', () => {
    const session = sessionWithWord('SOL')
    session.applyLetter('S')
    session.applyLetter('O')

    expect(session.applyLetter('L')).toEqual({ kind: 'matched', position: 3, wordCompleted: true })
    expect(session.score).toBe(30)
    expect(session.streak).toBe(1)
    expect(session.wordsCompleted).toBe(1)
    expect(session.blocked).toBe(true)
  })

  it('counts attempts and exhausts the word after three mistakes', () => {
    const session = sessionWithWord('SOL')

    expect(session.applyLetter('A')).toEqual({ kind: 'wrong', attemptsLeft: 2, wordExhausted: false })
    expect(session.applyLetter('A')).toEqual({ kind: 'wrong', attemptsLeft: 1, wordExhausted: false })
    expect(session.applyLetter('A')).toEqual({ kind: 'wrong', attemptsLeft: 0, wordExhausted: true })
    expect(session.errors).toBe(3)
  })

  it('resets errors after a correct letter', () => {
    const session = sessionWithWord('SOL')
    session.applyLetter('A')
    session.applyLetter('S')

    expect(session.errors).toBe(0)
  })

  it('ignores commands and letters while blocked', () => {
    const session = sessionWithWord('SOL')
    session.applyLetter('S')
    session.applyLetter('O')
    session.applyLetter('L')

    expect(session.applyLetter('A')).toEqual({ kind: 'ignored' })
    expect(session.applyLetter(' ')).toEqual({ kind: 'ignored' })
    expect(session.applyLetter('⌫')).toEqual({ kind: 'ignored' })
  })

  it('aborting a word clears errors and the streak', () => {
    const session = sessionWithWord('SOL')
    session.applyLetter('A')
    session.abortWord()

    expect(session.blocked).toBe(true)
    expect(session.errors).toBe(0)
    expect(session.streak).toBe(0)
  })

  it('promotes a level only when enough words are completed', () => {
    const session = sessionWithWord('SOL')
    for (let i = 0; i < LEVELS[0].wordsRequired - 1; i++) {
      session.applyLetter('S')
      session.applyLetter('O')
      session.applyLetter('L')
      session.promoteLevel()
      session.setWord('SOL')
    }

    expect(session.promoteLevel()).toBe(false)

    session.applyLetter('S')
    session.applyLetter('O')
    session.applyLetter('L')
    expect(session.promoteLevel()).toBe(true)
    expect(session.levelIndex).toBe(1)
    expect(session.wordsCompleted).toBe(0)
    expect(session.progress).toEqual({ completed: 0, required: 5 })
  })

  it('does not promote past the last level', () => {
    const session = sessionWithWord('SOL')
    for (let level = 0; level < LEVELS.length; level++) {
      const required = LEVELS[level].wordsRequired
      for (let word = 0; word < required; word++) {
        session.applyLetter('S')
        session.applyLetter('O')
        session.applyLetter('L')
        const isLastWord = word === required - 1
        const isLastLevel = level === LEVELS.length - 1
        expect(session.promoteLevel()).toBe(isLastWord && !isLastLevel)
        session.setWord('SOL')
      }
    }
    expect(session.levelIndex).toBe(4)
  })

  it('navigates history with takePreviousWord', () => {
    const session = sessionWithWord('SOL')
    session.recordCurrentWord()
    session.setWord('MAR')
    session.recordCurrentWord()
    session.setWord('PAZ')

    expect(session.takePreviousWord()).toBe('MAR')
    expect(session.takePreviousWord()).toBe('SOL')
    expect(session.takePreviousWord()).toBeNull()
  })

  it('keeps consecutive duplicates out of history', () => {
    const session = sessionWithWord('SOL')
    session.recordCurrentWord()
    session.recordCurrentWord()

    expect(session.takePreviousWord()).toBe('SOL')
    expect(session.takePreviousWord()).toBeNull()
  })
})