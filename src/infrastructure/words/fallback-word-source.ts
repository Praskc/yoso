import type { WordPool, WordSource } from '../../application/ports/word-source'

export class FallbackWordSource implements WordSource {
  readonly id: string

  constructor(private readonly primary: WordSource, private readonly secondary: WordSource) {
    this.id = primary.id
  }

  async getWords(level: number, minLength: number, maxLength: number): Promise<WordPool> {
    try {
      return await this.primary.getWords(level, minLength, maxLength)
    } catch {
      return await this.secondary.getWords(level, minLength, maxLength)
    }
  }
}