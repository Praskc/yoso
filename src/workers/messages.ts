import type { NormalizedLandmark, Category } from '@mediapipe/tasks-vision'
import type { CargaDebug } from '../engine/types'

export type WorkerInMsg =
  | { type: 'init' }
  | { type: 'reiniciar'; forzar: boolean }
  | { type: 'frame'; bitmap: ImageBitmap; timestamp: number }

export type WorkerInferenceResult = {
  letraDetectada: string
  confianzaEfectiva: number
  latInferencia: number
  esCamaraIzquierda: boolean
  letraConfirmada: string | null
  debug: CargaDebug
}

export type WorkerOutMsg =
  | { type: 'ready' }
  | {
      type: 'result'
      hasHand: boolean
      landmarks: NormalizedLandmark[]
      handedness: Category[]
      timestamp: number
      inference: WorkerInferenceResult | null
    }
  | {
      type: 'inference_result'
      inference: WorkerInferenceResult
    }
  | { type: 'error'; message: string }
