// Worker clásico (no module): importScripts deja que MediaPipe registre su factory WASM en el scope global.

self.module  = { exports: {} }
self.exports = self.module.exports
self.require = function () { return {} }

importScripts('/mediapipe/vision_bundle.cjs')

var HandLandmarker  = self.module.exports.HandLandmarker
var FilesetResolver = self.module.exports.FilesetResolver

var landmarker = null

async function init () {
  var vision = await FilesetResolver.forVisionTasks('/mediapipe')
  landmarker  = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/mediapipe/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode:                'VIDEO',
    numHands:                   1,
    minHandDetectionConfidence: 0.80,
    minHandPresenceConfidence:  0.70,
    minTrackingConfidence:      0.70,
  })
  self.postMessage({ type: 'ready' })
}

self.onmessage = function (e) {
  var data = e.data
  if (data.type === 'init') {
    init().catch(function (err) {
      self.postMessage({ type: 'error', message: String(err) })
    })
    return
  }
  if (data.type === 'frame') {
    if (!landmarker) { data.bitmap.close(); return }
    try {
      var t0    = performance.now()
      var result = landmarker.detectForVideo(data.bitmap, data.timestamp)
      var mpMs  = performance.now() - t0
      self.postMessage({
        type:      'result',
        landmarks: result.landmarks,
        handedness: result.handedness,
        timestamp: data.timestamp,
        mpMs:      mpMs,
      })
    } catch (err) {
      // Responder siempre: el main thread no libera _workerOcupado sin respuesta.
      self.postMessage({ type: 'error', message: String(err) })
    } finally {
      data.bitmap.close()
    }
  }
}
