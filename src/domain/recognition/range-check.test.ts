import { describe, expect, it } from 'vitest'
import { DEFAULT_RECOGNITION_CONFIG } from './config'
import { isWithinDetectionRange } from './range-check'
import type { Point } from './types'

const range = DEFAULT_RECOGNITION_CONFIG.range

const handAt = (x: number, y: number): Point[] =>
  Array.from({ length: 21 }, () => ({ x, y, z: 0 }))

describe('isWithinDetectionRange', () => {
  it('accepts a hand centered in the frame', () => {
    expect(isWithinDetectionRange(handAt(0.5, 0.5), range)).toBe(true)
  })

  it('rejects a hand crossing the top limit', () => {
    expect(isWithinDetectionRange(handAt(0.5, 0.05), range)).toBe(false)
  })

  it('rejects a hand crossing the left limit', () => {
    expect(isWithinDetectionRange(handAt(0.10, 0.5), range)).toBe(false)
  })

  it('rejects a hand crossing the right limit', () => {
    expect(isWithinDetectionRange(handAt(0.90, 0.5), range)).toBe(false)
  })

  it('accepts a hand exactly on a boundary', () => {
    expect(isWithinDetectionRange(handAt(0.15, 0.10), range)).toBe(true)
  })

  it('rejects when only one landmark leaves the range', () => {
    const points = handAt(0.5, 0.5)
    points[16] = { x: 0.86, y: 0.5, z: 0 }
    expect(isWithinDetectionRange(points, range)).toBe(false)
  })
})