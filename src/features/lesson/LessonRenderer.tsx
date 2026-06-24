import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Lesson } from '../../content/types'
import { getNextLesson } from '../../content/course'
import { loadOrCreateSeed, refreshSeed, resolveLesson } from '../../content/randomize'
import { SegmentedProgress } from '../../components/SegmentedProgress'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { StepRenderer, canAdvance, type StepState } from './StepRenderer'
import { LessonReview } from './LessonReview'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { useAuth } from '../auth/AuthProvider'
import {
  advanceStep,
  completeLesson,
  getLessonProgress,
  recordStepAnswer,
  restartLesson,
  saveLessonProgress,
  toggleStepStar,
  touchActivity,
} from '../progress/progressService'
import {
  calculateConceptMastery,
  getMasteryTier,
  isGradedStepType,
  isLessonMastered,
} from '../progress/mastery'
import { MasteryBadge } from '../../components/MasteryBadge'
import { StarButton } from '../../components/StarButton'
import { CONCEPT_LABELS } from '../../content/types'
import { isDevUnlock } from '../dev/devMode'

interface LessonRendererProps {
  lesson: Lesson
}

const defaultStepState: StepState = { answered: false, correct: null, answer: null }

export function LessonRenderer({ lesson: rawLesson }: LessonRendererProps) {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  // Randomized numbers are fixed per play-through by a seed (persisted so reloads
  // and the review screen stay consistent); restarting reshuffles via a new seed.
  const [seed, setSeed] = useState(() => loadOrCreateSeed(rawLesson.id))
  const lesson = useMemo(() => resolveLesson(rawLesson, seed), [rawLesson, seed])
  const [stepIndex, setStepIndex] = useState(0)
  const [furthestIndex, setFurthestIndex] = useState(0)
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({})
  const [loading, setLoading] = useState(true)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [progressDoc, setProgressDoc] = useState<LessonProgressDoc | null>(null)
  const [starredSteps, setStarredSteps] = useState<string[]>([])
  // True while stepping through a completed lesson's questions from the results
  // summary. Graded questions then render blank (not pre-filled) for consistency.
  const [reviewWalkthrough, setReviewWalkthrough] = useState(false)

  const step = lesson.steps[stepIndex]
  const stepState = stepStates[step.id] ?? defaultStepState
  // In a review walkthrough, show graded questions blank so multiple-choice and
  // numeric questions look the same; the real state still drives Continue/Enter.
  const displayStepState =
    reviewWalkthrough && isGradedStepType(step.type) ? defaultStepState : stepState

  // Whole-lesson mastery: fraction of graded questions answered correctly on the
  // first attempt. Recomputed live from step state (and restored on resume).
  const { gradedTotal, gradedCorrect, masteryScore, conceptMastery } = useMemo(() => {
    const graded = lesson.steps.filter((s) => isGradedStepType(s.type))
    const correct = graded.filter((s) => stepStates[s.id]?.firstTry === true).length
    const conceptAnswers: Array<{ conceptId: string; correct: boolean }> = []
    for (const s of graded) {
      const ft = stepStates[s.id]?.firstTry
      if (ft === true || ft === false) {
        for (const c of s.concepts ?? []) conceptAnswers.push({ conceptId: c, correct: ft })
      }
    }
    return {
      gradedTotal: graded.length,
      gradedCorrect: correct,
      masteryScore: graded.length ? correct / graded.length : 0,
      conceptMastery: calculateConceptMastery(conceptAnswers),
    }
  }, [lesson.steps, stepStates])

  useEffect(() => {
    if (!user) return
    getLessonProgress(user.uid, lesson.id).then((progress) => {
      if (progress) {
        const startIndex = progress.completed ? 0 : progress.currentStepIndex
        setStepIndex(startIndex)
        setFurthestIndex(progress.currentStepIndex)
        setAlreadyCompleted(progress.completed)
        setProgressDoc(progress)
        setReviewing(progress.completed)
        setStarredSteps(progress.starredSteps ?? [])

        // Always restore saved answers (even for completed lessons) so that
        // jumping back to a previous question via the progress bar shows what
        // the learner entered.
        const restored: Record<string, StepState> = {}
        for (const [stepId, record] of Object.entries(progress.stepAnswers ?? {})) {
          const numericAnswer = typeof record.answer === 'number' ? record.answer : null
          restored[stepId] = {
            answered: true,
            correct: record.correct,
            answer: numericAnswer,
            selectedIndex: numericAnswer,
            firstTry: record.firstAttemptCorrect ?? record.correct,
            everCorrect: record.correct === true,
            explorationDone: stepId.includes('explore'),
            factorialDone: stepId.includes('factorial'),
            connectionDone: stepId.includes('connect'),
            treeDone: stepId.includes('tree'),
            simulationDone: stepId.includes('sim'),
            probabilityDone: stepId.includes('gamble'),
            outcomeSelectDone: stepId.includes('pick'),
            condenseDone: stepId.includes('condense'),
            combinedExpDone: stepId.includes('combined'),
            pairingDone: stepId.includes('depend'),
          }
        }
        setStepStates(restored)
      } else {
        saveLessonProgress(user.uid, {
          lessonId: lesson.id,
          currentStepIndex: 0,
          completed: false,
          stepAnswers: {},
          masteryScore: 0,
          conceptMastery: {},
        })
      }
      setLoading(false)
      touchActivity(user.uid).then(() => refreshProfile())
    })
  }, [user, lesson.id, refreshProfile])

  const updateStepState = useCallback((stepId: string, update: Partial<StepState>) => {
    setStepStates((prev) => ({
      ...prev,
      [stepId]: { ...(prev[stepId] ?? defaultStepState), ...update },
    }))
  }, [])

  // Track in-flight answer writes so we can flush them before reading progress
  // back for the review screen (otherwise the review can read stale data).
  const pendingWrites = useRef<Promise<unknown>[]>([])

  const flushPendingWrites = useCallback(async () => {
    const writes = pendingWrites.current
    pendingWrites.current = []
    if (writes.length) await Promise.allSettled(writes)
  }, [])

  const persistAnswer = useCallback(
    (stepId: string, answer: string | number, correct: boolean, tags: string[] = []) => {
      if (!user) return
      const write = recordStepAnswer(user.uid, lesson.id, stepId, answer, correct, tags)
      pendingWrites.current.push(write)
    },
    [user, lesson.id],
  )

  const handleToggleStar = useCallback(
    async (stepId: string) => {
      if (!user) return
      const has = starredSteps.includes(stepId)
      // Optimistic update for instant feedback.
      setStarredSteps((prev) =>
        has ? prev.filter((id) => id !== stepId) : [...new Set([...prev, stepId])],
      )
      try {
        const next = await toggleStepStar(user.uid, lesson.id, stepId, !has)
        setStarredSteps(next)
      } catch {
        // Revert if the write failed.
        setStarredSteps((prev) =>
          has ? [...new Set([...prev, stepId])] : prev.filter((id) => id !== stepId),
        )
      }
    },
    [user, lesson.id, starredSteps],
  )

  const handleStepUpdate = (update: Partial<StepState>) => {
    const isGradedAnswer =
      update.answered === true && update.correct !== undefined && update.correct !== null

    // Lock in first-attempt correctness only the very first time this step is
    // graded — going back and re-answering never changes it (no double-counting).
    const firstTryUpdate =
      isGradedAnswer && stepState.firstTry === undefined
        ? { firstTry: update.correct }
        : {}

    const everCorrectUpdate = update.correct === true ? { everCorrect: true } : {}

    updateStepState(step.id, { ...update, ...firstTryUpdate, ...everCorrectUpdate })

    // Persist the answer, but never overwrite an already-correct saved answer with a
    // later wrong "exploration" click — the learner is just probing why options fail.
    const alreadySolved = stepState.everCorrect === true
    if (
      isGradedAnswer &&
      update.answer !== undefined &&
      (!alreadySolved || update.correct === true)
    ) {
      persistAnswer(
        step.id,
        update.answer as string | number,
        update.correct as boolean,
        step.question?.misconceptionTags ?? [],
      )
    }
  }

  const handleNext = async () => {
    const nextIndex = stepIndex + 1
    if (nextIndex >= lesson.steps.length) return

    const nextStep = lesson.steps[nextIndex]
    if (nextStep.type === 'completion' && user) {
      // Make sure every answer write has landed before we read progress back.
      await flushPendingWrites()
      await completeLesson(
        user.uid,
        lesson.id,
        masteryScore,
        conceptMastery,
        gradedCorrect,
        gradedTotal,
      )
      const fresh = await getLessonProgress(user.uid, lesson.id)
      if (fresh) {
        setProgressDoc(fresh)
        setStarredSteps((prev) => [...new Set([...(fresh.starredSteps ?? []), ...prev])])
      }
      await refreshProfile()
      setAlreadyCompleted(true)
      setFurthestIndex(lesson.steps.length - 1)
      setReviewWalkthrough(false)
      setReviewing(true)
      return
    }

    if (nextIndex > furthestIndex) {
      setFurthestIndex(nextIndex)
      // Fire the "current step" write in the background so navigation is instant;
      // it's flushed before completion/review so progress is never lost.
      if (user) pendingWrites.current.push(advanceStep(user.uid, lesson.id, nextIndex))
    }
    setStepIndex(nextIndex)
  }

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
  }

  // Jump to any already-visited step from the progress bar (never skips ahead).
  // In dev mode, allow jumping to ANY step for quick testing.
  const handleSelectStep = (step1Based: number) => {
    const idx = step1Based - 1
    const maxIdx = isDevUnlock() ? lesson.steps.length - 1 : furthestIndex
    if (idx >= 0 && idx <= maxIdx) setStepIndex(idx)
  }

  // Entering the results summary re-fetches progress so the review always shows
  // the latest saved answers and stars (not a stale in-memory snapshot).
  const handleViewResults = useCallback(async () => {
    if (user) {
      await flushPendingWrites()
      const fresh = await getLessonProgress(user.uid, lesson.id)
      if (fresh) {
        setProgressDoc(fresh)
        setStarredSteps((prev) => [...new Set([...(fresh.starredSteps ?? []), ...prev])])
      }
    }
    setReviewWalkthrough(false)
    setReviewing(true)
  }, [user, lesson.id, flushPendingWrites])

  // From a review row, jump straight to that question. These steps were already
  // reached by the learner, so they're always valid targets (no furthest clamp).
  const handleJumpToStep = (idx: number) => {
    if (idx < 0 || idx >= lesson.steps.length) return
    setFurthestIndex((prev) => Math.max(prev, idx))
    setStepIndex(idx)
    setReviewWalkthrough(true)
    setReviewing(false)
  }

  // From the completed-lesson summary, re-enter the lesson at the last question
  // the learner answered, with every step navigable via the progress bar.
  const handleReviewAnswers = () => {
    const answeredIndices = lesson.steps
      .map((s, i) => (progressDoc?.stepAnswers?.[s.id] ? i : -1))
      .filter((i) => i >= 0)
    const lastAnswered = answeredIndices.length ? Math.max(...answeredIndices) : 0
    setFurthestIndex(lesson.steps.length - 1)
    setStepIndex(lastAnswered)
    setReviewWalkthrough(true)
    setReviewing(false)
  }

  const handleRestart = async () => {
    if (user) await restartLesson(user.uid, lesson.id)
    setSeed(refreshSeed(rawLesson.id))
    setStepStates({})
    setStarredSteps([])
    setProgressDoc((prev) =>
      prev ? { ...prev, stepAnswers: {}, starredSteps: [], currentStepIndex: 0 } : prev,
    )
    setStepIndex(0)
    setFurthestIndex(0)
    setReviewWalkthrough(false)
    setReviewing(false)
  }

  // Pressing Enter advances to the next step once it's satisfiable (e.g. after a
  // question is answered correctly) — an explicit action, so we never auto-skip.
  // A "latest-callback" ref keeps one stable listener that always sees fresh state.
  const tryAdvanceRef = useRef<() => boolean>(() => false)
  tryAdvanceRef.current = () => {
    if (reviewing || loading) return false
    if (canAdvance(step, stepState)) {
      void handleNext()
      return true
    }
    return false
  }

  // Snapshot of step/state each render, so the Enter listener can read the values that
  // were true *before* the current keystroke graded an answer.
  const enterStateRef = useRef({ step, stepState, reviewing, loading })
  enterStateRef.current = { step, stepState, reviewing, loading }
  // Whether the step was already advancible when Enter went down. This stops a single
  // Enter from both checking a correct answer and skipping straight past its feedback.
  const advancibleAtKeydownRef = useRef(false)

  useEffect(() => {
    // Capture phase fires before React grades the answer, so it sees pre-keystroke state.
    const onKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      const { step, stepState, reviewing, loading } = enterStateRef.current
      advancibleAtKeydownRef.current = !reviewing && !loading && canAdvance(step, stepState)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      const target = e.target as HTMLElement | null
      // Don't hijack Enter inside multi-line text fields.
      if (target && target.tagName === 'TEXTAREA') return
      // Only advance if the step was already satisfied before this keystroke.
      if (advancibleAtKeydownRef.current && tryAdvanceRef.current()) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDownCapture, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDownCapture, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  const nextLesson = getNextLesson(lesson.id)

  if (reviewing && progressDoc) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 pb-28">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{lesson.title}</h1>
            <span className="rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-bold text-success-700">
              ✓ Completed
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            See your results below, step through your answers, or restart the lesson.
          </p>
        </div>

        <LessonReview
          lesson={lesson}
          progress={progressDoc}
          starredSteps={starredSteps}
          onToggleStar={handleToggleStar}
          onJumpToStep={handleJumpToStep}
        />

        <div className="fixed bottom-0 left-0 right-0 border-t border-brand-100/80 bg-white/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
            <Button variant="secondary" onClick={() => navigate('/course')}>
              Back to course
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={handleRestart}>
                ↻ Restart
              </Button>
              <Button variant="secondary" onClick={handleReviewAnswers}>
                Review questions
              </Button>
              {nextLesson ? (
                <Button onClick={() => navigate(`/lesson/${nextLesson.id}`)}>
                  Next lesson →
                </Button>
              ) : (
                <Button onClick={() => navigate('/course')}>Finish course →</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isCompletion = step.type === 'completion'
  // Dev mode can click straight through any step without satisfying it.
  const canGoNext = canAdvance(step, stepState) || isDevUnlock()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6">
        <Link to="/course" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to course
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{lesson.title}</h1>
          {alreadyCompleted && (
            <span className="rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-bold text-success-700">
              ✓ Completed
            </span>
          )}
        </div>
        {alreadyCompleted && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">
              You&apos;ve completed this lesson. Step through any question with the bar below, or
              see your full results.
            </p>
            <Button size="sm" variant="secondary" onClick={handleViewResults}>
              View results summary →
            </Button>
          </div>
        )}
      </div>

      {isDevUnlock() && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          🛠️ Dev mode — tap any segment to jump, or hit Continue to skip any step.
        </div>
      )}

      <SegmentedProgress
        current={stepIndex + 1}
        total={lesson.steps.length}
        furthest={isDevUnlock() ? lesson.steps.length : furthestIndex + 1}
        onSelect={handleSelectStep}
        className="mb-6"
      />

      <Card>
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{step.title}</h2>
          {isGradedStepType(step.type) && (
            <StarButton
              size="sm"
              starred={starredSteps.includes(step.id)}
              onToggle={() => handleToggleStar(step.id)}
            />
          )}
        </div>
        <StepRenderer
          key={step.id}
          step={step}
          stepState={displayStepState}
          onStepUpdate={handleStepUpdate}
        />
      </Card>

      {isCompletion && (
        <Card className="mt-4">
          <div className="flex flex-col items-center space-y-3 text-center">
            <MasteryBadge
              masteryScore={masteryScore}
              correct={gradedCorrect}
              total={gradedTotal}
              size="large"
            />
            {profile && (
              <p className="text-sm text-slate-600">
                🔥 Streak: {profile.streakCount} day{profile.streakCount !== 1 ? 's' : ''}
              </p>
            )}
            {Object.keys(conceptMastery).length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {Object.entries(conceptMastery).map(([id, score]) => (
                  <span
                    key={id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {CONCEPT_LABELS[id] ?? id}: {Math.round(score * 100)}%
                  </span>
                ))}
              </div>
            )}
            {getMasteryTier(masteryScore).tier !== 'green' && (
              <p className="text-sm text-warm-500">
                Replay this lesson anytime to reach the green “Mastered” tier.
              </p>
            )}
            {nextLesson && isLessonMastered(masteryScore) && (
              <p className="text-sm text-slate-600">
                Next up: <span className="font-semibold">{nextLesson.title}</span>
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {isCompletion ? (
            <>
              <Button variant="secondary" onClick={() => navigate('/course')}>
                Back to course
              </Button>
              {nextLesson ? (
                <Button onClick={() => navigate(`/lesson/${nextLesson.id}`)}>
                  Next lesson →
                </Button>
              ) : (
                <Button onClick={() => navigate('/course')}>Finish course →</Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={stepIndex === 0}
                className={stepIndex === 0 ? 'invisible' : ''}
              >
                ← Back
              </Button>
              <Button onClick={handleNext} disabled={!canGoNext}>
                {step.nextButtonLabel ?? 'Continue'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
