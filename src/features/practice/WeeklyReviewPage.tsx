import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { getLessonById } from '../../content/course'
import { useAuth } from '../auth/AuthProvider'
import { Companion } from '../challenge/Companion'
import { isWeeklyReviewForced } from '../dev/devMode'
import {
  getAllLessonProgress,
  getUserProfile,
  lowerMasteryFromReview,
  markWeeklyReviewDone,
  recordConceptReview,
} from '../progress/progressStore'
import { todayDateString } from '../progress/streaks'
import { MAX_REVIEW_ITEMS, reviewDueConceptIds } from './conceptSrs'
import { practiceableConcepts } from './practiceEngine'
import { recordPracticeCorrect } from './practiceXp'
import { TestPlayer, type TestItem, type TestItemResult, type TestXpResult } from './TestPlayer'
import { timeBonusXp } from './timeBonus'
import { WEEKLY_DIFFICULTY, weeklyReviewDue } from './weeklyReview'

type Phase = 'loading' | 'empty' | 'test' | 'summary'

const ALL_CAUGHT_UP = "You're all caught up — your next review will unlock when it's due."
const NEED_A_LESSON = "Finish at least one lesson and I'll start scheduling spaced reviews for you."

/**
 * Weekly Review: a real, delayed-feedback test over the concepts that are DUE for
 * spaced repetition (gated to once a week). The {@link TestPlayer} runs the test and
 * grading happens all at once in {@link handleGrade}, which advances each concept's
 * schedule, awards mastery-gated XP (+ a speed bonus), lowers mastery on misses, and
 * persists the weak lessons. The rest of the week the page shows that persisted
 * weak-spot summary with remediation links instead of re-testing.
 */
