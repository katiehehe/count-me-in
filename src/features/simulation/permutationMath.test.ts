import { describe, expect, it } from 'vitest'
import {
  allPermutations,
  checkNumericAnswer,
  combinations,
  countingPrinciple,
  factorial,
  formatFactorial,
  formatMultisetFormula,
  multisetPermutationCount,
  permutationCount,
  permutations,
} from './permutationMath'
import {
  calculateMastery,
  countGradedSteps,
  getMasteryTier,
  isGradedStepType,
  isLessonMastered,
} from '../progress/mastery'
import { todayDateString, updateStreak } from '../progress/streaks'

describe('permutationMath', () => {
  it('computes factorial', () => {
    expect(factorial(0)).toBe(1)
    expect(factorial(1)).toBe(1)
    expect(factorial(3)).toBe(6)
    expect(factorial(5)).toBe(120)
  })

  it('computes permutation count', () => {
    expect(permutationCount(4)).toBe(24)
  })

  it('formats factorial expression', () => {
    expect(formatFactorial(4)).toBe('4 × 3 × 2 × 1')
  })

  it('checks numeric answers with tolerance', () => {
    expect(checkNumericAnswer(24, 24, 0)).toBe(true)
    expect(checkNumericAnswer(23, 24, 0)).toBe(false)
    expect(checkNumericAnswer(24.5, 24, 1)).toBe(true)
  })

  it('counts multiset permutations', () => {
    expect(multisetPermutationCount([2, 1])).toBe(3) // 2 red + 1 blue
    expect(multisetPermutationCount([3, 2])).toBe(10) // 3 red + 2 blue
    expect(multisetPermutationCount([3, 2, 1])).toBe(60) // BANANA
    expect(multisetPermutationCount([2, 2])).toBe(6) // 2 red + 2 blue
    expect(multisetPermutationCount([1, 1, 1])).toBe(6) // all distinct
    expect(multisetPermutationCount([4, 4, 2, 1])).toBe(34650) // MISSISSIPPI
  })

  it('formats the multiset formula', () => {
    expect(formatMultisetFormula([3, 2, 1])).toBe('6! / (3! × 2! × 1!)')
  })

  it('computes permutations (nPr, order matters)', () => {
    expect(permutations(5, 3)).toBe(60)
    expect(permutations(10, 2)).toBe(90)
    expect(permutations(4, 4)).toBe(24)
    expect(permutations(5, 0)).toBe(1)
    expect(permutations(3, 5)).toBe(0)
  })

  it('computes combinations (nCr, order does not matter)', () => {
    expect(combinations(10, 3)).toBe(120)
    expect(combinations(5, 2)).toBe(10)
    expect(combinations(4, 2)).toBe(6)
    expect(combinations(52, 5)).toBe(2598960)
    expect(combinations(6, 0)).toBe(1)
    expect(combinations(6, 6)).toBe(1)
    expect(combinations(3, 5)).toBe(0)
  })

  it('relates permutations and combinations: nPr = nCr × k!', () => {
    expect(permutations(10, 3)).toBe(combinations(10, 3) * factorial(3))
  })

  it('applies the fundamental counting principle', () => {
    expect(countingPrinciple([3, 2])).toBe(6)
    expect(countingPrinciple([4, 3])).toBe(12)
    expect(countingPrinciple([2, 6, 6])).toBe(72)
    expect(countingPrinciple([])).toBe(1)
  })

  it('enumerates all permutations (used by the condensing visual)', () => {
    // A group of k items has k! orderings — the overcount factor in nCr.
    expect(allPermutations(['a']).length).toBe(1)
    expect(allPermutations(['a', 'b']).length).toBe(2)
    expect(allPermutations(['a', 'b', 'c']).length).toBe(factorial(3))
    expect(allPermutations(['a', 'b', 'c', 'd']).length).toBe(factorial(4))

    const perms = allPermutations(['a', 'b', 'c']).map((p) => p.join(''))
    expect(new Set(perms).size).toBe(6) // all distinct
    expect(perms).toContain('abc')
    expect(perms).toContain('cba')
    // every permutation uses each item exactly once
    for (const p of allPermutations(['a', 'b', 'c'])) {
      expect([...p].sort()).toEqual(['a', 'b', 'c'])
    }
  })
})

describe('mastery', () => {
  it('calculates mastery ratio', () => {
    expect(calculateMastery(2, 3)).toBeCloseTo(0.667, 2)
  })

  it('marks lesson mastered at 80%', () => {
    expect(isLessonMastered(0.8)).toBe(true)
    expect(isLessonMastered(0.79)).toBe(false)
  })

  it('maps a whole-lesson fraction to colored tiers (<50% red, 50-79% yellow, ≥80% green)', () => {
    expect(getMasteryTier(0).tier).toBe('red')
    expect(getMasteryTier(0.49).tier).toBe('red')
    expect(getMasteryTier(0.5).tier).toBe('yellow')
    expect(getMasteryTier(0.79).tier).toBe('yellow')
    expect(getMasteryTier(0.8).tier).toBe('green')
    expect(getMasteryTier(1).tier).toBe('green')
    expect(getMasteryTier(1).label).toBe('Mastered')
    expect(getMasteryTier(0.6).label).toBe('Almost there')
    expect(getMasteryTier(0.2).label).toBe('Keep practicing')
  })

  it('identifies graded step types and counts them', () => {
    expect(isGradedStepType('multiple-choice')).toBe(true)
    expect(isGradedStepType('numeric-question')).toBe(true)
    expect(isGradedStepType('intro')).toBe(false)
    expect(isGradedStepType('connection')).toBe(false)
    expect(isGradedStepType('tree')).toBe(false)
    expect(
      countGradedSteps([
        { type: 'intro' },
        { type: 'multiple-choice' },
        { type: 'numeric-question' },
        { type: 'connection' },
        { type: 'completion' },
      ]),
    ).toBe(2)
  })
})

describe('streaks', () => {
  it('starts streak on first activity', () => {
    const today = todayDateString()
    expect(updateStreak(0, null, today)).toEqual({ streakCount: 1, lastActiveDate: today })
  })

  it('increments streak on consecutive days', () => {
    const today = '2026-06-23'
    expect(updateStreak(3, '2026-06-22', today)).toEqual({ streakCount: 4, lastActiveDate: today })
  })

  it('resets streak after gap', () => {
    const today = '2026-06-23'
    expect(updateStreak(5, '2026-06-20', today)).toEqual({ streakCount: 1, lastActiveDate: today })
  })
})
