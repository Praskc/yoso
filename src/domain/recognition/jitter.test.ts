import { describe, expect, it } from 'vitest'
import { createJitterMeter } from './jitter'

describe('jitter meter', () => {
  it('measures the manhattan delta against the previous wrist position', () => {
    const meter = createJitterMeter()

    expect(meter.measure({ x: 0.3, y: 0.4, z: 0 })).toBeCloseTo(0.7, 6)
    expect(meter.measure({ x: 0.31, y: 0.4, z: 0 })).toBeCloseTo(0.01, 6)
    expect(meter.measure({ x: 0.31, y: 0.4, z: 0 })).toBeCloseTo(0, 6)
  })
})