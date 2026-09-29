import type { CentroidMap } from '../../domain/recognition/types'
import type { Classifier } from './classifier'

export interface RecognitionModel {
  classifier: Classifier
  centroids: CentroidMap | null
}

export interface RecognitionModelSource {
  load(): Promise<RecognitionModel>
}