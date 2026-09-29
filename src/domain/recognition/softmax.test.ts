import { describe, expect, it } from 'vitest'
import { softmax } from './softmax'

describe('softmax', () => {
  it('returns the peak index and normalized probabilities', () => {
    const out = new Float32Array(3)
    const peak = softmax(Float32Array.from([1, 2, 3]), out)

    const e1 = Math.exp(-2)
    const e2 = Math.exp(-1)
    const sum = e1 + e2 + 1

    expect(peak).toBe(2)
    expect(out[0]).toBeCloseTo(e1 / sum, 5)
    expect(out[1]).toBeCloseTo(e2 / sum, 5)
    expect(out[2]).toBeCloseTo(1 / sum, 5)
    expect(out[0] + out[1] + out[2]).toBeCloseTo(1, 5)
  })

  it('stays stable with very large logits', () => {
    const out = new Float32Array(2)
    const peak = softmax(Float32Array.from([1000, 1001]), out)

    expect(peak).toBe(1)
    expect(out[0]).toBeCloseTo(0.268941, 5)
    expect(out[1]).toBeCloseTo(0.731059, 5)
  })

  it('picks the first index on ties', () => {
    const out = new Float32Array(2)
    expect(softmax(Float32Array.from([2, 2]), out)).toBe(0)
  })
})