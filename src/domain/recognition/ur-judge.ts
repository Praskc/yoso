import type { Point } from './types'

export function judgeUorR(letter: string, points: readonly Point[], isLeftHand: boolean): string {
  if (letter !== 'U' && letter !== 'R') return letter
  const fingersCrossed = isLeftHand
    ? points[8].x > points[12].x
    : points[8].x < points[12].x
  return fingersCrossed ? 'R' : 'U'
}