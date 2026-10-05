export interface Punto {
  x: number
  y: number
  z: number
}

export interface Lateralidad {
  label: 'Left' | 'Right'
  score: number
}

export interface ItemTop {
  letra: string
  prob:  number
}

export interface CargaDebug {
  probRed:        number
  confEfectiva:   number
  distancia:      number | null
  distRef:        number | null
  bufferActual:   string[]
  topN:           ItemTop[]
}

export interface Centroide {
  coords:   Float32Array
  dist_ref: number
}

export type MapaCentroides = Record<string, Centroide>

export interface CallbacksInferencia {
  alConfirmarLetra:    (letra: string) => void
  alDetectarLetra:     (letra: string, confianza: number, esCamaraIzquierda: boolean) => void
  alActualizarDebug:   (carga: CargaDebug) => void
}

export interface OpcionesInicioInferencia {
  sesion:     unknown
  centroides: MapaCentroides | null
  callbacks:  CallbacksInferencia
}
