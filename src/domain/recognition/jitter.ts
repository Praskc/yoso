import type { Point } from './types'

export interface JitterMeter {
  measure(point: Point): number
}

export function createJitterMeter(): JitterMeter {
  let previousX = 0
  let previousY = 0

  return {
    measure(point) {
      const jitter = Math.abs(point.x - previousX) + Math.abs(point.y - previousY)
      previousX = point.x
      previousY = point.y
      return jitter
    },
  }
}