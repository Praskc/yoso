import type { Point } from './types'

export interface RangeConfig {
  topLimit: number
  leftLimit: number
  rightLimit: number
}

export function isWithinDetectionRange(points: readonly Point[], range: RangeConfig): boolean {
  let minX = 1
  let minY = 1
  let maxX = 0
  for (const point of points) {
    if (point.x < minX) minX = point.x
    if (point.y < minY) minY = point.y
    if (point.x > maxX) maxX = point.x
  }
  return minY >= range.topLimit && minX >= range.leftLimit && maxX <= range.rightLimit
}