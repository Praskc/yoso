import { describe, expect, it } from 'vitest'
import { extractFeatures } from './extract-features'
import type { Point } from './types'

const centeredHand = (): Point[] =>
  Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))

describe('extractFeatures', () => {
  it('rejects frames where the wrist to middle knuckle distance is zero', () => {
    const features = new Float32Array(48)
    expect(extractFeatures(centeredHand(), false, features)).toBe(false)
  })

  it('normalizes coordinates against the wrist and the middle knuckle', () => {
    const points = centeredHand()
    points[9] = { x: 0.6, y: 0.5, z: 0 }
    points[4] = { x: 0.5, y: 0.6, z: 0 }
    const features = new Float32Array(48)

    expect(extractFeatures(points, false, features)).toBe(true)
    expect(features[0]).toBeCloseTo(0, 5)
    expect(features[1]).toBeCloseTo(0, 5)
    expect(features[18]).toBeCloseTo(1, 5)
    expect(features[19]).toBeCloseTo(0, 5)
    expect(features[42]).toBeCloseTo(0, 5)
    expect(features[43]).toBeCloseTo(1, 5)
    expect(features[44]).toBeCloseTo(0, 5)
    expect(features[47]).toBeCloseTo(0, 5)
  })

  it('stays invariant when the hand moves away from the camera', () => {
    const near = centeredHand()
    near[9] = { x: 0.6, y: 0.5, z: 0 }
    const far = centeredHand()
    far[9] = { x: 0.7, y: 0.5, z: 0 }

    const nearFeatures = new Float32Array(48)
    const farFeatures = new Float32Array(48)
    extractFeatures(near, false, nearFeatures)
    extractFeatures(far, false, farFeatures)

    for (let i = 0; i < 48; i++) {
      expect(farFeatures[i]).toBeCloseTo(nearFeatures[i], 5)
    }
  })

  it('mirrors the x axis for the left hand', () => {
    const points = centeredHand()
    points[9] = { x: 0.6, y: 0.5, z: 0 }
    const features = new Float32Array(48)

    extractFeatures(points, true, features)
    expect(features[18]).toBeCloseTo(-1, 5)
    expect(features[42]).toBeCloseTo(Math.PI, 5)
  })
})