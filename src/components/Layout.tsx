import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export function Layout() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const isLesson = location.pathname.startsWith('/lesson/')

  const rawName = profile?.displayName ?? user?.displayName ?? ''
  const firstName = rawName && rawName !== 'Learner' ? rawName.split(' ')[0] : ''

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
                <div
                  title={`${profile?.streakCount ?? 0} day streak`}
                  className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-bold text-amber-700 shadow-sm"
                >
                  <span aria-hidden className="text-base leading-none">
                    🔥
                  </span>
                  <span>{profile?.streakCount ?? 0}</span>
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

      <footer className="border-t border-brand-100/80 bg-white/60 py-6 text-center text-sm text-slate-500">
        Count Me In — learn contest counting by doing
      </footer>
    </div>
  )
}
