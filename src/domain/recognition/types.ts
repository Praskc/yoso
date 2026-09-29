export interface Point {
  x: number
  y: number
  z: number
}

export interface Handedness {
  label: 'Left' | 'Right'
  score: number
}

export interface HandDetection {
  points: readonly Point[]
  handedness: Handedness
}

export interface Centroid {
  coords: Float32Array
  distRef: number
}

export type CentroidMap = Record<string, Centroid>

export interface TopPrediction {
  letter: string
  probability: number
}