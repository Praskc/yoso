import type { CargaDebug } from '../engine/types'

export class DebugPanel {
  private root: HTMLElement | null = null
  private visible = false

  constructor() {
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && e.key === 'D') this.toggle()
    })

    const params = new URLSearchParams(location.search)
    if (params.get('debug') === '1') {
      queueMicrotask(() => this.toggle())
    }

    ;(window as unknown as { yoso?: { debug: (v: boolean) => void } }).yoso = {
      debug: (v: boolean) => { if (v !== this.visible) this.toggle() },
    }
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

  private refs: Record<string, HTMLElement> = {}

  private ensureRoot(): void {
    if (this.root) return
    this.root = document.createElement('div')
    this.root.id = 'debug-panel'
    this.root.innerHTML = `
      <div class="debug-grid">
        <div class="dr"><span class="dl">Red bruta</span><div class="dbw"><div id="db-bar-red" class="db"></div></div><span id="db-red" class="dv">--</span></div>
        <div class="dr"><span class="dl">Conf efectiva</span><div class="dbw"><div id="db-bar-eff" class="db"></div></div><span id="db-eff" class="dv">--</span></div>
        <div class="dr"><span class="dl">Umbral</span><div class="dbw"><div class="db" style="width:82%"></div></div><span class="dv">82%</span></div>
        <div class="dr"><span class="dl">Distancia</span><div class="dbw"><div id="db-bar-dist" class="db"></div></div><span id="db-dist" class="dv">--</span></div>
        <div class="dr"><span class="dl">Dist ref</span><div class="dbw"><div class="db" style="width:50%"></div></div><span id="db-distref" class="dv">--</span></div>
        <div class="dr"><span class="dl">Buffer</span><div id="db-buffer" class="debug-buffer"></div><span id="db-votes" class="dv">--</span></div>
        <div class="dr"><span class="dl">Top-3</span><span id="db-top3" class="debug-top3">--</span></div>
      </div>
    `
    document.body.appendChild(this.root)

    const ids = ['db-bar-red', 'db-red', 'db-bar-eff', 'db-eff', 'db-bar-dist', 'db-dist', 'db-distref', 'db-buffer', 'db-votes', 'db-top3']
    for (const id of ids) {
      this.refs[id] = document.getElementById(id)!
    }
    this.refs['db-buffer'].innerHTML = Array.from({ length: 9 }, () => `<span></span>`).join('')
  }

  actualizar(p: CargaDebug): void {
    if (!this.visible || !this.root) return
    const setBar = (id: string, pct: number): void => {
      if (this.refs[id]) this.refs[id].style.width = `${Math.min(100, Math.max(0, pct))}%`
    }
    const setText = (id: string, txt: string): void => {
      if (this.refs[id]) this.refs[id].textContent = txt
    }
    setBar('db-bar-red', p.probRed * 100)
    setText('db-red', `${(p.probRed * 100).toFixed(1)}%`)
    setBar('db-bar-eff', p.confEfectiva * 100)
    setText('db-eff', `${(p.confEfectiva * 100).toFixed(1)}%`)
    const dist = p.distancia ?? 0
    setBar('db-bar-dist', dist * 100)
    setText('db-dist', p.distancia != null ? p.distancia.toFixed(2) : '--')
    setText('db-distref', p.distRef != null ? p.distRef.toFixed(2) : '--')
    const votos = p.bufferActual.filter(s => s !== '').length
    setText('db-votes', `${votos}/9`)
    setText('db-top3', p.topN.slice(0, 3).map(t => `${t.letra}:${(t.prob * 100).toFixed(0)}`).join(' '))
    const buffer = this.refs['db-buffer']
    if (buffer) {
      const children = buffer.children
      for (let i = 0; i < 9; i++) {
        const active = i < votos ? 'true' : 'false'
        if (children[i].getAttribute('data-active') !== active) {
          children[i].setAttribute('data-active', active)
        }
      }
    }
  }
}

