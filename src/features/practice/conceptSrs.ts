import type { ConceptSrsState } from '../../firebase/firestoreTypes'
import { todayDateString } from '../progress/streaks'

/** Hard ceiling on due concepts a single review session will surface (size is otherwise dynamic). */
export const MAX_REVIEW_ITEMS = 40

const EASE_MIN = 1.3
const EASE_MAX = 2.7

/** Adds `n` days to a local YYYY-MM-DD date, returning a YYYY-MM-DD local date. */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return todayDateString(d)
}

/**
 * A freshly-learned concept's first review is scheduled for tomorrow, so it is
 * not instantly due the moment the lesson is finished.
 */
export function initialSrsState(today: string): ConceptSrsState {
  return {
    reps: 0,
    intervalDays: 0,
    ease: 2.5,
    due: addDays(today, 1),
    lapses: 0,
    lastReviewed: today,
  }
}

function clampEase(ease: number): number {
  return Math.max(EASE_MIN, Math.min(EASE_MAX, ease))
}

/**
 * SM-2-lite next schedule. A correct answer grows the interval (1 → 3 → ease-scaled)
 * and gently raises ease (so well-mastered concepts resurface less often); a miss
 * resets reps, drops ease by 0.2 (floored at 1.3), counts a lapse, and leaves the
 * concept due today so it can be re-tested in the same session until answered right.
 */
export function scheduleNext(
  state: ConceptSrsState,
  correct: boolean,
  today: string,
): ConceptSrsState {
  if (!correct) {
    return {
      reps: 0,
      intervalDays: 1,
      ease: clampEase(state.ease - 0.2),
      due: today,
      lapses: state.lapses + 1,
      lastReviewed: today,
    }
  }

  const reps = state.reps + 1
  const intervalDays =
    reps === 1 ? 1 : reps === 2 ? 3 : Math.max(1, Math.round(state.intervalDays * state.ease))
  return {
    reps,
    intervalDays,
    ease: Math.min(EASE_MAX, state.ease + 0.05),
    due: addDays(today, intervalDays),
    lapses: state.lapses,
    lastReviewed: today,
  }
}

/** True once a concept's scheduled date has arrived (YYYY-MM-DD sorts lexicographically). */
export function isDue(state: ConceptSrsState, today: string): boolean {
  return state.due <= today
}

/**
 * The learned concepts due for review today, most-overdue first. A concept with no
 * schedule yet counts as due, so learners who finished lessons before SRS existed
 * get reviews immediately. Missing schedules sort as the earliest possible due date.
 */
export function reviewDueConceptIds(
  map: Record<string, ConceptSrsState>,
  learnedConceptIds: string[],
  today: string,
): string[] {
  return learnedConceptIds
    .filter((id) => !map[id] || isDue(map[id], today))
    .sort((a, b) => (map[a]?.due ?? '0000-00-00').localeCompare(map[b]?.due ?? '0000-00-00'))
}
