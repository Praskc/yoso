export interface WordPool {
  words: readonly string[]
  source: string
}

export interface WordSource {
  readonly id: string
  getWords(level: number, minLength: number, maxLength: number): Promise<WordPool>
}