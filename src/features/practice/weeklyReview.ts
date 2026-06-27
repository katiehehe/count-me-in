import { getLessonById } from '../../content/course'
import { mulberry32 } from '../../content/randomize'
import type { LessonProgressDoc, UserProfile } from '../../firebase/firestoreTypes'
import { todayDateString } from '../progress/streaks'
import { lessonWeakConceptIds, pickConcept, practiceableConcepts } from './practiceEngine'

export interface WeeklyItem {
  lessonId: string
  conceptId: string
}

export const WEEKLY_QUESTION_COUNT = 8
/** A lesson missed this many times in the weekly review is flagged for remediation. */
export const REMEDIATION_MISS_THRESHOLD = 2
/** Weekly review tests base material, so it sits at a mid difficulty. */
export const WEEKLY_DIFFICULTY = 2
const WEEK_DAYS = 7

/** Whole days from local date string `a` to `b` (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime()
  const db = new Date(`${b}T00:00:00`).getTime()
  return Math.round((db - da) / 86_400_000)
}

/** The weekly review unlocks once a week has passed and ≥1 lesson is complete. */
export function weeklyReviewDue(profile: UserProfile | null, completedCount: number): boolean {
  if (completedCount < 1) return false
  if (!profile?.lastWeeklyReviewAt) return true
  return daysBetween(profile.lastWeeklyReviewAt, todayDateString()) >= WEEK_DAYS
}

/**
 * Builds an interleaved set of weekly-review questions across the completed
 * lessons (round-robin so concepts are mixed), favoring each lesson's weak spots.
 */
export function buildWeeklyItems(
  completedLessonIds: string[],
  allProgress: LessonProgressDoc[],
  seed: number,
): WeeklyItem[] {
  const progressById = new Map(allProgress.map((p) => [p.lessonId, p]))
  const rng = mulberry32(seed)

  const lessons = completedLessonIds
    .map((id) => getLessonById(id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
    .map((l) => ({
      id: l.id,
      all: practiceableConcepts(l.concepts),
      weak: lessonWeakConceptIds(progressById.get(l.id) ?? null, l),
    }))
    .filter((l) => l.all.length || l.weak.length)

  if (!lessons.length) return []

  const items: WeeklyItem[] = []
  for (let i = 0; items.length < WEEKLY_QUESTION_COUNT && i < WEEKLY_QUESTION_COUNT * 4; i++) {
    const l = lessons[i % lessons.length]
    const pool = l.all.length ? l.all : l.weak
    items.push({ lessonId: l.id, conceptId: pickConcept(l.weak, pool, rng) })
  }
  return items.slice(0, WEEKLY_QUESTION_COUNT)
}
