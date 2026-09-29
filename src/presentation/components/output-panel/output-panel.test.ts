import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TypedEventBus } from '../../../shared/typed-event-bus'
import type { AppEvents } from '../../../application/events/app-events'
import { OutputPanel } from './output-panel'

const MARKUP = `
  <div id="tab-traductor"></div>
  <div id="final-text"></div>
  <button id="btn-clear"></button>
`

const transcript = (): string => document.getElementById('final-text')!.textContent ?? ''

describe('OutputPanel', () => {
  let bus: TypedEventBus<AppEvents>

  beforeEach(() => {
    document.body.innerHTML = MARKUP
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    bus = new TypedEventBus<AppEvents>()
    new OutputPanel(bus)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders the transcript from the confirmed letters', () => {
    bus.emit('letterConfirmed', { letter: 'A' })
    bus.emit('letterConfirmed', { letter: 'B' })

    expect(transcript()).toBe('AB')
  })

  it('removes the last letter when the backspace is confirmed', () => {
    bus.emit('letterConfirmed', { letter: 'A' })
    bus.emit('letterConfirmed', { letter: 'B' })
    bus.emit('letterConfirmed', { letter: '⌫' })

    expect(transcript()).toBe('A')
  })

  it('clears the transcript when the clear button is pressed', () => {
    bus.emit('letterConfirmed', { letter: 'A' })

    document.getElementById('btn-clear')!.click()

    expect(transcript()).toBe('')
  })

  it('clears the transcript when the mode changes', () => {
    bus.emit('letterConfirmed', { letter: 'A' })

    bus.emit('modeChanged', { mode: 'training' })

    expect(transcript()).toBe('')
  })

  it('shows the current prediction letter', async () => {
    vi.useFakeTimers()
    try {
      bus.emit('prediction', {
        letter: 'C',
        effectiveConfidence: 0.9,
        inferenceLatencyMs: 4,
        isLeftHand: false,
      })
      await vi.advanceTimersByTimeAsync(40)

      expect(document.getElementById('prediction')?.textContent).toBe('C')
    } finally {
      vi.useRealTimers()
    }
  })
})
