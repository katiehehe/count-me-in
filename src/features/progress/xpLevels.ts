/**
 * XP → level/rank progression and the daily-goal math. All pure and unit-tested;
 * the lifetime `companionXp` is the only input to levels and the leaderboard.
 */

/**
 * Cumulative lifetime XP needed to REACH a level. Each level costs progressively
 * more (level L→L+1 needs 50·L XP), giving a gentle rising curve:
 * L1 0 · L2 50 · L3 150 · L4 300 · L5 500 · L6 750 · L7 1050 · L8 1400 …
 */
export function xpThresholdForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level))
  return 25 * (l - 1) * l
}

/** Tasteful, math/explorer-themed rank titles; the last one covers every higher level. */
export const RANKS: readonly string[] = [
  'Curious Counter',
  'Number Navigator',
  'Pattern Spotter',
  'Probability Apprentice',
  'Combinatorics Cadet',
  'Expectation Explorer',
  'Likelihood Luminary',
  'Grand Mathematician',
]

export function rankForLevel(level: number): string {
  const idx = Math.min(Math.max(1, Math.floor(level)), RANKS.length) - 1
  return RANKS[idx]
}

export interface LevelInfo {
  level: number
  rank: string
  /** XP accumulated past the current level's threshold. */
  xpIntoLevel: number
  /** XP span from this level to the next (50·level). */
  xpForNextLevel: number
}

/** Resolves lifetime XP into a level, rank, and progress toward the next level. */
export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp || 0))
  let level = 1
  while (xpThresholdForLevel(level + 1) <= xp) level++
  const base = xpThresholdForLevel(level)
  return {
    level,
    rank: rankForLevel(level),
    xpIntoLevel: xp - base,
    xpForNextLevel: xpThresholdForLevel(level + 1) - base,
  }
}

/** Default daily XP target for the header goal ring. */
export const DAILY_XP_GOAL = 40

/** Today's XP, honoring the day stamp — a new day reads as 0 until more XP lands. */
export function xpEarnedToday(
  xpToday: number | undefined,
  xpTodayDate: string | undefined,
  today: string,
): number {
  if (xpTodayDate !== today) return 0
  return Math.max(0, xpToday ?? 0)
}

/** Fraction of the daily goal reached (clamped to 0–1). */
export function dailyGoalRatio(xpToday: number, goal: number = DAILY_XP_GOAL): number {
  if (goal <= 0) return 1
  return Math.min(1, Math.max(0, xpToday / goal))
}

export function isDailyGoalMet(xpToday: number, goal: number = DAILY_XP_GOAL): boolean {
  return xpToday >= goal
}
