import { describe, expect, it } from 'vitest'
import { xpForLevel } from './practiceEngine'
import {
  learnerLevelFromMastery,
  levelFactor,
  selfTestXpPerCorrect,
  timePressureMult,
} from './selfTestXp'

describe('learnerLevelFromMastery', () => {
  it('maps average mastery to a clamped 1–5 level', () => {
    expect(learnerLevelFromMastery(0)).toBe(1)
    expect(learnerLevelFromMastery(1)).toBe(5)
    expect(learnerLevelFromMastery(0.6)).toBe(3)
    expect(learnerLevelFromMastery(2)).toBe(5)
    expect(learnerLevelFromMastery(-1)).toBe(1)
  })
})

describe('timePressureMult', () => {
  it('rewards tighter paces and pays base when untimed', () => {
    expect(timePressureMult(null)).toBe(1.0)
    expect(timePressureMult(25)).toBe(1.1)
    expect(timePressureMult(20)).toBe(1.1)
    expect(timePressureMult(15)).toBe(1.25)
    expect(timePressureMult(12)).toBe(1.25)
    expect(timePressureMult(8)).toBe(1.45)
  })
})

describe('levelFactor', () => {
  it('is full at or above level and decays below it, floored at 0.2', () => {
    expect(levelFactor(5, 3)).toBe(1.0)
    expect(levelFactor(3, 3)).toBe(1.0)
    expect(levelFactor(2, 3)).toBeCloseTo(0.7, 5)
    expect(levelFactor(1, 3)).toBeCloseTo(0.4, 5)
    expect(levelFactor(1, 5)).toBe(0.2)
  })
})

describe('selfTestXpPerCorrect', () => {
  it('scales base XP by pace and the rising-bar factor', () => {
    expect(selfTestXpPerCorrect(3, null, 3)).toBe(xpForLevel(3))
    expect(selfTestXpPerCorrect(2, 8, 2)).toBe(Math.round(xpForLevel(2) * 1.45))
    expect(selfTestXpPerCorrect(1, null, 5)).toBe(Math.round(xpForLevel(1) * 0.2))
  })

  it('pays less for an easy test once you have leveled up', () => {
    expect(selfTestXpPerCorrect(2, null, 5)).toBeLessThan(selfTestXpPerCorrect(5, null, 5))
  })

  it('is never negative across the whole config grid', () => {
    for (let d = 1; d <= 5; d++) {
      for (let lvl = 1; lvl <= 5; lvl++) {
        expect(selfTestXpPerCorrect(d, null, lvl)).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
