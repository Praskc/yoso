import type { RecognitionConfig } from './config'
import type { Centroid } from './types'

export interface GrayZoneOutcome {
  effectiveConfidence: number
  distance: number | null
  distRef: number | null
}

export interface GrayZoneFilter {
  apply(
    centroid: Centroid | null,
    features: Float32Array,
    networkConfidence: number,
    out: GrayZoneOutcome
  ): void
}

export function createGrayZoneFilter(config: RecognitionConfig): GrayZoneFilter {
  return {
    apply(centroid, features, networkConfidence, out) {
      if (!centroid) {
        out.effectiveConfidence = networkConfidence
        out.distance = null
        out.distRef = null
        return
      }

      let sumSquared = 0
      for (let i = 0; i < centroid.coords.length; i++) {
        const delta = features[i] - centroid.coords[i]
        sumSquared += delta * delta
      }
      const distance = Math.sqrt(sumSquared)
      out.distance = distance
      out.distRef = centroid.distRef

      if (networkConfidence >= config.confidenceThreshold) {
        out.effectiveConfidence = networkConfidence
        return
      }

      const deviation = Math.max(0, distance - centroid.distRef) / centroid.distRef
      const penalty = Math.min(deviation, 1.0) * config.geoPenaltyWeight
      out.effectiveConfidence = networkConfidence * (1 - penalty)
    },
  }
}