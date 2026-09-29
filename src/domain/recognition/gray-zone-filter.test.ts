import { describe, expect, it } from 'vitest'
import { DEFAULT_RECOGNITION_CONFIG } from './config'
import { createGrayZoneFilter, type GrayZoneOutcome } from './gray-zone-filter'
import type { Centroid } from './types'

const outcome = (): GrayZoneOutcome => ({ effectiveConfidence: 0, distance: null, distRef: null })

describe('gray zone filter', () => {
  it('passes the network confidence through when the class has no centroid', () => {
    const filter = createGrayZoneFilter(DEFAULT_RECOGNITION_CONFIG)
    const out = outcome()

    filter.apply(null, Float32Array.from([1, 2]), 0.9, out)
    expect(out.effectiveConfidence).toBe(0.9)
    expect(out.distance).toBeNull()
    expect(out.distRef).toBeNull()
  })

  it('does not penalize at or above the confidence threshold', () => {
    const filter = createGrayZoneFilter(DEFAULT_RECOGNITION_CONFIG)
    const centroid: Centroid = { coords: Float32Array.from([0, 0]), distRef: 1 }
    const out = outcome()

    filter.apply(centroid, Float32Array.from([5, 5]), 0.9, out)
    expect(out.effectiveConfidence).toBe(0.9)
    expect(out.distance).toBeCloseTo(Math.sqrt(50), 5)
    expect(out.distRef).toBe(1)
  })

  it('keeps the confidence untouched when the distance fits inside distRef', () => {
    const filter = createGrayZoneFilter(DEFAULT_RECOGNITION_CONFIG)
    const centroid: Centroid = { coords: Float32Array.from([1, 2, 3]), distRef: 2 }
    const out = outcome()

    filter.apply(centroid, Float32Array.from([1, 2, 3]), 0.7, out)
    expect(out.distance).toBeCloseTo(0, 5)
    expect(out.effectiveConfidence).toBeCloseTo(0.7, 6)
  })

  it('scales the penalty linearly with the distance beyond distRef', () => {
    const filter = createGrayZoneFilter(DEFAULT_RECOGNITION_CONFIG)
    const centroid: Centroid = { coords: Float32Array.from([0, 0]), distRef: 2 }
    const out = outcome()

    filter.apply(centroid, Float32Array.from([3, Math.sqrt(3)]), 0.5, out)
    const deviation = (Math.sqrt(12) - 2) / 2
    expect(out.effectiveConfidence).toBeCloseTo(0.5 * (1 - deviation * 0.20), 5)
  })

  it('caps the penalty when the distance far exceeds distRef', () => {
    const filter = createGrayZoneFilter(DEFAULT_RECOGNITION_CONFIG)
    const centroid: Centroid = { coords: Float32Array.from([0, 0, 0]), distRef: 1 }
    const out = outcome()

    filter.apply(centroid, Float32Array.from([1, 2, 2]), 0.5, out)
    expect(out.effectiveConfidence).toBeCloseTo(0.5 * 0.8, 6)
  })
})