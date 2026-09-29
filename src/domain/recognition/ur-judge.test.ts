import { describe, expect, it } from 'vitest'
import { judgeUorR } from './ur-judge'
import type { Point } from './types'

const handWith = (indexX: number, middleX: number): Point[] => {
  const points: Point[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
  points[8] = { x: indexX, y: 0.4, z: 0 }
  points[12] = { x: middleX, y: 0.4, z: 0 }
  return points
}

describe('judgeUorR', () => {
  it('leaves letters other than U and R untouched', () => {
    expect(judgeUorR('A', handWith(0.6, 0.4), false)).toBe('A')
    expect(judgeUorR('W', handWith(0.4, 0.6), true)).toBe('W')
  })

  it('keeps U while the index finger is not crossed for the right hand', () => {
    expect(judgeUorR('U', handWith(0.6, 0.4), false)).toBe('U')
  })

  it('turns U into R when the index finger crosses the middle finger for the right hand', () => {
    expect(judgeUorR('U', handWith(0.4, 0.6), false)).toBe('R')
  })

  it('turns R into U when the fingers are not crossed for the right hand', () => {
    expect(judgeUorR('R', handWith(0.6, 0.4), false)).toBe('U')
  })

  it('mirrors the crossing rule for the left hand', () => {
    expect(judgeUorR('U', handWith(0.6, 0.4), true)).toBe('R')
    expect(judgeUorR('U', handWith(0.4, 0.6), true)).toBe('U')
  })
})