import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { makeSeed } from '../../content/randomize'
import { Companion } from '../challenge/Companion'
import { checkTransferAnswer } from '../challenge/transferQuestions'
import { reskinProblem } from './practiceAi'
import { generateProblem, type PracticeProblem } from './practiceEngine'

export interface TestItem {
  conceptId: string
  lessonId: string
  difficulty: number
}

export interface TestItemResult {
  item: TestItem
  problem: PracticeProblem
  correct: boolean
  answerText: string
  /** Active time (ms) the question was visible before the learner first answered it. */
  activeMs: number
}

/** XP the parent actually recorded, split for the results breakdown. */
export interface TestXpResult {
  baseXp: number
  bonusXp: number
}

interface TestPlayerProps {
  items: TestItem[]
  title: string
  subtitle?: string
  /** Optional whole-test countdown (seconds); on expiry the test auto-submits. */
  timeLimitSec?: number
  onExit: () => void
  /** Records scheduling/mastery/XP for the whole test and returns the XP breakdown to show. */
  onGrade: (results: TestItemResult[]) => Promise<TestXpResult> | TestXpResult
}

type TestPhase = 'preparing' | 'testing' | 'grading' | 'results'

/**
 * A delayed-feedback "real test": questions are pre-generated once, answered in any
 * order with NO correctness feedback until submit, then graded all at once. Per
 * question we accumulate the active (visible) time until the first non-empty answer,
 * so a speed bonus can reward quick recall. The results screen scores the test and
 * lets the learner expand any question (missed ones emphasized) to review it.
 */
