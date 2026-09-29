import { BACKSPACE, MODEL_CLASSES, SPACE } from '../alphabet'
import type { Centroid, CentroidMap } from './types'

export function indexCentroidsByClass(centroidMap: CentroidMap | null): Array<Centroid | null> {
  return MODEL_CLASSES.map(letter => {
    if (!centroidMap || letter === SPACE || letter === BACKSPACE) return null
    return centroidMap[letter.toLowerCase()] ?? null
  })
}