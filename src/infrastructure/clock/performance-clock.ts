import type { Clock } from '../../application/ports/clock'

export class PerformanceClock implements Clock {
  now(): number {
    return performance.now()
  }
}