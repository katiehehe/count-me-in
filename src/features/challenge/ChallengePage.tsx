import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { getLessonById, getNextLesson } from '../../content/course'
import { CONCEPT_LABELS } from '../../content/types'
import { isAiEnabled } from '../../firebase/aiConfig'
import { useAuth } from '../auth/AuthProvider'
import { awardCompanionXp } from '../progress/progressStore'
import { buildGroundingContext } from './buildGroundingContext'
import { ChallengeConversation } from './ChallengeConversation'
import { ChallengeSummary } from './ChallengeSummary'
import { ChallengeTransition } from './ChallengeTransition'
import { completeChallengeSession, createChallengeSession } from './challengeService'
import type {
  ChallengeAnsweredItem,
  ChallengeGroundingContext,
  ChallengeQuestionType,
  ChallengeUnderstanding,
  RecommendedNextAction,
} from './challengeTypes'
import { recommendedAction, summarizeUnderstanding } from './challengeXp'
import { Companion } from './Companion'
import { planSession } from './sessionPlan'

type Phase = 'loading' | 'transition' | 'conversation' | 'summary' | 'disabled'

interface SummaryData {
  overall: ChallengeUnderstanding
  xpEarned: number
  conceptsToReview: string[]
  recommended: RecommendedNextAction
}

/**
 * Orchestrates AI Challenge Mode for a just-completed lesson:
 * transition → 2-4 grounded questions → reflection summary. The lesson is
 * already completed and the next lesson already unlocked before we get here, so
 * nothing on this page can block progression — it only adds reflection + XP.
 */
export function ChallengePage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromReview = searchParams.get('from') === 'weekly-review'
  const { user, refreshProfile } = useAuth()
  const lesson = lessonId ? getLessonById(lessonId) : undefined
  const nextLesson = lessonId ? getNextLesson(lessonId) : null

  const [phase, setPhase] = useState<Phase>(isAiEnabled() ? 'loading' : 'disabled')
  const [ctx, setCtx] = useState<ChallengeGroundingContext | null>(null)
  const [plan, setPlan] = useState<ChallengeQuestionType[]>([])
  const [sessionId, setSessionId] = useState('')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isAiEnabled()) {
      setPhase('disabled')
      return
    }
    if (!user || !lessonId || !lesson || startedRef.current) return
    startedRef.current = true
    void (async () => {
      const built = await buildGroundingContext(user.uid, lessonId)
      if (!built) {
        navigate('/course', { replace: true })
        return
      }
      const planned = planSession(built)
      let sid = `local-${Date.now()}`
      try {
        sid = await createChallengeSession(user.uid, lessonId)
      } catch {
        /* fall back to a local id; responses just won't persist */
      }
      setCtx(built)
      setPlan(planned)
      setSessionId(sid)
      setPhase('transition')
    })()
  }, [user, lessonId, lesson, navigate])

  if (!lessonId || !lesson) {
    return <Navigate to="/course" replace />
  }

  const goNextLesson = () => navigate(nextLesson ? `/lesson/${nextLesson.id}` : '/course')
  const goReviewLesson = () => navigate(`/lesson/${lessonId}`)
  const goCourse = () => navigate('/course')
  const goReview = () => navigate('/weekly-review')

  async function handleComplete(items: ChallengeAnsweredItem[]) {
    const overall = summarizeUnderstanding(items.map((i) => i.understanding))
    const recommended = recommendedAction(overall)
    const xpEarned = items.reduce((sum, i) => sum + i.xpAwarded, 0)

    // Only surface SPECIFIC misconceptions the learner actually showed — not the
    // lesson's own concept names (they already know which lesson it was). Drop AI
    // "misconceptions" that are just a concept id/label echo, e.g. raw
    // "counting-principle" duplicating "Counting Principle".
    const conceptTerms = new Set<string>()
    for (const c of ctx?.concepts ?? []) {
      conceptTerms.add(c.toLowerCase())
      conceptTerms.add((CONCEPT_LABELS[c] ?? c).toLowerCase())
    }
    const conceptsToReview = Array.from(
      new Set(items.map((i) => i.misconceptionDetected?.trim()).filter((m): m is string => Boolean(m))),
    ).filter((m) => !conceptTerms.has(m.toLowerCase()))

    setSummary({ overall, xpEarned, conceptsToReview, recommended })
    setPhase('summary')

    if (user) {
      try {
        await completeChallengeSession(user.uid, sessionId, {
          questionCount: items.length,
          understanding: overall,
          xpEarned,
          recommendedNextAction: recommended,
        })
      } catch {
        /* best-effort */
      }
      try {
        await awardCompanionXp(user.uid, xpEarned)
        await refreshProfile()
      } catch {
        /* best-effort */
      }
    }
  }

  if (phase === 'disabled') {
    return (
      <div className="animate-fade-up mx-auto max-w-2xl px-4 py-12">
        <Card className="text-center">
          <div className="mx-auto mb-4 max-w-md text-left">
            <Companion message="Challenge Mode is taking a nap right now — your lesson is saved and you're all set to keep going!" />
          </div>
          <h1 className="text-h3">Challenge Mode is off</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            The AI companion isn&apos;t enabled, but everything else works normally. Your progress
            and mastery are saved.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {nextLesson && <Button onClick={goNextLesson}>Next lesson →</Button>}
            <Button variant="secondary" onClick={goReviewLesson}>
              Review this lesson
            </Button>
            <Button variant="ghost" onClick={fromReview ? goReview : goCourse}>
              {fromReview ? 'Back to review' : 'Back to course'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'loading' || !ctx) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (phase === 'transition') {
    return (
      <ChallengeTransition onStart={() => setPhase('conversation')} busy={!sessionId} />
    )
  }

  if (phase === 'summary' && summary) {
    return (
      <ChallengeSummary
        overall={summary.overall}
        xpEarned={summary.xpEarned}
        conceptsToReview={summary.conceptsToReview}
        recommended={summary.recommended}
        hasNextLesson={Boolean(nextLesson)}
        onNextLesson={goNextLesson}
        onReviewLesson={goReviewLesson}
        onBackToCourse={fromReview ? goReview : goCourse}
        backLabel={fromReview ? 'Back to review' : undefined}
      />
    )
  }

  return (
    <ChallengeConversation
      ctx={ctx}
      plan={plan}
      sessionId={sessionId}
      onComplete={(items) => void handleComplete(items)}
    />
  )
}
