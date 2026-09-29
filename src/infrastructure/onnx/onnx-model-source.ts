import * as ort from 'onnxruntime-web'
import type { Classifier } from '../../application/ports/classifier'
import type { RecognitionModel, RecognitionModelSource } from '../../application/ports/recognition-model-source'
import { FEATURE_COUNT } from '../../domain/recognition/extract-features'
import type { CentroidMap } from '../../domain/recognition/types'

export interface OnnxModelSettings {
  modelUrl: string
  centroidsUrl: string
  wasmPath: string
  threadCount: number
}

export class OnnxModelSource implements RecognitionModelSource {
  constructor(private readonly settings: OnnxModelSettings) {}

  async load(): Promise<RecognitionModel> {
    ort.env.wasm.wasmPaths = this.settings.wasmPath
    const [session, centroids] = await Promise.all([
      ort.InferenceSession.create(this.settings.modelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        enableCpuMemArena: true,
        intraOpNumThreads: this.settings.threadCount,
      }),
      this.loadCentroids(),
    ])
    return { classifier: new OnnxClassifier(session), centroids }
  }

  private async loadCentroids(): Promise<CentroidMap | null> {
    try {
      const response = await fetch(this.settings.centroidsUrl)
      if (!response.ok) return null
      const raw = await response.json() as Record<string, { coords: number[]; dist_ref: number }>
      return Object.fromEntries(
        Object.entries(raw).map(([letter, value]) => [
          letter,
          { coords: new Float32Array(value.coords), distRef: value.dist_ref },
        ])
      )
    } catch {
      return null
    }
  }
}

class OnnxClassifier implements Classifier {
  private readonly inputName: string
  private readonly outputName: string
  private readonly inputFeed: Record<string, ort.Tensor>
  private tensor: ort.Tensor | null = null

  constructor(private readonly session: ort.InferenceSession) {
    this.inputName = session.inputNames[0]
    this.outputName = session.outputNames[0]
    this.inputFeed = {}
  }

  async classify(features: Float32Array): Promise<Float32Array> {
    if (!this.tensor || this.tensor.data !== features) {
      this.tensor = new ort.Tensor('float32', features, [1, FEATURE_COUNT])
    }
    this.inputFeed[this.inputName] = this.tensor
    const results = await this.session.run(this.inputFeed)
    return results[this.outputName].data as Float32Array
  }
}