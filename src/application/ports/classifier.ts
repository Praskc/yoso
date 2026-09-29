export interface Classifier {
  classify(features: Float32Array): Promise<Float32Array>
}