import { describe, expect, it } from 'vitest'
import {
  recommendedAction,
  summarizeUnderstanding,
  xpForUnderstanding,
} from './challengeXp'

describe('xpForUnderstanding', () => {
  it('awards more XP for stronger understanding', () => {
    expect(xpForUnderstanding('strong')).toBeGreaterThan(xpForUnderstanding('developing'))
    expect(xpForUnderstanding('developing')).toBeGreaterThan(xpForUnderstanding('needs_review'))
    expect(xpForUnderstanding('needs_review')).toBeGreaterThan(0)
  })
})

describe('summarizeUnderstanding', () => {
  it('returns developing for an empty session', () => {
    expect(summarizeUnderstanding([])).toBe('developing')
  })
  it('summarizes all-strong as strong and all-weak as needs_review', () => {
    expect(summarizeUnderstanding(['strong', 'strong', 'strong'])).toBe('strong')
    expect(summarizeUnderstanding(['needs_review', 'needs_review'])).toBe('needs_review')
  })
  it('lands in the middle for mixed results', () => {
    expect(summarizeUnderstanding(['strong', 'needs_review'])).toBe('developing')
  })
})

describe('recommendedAction', () => {
  it('maps understanding to a sensible next action', () => {
    expect(recommendedAction('strong')).toBe('continue')
    expect(recommendedAction('developing')).toBe('try_practice')
    expect(recommendedAction('needs_review')).toBe('review_lesson')
  })
})
