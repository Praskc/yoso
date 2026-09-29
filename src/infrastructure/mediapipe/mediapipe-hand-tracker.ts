import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import type { HandTracker } from '../../application/ports/hand-tracker'
import type { HandDetection, Point } from '../../domain/recognition/types'

export class MediaPipeHandTracker implements HandTracker {
  private constructor(
    private readonly landmarker: HandLandmarker,
    private readonly video: HTMLVideoElement,
  ) {}

  static async create(video: HTMLVideoElement, wasmPath: string, modelPath: string): Promise<MediaPipeHandTracker> {
    const files = await FilesetResolver.forVisionTasks(wasmPath)
    const landmarker = await HandLandmarker.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: modelPath,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.80,
      minHandPresenceConfidence: 0.70,
      minTrackingConfidence: 0.70,
    })
    return new MediaPipeHandTracker(landmarker, video)
  }

  detect(timestampMs: number): HandDetection | null {
    const result = this.landmarker.detectForVideo(this.video, timestampMs)
    if (result.landmarks.length === 0 || result.handedness.length === 0) return null
    return {
      points: result.landmarks[0] as unknown as Point[],
      handedness: {
        label: result.handedness[0][0].categoryName as 'Left' | 'Right',
        score: result.handedness[0][0].score,
      },
    }
  }

  close(): void {
    this.landmarker.close()
  }
}