import { describe, expect, it } from 'vitest'
import type { ConceptSrsState } from '../../firebase/firestoreTypes'
import { addDays, initialSrsState, isDue, reviewDueConceptIds, scheduleNext } from './conceptSrs'

const TODAY = '2026-06-26'

function state(overrides: Partial<ConceptSrsState> = {}): ConceptSrsState {
  return { reps: 1, intervalDays: 1, ease: 2.5, due: TODAY, lapses: 0, lastReviewed: TODAY, ...overrides }
}

describe('addDays', () => {
  it('adds and subtracts local calendar days, crossing month/year boundaries', () => {
    expect(addDays('2026-06-26', 0)).toBe('2026-06-26')
    expect(addDays('2026-06-26', 1)).toBe('2026-06-27')
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('initialSrsState', () => {
  it('schedules the first review for tomorrow, not instantly due', () => {
    const s = initialSrsState(TODAY)
    expect(s.reps).toBe(0)
    expect(s.intervalDays).toBe(0)
    expect(s.ease).toBe(2.5)
    expect(s.lapses).toBe(0)
    expect(s.lastReviewed).toBe(TODAY)
    expect(s.due).toBe(addDays(TODAY, 1))
    expect(isDue(s, TODAY)).toBe(false)
  })
})

describe('scheduleNext (correct)', () => {
  it('grows the interval 1 → 3 → ease-scaled, raises ease, with due in the future', () => {
    const s0 = initialSrsState(TODAY)

    const s1 = scheduleNext(s0, true, TODAY)
    expect(s1.reps).toBe(1)
    expect(s1.intervalDays).toBe(1)
    expect(s1.ease).toBeCloseTo(2.55, 5)
    expect(s1.due).toBe(addDays(TODAY, 1))

    const s2 = scheduleNext(s1, true, TODAY)
    expect(s2.reps).toBe(2)
    expect(s2.intervalDays).toBe(3)
    expect(s2.ease).toBeCloseTo(2.6, 5)
    expect(s2.due).toBe(addDays(TODAY, 3))

    const s3 = scheduleNext(s2, true, TODAY)
    expect(s3.reps).toBe(3)
    expect(s3.intervalDays).toBe(Math.max(1, Math.round(3 * s2.ease)))
    expect(s3.ease).toBeGreaterThan(s2.ease)
    expect(s3.ease).toBeLessThanOrEqual(2.7)
    expect(s3.due).toBe(addDays(TODAY, s3.intervalDays))
    expect(s3.due > TODAY).toBe(true)
    expect(s3.lapses).toBe(0)
  })

  it('caps ease at 2.7 across repeated correct reviews', () => {
    let s = state({ ease: 2.68 })
    s = scheduleNext(s, true, TODAY)
    expect(s.ease).toBe(2.7)
    s = scheduleNext(s, true, TODAY)
    expect(s.ease).toBe(2.7)
  })
})

describe('scheduleNext (incorrect)', () => {
  it('resets reps, lowers ease by 0.2, stays due today, and counts a lapse', () => {
    const s = scheduleNext(state({ reps: 4, intervalDays: 20, ease: 2.5, lapses: 1 }), false, TODAY)
    expect(s.reps).toBe(0)
    expect(s.intervalDays).toBe(1)
    expect(s.ease).toBeCloseTo(2.3, 5)
    expect(s.due).toBe(TODAY)
    expect(isDue(s, TODAY)).toBe(true)
    expect(s.lapses).toBe(2)
  })

  it('floors ease at 1.3', () => {
    const s = scheduleNext(state({ ease: 1.3 }), false, TODAY)
    expect(s.ease).toBe(1.3)
  })
})

describe('isDue', () => {
  it('is true for past and equal dates, false for the future', () => {
    expect(isDue(state({ due: '2026-06-25' }), TODAY)).toBe(true)
    expect(isDue(state({ due: TODAY }), TODAY)).toBe(true)
    expect(isDue(state({ due: '2026-06-27' }), TODAY)).toBe(false)
  })
})

describe('reviewDueConceptIds', () => {
  it('counts missing state as due, excludes future-due, and orders most-overdue first', () => {
    const map: Record<string, ConceptSrsState> = {
      a: state({ due: '2026-06-20' }),
      b: state({ due: '2026-07-30' }),
      c: state({ due: '2026-06-24' }),
    }
    const due = reviewDueConceptIds(map, ['a', 'b', 'c', 'd'], TODAY)
    expect(due).not.toContain('b')
    // 'd' has no schedule (treated as the earliest possible due date) → first.
    expect(due).toEqual(['d', 'a', 'c'])
  })

  it('returns nothing when nothing has been learned', () => {
    expect(reviewDueConceptIds({}, [], TODAY)).toEqual([])
  })
})
