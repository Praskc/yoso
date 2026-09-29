import type { WordPool, WordSource } from '../../application/ports/word-source'
import { WORD_BANK } from './word-bank'

export class LocalBankWordSource implements WordSource {
  readonly id = 'local'

  async getWords(level: number): Promise<WordPool> {
    const bank = WORD_BANK[level] ?? WORD_BANK[1]
    const words = [...bank]
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j], words[i]]
    }
    return { words, source: this.id }
  }
}