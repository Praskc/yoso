// El worker vive en public/mediapipe-worker.js; aquí solo su protocolo de mensajes.
import type { NormalizedLandmark, Category } from '@mediapipe/tasks-vision'

export type WorkerInMsg =
  | { type: 'init' }
  | { type: 'frame'; bitmap: ImageBitmap; timestamp: number }

export type WorkerOutMsg =
  | { type: 'ready' }
  | { type: 'result'; landmarks: NormalizedLandmark[][]; handedness: Category[][]; timestamp: number; mpMs: number }
  | { type: 'error'; message: string }
