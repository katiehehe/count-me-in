/** Most speed-bonus XP a single correct answer can earn (on top of its base XP). */
export const MAX_TIME_BONUS = 10
/** Time constant of the decay (ms): around this much active time roughly halves-ish the bonus. */
export const TAU_MS = 8000

/**
 * Speed-bonus XP for a correct answer: ~max for an instant answer, decaying smoothly
 * toward 0 the longer it takes. Always >= 0, monotonically non-increasing in time, and
 * only ever ADDED to a correct answer's XP — a wrong answer never earns it.
 */
export function timeBonusXp(activeMs: number): number {
  return Math.round(MAX_TIME_BONUS * Math.exp(-Math.max(0, activeMs) / TAU_MS))
}
