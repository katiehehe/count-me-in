import { xpForLevel } from './practiceEngine'

/** The learner's current level (1–5) from their average mastery across attempted lessons. */
export function learnerLevelFromMastery(avgMastery: number): number {
  return Math.max(1, Math.min(5, Math.round(avgMastery * 5)))
}

/** Pace multiplier from seconds-per-question; null (untimed) pays the base rate. */
export function timePressureMult(paceSecPerQ: number | null): number {
  if (paceSecPerQ == null) return 1.0
  if (paceSecPerQ < 12) return 1.45
  if (paceSecPerQ < 20) return 1.25
  return 1.1
}

/**
 * Rising-bar factor: a test at or above your level pays full; below your level it
 * pays progressively less (floored at 0.2) the further below it is — so grinding
 * easy tests stops being worth much as you master the material.
 */
export function levelFactor(difficulty: number, learnerLevel: number): number {
  if (difficulty >= learnerLevel) return 1.0
  return Math.max(0.2, 1 - 0.3 * (learnerLevel - difficulty))
}

/** Config-scaled base XP for one correct self-test answer (the speed bonus is added on top). */
export function selfTestXpPerCorrect(
  difficulty: number,
  paceSecPerQ: number | null,
  learnerLevel: number,
): number {
  return Math.round(
    xpForLevel(difficulty) * timePressureMult(paceSecPerQ) * levelFactor(difficulty, learnerLevel),
  )
}
