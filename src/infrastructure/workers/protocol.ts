import type { Punto } from '../../domain/recognition/types'

// Protocolo del worker de detección (ruta CPU). El worker solo corre MediaPipe;
// la inferencia ONNX siempre vive en el hilo principal (MotorInferencia).
export type WorkerInMsg =
  | { type: 'init' }
  | { type: 'frame'; bitmap: ImageBitmap; timestamp: number }

export type WorkerOutMsg =
  | { type: 'ready' }
  | {
      type: 'resultado'
      landmarks: Punto[] | null
      lateralidad: 'Left' | 'Right' | null
      score: number
      mpMs: number
    }
  | { type: 'error'; message: string }
