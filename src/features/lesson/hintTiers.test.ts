import { describe, expect, it } from 'vitest'
import { coerceHintTiers } from './hintTiers'

describe('coerceHintTiers', () => {
  it('keeps exactly three trimmed tiers, truncating extras', () => {
    expect(coerceHintTiers(['  a  ', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c'])
  })

  it('pads by repeating the last tier when given fewer than three', () => {
    expect(coerceHintTiers(['only one'])).toEqual(['only one', 'only one', 'only one'])
    expect(coerceHintTiers(['a', 'b'])).toEqual(['a', 'b', 'b'])
  })

  it('drops blanks and falls back to three generic tiers when empty', () => {
    expect(coerceHintTiers([])).toHaveLength(3)
    expect(coerceHintTiers(['', '   '])).toHaveLength(3)
    expect(coerceHintTiers(null)).toHaveLength(3)
    expect(coerceHintTiers('nope')).toHaveLength(3)
  })

  it('always returns exactly three tiers', () => {
    for (const input of [[], ['a'], ['a', 'b'], ['a', 'b', 'c'], ['a', 'b', 'c', 'd', 'e']]) {
      expect(coerceHintTiers(input)).toHaveLength(3)
    }
  })
})
