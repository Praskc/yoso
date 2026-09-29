import { filterFingerspellingWords } from '../../domain/game/words'
import type { WordPool, WordSource } from '../../application/ports/word-source'

const REQUEST_TIMEOUT_MS = 7000
const MIN_POOL_SIZE = 5

export class DatamuseWordSource implements WordSource {
  readonly id = 'datamuse'

  async getWords(_level: number, minLength: number, maxLength: number): Promise<WordPool> {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const lengths: number[] = []
    for (let length = minLength; length <= maxLength; length++) lengths.push(length)

    try {
      const responses = await Promise.all(lengths.map(length =>
        fetch(`https://api.datamuse.com/words?sp=${'?'.repeat(length)}&v=es&max=100`, { signal: controller.signal })
          .then(response => response.ok ? response.json() as Promise<{ word: string }[]> : [])
          .catch(() => [] as { word: string }[])
      ))
      const words = filterFingerspellingWords(
        responses.flat().map(entry => entry.word ?? ''),
        minLength,
        maxLength
      )
      if (words.length < MIN_POOL_SIZE) throw new Error('insufficient word pool')
      return { words, source: this.id }
    } finally {
      window.clearTimeout(timer)
    }
  }
}