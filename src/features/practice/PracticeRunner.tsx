import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { FeedbackBox } from '../../components/FeedbackBox'
import { makeSeed, mulberry32, type Rng } from '../../content/randomize'
import { Companion } from '../challenge/Companion'
import { checkTransferAnswer } from '../challenge/transferQuestions'
import { reskinProblem } from './practiceAi'
import {
  BASE_CAP,
  generateProblem,
  MAX_LEVEL,
  MIN_LEVEL,
  nextLevel,
  type PracticeProblem,
} from './practiceEngine'
import { timeBonusXp } from './timeBonus'

/** The lesson + concept a question is drawn from (so XP/mastery is lesson-tied). */
export interface PracticeSource {
  lessonId: string
  conceptId: string
}

interface PracticeRunnerProps {
  title: string
  subtitle: string
  /** Picks the next question's source (called with a seeded RNG). */
  pickSource: (rng: Rng) => PracticeSource
  /** Start at the base cap (e.g. already mastered) instead of level 1. */
  startMastered?: boolean
  /** Awards XP/mastery for a correct answer; returns XP earned (for the tally). */
  onCorrect: (
    level: number,
    lessonId: string,
    awardXp: boolean,
    bonusXp: number,
  ) => number | void | Promise<number | void>
  /** XP this question can grant right now (0 if the source lesson is already mastered). */
  xpForQuestion?: (level: number, lessonId: string) => number
  /** Fires once per question on the FIRST check (right or wrong) — feeds the weakness model. */
  onFirstAttempt?: (correct: boolean, lessonId: string, conceptId: string) => void
  onExit: () => void
  /** Optional content rendered at the top (e.g. the weak-spots coach panel). */
  intro?: ReactNode
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Difficulty ${level} of ${MAX_LEVEL}`}>
      {Array.from({ length: MAX_LEVEL }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < level ? (level > BASE_CAP ? 'bg-blush-500' : 'bg-brand-500') : 'bg-slate-200'
          }`}
        />
      ))}
    </span>
  )
}

/**
 * Shared engine for the unlimited practice surfaces (per-lesson + cross-lesson
 * weak spots). Handles adaptive difficulty, the base-mastery cap + opt-in
 * challenge, code-verified checking, XP tally, and the lesson-style UI.
 */
