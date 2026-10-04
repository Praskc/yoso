import { describe, it, expect } from 'vitest'
import { SIGNS, signURI } from './sign-uris'

describe('catálogo de señas (signs.ts)', () => {
  it('cubre exactamente las 26 letras A–Z', () => {
    expect(Object.keys(SIGNS).sort().join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  })

  it('genera data URIs SVG válidas para cada letra', () => {
    for (const letra of Object.keys(SIGNS)) {
      expect(signURI(letra)).toMatch(/^data:image\/svg\+xml/)
    }
  })

  it('devuelve cadena vacía para letras fuera del modelo (Ñ, vacío, espacio)', () => {
    expect(signURI('Ñ')).toBe('')
    expect(signURI('')).toBe('')
    expect(signURI(' ')).toBe('')
  })
})
