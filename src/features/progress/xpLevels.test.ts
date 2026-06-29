import { describe, expect, it } from 'vitest'
import {
  DAILY_XP_GOAL,
  dailyGoalRatio,
  isDailyGoalMet,
  levelFromXp,
  rankForLevel,
  RANKS,
  xpEarnedToday,
  xpThresholdForLevel,
} from './xpLevels'

describe('xpThresholdForLevel', () => {
  it('is a rising 25·(L-1)·L curve', () => {
    expect(xpThresholdForLevel(1)).toBe(0)
    expect(xpThresholdForLevel(2)).toBe(50)
    expect(xpThresholdForLevel(3)).toBe(150)
    expect(xpThresholdForLevel(4)).toBe(300)
    expect(xpThresholdForLevel(5)).toBe(500)
    expect(xpThresholdForLevel(8)).toBe(1400)
  })
})

describe('levelFromXp', () => {
  it('places XP in the right level with progress to next', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpForNextLevel: 50 })
    expect(levelFromXp(49)).toMatchObject({ level: 1, xpIntoLevel: 49, xpForNextLevel: 50 })
    expect(levelFromXp(50)).toMatchObject({ level: 2, xpIntoLevel: 0, xpForNextLevel: 100 })
    expect(levelFromXp(149)).toMatchObject({ level: 2, xpIntoLevel: 99, xpForNextLevel: 100 })
    expect(levelFromXp(150)).toMatchObject({ level: 3, xpIntoLevel: 0, xpForNextLevel: 150 })
    expect(levelFromXp(500)).toMatchObject({ level: 5, xpIntoLevel: 0 })
  })

  it('is monotonic and handles junk input', () => {
    expect(levelFromXp(-100).level).toBe(1)
    expect(levelFromXp(Number.NaN).level).toBe(1)
    expect(levelFromXp(100000).level).toBeGreaterThan(levelFromXp(1000).level)
  })

  it('attaches a rank name', () => {
    expect(levelFromXp(0).rank).toBe('Curious Counter')
    expect(levelFromXp(50).rank).toBe('Number Navigator')
  })
})

describe('rankForLevel', () => {
  it('clamps to the catalog ends', () => {
    expect(rankForLevel(1)).toBe(RANKS[0])
    expect(rankForLevel(RANKS.length)).toBe(RANKS[RANKS.length - 1])
    expect(rankForLevel(999)).toBe(RANKS[RANKS.length - 1])
  })
})

describe('xpEarnedToday', () => {
  it('only counts XP stamped with today', () => {
    expect(xpEarnedToday(30, '2026-06-28', '2026-06-28')).toBe(30)
    expect(xpEarnedToday(30, '2026-06-27', '2026-06-28')).toBe(0)
    expect(xpEarnedToday(undefined, undefined, '2026-06-28')).toBe(0)
  })
})

describe('daily goal', () => {
  it('clamps the ratio and detects completion', () => {
    expect(dailyGoalRatio(0)).toBe(0)
    expect(dailyGoalRatio(DAILY_XP_GOAL / 2)).toBeCloseTo(0.5)
    expect(dailyGoalRatio(DAILY_XP_GOAL)).toBe(1)
    expect(dailyGoalRatio(DAILY_XP_GOAL * 10)).toBe(1)
    expect(isDailyGoalMet(DAILY_XP_GOAL - 1)).toBe(false)
    expect(isDailyGoalMet(DAILY_XP_GOAL)).toBe(true)
  })
})
