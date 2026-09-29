export interface LevelDefinition {
  index: number
  minWordLength: number
  maxWordLength: number
  wordsRequired: number
}

export const LEVELS: readonly LevelDefinition[] = [
  { index: 0, minWordLength: 3, maxWordLength: 4, wordsRequired: 3 },
  { index: 1, minWordLength: 4, maxWordLength: 5, wordsRequired: 5 },
  { index: 2, minWordLength: 5, maxWordLength: 6, wordsRequired: 7 },
  { index: 3, minWordLength: 6, maxWordLength: 7, wordsRequired: 9 },
  { index: 4, minWordLength: 7, maxWordLength: 9, wordsRequired: 12 },
]