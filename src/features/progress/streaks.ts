export function todayDateString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface StreakUpdate {
  streakCount: number
  lastActiveDate: string
  /** Streak-freeze tokens consumed by this update (0 or 1). */
  tokensConsumed: number
}

/**
 * Advances a streak for activity on `today`. A same-day repeat is a no-op; a
 * 1-day gap extends the streak. A LONGER gap normally resets to 1 — but if the
 * learner holds at least one streak-freeze token, exactly ONE token is consumed
 * to save the streak (which then extends as if no gap), regardless of gap length.
 */
export function updateStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  today = todayDateString(),
  freezeTokens = 0,
): StreakUpdate {
  if (!lastActiveDate) {
    return { streakCount: 1, lastActiveDate: today, tokensConsumed: 0 }
  }

  if (lastActiveDate === today) {
    return { streakCount: currentStreak, lastActiveDate: today, tokensConsumed: 0 }
  }

  const last = new Date(`${lastActiveDate}T12:00:00`)
  const now = new Date(`${today}T12:00:00`)
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return { streakCount: currentStreak + 1, lastActiveDate: today, tokensConsumed: 0 }
  }

  if (diffDays > 1 && freezeTokens >= 1) {
    // A token patches the missed day(s); today still extends the streak.
    return { streakCount: currentStreak + 1, lastActiveDate: today, tokensConsumed: 1 }
  }

  return { streakCount: 1, lastActiveDate: today, tokensConsumed: 0 }
}

/**
 * Produces the profile fields to merge after a streak-bumping activity, applying a
 * freeze token when needed. `streakFreezeTokens` is only included when it changes,
 * and `lastStreakFreezeDate` only when a freeze was actually consumed — so normal
 * activity never clobbers a concurrently-purchased token.
 */
export function nextStreakFields(
  currentStreak: number,
  lastActiveDate: string | null,
  freezeTokens: number,
  today = todayDateString(),
): {
  streakCount: number
  lastActiveDate: string
  streakFreezeTokens?: number
  lastStreakFreezeDate?: string
} {
  const u = updateStreak(currentStreak, lastActiveDate, today, freezeTokens)
  if (u.tokensConsumed > 0) {
    return {
      streakCount: u.streakCount,
      lastActiveDate: u.lastActiveDate,
      streakFreezeTokens: Math.max(0, freezeTokens - u.tokensConsumed),
      lastStreakFreezeDate: today,
    }
  }
  return { streakCount: u.streakCount, lastActiveDate: u.lastActiveDate }
}
