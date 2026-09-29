import { describe, expect, it } from 'vitest'
import { indexCentroidsByClass } from './centroids'
import type { CentroidMap } from './types'

describe('indexCentroidsByClass', () => {
  it('returns a null slot per class when the map is missing', () => {
    const indexed = indexCentroidsByClass(null)

    expect(indexed).toHaveLength(28)
    expect(indexed.every(centroid => centroid === null)).toBe(true)
  })

  it('maps lowercase keys to their class index', () => {
    const map: CentroidMap = {
      a: { coords: Float32Array.from([1, 2]), distRef: 0.5 },
      q: { coords: Float32Array.from([3, 4]), distRef: 0.7 },
    }
    const indexed = indexCentroidsByClass(map)

    expect(indexed[0]?.distRef).toBe(0.5)
    expect(indexed[16]?.distRef).toBe(0.7)
    expect(indexed[1]).toBeNull()
  })

  it('never assigns centroids to space or backspace', () => {
    const map: CentroidMap = {
      ' ': { coords: Float32Array.from([1]), distRef: 1 },
      '⌫': { coords: Float32Array.from([1]), distRef: 1 },
    }
    const indexed = indexCentroidsByClass(map)

    expect(indexed[26]).toBeNull()
    expect(indexed[27]).toBeNull()
  })
})