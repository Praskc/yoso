import type { Point } from './types'

export const FEATURE_COUNT = 48

const LANDMARK_COUNT = 21
const WRIST = 0
const MIDDLE_MCP = 9
const FINGERTIP_LANDMARKS = [4, 8, 12, 16, 20] as const
const OCCLUSION_EPSILON = 1e-4
const COORDINATE_COUNT = 42
const ANGLE_INDEX = COORDINATE_COUNT
const DISTANCE_START = COORDINATE_COUNT + 1

export function extractFeatures(
  points: readonly Point[],
  isLeftHand: boolean,
  out: Float32Array
): boolean {
  const baseX = points[WRIST].x
  const baseY = points[WRIST].y

  for (let i = 0; i < LANDMARK_COUNT; i++) {
    let dx = points[i].x - baseX
    if (isLeftHand) dx = -dx
    out[i * 2] = dx
    out[i * 2 + 1] = points[i].y - baseY
  }

  const middleMcpX = MIDDLE_MCP * 2
  const scale = Math.sqrt(out[middleMcpX] ** 2 + out[middleMcpX + 1] ** 2)
  if (scale <= OCCLUSION_EPSILON) return false

  const inverseScale = 1 / scale
  for (let i = 0; i < COORDINATE_COUNT; i++) out[i] *= inverseScale

  out[ANGLE_INDEX] = Math.atan2(out[middleMcpX + 1], out[middleMcpX])
  for (let k = 0; k < FINGERTIP_LANDMARKS.length; k++) {
    const tip = FINGERTIP_LANDMARKS[k]
    const dx = out[tip * 2]
    const dy = out[tip * 2 + 1]
    out[DISTANCE_START + k] = Math.sqrt(dx * dx + dy * dy)
  }
  return true
}