// Worker clásico unificado: MediaPipe + ONNX.
// Recibe ImageBitmap, devuelve letra + confianza + debug.

self.module  = { exports: {} }
self.exports = self.module.exports
self.require = function () { return {} }

importScripts('/mediapipe/vision_bundle.cjs')

var HandLandmarker  = self.module.exports.HandLandmarker
var FilesetResolver = self.module.exports.FilesetResolver

// ORT UMD build
importScripts('/ort/ort.wasm.min.js')
var ort = self.ort

var landmarker = null
var sesionOnnx = null
var inputName  = ''
var outputName = ''
var tensorInput = null
var inputFeed   = {}
var centroides  = null
var centroidesPorIndice = []

// ─── Constantes (idénticas a inference.ts) ───────────────────────────

var ALFABETO = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
  ' ', '⌫'
]
var BORRAR = '⌫'

var UMBRAL_CONFIANZA       = 0.82
var PESO_GEO_MAX           = 0.20
var TAMANO_BUFFER          = 9
var VOTOS_NECESARIOS       = 7
var TIEMPO_COOLDOWN_MS     = 800
var COOLDOWN_MISMA_LETRA   = 1800
var COOLDOWN_COMANDO_MS    = 400
var PESO_MINIMO_VOTOS      = VOTOS_NECESARIOS * UMBRAL_CONFIANZA
var PUNTAS                 = [4, 8, 12, 16, 20]
var IDX_DESCARTE           = -1
var IDX_ESPACIO            = ALFABETO.indexOf(' ')
var IDX_BORRAR             = ALFABETO.indexOf(BORRAR)

// ─── Buffers preasignados ────────────────────────────────────────────

var bufCoords   = new Float32Array(42)
var bufFeatures = new Float32Array(48)
var bufSoftmax  = new Float32Array(0)
var bufLetras   = Array.from({ length: TAMANO_BUFFER }, function () { return '' })
var top3Buf     = [
  { letra: '', prob: 0 },
  { letra: '', prob: 0 },
  { letra: '', prob: 0 }
]

var votosLetras = new Int8Array(TAMANO_BUFFER)
var votosPesos  = new Float32Array(TAMANO_BUFFER)
var votosHead   = 0
var votosLleno  = false
var pesoPorLetra = new Float32Array(ALFABETO.length)
var ultimaLetra           = ''
var ultimoTiempoEscritura = 0
var procesando = false

// ─── Funciones de inferencia (port de inference.ts) ──────────────────

function preprocesar(puntos, esCamaraIzquierda) {
  var baseX = puntos[0].x
  var baseY = puntos[0].y

  for (var i = 0; i < 21; i++) {
    var dx = puntos[i].x - baseX
    if (esCamaraIzquierda) dx *= -1
    bufCoords[i * 2]     = dx
    bufCoords[i * 2 + 1] = puntos[i].y - baseY
  }

  var dp = Math.sqrt(bufCoords[18] * bufCoords[18] + bufCoords[19] * bufCoords[19])
  if (dp <= 1e-4) return null

  var invDp = 1 / dp
  for (var i = 0; i < 42; i++) bufCoords[i] *= invDp

  bufFeatures.set(bufCoords)
  bufFeatures[42] = Math.atan2(bufCoords[19], bufCoords[18])
  for (var k = 0; k < 5; k++) {
    var p  = PUNTAS[k]
    var dx = bufCoords[p * 2]
    var dy = bufCoords[p * 2 + 1]
    bufFeatures[43 + k] = Math.sqrt(dx * dx + dy * dy)
  }

  return bufFeatures
}

function softmax(logits) {
  if (bufSoftmax.length !== logits.length) {
    bufSoftmax = new Float32Array(logits.length)
  }
  var maxLogit = -Infinity, indicePico = 0
  for (var i = 0; i < logits.length; i++) {
    if (logits[i] > maxLogit) { maxLogit = logits[i]; indicePico = i }
  }
  var sumaExp = 0
  for (var i = 0; i < logits.length; i++) {
    bufSoftmax[i] = Math.exp(logits[i] - maxLogit)
    sumaExp += bufSoftmax[i]
  }
  var probPico = 0
  for (var i = 0; i < bufSoftmax.length; i++) {
    bufSoftmax[i] /= sumaExp
    if (bufSoftmax[i] > probPico) probPico = bufSoftmax[i]
  }
  return { probs: bufSoftmax, indicePico: indicePico, probPico: probPico }
}

function juezUR(letra, puntos, esCamaraIzquierda) {
  if (letra !== 'U' && letra !== 'R') return letra
  var cruzados = esCamaraIzquierda
    ? puntos[8].x > puntos[12].x
    : puntos[8].x < puntos[12].x
  return cruzados ? 'R' : 'U'
}

