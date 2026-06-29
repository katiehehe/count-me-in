import { describe, expect, it } from 'vitest'
import { nextStreakFields, todayDateString, updateStreak } from './streaks'

const TODAY = '2026-06-28'
const YESTERDAY = '2026-06-27'
const THREE_AGO = '2026-06-25'

describe('updateStreak', () => {
  it('starts a streak with no prior activity', () => {
    expect(updateStreak(0, null, TODAY)).toEqual({
      streakCount: 1,
      lastActiveDate: TODAY,
      tokensConsumed: 0,
    })
  })

  it('is a no-op on the same day', () => {
    expect(updateStreak(5, TODAY, TODAY)).toEqual({
      streakCount: 5,
      lastActiveDate: TODAY,
      tokensConsumed: 0,
    })
  })

  it('extends on a 1-day gap', () => {
    expect(updateStreak(5, YESTERDAY, TODAY)).toEqual({
      streakCount: 6,
      lastActiveDate: TODAY,
      tokensConsumed: 0,
    })
  })

  it('resets on a multi-day gap with no tokens', () => {
    expect(updateStreak(5, THREE_AGO, TODAY)).toEqual({
      streakCount: 1,
      lastActiveDate: TODAY,
      tokensConsumed: 0,
    })
  })

  it('consumes one token to save a multi-day gap', () => {
    expect(updateStreak(5, THREE_AGO, TODAY, 2)).toEqual({
      streakCount: 6,
      lastActiveDate: TODAY,
      tokensConsumed: 1,
    })
  })

  it('still resets a multi-day gap when out of tokens', () => {
    expect(updateStreak(5, THREE_AGO, TODAY, 0).streakCount).toBe(1)
  })
})

describe('nextStreakFields', () => {
  it('omits token fields on normal activity', () => {
    expect(nextStreakFields(5, YESTERDAY, 2, TODAY)).toEqual({
      streakCount: 6,
      lastActiveDate: TODAY,
    })
  })

  it('decrements tokens and stamps the freeze date on consumption', () => {
    expect(nextStreakFields(5, THREE_AGO, 2, TODAY)).toEqual({
      streakCount: 6,
      lastActiveDate: TODAY,
      streakFreezeTokens: 1,
      lastStreakFreezeDate: TODAY,
    })
  })

  it('resets without touching tokens when none are held', () => {
    expect(nextStreakFields(5, THREE_AGO, 0, TODAY)).toEqual({
      streakCount: 1,
      lastActiveDate: TODAY,
    })
  })
})

describe('todayDateString', () => {
  it('formats YYYY-MM-DD', () => {
    expect(todayDateString(new Date('2026-06-28T09:00:00'))).toBe('2026-06-28')
  })
})
