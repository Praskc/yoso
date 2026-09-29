import type { AppEvents, DebugSnapshot } from '../../../application/events/app-events'
import type { EventBus } from '../../../application/ports/event-bus'
import { DEFAULT_RECOGNITION_CONFIG } from '../../../domain/recognition/config'

const THRESHOLD_PERCENT = Math.round(DEFAULT_RECOGNITION_CONFIG.confidenceThreshold * 100)

export class DebugPanel {
  private root: HTMLElement | null = null
  private visible = false

  constructor(bus: EventBus<AppEvents>) {
    document.addEventListener('keydown', (event) => {
      if (event.shiftKey && event.key === 'D') this.toggle()
    })

    const params = new URLSearchParams(location.search)
    if (params.get('debug') === '1') {
      queueMicrotask(() => this.toggle())
    }

    ;(window as unknown as { yoso?: { debug: (value: boolean) => void } }).yoso = {
      debug: (value: boolean) => { if (value !== this.visible) this.toggle() },
    }

    bus.on('debugUpdated', payload => this.update(payload))
    bus.on('frameCaptured', payload => this.updatePerf(payload.detectionLatencyMs, payload.fps))
  }

  toggle(): void {
    if (!this.visible) {
      this.ensureRoot()
      if (this.root) this.root.hidden = false
    } else if (this.root) {
      this.root.hidden = true
    }
    this.visible = !this.visible
  }

  private ensureRoot(): void {
    if (this.root) return
    this.root = document.createElement('div')
    this.root.id = 'debug-panel'
    this.root.innerHTML = `
      <div class="debug-grid">
        <div class="dr"><span class="dl">Red bruta</span><div class="dbw"><div id="db-bar-red" class="db"></div></div><span id="db-red" class="dv">--</span></div>
        <div class="dr"><span class="dl">Conf efectiva</span><div class="dbw"><div id="db-bar-eff" class="db"></div></div><span id="db-eff" class="dv">--</span></div>
        <div class="dr"><span class="dl">Umbral</span><div class="dbw"><div class="db" style="width:${THRESHOLD_PERCENT}%"></div></div><span class="dv">${THRESHOLD_PERCENT}%</span></div>
        <div class="dr"><span class="dl">Distancia</span><div class="dbw"><div id="db-bar-dist" class="db"></div></div><span id="db-dist" class="dv">--</span></div>
        <div class="dr"><span class="dl">Dist ref</span><div class="dbw"><div class="db" style="width:50%"></div></div><span id="db-distref" class="dv">--</span></div>
        <div class="dr"><span class="dl">Buffer</span><div id="db-buffer" class="debug-buffer"></div><span id="db-votes" class="dv">--</span></div>
        <div class="dr"><span class="dl">Top-3</span><span id="db-top3" class="debug-top3">--</span></div>
        <div class="dr"><span class="dl">RAM heap</span><div class="dbw"><div id="db-bar-mem" class="db"></div></div><span id="db-mem" class="dv">-- MB</span></div>
        <div class="dr"><span class="dl">MP frame</span><div class="dbw"><div id="db-bar-mp" class="db"></div></div><span id="db-mp" class="dv">-- ms</span></div>
        <div class="dr"><span class="dl">FPS real</span><span id="db-fps" class="dv">--</span></div>
      </div>
    `
    document.body.appendChild(this.root)
  }

  update(payload: DebugSnapshot): void {
    if (!this.visible || !this.root) return
    const setBar = (id: string, pct: number): void => {
      const el = document.getElementById(id)
      if (el) (el as HTMLElement).style.width = `${Math.min(100, Math.max(0, pct))}%`
    }
    const setText = (id: string, txt: string): void => {
      const el = document.getElementById(id)
      if (el) el.textContent = txt
    }
    setBar('db-bar-red', payload.networkConfidence * 100)
    setText('db-red', `${(payload.networkConfidence * 100).toFixed(1)}%`)
    setBar('db-bar-eff', payload.effectiveConfidence * 100)
    setText('db-eff', `${(payload.effectiveConfidence * 100).toFixed(1)}%`)
    const distance = payload.distance ?? 0
    setBar('db-bar-dist', distance * 100)
    setText('db-dist', payload.distance != null ? payload.distance.toFixed(2) : '--')
    setText('db-distref', payload.distRef != null ? payload.distRef.toFixed(2) : '--')
    const votes = payload.voteBuffer.filter(entry => entry !== '').length
    setText('db-votes', `${votes}/9`)
    setText('db-top3', payload.topPredictions.map(top => `${top.letter}:${(top.probability * 100).toFixed(0)}`).join(' '))
    const buffer = document.getElementById('db-buffer')
    if (buffer) {
      buffer.innerHTML = Array.from({ length: 9 }, (_, index) =>
        `<span data-active="${index < votes}"></span>`,
      ).join('')
    }
  }

  updatePerf(frameMs: number, fps: number): void {
    if (!this.visible) return
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
    if (mem) {
      const mb = mem.usedJSHeapSize / 1024 / 1024
      const el = document.getElementById('db-bar-mem')
      if (el) (el as HTMLElement).style.width = `${Math.min(100, mb / 2)}%`
      const txt = document.getElementById('db-mem')
      if (txt) txt.textContent = `${mb.toFixed(0)} MB`
    }
    const mpEl = document.getElementById('db-bar-mp')
    if (mpEl) (mpEl as HTMLElement).style.width = `${Math.min(100, frameMs * 6)}%`
    const mpTxt = document.getElementById('db-mp')
    if (mpTxt) mpTxt.textContent = `${frameMs.toFixed(1)} ms`
    const fpsTxt = document.getElementById('db-fps')
    if (fpsTxt) fpsTxt.textContent = fps.toFixed(1)
  }
}