function filtroZonaGris(indiceLetra, entrada, probRed) {
  var centroide = centroidesPorIndice[indiceLetra]
  if (!centroide) return { confianzaEfectiva: probRed, distancia: null, distRef: null }

  var sumaSq = 0
  for (var i = 0; i < centroide.coords.length; i++) {
    var d = entrada[i] - centroide.coords[i]
    sumaSq += d * d
  }
  var distRef   = centroide.dist_ref
  var distRefSq = distRef * distRef

  if (probRed >= UMBRAL_CONFIANZA) return { confianzaEfectiva: probRed, distancia: sumaSq, distRef: distRefSq }

  // Penalización usando distancias cuadráticas: evita Math.sqrt
  var ratio = sumaSq > distRefSq ? Math.sqrt(sumaSq / distRefSq) - 1 : 0
  var penalizacion      = Math.min(ratio, 1.0) * PESO_GEO_MAX
  var confianzaEfectiva = probRed * (1 - penalizacion)
  return { confianzaEfectiva: confianzaEfectiva, distancia: sumaSq, distRef: distRefSq }
}

function reiniciar(forzar) {
  votosLetras.fill(IDX_DESCARTE)
  votosPesos.fill(0)
  votosHead   = 0
  votosLleno  = false
  procesando  = false
  if (forzar) {
    ultimaLetra           = ''
    ultimoTiempoEscritura = 0
  }
}

async function procesarFrame(puntos, lateralidad, jitter, timestamp) {
  if (!sesionOnnx || procesando) return null
  procesando = true
  try {
    var esCamaraIzquierda = lateralidad.label === 'Left'

    var entrada  = preprocesar(puntos, esCamaraIzquierda)
    if (entrada === null) return null

    var t0Inf         = performance.now()
    var salida        = await sesionOnnx.run(inputFeed)
    var latInferencia = performance.now() - t0Inf

    var datos = salida[outputName].data
    var result = softmax(datos)
    var probs = result.probs
    var indicePico = result.indicePico
    var probPico = result.probPico

    var letra = ALFABETO[indicePico]
    letra = juezUR(letra, puntos, esCamaraIzquierda)
    var indiceLetraFinal = ALFABETO.indexOf(letra)

    var gris = filtroZonaGris(indiceLetraFinal, entrada, probPico)
    var confianzaEfectiva = gris.confianzaEfectiva
    var distancia = gris.distancia
    var distRef = gris.distRef

    var letraDetectada = confianzaEfectiva >= UMBRAL_CONFIANZA ? letra : '-'
    if ((letraDetectada === ' ' || letraDetectada === BORRAR) && jitter > 0.02) letraDetectada = '-'

    // top-3
    var i0 = 0, i1 = 0, i2 = 0
    var p0 = -Infinity, p1 = -Infinity, p2 = -Infinity
    for (var i = 0; i < probs.length; i++) {
      var p = probs[i]
      if      (p > p0) { p2 = p1; i2 = i1; p1 = p0; i1 = i0; p0 = p; i0 = i }
      else if (p > p1) { p2 = p1; i2 = i1; p1 = p; i1 = i }
      else if (p > p2) { p2 = p; i2 = i }
    }
    top3Buf[0].letra = ALFABETO[i0]; top3Buf[0].prob = p0
    top3Buf[1].letra = ALFABETO[i1]; top3Buf[1].prob = p1
    top3Buf[2].letra = ALFABETO[i2]; top3Buf[2].prob = p2

    var idxDetectada  = letraDetectada === '-' ? IDX_DESCARTE : ALFABETO.indexOf(letraDetectada)
    var pesoDetectado = letraDetectada === '-' ? 0 : confianzaEfectiva

    votosLetras[votosHead] = idxDetectada
    votosPesos[votosHead]  = pesoDetectado
    votosHead = (votosHead + 1) % TAMANO_BUFFER
    if (votosHead === 0) votosLleno = true

    pesoPorLetra.fill(0)
    var idxCandidato = IDX_DESCARTE, pesoCandidato = 0
    var limite = votosLleno ? TAMANO_BUFFER : votosHead
    for (var k = 0; k < limite; k++) {
      var idxL = votosLetras[k]
      if (idxL === IDX_DESCARTE) continue
      var acumulado = pesoPorLetra[idxL] + votosPesos[k]
      pesoPorLetra[idxL] = acumulado
      if (acumulado > pesoCandidato) { pesoCandidato = acumulado; idxCandidato = idxL }
    }
    var bufferLleno    = votosLleno
    var bufferProgreso = bufferLleno
      ? Math.min(pesoCandidato / PESO_MINIMO_VOTOS, 1.0)
      : 0

    for (var i = 0; i < TAMANO_BUFFER; i++) {
      if (!bufferLleno && i >= votosHead) { bufLetras[i] = ''; continue }
      var slot = bufferLleno ? (votosHead + i) % TAMANO_BUFFER : i
      var idxL = votosLetras[slot]
      bufLetras[i] = idxL === IDX_DESCARTE ? '-' : ALFABETO[idxL]
    }

    var letraConfirmada = null

    if (bufferLleno && pesoCandidato >= PESO_MINIMO_VOTOS && idxCandidato !== IDX_DESCARTE) {
      var candidato = ALFABETO[idxCandidato]
      var ahora        = performance.now()
      var esComando    = idxCandidato === IDX_ESPACIO || idxCandidato === IDX_BORRAR
      var esMismaLetra = candidato === ultimaLetra && !esComando
      var cooldown     = esComando    ? COOLDOWN_COMANDO_MS
                       : esMismaLetra ? COOLDOWN_MISMA_LETRA
                       : TIEMPO_COOLDOWN_MS

      if (ahora - ultimoTiempoEscritura >= cooldown) {
        ultimaLetra           = candidato
        ultimoTiempoEscritura = ahora
        votosLetras.fill(IDX_DESCARTE)
        votosPesos.fill(0)
        votosHead  = 0
        votosLleno = false
        letraConfirmada = candidato
      }
    }

    return {
      letraDetectada: letraDetectada,
      confianzaEfectiva: confianzaEfectiva,
      latInferencia: latInferencia,
      esCamaraIzquierda: esCamaraIzquierda,
      letraConfirmada: letraConfirmada,
      debug: {
        probRed: probPico,
        confEfectiva: confianzaEfectiva,
        distancia: distancia,
        distRef: distRef,
        bufferActual: bufLetras.slice(),
        topN: [
          { letra: top3Buf[0].letra, prob: top3Buf[0].prob },
          { letra: top3Buf[1].letra, prob: top3Buf[1].prob },
          { letra: top3Buf[2].letra, prob: top3Buf[2].prob }
        ],
        bufferProgreso: bufferProgreso
      }
    }
  } catch (err) {
    console.error('[Worker] Inferencia error:', err)
    return null
  } finally {
    procesando = false
  }
}

