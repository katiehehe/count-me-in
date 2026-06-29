import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { todayDateString } from '../features/progress/streaks'
import {
  DAILY_XP_GOAL,
  isDailyGoalMet,
  levelFromXp,
  xpEarnedToday,
} from '../features/progress/xpLevels'
import { spendableBalance } from '../features/progress/xpWallet'
import { MasteryRing } from './MasteryRing'

export function Layout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const isLesson = location.pathname.startsWith('/lesson/')
  // Demo-mode banner is for guests actively using the app — not on the login page
  // they're being sent to, where it'd be redundant.
  const showDemoBanner = !!user?.isAnonymous && location.pathname !== '/login'

  const rawName = profile?.displayName ?? user?.displayName ?? ''
  const firstName = rawName && rawName !== 'Learner' ? rawName.split(' ')[0] : ''
  const companionXp = profile?.companionXp ?? 0
  const { level, rank, xpIntoLevel, xpForNextLevel } = levelFromXp(companionXp)
  const today = todayDateString()
  const xpToday = xpEarnedToday(profile?.xpToday, profile?.xpTodayDate, today)
  const goalMet = isDailyGoalMet(xpToday)
  const tokens = profile?.streakFreezeTokens ?? 0
  const balance = spendableBalance(profile)
  const streak = profile?.streakCount ?? 0
  const frozeToday = profile?.lastStreakFreezeDate === today

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-brand-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-accent-400 font-serif text-sm font-semibold text-white shadow-sm shadow-brand-200">
              #
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight text-slate-900">
              Count Me In
            </span>
            </Link>
            {user && firstName && (
              <span className="hidden max-w-[10rem] truncate border-l border-slate-200 pl-3 text-sm font-semibold text-brand-600 sm:inline">
                Hello, {firstName} 👋
              </span>
            )}
          </div>

          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            {user ? (
              <>
                {!isLesson && (
                  <Link
                    to="/course"
                    className="hidden font-medium text-slate-600 hover:text-brand-600 sm:inline"
                  >
                    Course
                  </Link>
                )}
                <Link
                  to="/leaderboard"
                  title="Leaderboard"
                  className="rounded-lg px-1.5 py-1.5 text-base leading-none hover:bg-slate-100"
                >
                  <span aria-hidden>🏆</span>
                  <span className="sr-only">Leaderboard</span>
                </Link>
                {/* Level ring + lifetime XP — tap to spend in the shop. */}
                <Link
                  to="/shop"
                  title={`⭐ ${balance} spendable in the shop · ${rank} · Level ${level} · ${xpIntoLevel}/${xpForNextLevel} XP to next level (lifetime ${companionXp})`}
                  className="flex items-center gap-1.5 rounded-full border border-lavender-200 bg-lavender-50 py-0.5 pl-0.5 pr-2.5 font-bold text-lavender-600 shadow-sm hover:border-lavender-300"
                >
                  <MasteryRing
                    value={xpIntoLevel}
                    total={xpForNextLevel}
                    size={30}
                    thickness={4}
                    strokeClass="text-lavender-500"
                    trackClass="text-lavender-100"
                  >
                    <span className="text-[11px] font-bold leading-none text-lavender-700">
                      {level}
                    </span>
                  </MasteryRing>
                  <span className="leading-none">⭐ {balance}</span>
                  <span className="sr-only">
                    level {level}, {balance} spendable experience points
                  </span>
                </Link>
                {/* Daily XP goal ring. */}
                <div
                  title={`Daily goal: ${xpToday} / ${DAILY_XP_GOAL} XP${goalMet ? ' — done for today!' : ''}`}
                  className="hidden sm:inline-flex"
                >
                  <MasteryRing
                    value={xpToday}
                    total={DAILY_XP_GOAL}
                    size={30}
                    thickness={4}
                    strokeClass={goalMet ? 'text-lime-500' : 'text-lime-400'}
                    trackClass="text-lime-100"
                  >
                    <span className="text-[11px] leading-none">{goalMet ? '✅' : '🎯'}</span>
                  </MasteryRing>
                </div>
                <div
                  title={`${streak} day streak${
                    tokens ? ` · ${tokens} streak freeze${tokens > 1 ? 's' : ''}` : ''
                  }${frozeToday ? ' · a freeze saved your streak today' : ''}`}
                  className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-bold text-amber-700 shadow-sm sm:px-3"
                >
                  <span aria-hidden className="text-base leading-none">
                    🔥
                  </span>
                  <span>{streak}</span>
                  {tokens > 0 && (
                    <span className="ml-1 flex items-center gap-0.5 text-sky-600" title="Streak freezes">
                      <span aria-hidden className="text-sm leading-none">
                        🧊
                      </span>
                      <span>{tokens}</span>
                    </span>
                  )}
                  <span className="sr-only">day streak</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg px-2 py-1.5 text-slate-500 hover:bg-slate-100 sm:px-3"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-brand-500 px-4 py-2 font-medium text-white shadow-sm shadow-brand-200 hover:bg-brand-600"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {showDemoBanner && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          Demo mode — your progress won&apos;t be saved and will be lost if you refresh.{' '}
          <Link to="/login" className="font-semibold underline underline-offset-2 hover:text-amber-900">
            Sign in to save your progress
          </Link>
        </div>
      )}

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {!isLesson && (
        <footer className="border-t border-brand-100/80 bg-white/60 py-6 text-center text-sm text-slate-500">
          Count Me In — learn contest counting by doing
        </footer>
      )}
    </div>
  )
}
