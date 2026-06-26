import type { ChallengeUnderstanding, RecommendedNextAction } from './challengeTypes'

/**
 * Companion XP awarded per answered question, keyed by the soft understanding
 * label. XP is computed deterministically in code (never taken from the AI's
 * `xpAwarded` field) so the reward system can't be gamed by prompt manipulation.
 */
export const XP_BY_UNDERSTANDING: Record<ChallengeUnderstanding, number> = {
  strong: 20,
  developing: 12,
  needs_review: 6,
}

export function xpForUnderstanding(u: ChallengeUnderstanding): number {
  return XP_BY_UNDERSTANDING[u] ?? 0
}

/** Learner-facing labels — intentionally encouraging, never "pass/fail". */
export const UNDERSTANDING_LABEL: Record<ChallengeUnderstanding, string> = {
  strong: 'Strong understanding',
  developing: 'Almost there',
  needs_review: 'Worth reviewing',
}

export const ACTION_LABEL: Record<RecommendedNextAction, string> = {
  continue: 'Continue to the next lesson',
  review_lesson: 'Review this lesson',
  try_practice: 'Try a little more practice',
}

/** Aggregates per-question understanding into one overall session label. */
export function summarizeUnderstanding(items: ChallengeUnderstanding[]): ChallengeUnderstanding {
  if (items.length === 0) return 'developing'
  const score: Record<ChallengeUnderstanding, number> = {
    strong: 2,
    developing: 1,
    needs_review: 0,
  }
  const avg = items.reduce((sum, u) => sum + score[u], 0) / items.length
  if (avg >= 1.5) return 'strong'
  if (avg >= 0.75) return 'developing'
  return 'needs_review'
}

/** Maps an overall understanding to a recommended next action. */
export function recommendedAction(overall: ChallengeUnderstanding): RecommendedNextAction {
  if (overall === 'strong') return 'continue'
  if (overall === 'developing') return 'try_practice'
  return 'review_lesson'
}