// ─── Init ────────────────────────────────────────────────────────────

async function init () {
  // MediaPipe
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

  // ORT
  ort.env.wasm.wasmPaths = '/ort/'
  var hilos = Math.min(2, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2)
  sesionOnnx = await ort.InferenceSession.create('/YOSO.onnx', {
    executionProviders:     ['wasm'],
    graphOptimizationLevel: 'all',
    enableCpuMemArena:      true,
    intraOpNumThreads:      hilos
  })
  inputName  = sesionOnnx.inputNames[0]
  outputName = sesionOnnx.outputNames[0]
  tensorInput = new ort.Tensor('float32', bufFeatures, [1, 48])
  inputFeed[inputName] = tensorInput

  // Centroides
  try {
    var resp = await fetch('/Centroides.json')
    if (resp.ok) {
      var raw = await resp.json()
      centroides = {}
      for (var key in raw) {
        centroides[key] = {
          coords: new Float32Array(raw[key].coords),
          dist_ref: raw[key].dist_ref
        }
      }
    }
  } catch (e) {
    console.warn('[Worker] Centroides no cargados:', e)
  }

  centroidesPorIndice = ALFABETO.map(function (letra) {
    if (!centroides || letra === ' ' || letra === BORRAR) return null
    return centroides[letra.toLowerCase()] || null
  })

  self.postMessage({ type: 'ready' })
}

// ─── Message handler ─────────────────────────────────────────────────

self.onmessage = function (e) {
  var data = e.data

  if (data.type === 'init') {
    init().catch(function (err) {
      self.postMessage({ type: 'error', message: String(err) })
    })
    return
  }

  if (data.type === 'reiniciar') {
    reiniciar(data.forzar)
    return
  }

  if (data.type === 'frame') {
    if (!landmarker || !sesionOnnx) { data.bitmap.close(); return }
    try {
      var result = landmarker.detectForVideo(data.bitmap, data.timestamp)

      if (result.landmarks.length === 0) {
        reiniciar(false)
        self.postMessage({
          type: 'result',
          hasHand: false,
          landmarks: [],
          handedness: [],
          timestamp: data.timestamp,
          inference: null
        })
        data.bitmap.close()
        return
      }

      var landmarks   = result.landmarks[0]
      var handedness  = result.handedness[0]
      var lateralidad = { label: handedness[0].categoryName, score: handedness[0].score }

      // Calcular jitter en el worker (necesitamos wrist previo)
      if (typeof self._prevWristX === 'undefined') {
        self._prevWristX = 0
        self._prevWristY = 0
      }
      var jitter = Math.abs(landmarks[0].x - self._prevWristX) + Math.abs(landmarks[0].y - self._prevWristY)
      self._prevWristX = landmarks[0].x
      self._prevWristY = landmarks[0].y

      // Responder INMEDIATAMENTE para liberar el Main Thread a 30 FPS
      self.postMessage({
        type: 'result',
        hasHand: true,
        landmarks: landmarks,
        handedness: handedness,
        timestamp: data.timestamp,
        inference: null
      })

      // Ejecutar ONNX en background (si no está ocupado, procesarFrame devolverá null al instante)
      procesarFrame(landmarks, lateralidad, jitter, data.timestamp).then(function (inf) {
        if (inf) {
          self.postMessage({
            type: 'inference_result',
            inference: inf
          })
        }
      }).catch(function (err) {
        console.error('[Worker] Error asíncrono ONNX:', err)
      })

    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) })
    } finally {
      data.bitmap.close()
    }
  }
}
