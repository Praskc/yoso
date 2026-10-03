import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import type { WorkerInMsg, WorkerOutMsg } from './protocol'

// Ruta CPU: MediaPipe en WASM dentro de este hilo dedicado, para dispositivos
// sin GPU delegate (o demasiado lentos) donde la detección bloquearía el main thread.
// La inferencia ONNX no se mueve: es <1 ms de cómputo, postMessage costaría más.

interface WorkerScope {
  onmessage: ((e: MessageEvent<WorkerInMsg>) => void) | null
  postMessage(msg: WorkerOutMsg): void
}
const scope = self as unknown as WorkerScope

let landmarker: HandLandmarker | null = null

scope.onmessage = (e) => {
  const msg = e.data

  if (msg.type === 'init') {
    void (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe')
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/mediapipe/hand_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.80,
          minHandPresenceConfidence:  0.70,
          minTrackingConfidence:      0.70
        })
        scope.postMessage({ type: 'ready' })
      } catch (err) {
        scope.postMessage({ type: 'error', message: String(err) })
      }
    })()
    return
  }

  if (msg.type === 'frame') {
    if (!landmarker) return
    const t0 = performance.now()
    const resultado = landmarker.detectForVideo(msg.bitmap, msg.timestamp)
    const mpMs = performance.now() - t0
    msg.bitmap.close()

    const landmarks = resultado.landmarks.length > 0 ? resultado.landmarks[0] : null
    const handedness = resultado.handedness[0]?.[0]
    scope.postMessage({
      type: 'resultado',
      landmarks,
      lateralidad: handedness ? (handedness.categoryName === 'Left' ? 'Left' : 'Right') : null,
      score: handedness ? handedness.score : 0,
      mpMs
    })
  }
}
