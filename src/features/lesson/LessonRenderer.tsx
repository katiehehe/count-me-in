import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Lesson } from '../../content/types'
import { getNextLesson } from '../../content/course'
import { loadOrCreateSeed, refreshSeed, resolveLesson, storeSeed } from '../../content/randomize'
import { SegmentedProgress } from '../../components/SegmentedProgress'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { StepRenderer, canAdvance, interactiveDoneState, type StepState } from './StepRenderer'
import { LessonReview } from './LessonReview'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { useAuth } from '../auth/AuthProvider'
import {
  advanceStep,
  completeLesson,
  getLessonProgress,
  recordStepAnswer,
  markStepComplete,
  recordLearningActivity,
  restartLesson,
  saveLessonProgress,
  toggleStepStar,
} from '../progress/progressStore'
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
import { isAiEnabled } from '../../firebase/aiConfig'

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
  // Mirror the live seed in a ref so the one-shot load effect can read the
  // current seed without listing it as a dependency (which would re-fetch).
  const seedRef = useRef(seed)
  seedRef.current = seed
  const lesson = useMemo(() => resolveLesson(rawLesson, seed), [rawLesson, seed])
  // Step ids/types are stable across seed changes (only the numbers differ), so
  // the one-shot load effect reads them via a ref instead of depending on the
  // re-resolved array (which would otherwise re-trigger the fetch on seed swap).
  const stepsRef = useRef(lesson.steps)
  stepsRef.current = lesson.steps
  const [stepIndex, setStepIndex] = useState(0)
  // Tracks the previously rendered step so we can pick a slide direction.
  const prevStepIndexRef = useRef(0)
  useEffect(() => {
    prevStepIndexRef.current = stepIndex
  }, [stepIndex])
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
  // Ephemeral answers given DURING a review walkthrough. Kept completely separate
  // from `stepStates` so re-answering in review never persists to Firestore nor
  // affects the learner's summarized results (mastery, concept scores, etc.).
  const [reviewStepStates, setReviewStepStates] = useState<Record<string, StepState>>({})

  const step = lesson.steps[stepIndex]
  const stepState = stepStates[step.id] ?? defaultStepState
  // The state that actually drives the UI for the current step. In a review
  // walkthrough we use the ephemeral review state: graded questions start blank
  // (so they can be re-answered), while non-graded interactive steps fall back to
  // the learner's real (already-complete) state so Continue works without a redo.
  const activeStepState = reviewWalkthrough
    ? (reviewStepStates[step.id] ?? (isGradedStepType(step.type) ? defaultStepState : stepState))
    : stepState
  const displayStepState = activeStepState

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
        // Reproduce the exact play-through this progress was recorded against.
        // If the doc carries a seed, adopt it (so a different device shows the
        // same numbers); otherwise backfill the local seed for older docs.
        if (typeof progress.seed === 'number' && progress.seed >>> 0 !== seedRef.current) {
          storeSeed(lesson.id, progress.seed)
          setSeed(progress.seed >>> 0)
        } else if (progress.seed === undefined) {
          saveLessonProgress(user.uid, { lessonId: lesson.id, seed: seedRef.current })
        }

        const startIndex = progress.completed ? 0 : progress.currentStepIndex
        setStepIndex(startIndex)
        setFurthestIndex(progress.currentStepIndex)
        setAlreadyCompleted(progress.completed)
        setProgressDoc(progress)
        setReviewing(progress.completed)
        setStarredSteps(progress.starredSteps ?? [])

        // Always restore saved state (even for completed lessons) so that
        // jumping back to a previous step via the progress bar shows what the
        // learner did. Graded answers come from `stepAnswers`; non-graded
        // interactive completions come from `completedSteps` and are mapped back
        // to their done-flag by step TYPE (not by guessing from the step id).
        const restored: Record<string, StepState> = {}
        for (const [stepId, record] of Object.entries(progress.stepAnswers ?? {})) {
          const numericAnswer = typeof record.answer === 'number' ? record.answer : null
          // Keep string answers (e.g. typed fractions like "1/4") on resume too;
          // only numeric answers map to a multiple-choice selectedIndex.
          const storedAnswer =
            typeof record.answer === 'number' || typeof record.answer === 'string'
              ? record.answer
              : null
          restored[stepId] = {
            answered: true,
            correct: record.correct,
            answer: storedAnswer,
            selectedIndex: numericAnswer,
            firstTry: record.firstAttemptCorrect ?? record.correct,
            everCorrect: record.correct === true,
          }
        }
        for (const stepId of progress.completedSteps ?? []) {
          const completedStep = stepsRef.current.find((s) => s.id === stepId)
          if (!completedStep) continue
          restored[stepId] = {
            ...(restored[stepId] ?? defaultStepState),
            answered: true,
            ...interactiveDoneState(completedStep.type),
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
          seed: seedRef.current,
        })
      }
      setLoading(false)
    })
  }, [user, lesson.id])

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

  // Streak/daily activity is credited on the first real answer this session, not
  // on merely opening the lesson — so the streak reflects actual work done.
  const activityRecordedRef = useRef(false)

  const persistAnswer = useCallback(
    (stepId: string, answer: string | number, correct: boolean, tags: string[] = []) => {
      if (!user) return
      pendingWrites.current.push(
        recordStepAnswer(user.uid, lesson.id, stepId, answer, correct, tags),
      )
      if (!activityRecordedRef.current) {
        activityRecordedRef.current = true
        pendingWrites.current.push(
          recordLearningActivity(user.uid, correct).then(() => refreshProfile()),
        )
      }
    },
    [user, lesson.id, refreshProfile],
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
    // Review walkthrough: keep answers purely local and ephemeral. Never persist
    // and never touch mastery — this is a viewing/answering mode only.
    if (reviewWalkthrough) {
      setReviewStepStates((prev) => {
        const base = prev[step.id] ?? defaultStepState
        const everCorrectUpdate = update.correct === true ? { everCorrect: true } : {}
        return { ...prev, [step.id]: { ...base, ...update, ...everCorrectUpdate } }
      })
      return
    }

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

    // Persist non-graded interactive completion the moment the step becomes
    // satisfiable, so resume / backward navigation never forces a redo. Fire
    // once per step (only on the not-complete → complete transition).
    if (
      user &&
      !isGradedStepType(step.type) &&
      !canAdvance(step, stepState) &&
      canAdvance(step, { ...stepState, ...update })
    ) {
      pendingWrites.current.push(markStepComplete(user.uid, lesson.id, step.id))
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
      // The lesson is now saved and the next lesson unlocked. When AI is on, route
      // into Challenge Mode for retrieval practice; the results summary stays
      // reachable from there. With AI off, fall back to the summary as before.
      if (isAiEnabled()) {
        navigate(`/challenge/${lesson.id}`)
        return
      }
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
    setReviewStepStates({})
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
    setReviewStepStates({})
    setReviewWalkthrough(true)
    setReviewing(false)
  }

  const handleRestart = async () => {
    const newSeed = refreshSeed(rawLesson.id)
    if (user) await restartLesson(user.uid, lesson.id, newSeed)
    setSeed(newSeed)
    setStepStates({})
    setStarredSteps([])
    setProgressDoc((prev) =>
      prev
        ? { ...prev, stepAnswers: {}, starredSteps: [], completedSteps: [], currentStepIndex: 0 }
        : prev,
    )
    activityRecordedRef.current = false
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
    if (canAdvance(step, activeStepState)) {
      void handleNext()
      return true
    }
    return false
  }

  // Snapshot of step/state each render, so the Enter listener can read the values that
  // were true *before* the current keystroke graded an answer.
  const enterStateRef = useRef({ step, stepState: activeStepState, reviewing, loading })
  enterStateRef.current = { step, stepState: activeStepState, reviewing, loading }
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
            <h1 className="text-h2">{lesson.title}</h1>
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

        <div className="fixed bottom-0 left-0 right-0 border-t border-brand-100/80 bg-white/95 px-4 py-3 backdrop-blur sm:py-4">
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
  const canGoNext = canAdvance(step, activeStepState) || isDevUnlock()

  // Direction-aware slide between steps: forward (Continue) slides in from the
  // right, back (Previous / jump back) from the left. Computed during render
  // before the effect below records the new index.
  const stepDirection = stepIndex >= prevStepIndexRef.current ? 'forward' : 'back'

  return (
    <>
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-6">
        <Link to="/course" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to course
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-h2">{lesson.title}</h1>
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

      <div
        key={step.id}
        className={stepDirection === 'back' ? 'animate-step-back' : 'animate-step-forward'}
      >
        <Card>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="text-h4">{step.title}</h2>
            {isGradedStepType(step.type) && (
              <StarButton
                size="sm"
                starred={starredSteps.includes(step.id)}
                onToggle={() => handleToggleStar(step.id)}
              />
            )}
          </div>
          <StepRenderer
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
      </div>

    </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:py-4">
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
    </>
  )
}