export function TestPlayer({ items, title, subtitle, timeLimitSec, onExit, onGrade }: TestPlayerProps) {
  const [phase, setPhase] = useState<TestPhase>('preparing')
  const [problems, setProblems] = useState<PracticeProblem[]>([])
  const [answers, setAnswers] = useState<string[]>(() => items.map(() => ''))
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<TestItemResult[] | null>(null)
  const [xp, setXp] = useState<TestXpResult>({ baseXp: 0, bonusXp: 0 })
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [remainingSec, setRemainingSec] = useState<number | null>(timeLimitSec ?? null)

  const mounted = useRef(true)
  useEffect(() => () => void (mounted.current = false), [])
  const submittingRef = useRef(false)
  const deadlineRef = useRef<number | null>(null)

  // Per-question active-time accounting (kept in refs so it never triggers renders).
  const activeMs = useRef<number[]>(items.map(() => 0))
  const committed = useRef<boolean[]>(items.map(() => false))
  const activeSince = useRef<number | null>(null)
  const activeIndex = useRef(0)

  // Pre-generate every question once so navigation is stable (no reshuffling).
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void (async () => {
      const generated = await Promise.all(
        items.map(async (it) => {
          const seed = makeSeed()
          const base = generateProblem(it.conceptId, it.difficulty, seed)
          const prompt = await reskinProblem(base)
          return { ...base, prompt }
        }),
      )
      if (!mounted.current) return
      setProblems(generated)
      setPhase('testing')
    })()
  }, [items])

  function accumulateActive() {
    if (activeSince.current != null) {
      activeMs.current[activeIndex.current] += Date.now() - activeSince.current
      activeSince.current = null
    }
  }

  function goTo(i: number) {
    if (i === index || i < 0 || i >= items.length) return
    accumulateActive()
    setIndex(i)
  }

  // Resume timing whenever a new (uncommitted) question becomes visible. Pausing is
  // explicit (navigation/commit/submit), so the cleanup never touches a ref's value.
  useEffect(() => {
    if (phase !== 'testing') return
    if (!committed.current[index]) {
      activeIndex.current = index
      activeSince.current = Date.now()
    } else {
      activeSince.current = null
    }
  }, [index, phase])

  // A ref to the latest submit so the countdown interval always calls current state.
  const submitRef = useRef<(auto?: boolean) => void>(() => {})
  submitRef.current = (auto) => void submit(auto)

  // Optional whole-test countdown: tick down once testing begins and auto-submit at 0.
  useEffect(() => {
    if (phase !== 'testing' || !timeLimitSec) return
    deadlineRef.current = Date.now() + timeLimitSec * 1000
    setRemainingSec(timeLimitSec)
    const id = setInterval(() => {
      const left = Math.max(0, Math.round(((deadlineRef.current ?? 0) - Date.now()) / 1000))
      setRemainingSec(left)
      if (left <= 0) submitRef.current(true)
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLimitSec])

  function setCurrentAnswer(value: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    // First non-empty answer commits the timer for this question.
    if (value.trim() && !committed.current[index]) {
      if (activeSince.current != null && activeIndex.current === index) {
        activeMs.current[index] += Date.now() - activeSince.current
      }
      committed.current[index] = true
      activeSince.current = null
    }
  }

  async function submit(auto = false) {
    if (submittingRef.current) return
    if (!auto) {
      const blanks = answers.filter((a) => !a.trim()).length
      if (blanks > 0 && !window.confirm(`You have ${blanks} unanswered — submit anyway?`)) return
    }
    submittingRef.current = true
    accumulateActive()
    const graded: TestItemResult[] = items.map((item, i) => {
      const text = answers[i].trim()
      return {
        item,
        problem: problems[i],
        correct: Boolean(text) && checkTransferAnswer(text, problems[i].answer),
        answerText: text,
        activeMs: activeMs.current[i],
      }
    })
    setResults(graded)
    setPhase('grading')
    try {
      const award = await onGrade(graded)
      if (award && mounted.current) setXp(award)
    } catch {
      /* best-effort: still show the results even if recording failed */
    }
    if (mounted.current) setPhase('results')
  }

  if (phase === 'preparing' || (phase === 'testing' && problems.length !== items.length)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        Preparing your test…
      </div>
    )
  }

  if (phase === 'grading') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        Grading your test…
      </div>
    )
  }

  if (phase === 'results' && results) {
    const correctCount = results.filter((r) => r.correct).length
    const total = results.length
    const missedCount = total - correctCount
    const totalXp = xp.baseXp + xp.bonusXp
    return (
      <>
        <div className="animate-fade-up mx-auto max-w-2xl px-4 py-10 pb-24">
          <Companion
            message={
              missedCount === 0
                ? `Perfect — ${correctCount}/${total}! That's locked in.`
                : `You got ${correctCount}/${total}. Tap a question to review what slipped.`
            }
            mood={missedCount === 0 ? 'celebrate' : 'thinking'}
            className="mb-5"
          />
          <Card>
            <h1 className="text-h2">Test complete</h1>
            <p className="mt-1 text-slate-600">
              You scored <strong>{correctCount}</strong> of <strong>{total}</strong>.
            </p>
            {totalXp > 0 && (
              <p className="mt-2 text-sm text-slate-600">
                <strong className="text-blush-600">⭐ {totalXp} XP</strong> earned — {xp.baseXp} base
                {xp.bonusXp > 0 ? <> + {xp.bonusXp} speed bonus</> : null}.
              </p>
            )}
          </Card>

          <h2 className="text-h3 mt-6">{missedCount > 0 ? 'Review what you missed' : 'Your answers'}</h2>
          <div className="mt-3 space-y-2">
            {results.map((r, i) => {
              const open = expanded.has(i)
              return (
                <div
                  key={i}
                  className={`overflow-hidden rounded-2xl border-2 ${
                    r.correct ? 'border-slate-200 bg-white' : 'border-error-500/40 bg-error-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev)
                        if (next.has(i)) next.delete(i)
                        else next.add(i)
                        return next
                      })
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span className={r.correct ? 'text-success-600' : 'text-error-600'}>
                        {r.correct ? '✓' : '✗'}
                      </span>
                      Question {i + 1}
                      {!r.correct && <span className="text-xs font-medium text-error-600">· review</span>}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{open ? 'Hide' : 'Show'}</span>
                  </button>
                  {open && (
                    <div className="border-t border-slate-200/70 px-4 py-3 text-sm">
                      <p className="font-medium text-slate-900">{r.problem.prompt}</p>
                      <p className="mt-2 text-slate-600">
                        Your answer:{' '}
                        <span className={`font-mono font-semibold ${r.correct ? 'text-success-700' : 'text-error-700'}`}>
                          {r.answerText || '—'}
                        </span>
                      </p>
                      {!r.correct && (
                        <p className="mt-1 text-slate-600">
                          Correct answer:{' '}
                          <span className="font-mono font-semibold text-success-700">{r.problem.answer}</span>
                        </p>
                      )}
                      <p className="mt-2 text-slate-600">{r.problem.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-end gap-3">
            <Button onClick={onExit}>Done →</Button>
          </div>
        </div>
      </>
    )
  }

  // testing
  const problem = problems[index]
  const answeredCount = answers.filter((a) => a.trim()).length
  return (
    <>
      <div className="animate-fade-up mx-auto max-w-2xl px-4 py-8 pb-24">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
            {remainingSec != null && (
              <span
                className={`rounded-full px-2.5 py-1 font-bold ${
                  remainingSec <= 10 ? 'bg-error-100 text-error-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                ⏱ {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, '0')}
              </span>
            )}
            {answeredCount}/{items.length} answered
          </span>
        </div>
        {subtitle && <p className="mb-3 text-sm text-slate-500">{subtitle}</p>}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {items.map((_, i) => {
            const isCurrent = i === index
            const isAnswered = answers[i].trim().length > 0
            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ', blank'}`}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                  isCurrent
                    ? 'bg-brand-600 text-white ring-2 ring-brand-300 ring-offset-1'
                    : isAnswered
                      ? 'bg-brand-100 text-brand-700'
                      : 'border border-slate-200 bg-white text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Question {index + 1} of {items.length}
          </p>
          <p className="mt-2 text-base font-medium text-slate-900">{problem.prompt}</p>
          <input
            type="text"
            inputMode="numeric"
            value={answers[index]}
            onChange={(e) => setCurrentAnswer(e.target.value.replace(/[^0-9./]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                goTo(index + 1)
              }
            }}
            placeholder="Type your answer"
            className="mt-4 w-full rounded-2xl border-2 border-brand-100 bg-white px-4 py-3 font-mono text-base focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-lg"
          />
          <p className="mt-3 text-xs text-slate-400">
            No feedback until you submit — answer in any order and review your work first.
          </p>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:py-4">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" onClick={onExit}>
            Exit
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              ← Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(index + 1)}
              disabled={index === items.length - 1}
            >
              Next →
            </Button>
            <Button onClick={() => void submit()}>Submit test</Button>
          </div>
        </div>
      </div>
    </>
  )
}
