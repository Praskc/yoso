import { describe, expect, it } from 'vitest'
import { BACKSPACE, DISPLAY_LETTERS, MODEL_CLASSES, SPACE, isCommand } from './alphabet'

describe('MODEL_CLASSES', () => {
  it('has the 28 model classes in output order', () => {
    expect(MODEL_CLASSES).toHaveLength(28)
    expect(MODEL_CLASSES[0]).toBe('A')
    expect(MODEL_CLASSES[25]).toBe('Z')
    expect(MODEL_CLASSES[26]).toBe(SPACE)
    expect(MODEL_CLASSES[27]).toBe(BACKSPACE)
  })
})

describe('DISPLAY_LETTERS', () => {
  it('has the 27 spanish display letters with Ñ after N', () => {
    expect(DISPLAY_LETTERS).toHaveLength(27)
    expect(DISPLAY_LETTERS[13]).toBe('N')
    expect(DISPLAY_LETTERS[14]).toBe('Ñ')
    expect(DISPLAY_LETTERS).not.toContain(SPACE)
    expect(DISPLAY_LETTERS).not.toContain(BACKSPACE)
  })
})

describe('isCommand', () => {
  it('recognizes space and backspace as commands', () => {
    expect(isCommand(SPACE)).toBe(true)
    expect(isCommand(BACKSPACE)).toBe(true)
  })

  it('rejects letters', () => {
    expect(isCommand('A')).toBe(false)
    expect(isCommand('Ñ')).toBe(false)
  })
})