export function PracticeRunner({
  title,
  subtitle,
  pickSource,
  startMastered,
  onCorrect,
  xpForQuestion,
  onFirstAttempt,
  onExit,
  intro,
}: PracticeRunnerProps) {
  const [level, setLevel] = useState(startMastered ? BASE_CAP : MIN_LEVEL)
  const [challengeUnlocked, setChallengeUnlocked] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [offerDismissed, setOfferDismissed] = useState(false)
  const [problem, setProblem] = useState<PracticeProblem | null>(null)
  const [sourceLessonId, setSourceLessonId] = useState('')
  const [sourceConceptId, setSourceConceptId] = useState('')
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const [missed, setMissed] = useState(false)
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [solved, setSolved] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [justEarned, setJustEarned] = useState(0)
  const [justBonus, setJustBonus] = useState(0)

  const mounted = useRef(true)
  useEffect(() => () => void (mounted.current = false), [])
  const startedRef = useRef(false)
  // When the current question became visible — used for the speed bonus on a clean
  // first-try correct answer (shown → first Check).
  const shownAtRef = useRef(0)

  const cap = challengeUnlocked ? MAX_LEVEL : BASE_CAP
  const potentialXp = xpForQuestion?.(level, sourceLessonId) ?? 0

  async function loadProblem(forLevel: number) {
    setLoading(true)
    setResult(null)
    setMissed(false)
    setAnswer('')
    setJustEarned(0)
    setJustBonus(0)
    setLevel(forLevel)
    const seed = makeSeed()
    const source = pickSource(mulberry32(seed))
    const p = generateProblem(source.conceptId, forLevel, seed)
    const prompt = await reskinProblem(p)
    if (!mounted.current) return
    setSourceLessonId(source.lessonId)
    setSourceConceptId(source.conceptId)
    setProblem({ ...p, prompt })
    setLoading(false)
    shownAtRef.current = Date.now()
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void loadProblem(startMastered ? BASE_CAP : MIN_LEVEL)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function check() {
    if (!problem || checking || !answer.trim()) return
    const isFirstAttempt = result === null
    setChecking(true)
    const ok = checkTransferAnswer(answer.trim(), problem.answer)
    setResult(ok ? 'correct' : 'incorrect')
    setChecking(false)
    if (isFirstAttempt) onFirstAttempt?.(ok, sourceLessonId, sourceConceptId)
    if (ok) {
      setSolved((s) => s + 1)
      // Speed bonus only for a clean first try; a fumbled-then-correct answer earns nothing.
      const bonus = isFirstAttempt ? timeBonusXp(Date.now() - shownAtRef.current) : 0
      try {
        const xp = await onCorrect(level, sourceLessonId, !missed, bonus)
        if (typeof xp === 'number' && mounted.current) {
          setXpEarned((x) => x + xp)
          setJustEarned(xp)
          setJustBonus(xp > 0 ? bonus : 0)
        }
      } catch {
        /* best-effort */
      }
      if (level >= BASE_CAP && !challengeUnlocked && !offerDismissed) setShowOffer(true)
    } else {
      setMissed(true)
    }
  }

  function nextQuestion() {
    setShowOffer(false)
    void loadProblem(nextLevel(level, result === 'correct', cap))
  }

  const locked = result === 'correct'

  // Pressing Enter moves to the next question — but only once it's correct, and only on
  // a SECOND Enter (the first Enter that checks a correct answer just shows the
  // feedback). We snapshot "was it already correct?" in the capture phase, before React
  // flushes the check, so the checking keystroke never also advances.
  const resultRef = useRef(result)
  resultRef.current = result
  const correctBeforeKeyRef = useRef(false)
  const nextRef = useRef(nextQuestion)
  nextRef.current = nextQuestion

  useEffect(() => {
    const onCapture = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      correctBeforeKeyRef.current = resultRef.current === 'correct'
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      const target = e.target as HTMLElement | null
      if (target && target.tagName === 'TEXTAREA') return
      if (correctBeforeKeyRef.current && resultRef.current === 'correct') {
        e.preventDefault()
        nextRef.current()
      }
    }
    window.addEventListener('keydown', onCapture, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onCapture, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <>
      <div className="animate-fade-up mx-auto max-w-2xl px-4 py-8 pb-24">
        {intro}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
            {!missed && potentialXp > 0 ? (
              <span className="rounded-full border border-blush-200 bg-blush-50 px-2.5 py-1 text-xs font-semibold text-blush-700">
                ⭐ Worth {potentialXp} XP
              </span>
            ) : missed ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                No XP — missed first try
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                Mastered ✓ · practice for fun
              </span>
            )}
            {challengeUnlocked ? 'Challenge' : 'Difficulty'} <DifficultyDots level={level} />
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-500">{subtitle}</p>

        <Companion
          message={
            solved > 0
              ? `${solved} solved${xpEarned > 0 ? ` · ⭐ ${xpEarned} XP earned` : ''}! I'll keep them coming.`
              : "Let's sharpen this up — answer as many as you like."
          }
          mood={loading || checking ? 'thinking' : result === 'correct' ? 'celebrate' : 'happy'}
          className="mb-4"
        />

        {showOffer && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-blush-200 bg-blush-50 px-4 py-3">
            <p className="text-sm font-medium text-blush-700">
              🎉 You&apos;ve got the base material down! Want a tougher challenge?
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOfferDismissed(true)
                  setShowOffer(false)
                }}
              >
                Maybe later
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setChallengeUnlocked(true)
                  setShowOffer(false)
                }}
              >
                Challenge me →
              </Button>
            </div>
          </div>
        )}

        <Card>
          {loading || !problem ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Pip is writing a fresh question…
            </div>
          ) : (
            <>
              <p className="text-base font-medium text-slate-900">{problem.prompt}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  inputMode="numeric"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.replace(/[^0-9./]/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void check()
                    }
                  }}
                  disabled={locked || checking}
                  placeholder="Type a number"
                  className="flex-1 rounded-2xl border-2 border-brand-100 bg-white px-4 py-3 font-mono text-base focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-lg"
                />
                {!locked && (
                  <Button onClick={() => void check()} disabled={!answer.trim() || checking}>
                    {checking ? 'Checking…' : 'Check'}
                  </Button>
                )}
              </div>

              {result === 'correct' && (
                <FeedbackBox
                  variant="correct"
                  title={
                    justEarned > 0
                      ? `Correct! +${justEarned} XP${justBonus > 0 ? ` (+${justBonus} speed)` : ''}`
                      : 'Correct!'
                  }
                  message={problem.explanation}
                />
              )}
              {result === 'incorrect' && (
                <FeedbackBox
                  variant="incorrect"
                  title="Not quite."
                  message={`${problem.explanation} Edit and check again, or move on.`}
                />
              )}
            </>
          )}
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Button variant="secondary" onClick={onExit}>
            Exit practice
          </Button>
          <Button onClick={nextQuestion} disabled={loading || !result}>
            Next question →
          </Button>
        </div>
      </div>
    </>
  )
}
