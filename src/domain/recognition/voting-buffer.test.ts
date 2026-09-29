import { describe, expect, it } from 'vitest'
import { MODEL_CLASSES } from '../alphabet'
import { DEFAULT_RECOGNITION_CONFIG } from './config'
import { DISCARD_VOTE, createVotingBuffer } from './voting-buffer'

const indexA = MODEL_CLASSES.indexOf('A')
const indexB = MODEL_CLASSES.indexOf('B')

describe('voting buffer', () => {
  it('starts empty', () => {
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    const tally = buffer.tally()

    expect(tally.candidateIndex).toBe(DISCARD_VOTE)
    expect(tally.candidateWeight).toBe(0)
    expect(tally.progress).toBe(0)
  })

  it('reports no progress until the buffer has filled once', () => {
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    for (let i = 0; i < 7; i++) buffer.push(indexA, 0.82)
    const tally = buffer.tally()

    expect(tally.candidateIndex).toBe(indexA)
    expect(tally.candidateWeight).toBeCloseTo(5.74, 4)
    expect(tally.progress).toBe(0)
  })

  it('accumulates weighted votes per letter', () => {
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    buffer.push(indexA, 0.5)
    buffer.push(indexB, 0.6)
    buffer.push(indexA, 0.5)
    for (let i = 0; i < 6; i++) buffer.push(DISCARD_VOTE, 0)
    const tally = buffer.tally()

    expect(tally.candidateIndex).toBe(indexA)
    expect(tally.candidateWeight).toBeCloseTo(1, 4)
    expect(tally.progress).toBeCloseTo(1 / 5.74, 4)
  })

  it('ignores discarded votes', () => {
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    for (let i = 0; i < 9; i++) buffer.push(DISCARD_VOTE, 0)
    const tally = buffer.tally()

    expect(tally.candidateIndex).toBe(DISCARD_VOTE)
    expect(tally.candidateWeight).toBe(0)
    expect(tally.progress).toBe(0)
  })

  it('caps progress at one', () => {
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    for (let i = 0; i < 9; i++) buffer.push(indexA, 0.9)
    expect(buffer.tally().progress).toBe(1)
  })

  it('projects votes in chronological order before wrapping', () => {
    const out = new Array<string>(9).fill('')
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    buffer.push(DISCARD_VOTE, 0)
    buffer.push(indexA, 0.9)
    buffer.push(DISCARD_VOTE, 0)
    buffer.projectVotesInto(out)

    expect(out).toEqual(['-', 'A', '-', '', '', '', '', '', ''])
  })

  it('projects from the oldest slot once the buffer wraps', () => {
    const out = new Array<string>(9).fill('')
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    buffer.push(indexA, 0.9)
    for (let i = 0; i < 8; i++) buffer.push(indexB, 0.9)
    buffer.push(DISCARD_VOTE, 0)
    buffer.projectVotesInto(out)

    expect(out.slice(0, 8)).toEqual(Array.from({ length: 8 }, () => 'B'))
    expect(out[8]).toBe('-')
  })

  it('clears all votes on reset', () => {
    const buffer = createVotingBuffer(DEFAULT_RECOGNITION_CONFIG)
    for (let i = 0; i < 9; i++) buffer.push(indexA, 0.9)
    buffer.reset()
    const tally = buffer.tally()

    expect(tally.candidateIndex).toBe(DISCARD_VOTE)
    expect(tally.progress).toBe(0)
  })
})