import type { LessonStep, StepType } from '../../content/types'

export function calculateMastery(correctCount: number, totalCount: number): number {
  if (totalCount === 0) return 0
  return correctCount / totalCount
}

/** A lesson counts as "mastered" once the learner answers ≥ 80% correctly. */
export const MASTERY_GREEN_THRESHOLD = 0.8
export const MASTERY_YELLOW_THRESHOLD = 0.5

export function isLessonMastered(masteryScore: number): boolean {
  return masteryScore >= MASTERY_GREEN_THRESHOLD
}

export type MasteryTierId = 'red' | 'yellow' | 'green'

export interface MasteryTier {
  tier: MasteryTierId
  label: string
}

/**
 * Maps a whole-lesson mastery score (0–1, the fraction of graded questions the
 * learner answered correctly on their first attempt) to a colored tier.
 *  • ≥ 80% → green ("Mastered")
 *  • ≥ 50% → yellow ("Almost there")
 *  • otherwise → red ("Keep practicing")
 */
export function getMasteryTier(masteryScore: number): MasteryTier {
  if (masteryScore >= MASTERY_GREEN_THRESHOLD) return { tier: 'green', label: 'Mastered' }
  if (masteryScore >= MASTERY_YELLOW_THRESHOLD) return { tier: 'yellow', label: 'Almost there' }
  return { tier: 'red', label: 'Keep practicing' }
}

/**
 * Step types whose first-attempt correctness counts toward the lesson mastery
 * score. Exploratory/build steps (arrangement, connection, tree, factorial
 * discovery, intro, completion) are not graded.
 */
export const GRADED_STEP_TYPES: ReadonlyArray<StepType> = ['multiple-choice', 'numeric-question']

export function isGradedStepType(type: StepType): boolean {
  return GRADED_STEP_TYPES.includes(type)
}

export function countGradedSteps(steps: Pick<LessonStep, 'type'>[]): number {
  return steps.filter((s) => isGradedStepType(s.type)).length
}

export function calculateConceptMastery(
  answers: Array<{ conceptId: string; correct: boolean }>,
): Record<string, number> {
  const totals: Record<string, { correct: number; total: number }> = {}

  for (const { conceptId, correct } of answers) {
    if (!totals[conceptId]) totals[conceptId] = { correct: 0, total: 0 }
    totals[conceptId].total++
    if (correct) totals[conceptId].correct++
  }

  const result: Record<string, number> = {}
  for (const [id, { correct, total }] of Object.entries(totals)) {
    result[id] = calculateMastery(correct, total)
  }
  return result
}

export function mergeConceptMastery(
  existing: Record<string, number>,
  incoming: Record<string, number>,
): Record<string, number> {
  const merged = { ...existing }
  for (const [id, score] of Object.entries(incoming)) {
    if (merged[id] === undefined) {
      merged[id] = score
    } else {
      merged[id] = (merged[id] + score) / 2
    }
  }
  return merged
}
