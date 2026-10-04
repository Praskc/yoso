import { HUD }           from './hud/hud'
import { DebugPanel }    from './debug-panel/debug-panel'
import { Toast, type TipoToast } from './toast/toast'
import { Onboarding }    from './onboarding/onboarding'
import { AlphabetLearn } from './learn-panel/learn-panel'
import { Splash }        from './splash/splash'
import { PanelLeft }     from './panel-left/panel-left'
import { OutputPanel }   from './output-panel/output-panel'
import { GamePanel }     from './game-panel/game-panel'
import { SiteFooter }    from './site-footer/site-footer'
import { AccessibilityModal } from './accessibility-modal/accessibility-modal'
import { a11y }          from '../../application/accessibility'
import type { CargaDebug } from '../../domain/recognition/types'

export class RenderizadorUI {
  private readonly panelLeft:  PanelLeft
  private readonly output:     OutputPanel
  private readonly hud:        HUD
  private readonly debug:      DebugPanel
  private readonly toast:      Toast
  private readonly onboarding: Onboarding
  private readonly learn:      AlphabetLearn
  private readonly splash:     Splash
  private readonly a11yModal:  AccessibilityModal

  constructor() {
    // PanelLeft y Output crean DOM antes que HUD, que bindea IDs en diferido.
    this.panelLeft  = new PanelLeft()
    this.output     = new OutputPanel()
    new GamePanel()
    new SiteFooter()
    this.hud        = new HUD()
    this.debug      = new DebugPanel()
    this.toast      = new Toast()
    this.onboarding = new Onboarding()
    this.learn      = new AlphabetLearn()
    this.splash     = new Splash()
    this.a11yModal  = new AccessibilityModal()

    window.addEventListener('yoso:letra', (e) => {
      const detail = (e as CustomEvent<{ letra: string; borrar: boolean }>).detail
      this.output.agregarLetra(detail.letra, detail.borrar)
      if (!detail.borrar && detail.letra) {
        a11y.notificarLetraCapturada(detail.letra)
      }
    })
    window.addEventListener('yoso:texto-clear', () => this.output.limpiarTexto())
  }

  mensajeSplash(mensaje: string, esError = false): void        { this.splash.mensaje(mensaje, esError) }
  ocultarSplash(): void                                         { this.splash.ocultar() }
  setLive(activo: boolean): void                                { this.panelLeft.setLive(activo) }
  mostrarEstadoVacio(err: DOMException | null, onReintentar: () => void, estado: import('./splash/splash').TipoEstadoCamara | boolean = 'other'): void {
    this.splash.mostrarEstadoVacio(err, onReintentar, estado)
    this.panelLeft.setLive(false)
  }
  ocultarEstadoVacio(): void                                    { this.splash.ocultarEstadoVacio() }

  estadoListo(estado: 'idle' | 'signing' | 'warning'): void {
    this.hud.estadoListo(estado)
    this.panelLeft.setLive(true)
  }
  actualizarPrediccion(letra: string, confianza: number, latencia: number, esIzquierda: boolean): void {
    this.hud.actualizarPrediccion(letra, confianza, latencia, esIzquierda)
    this.output.setLetra(letra)
    this.output.actualizarStream(confianza)
    this.output.setMano(esIzquierda, confianza >= 0.82 ? 'good' : 'jitter')
    if (confianza >= 0.82) {
      this.output.setMensajeHumano('tu mano está perfecta', 'good')
    } else {
      this.output.setMensajeHumano('mantén la postura', 'warn')
    }
  }
  estadoMano(estado: string, esOptimo: boolean): void {
    this.hud.estadoMano(estado, esOptimo)
    if (!esOptimo) {
      this.output.setMensajeHumano('mucha vibración — aquieta', 'warn')
      this.output.setManoEstadoActual('jitter')
    }
  }
  limpiarMano(): void {
    this.hud.limpiarMano()
    this.output.setLetra('')
    this.output.setMensajeHumano('pon tu mano aquí', 'idle')
    this.output.setMano(null, 'idle')
    this.output.actualizarStream(0)
  }
  actualizarROI(fueraZona: boolean): void {
    this.hud.actualizarROI(fueraZona)
    if (fueraZona) {
      this.output.setMensajeHumano('fuera del recuadro', 'warn')
      this.output.setManoEstadoActual('roi')
    }
  }
  limpiarROI(): void                                            { this.hud.limpiarROI() }
  agregarLetra(letra: string, borrar: boolean): void            { this.hud.agregarLetra(letra, borrar) }
  limpiarTexto(): void                                          { this.hud.limpiarTexto() }

  actualizarDebug(p: CargaDebug): void {
    this.debug.actualizar(p)
    // bufferActual mide 9 siempre (padding con ''); los votos reales son
    // las letras — '-' es frame descartado y no llena la barra.
    let votos = 0
    for (const s of p.bufferActual) {
      if (s !== '' && s !== '-') votos++
    }
    this.output.setBuffer(votos, 9)
  }
  actualizarPerfFrame(mpMs: number, fps: number): void {
    this.debug.actualizarPerf(mpMs, fps)
    this.hud.actualizarFps(fps)
  }

  mostrarToast(id: string, msg: string, tipo: TipoToast = 'info', dur = 5000): void {
    this.toast.mostrar(id, msg, tipo, dur)
  }
  ocultarToast(id: string): void                                { this.toast.ocultar(id) }

  mostrarOnboarding(forzado = false): Promise<void>             { return this.onboarding.mostrar(forzado) }
  mostrarAccesibilidad(): void                                  { this.a11yModal.open() }

  resaltarSena(letra: string): void                             { this.learn.resaltar(letra) }
  limpiarSena(): void                                           { this.learn.limpiar() }
}
