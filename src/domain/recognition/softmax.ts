export function softmax(logits: Float32Array, out: Float32Array): number {
  let maxLogit = -Infinity
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > maxLogit) maxLogit = logits[i]
  }

  let sumExp = 0
  for (let i = 0; i < logits.length; i++) {
    const exp = Math.exp(logits[i] - maxLogit)
    out[i] = exp
    sumExp += exp
  }

  let peakIndex = 0
  for (let i = 0; i < out.length; i++) {
    out[i] /= sumExp
    if (out[i] > out[peakIndex]) peakIndex = i
  }
  return peakIndex
}