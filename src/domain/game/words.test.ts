import { describe, expect, it } from 'vitest'
import { filterFingerspellingWords, isValidFingerspellingWord, normalizeWord } from './words'

describe('normalizeWord', () => {
  it('strips accents, uppercases and trims', () => {
    expect(normalizeWord('  señal  ')).toBe('SENAL')
    expect(normalizeWord('músculo')).toBe('MUSCULO')
    expect(normalizeWord('áéíóúü')).toBe('AEIOUU')
  })
})

describe('isValidFingerspellingWord', () => {
  it('accepts words inside the length range', () => {
    expect(isValidFingerspellingWord('SOL', 3, 4)).toBe(true)
    expect(isValidFingerspellingWord('CASAS', 4, 5)).toBe(true)
  })

  it('rejects words outside the length range', () => {
    expect(isValidFingerspellingWord('SO', 3, 4)).toBe(false)
    expect(isValidFingerspellingWord('SIETE', 3, 4)).toBe(false)
  })

  it('rejects non letter sequences', () => {
    expect(isValidFingerspellingWord('SOL 2', 3, 6)).toBe(false)
    expect(isValidFingerspellingWord('SO-L', 3, 6)).toBe(false)
  })

  it('rejects disallowed consonant clusters', () => {
    expect(isValidFingerspellingWord('GHOST', 3, 6)).toBe(false)
    expect(isValidFingerspellingWord('CHECK', 3, 6)).toBe(false)
  })
})

describe('filterFingerspellingWords', () => {
  it('normalizes, validates and deduplicates', () => {
    const result = filterFingerspellingWords(['sol', 'SOL', 'señal', 'no!', 'casa'], 3, 5)
    expect(result).toEqual(['SOL', 'SENAL', 'CASA'])
  })
})