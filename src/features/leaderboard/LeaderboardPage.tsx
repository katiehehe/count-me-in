import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/Card'
import { isFirebaseConfigured } from '../../firebase/firebaseClient'
import type { LeaderboardEntry } from '../../firebase/firestoreTypes'
import { useAuth } from '../auth/AuthProvider'
import { getLeaderboardTop, getUserLeaderboardRank } from '../progress/progressService'
import { levelFromXp } from '../progress/xpLevels'

const MEDALS = ['🥇', '🥈', '🥉']

function rankLabel(rank: number): string {
  return MEDALS[rank - 1] ?? `#${rank}`
}

/**
 * Public leaderboard ranked by LIFETIME XP. Reads the global `leaderboard`
 * collection directly (it's shared, not per-session). Anonymous demo guests can
 * view but aren't ranked; the current user is highlighted and shown even when
 * they fall outside the visible top list.
 */
export function LeaderboardPage() {
  const { user, profile } = useAuth()
  const isAnon = user?.isAnonymous ?? false
  const myXp = profile?.companionXp ?? 0
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    if (!isFirebaseConfigured()) {
      setEntries([])
      return
    }
    void (async () => {
      try {
        const top = await getLeaderboardTop(50)
        if (!alive) return
        setEntries(top)
        const inTop = user ? top.some((e) => e.uid === user.uid) : false
        if (user && !isAnon && myXp > 0 && !inTop) {
          const r = await getUserLeaderboardRank(myXp)
          if (alive) setMyRank(r)
        }
      } catch {
        if (alive) setError(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [user, isAnon, myXp])

  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900">
            🏆 Leaderboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">Top learners by lifetime XP. Keep earning to climb.</p>
        </div>
        <Link to="/course" className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700">
          ← Course
        </Link>
      </div>

      {isAnon && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          You&apos;re in demo mode, so your progress isn&apos;t ranked.{' '}
          <Link to="/login" className="font-semibold underline underline-offset-2">
            Sign in
          </Link>{' '}
          to join the leaderboard.
        </div>
      )}

      {entries === null && !error && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <Card className="text-center text-sm text-slate-600">
          We couldn&apos;t load the leaderboard right now. Please try again in a bit.
        </Card>
      )}

      {entries !== null && !error && entries.length === 0 && (
        <Card className="text-center">
          <div className="text-2xl">🌱</div>
          <p className="mt-2 font-semibold text-slate-800">No rankings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            {isAnon
              ? 'Sign in and earn XP to be the very first on the board.'
              : "You're #1 — keep going and earn XP to lock it in!"}
          </p>
        </Card>
      )}

      {entries !== null && entries.length > 0 && (
        <Card className="divide-y divide-slate-100 p-0">
          {entries.map((e, i) => {
            const isMe = user?.uid === e.uid
            return (
              <Row
                key={e.uid}
                rank={i + 1}
                name={isMe ? `${e.displayName} (you)` : e.displayName}
                level={e.level}
                xp={e.companionXp}
                highlight={isMe}
              />
            )
          })}
        </Card>
      )}

      {myRank !== null && (
        <>
          <div className="my-2 text-center text-xs font-medium text-slate-400">your position</div>
          <Card className="p-0">
            <Row
              rank={myRank}
              name={`${(profile?.displayName ?? 'You').split(' ')[0]} (you)`}
              level={levelFromXp(myXp).level}
              xp={myXp}
              highlight
            />
          </Card>
        </>
      )}

      {!isAnon && entries !== null && entries.length > 0 && myXp === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Earn your first XP in a lesson or practice to join the board.
        </p>
      )}
    </div>
  )
}

function Row({
  rank,
  name,
  level,
  xp,
  highlight,
}: {
  rank: number
  name: string
  level: number
  xp: number
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${highlight ? 'bg-lavender-50' : ''}`}
    >
      <div className="w-10 shrink-0 text-center text-lg font-bold text-slate-700">
        {rankLabel(rank)}
      </div>
      <div className="min-w-0 flex-1 truncate font-semibold text-slate-900">{name}</div>
      <div className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
        Lv {level}
      </div>
      <div className="w-20 shrink-0 text-right font-bold text-lavender-700">⭐ {xp}</div>
    </div>
  )
}
