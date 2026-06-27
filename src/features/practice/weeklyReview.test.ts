import { describe, expect, it } from 'vitest'
import { course } from '../../content/course'
import type { LessonProgressDoc, UserProfile } from '../../firebase/firestoreTypes'
import { todayDateString } from '../progress/streaks'
import {
  WEEKLY_QUESTION_COUNT,
  buildWeeklyItems,
  daysBetween,
  weeklyReviewDue,
} from './weeklyReview'

function profileWith(lastWeeklyReviewAt?: string): UserProfile {
  return { lastWeeklyReviewAt } as unknown as UserProfile
}

function isoDaysAgo(days: number): string {
  const d = new Date(`${todayDateString()}T00:00:00`)
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('weeklyReviewDue', () => {
  it('is not due without a completed lesson', () => {
    expect(weeklyReviewDue(profileWith(), 0)).toBe(false)
  })
  it('is due when never done (and a lesson is complete)', () => {
    expect(weeklyReviewDue(profileWith(), 1)).toBe(true)
  })
  it('is due only after 7+ days', () => {
    expect(weeklyReviewDue(profileWith(isoDaysAgo(3)), 2)).toBe(false)
    expect(weeklyReviewDue(profileWith(isoDaysAgo(7)), 2)).toBe(true)
    expect(weeklyReviewDue(profileWith(isoDaysAgo(10)), 2)).toBe(true)
  })
})

describe('daysBetween', () => {
  it('counts whole days between local date strings', () => {
    expect(daysBetween('2026-06-01', '2026-06-08')).toBe(7)
    expect(daysBetween('2026-06-08', '2026-06-08')).toBe(0)
  })
})

describe('buildWeeklyItems', () => {
  it('builds the right number of interleaved items across completed lessons', () => {
    const completed = course.lessons.slice(0, 3).map((l) => l.id)
    const progress = completed.map((id) => ({ lessonId: id, stepAnswers: {} }) as unknown as LessonProgressDoc)
    const items = buildWeeklyItems(completed, progress, 42)
    expect(items).toHaveLength(WEEKLY_QUESTION_COUNT)
    // Mixed across lessons (not all from one).
    expect(new Set(items.map((i) => i.lessonId)).size).toBeGreaterThan(1)
    // Every item references a real completed lesson.
    for (const it of items) expect(completed).toContain(it.lessonId)
  })
  it('returns nothing with no completed lessons', () => {
    expect(buildWeeklyItems([], [], 1)).toEqual([])
  })
})
