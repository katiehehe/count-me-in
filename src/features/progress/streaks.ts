export function todayDateString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function updateStreak(
  currentStreak: number,
  lastActiveDate: string | null,
  today = todayDateString(),
): { streakCount: number; lastActiveDate: string } {
  if (!lastActiveDate) {
    return { streakCount: 1, lastActiveDate: today }
  }

  if (lastActiveDate === today) {
    return { streakCount: currentStreak, lastActiveDate: today }
  }

  const last = new Date(`${lastActiveDate}T12:00:00`)
  const now = new Date(`${today}T12:00:00`)
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return { streakCount: currentStreak + 1, lastActiveDate: today }
  }

  return { streakCount: 1, lastActiveDate: today }
}
