const DISALLOWED_PATTERNS = /TH|CK|WH|GH/
const LETTERS_PATTERN = /^[A-Z]+$/

export function normalizeWord(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

export function isValidFingerspellingWord(word: string, minLength: number, maxLength: number): boolean {
  return word.length >= minLength
    && word.length <= maxLength
    && LETTERS_PATTERN.test(word)
    && !DISALLOWED_PATTERNS.test(word)
}

export function filterFingerspellingWords(rawWords: readonly string[], minLength: number, maxLength: number): string[] {
  const unique = new Set<string>()
  for (const raw of rawWords) {
    const word = normalizeWord(raw)
    if (isValidFingerspellingWord(word, minLength, maxLength)) unique.add(word)
  }
  return [...unique]
}