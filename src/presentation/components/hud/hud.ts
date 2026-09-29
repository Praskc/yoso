import type { AppEvents, PredictionSnapshot, RangeStatus } from '../../../application/events/app-events'
import type { EventBus } from '../../../application/ports/event-bus'

const ARC_CIRCUMFERENCE = 263.9

export class Hud {
  private timeEl: HTMLElement | null = null
  private handEl: HTMLElement | null = null
  private stateEl: HTMLElement | null = null
  private confidenceEl: HTMLElement | null = null
  private arcFill: SVGCircleElement | null = null
  private fpsEl: HTMLElement | null = null
  private rangeEl: HTMLElement | null = null
  private outOfRange = false

  private previousPercent = -1
  private previousHand = ''
  private previousState = ''
  private previousRange = ''
  private clearKey = ''

  constructor(bus: EventBus<AppEvents>) {
    this.bind()
    bus.on('prediction', payload => this.handlePrediction(payload))
    bus.on('handStability', payload => this.handleStability(payload.stable))
    bus.on('handCleared', () => this.clearHand())
    bus.on('rangeState', payload => this.handleRange(payload.status))
    bus.on('frameCaptured', payload => this.updateFps(payload.fps))
  }

  private bind(): void {
    this.timeEl = document.getElementById('m-time')
    this.handEl = document.getElementById('m-hand')
    this.stateEl = document.getElementById('m-estado')
    this.confidenceEl = document.getElementById('m-conf')
    this.arcFill = document.getElementById('conf-arc-fill') as SVGCircleElement | null
    this.fpsEl = document.getElementById('m-fps')
    this.rangeEl = document.querySelector('.feed__roi')
  }

  private handlePrediction(payload: PredictionSnapshot): void {
    this.clearKey = ''

    const percent = Math.round(payload.effectiveConfidence * 100)
    if (this.confidenceEl && percent !== this.previousPercent) {
      this.previousPercent = percent
      this.confidenceEl.innerHTML = `${percent}<span class="unit">%</span>`
      this.confidenceEl.dataset.state = payload.effectiveConfidence >= 0.9 ? 'high' : 'on'
      if (this.arcFill) {
        this.arcFill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE * (1 - percent / 100))
      }
    }
    if (this.timeEl) this.timeEl.innerHTML = `${payload.inferenceLatencyMs.toFixed(1)}<span class="unit">ms</span>`

    const hand = payload.isLeftHand ? 'izq.' : 'der.'
    if (this.handEl && hand !== this.previousHand) {
      this.previousHand = hand
      this.handEl.textContent = hand
      this.handEl.dataset.state = 'on'
    }
  }

  private handleStability(stable: boolean): void {
    if (!this.stateEl) return
    const state = stable ? 'óptimo' : 'mov.'
    if (state === this.previousState) return
    this.previousState = state
    this.stateEl.textContent = state
    this.stateEl.dataset.state = stable ? 'on' : 'warn'
  }

  private clearHand(): void {
    const key = `cleared:${this.outOfRange}`
    if (this.clearKey === key) return
    this.clearKey = key
    this.previousPercent = -1
    this.previousHand = ''
    this.previousState = ''

    if (this.handEl) {
      this.handEl.textContent = 'ND'
      this.handEl.dataset.state = 'off'
    }
    if (this.stateEl) {
      if (this.outOfRange) {
        this.stateEl.textContent = 'fuera'
        this.stateEl.dataset.state = 'warn'
      } else {
        this.stateEl.textContent = '·'
        this.stateEl.dataset.state = 'off'
      }
    }
    if (this.arcFill) this.arcFill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE)
    if (this.confidenceEl) {
      this.confidenceEl.innerHTML = `0<span class="unit">%</span>`
      delete this.confidenceEl.dataset.state
    }
    if (this.timeEl) this.timeEl.innerHTML = `·<span class="unit">ms</span>`
  }

  private handleRange(status: RangeStatus): void {
    if (status === 'none') {
      this.outOfRange = false
      if (!this.rangeEl || this.previousRange === '') return
      this.previousRange = ''
      this.rangeEl.removeAttribute('data-state')
      const label = this.rangeEl.querySelector('.feed__roi-label')
      if (label) label.textContent = 'zona de detección'
      return
    }

    this.outOfRange = status === 'out-of-range'
    if (!this.rangeEl) return
    const state = this.outOfRange ? 'warning' : 'ok'
    if (state === this.previousRange) return
    this.previousRange = state
    this.rangeEl.setAttribute('data-state', state)
    const label = this.rangeEl.querySelector('.feed__roi-label')
    if (label) label.textContent = this.outOfRange ? 'fuera del rango' : 'zona de detección'
  }

  private updateFps(fps: number): void {
    if (this.fpsEl) this.fpsEl.textContent = fps.toFixed(1)
  }
}