export function WeeklyReviewPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [phase, setPhase] = useState<Phase>('loading')
  const [emptyMessage, setEmptyMessage] = useState(ALL_CAUGHT_UP)
  const [items, setItems] = useState<TestItem[]>([])
  const [weakLessons, setWeakLessons] = useState<string[]>([])

  const mounted = useRef(true)
  useEffect(() => () => void (mounted.current = false), [])
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    if (!user) {
      setEmptyMessage(NEED_A_LESSON)
      setPhase('empty')
      return
    }
    const today = todayDateString()
    Promise.all([getUserProfile(user.uid), getAllLessonProgress(user.uid)]).then(
      ([profile, all]) => {
        if (!mounted.current) return
        // Build the learned-concept set from completed lessons, and remember which
        // completed lesson (lowest mastery) should own each concept for XP/remediation.
        const completedLessons = all.filter((p) => p.completed)
        const learned = new Set<string>()
        const lessonForConcept: Record<string, { lessonId: string; mastery: number }> = {}
        for (const p of completedLessons) {
          const lesson = getLessonById(p.lessonId)
          if (!lesson) continue
          const mastery = p.masteryScore ?? 0
          for (const conceptId of practiceableConcepts(lesson.concepts)) {
            learned.add(conceptId)
            const current = lessonForConcept[conceptId]
            if (!current || mastery < current.mastery) {
              lessonForConcept[conceptId] = { lessonId: p.lessonId, mastery }
            }
          }
        }

        // A genuinely new review unlocks only once a week has passed AND concepts are
        // due; otherwise the page shows the persisted weak-spot summary (no re-test).
        // The demo override (`?weeklyReview=1`) bypasses the schedule for walkthroughs.
        const dueIds = reviewDueConceptIds(profile?.conceptSrs ?? {}, [...learned], today)
        const forced = isWeeklyReviewForced()
        const due = forced || (weeklyReviewDue(profile, completedLessons.length) && dueIds.length > 0)

        if (due) {
          const maxItems = Math.min(MAX_REVIEW_ITEMS, Math.max(6, completedLessons.length * 5))
          const sourceIds = dueIds.length ? dueIds : forced ? [...learned] : []
          const built = sourceIds.slice(0, maxItems).map((conceptId) => ({
            conceptId,
            lessonId: lessonForConcept[conceptId].lessonId,
            difficulty: WEEKLY_DIFFICULTY,
          }))
          if (built.length) {
            setItems(built)
            setPhase('test')
            return
          }
        }

        const persisted = (profile?.weeklyReviewWeakLessons ?? []).filter((id) => getLessonById(id))
        if (!persisted.length) {
          setEmptyMessage(learned.size ? ALL_CAUGHT_UP : NEED_A_LESSON)
          setPhase('empty')
          return
        }
        setWeakLessons(persisted)
        setPhase('summary')
      },
    )
  }, [user])

  async function handleGrade(results: TestItemResult[]): Promise<TestXpResult> {
    let baseXp = 0
    let bonusXp = 0
    if (!user) return { baseXp, bonusXp }

    const missCounts: Record<string, number> = {}
    for (const r of results) {
      try {
        await recordConceptReview(user.uid, r.item.conceptId, r.correct)
      } catch {
        /* best-effort */
      }
      if (r.correct) {
        const speed = timeBonusXp(r.activeMs)
        try {
          const total = await recordPracticeCorrect(
            user.uid,
            r.item.lessonId,
            WEEKLY_DIFFICULTY,
            true,
            true,
            speed,
          )
          if (total > 0) {
            bonusXp += speed
            baseXp += total - speed
          }
        } catch {
          /* best-effort */
        }
      } else {
        missCounts[r.item.lessonId] = (missCounts[r.item.lessonId] ?? 0) + 1
        try {
          await lowerMasteryFromReview(user.uid, r.item.lessonId)
        } catch {
          /* best-effort */
        }
      }
    }

    const flagged = Object.entries(missCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([lessonId]) => lessonId)
    try {
      await markWeeklyReviewDone(user.uid, flagged)
    } catch {
      /* best-effort */
    }
    if (mounted.current) setWeakLessons(flagged)
    await refreshProfile().catch(() => {})
    return { baseXp, bonusXp }
  }

  if (phase === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <div className="animate-fade-up mx-auto max-w-xl px-4 py-12 text-center">
        <Companion message={emptyMessage} mood="happy" className="mb-4" />
        <Button onClick={() => navigate('/course')}>Back to course</Button>
      </div>
    )
  }

  if (phase === 'test') {
    return (
      <TestPlayer
        items={items}
        title="Spaced review"
        subtitle="A quick test over what's due. No hints, no feedback until you submit — answer fast for a speed bonus."
        onGrade={handleGrade}
        onExit={() => setPhase('summary')}
      />
    )
  }

  // summary (persisted weak spots from the last completed review)
  const hasWeak = weakLessons.length > 0
  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-10">
      <Companion
        message={
          hasWeak
            ? 'Here are the weak spots from your review — work through them one by one.'
            : 'Nothing to revisit right now — your next review will unlock when it’s due.'
        }
        mood={hasWeak ? 'thinking' : 'celebrate'}
        className="mb-5"
      />
      <Card>
        <h1 className="text-h2">Your review weak spots</h1>
        {hasWeak ? (
          <div className="mt-6 space-y-4">
            <h2 className="text-h3">Work through these one by one</h2>
            {weakLessons.map((lessonId) => {
              const lesson = getLessonById(lessonId)
              if (!lesson) return null
              return (
                <div key={lessonId} className="rounded-2xl border-2 border-blush-200 bg-blush-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">{lesson.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    This slipped in your last review. Sharpen up (earn XP) — each option brings you
                    right back here.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to={`/lesson/${lessonId}?restart=1&from=weekly-review`}>
                      <Button size="sm" variant="secondary">
                        Restart lesson
                      </Button>
                    </Link>
                    <Link to={`/challenge/${lessonId}?from=weekly-review`}>
                      <Button size="sm" variant="secondary">
                        Review with Pip
                      </Button>
                    </Link>
                    <Link to={`/practice/${lessonId}?from=weekly-review`}>
                      <Button size="sm" variant="secondary">
                        Unlimited practice
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
            <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
              Work these one by one — your next review unlocks when it&apos;s due.
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            No lesson tripped you up enough to revisit. Keep it up!
          </p>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => navigate('/course')}>
          Back to course
        </Button>
        {!hasWeak && (
          <Link to="/practice">
            <Button>Weak-spot practice →</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
