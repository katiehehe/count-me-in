import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { FeedbackBox } from '../../components/FeedbackBox'
import { makeSeed } from '../../content/randomize'
import { requestLessonHint } from '../lesson/lessonAi'
import { evaluateChallengeResponse, generateChallengeQuestion } from './ai/challengeAi'
import { recordChallengeResponse } from './challengeService'
import type {
  ChallengeAnsweredItem,
  ChallengeGroundingContext,
  ChallengeQuestionType,
  ChallengeUnderstanding,
} from './challengeTypes'
import { UNDERSTANDING_LABEL, xpForUnderstanding } from './challengeXp'
import { Companion } from './Companion'
import { buildTransferQuestion, checkTransferAnswer, type TransferQuestion } from './transferQuestions'

interface ChallengeConversationProps {
  ctx: ChallengeGroundingContext
  plan: ChallengeQuestionType[]
  sessionId: string
  onComplete: (items: ChallengeAnsweredItem[]) => void
}

/** Per-question state, cached by index so Back/Continue restore prior questions. */
interface QState {
  question: string
  companionMsg: string
  transfer: TransferQuestion | null
  answer: string
  result: ChallengeAnsweredItem | null
  hint: string | null
}

const FALLBACK_QUESTION: Record<ChallengeQuestionType, string> = {
  explain_it_back: 'In your own words, what was the main idea of this lesson?',
  catch_the_mistake:
    'A student says you can always just multiply the number of options by itself once per slot. When does that reasoning break down for this lesson?',
  real_life_example: "Describe a real-life situation where this lesson's idea shows up.",
  transfer: '',
  difficulty_shift: '',
}

const TYPE_LABEL: Record<ChallengeQuestionType, string> = {
  transfer: 'Review question',
  catch_the_mistake: 'Spot the mistake',
  explain_it_back: 'Explain your thinking',
  real_life_example: 'Real-world example',
  difficulty_shift: '',
}

const FEEDBACK_VARIANT: Record<ChallengeUnderstanding, 'correct' | 'incorrect' | 'neutral'> = {
  strong: 'correct',
  developing: 'neutral',
  needs_review: 'incorrect',
}

/**
 * The fixed 4-step challenge, presented like a normal lesson question: an inline
 * Check button, a "Help me" hint, and a Back / Continue bottom bar. The input
 * stays editable after a wrong answer, so retrying is just edit-and-Check-again.
 */
export function ChallengeConversation({ ctx, plan, sessionId, onComplete }: ChallengeConversationProps) {
  const [index, setIndex] = useState(0)
  const [states, setStates] = useState<Record<number, QState>>({})
  const [checking, setChecking] = useState(false)
  const [hintBusy, setHintBusy] = useState(false)

  const statesRef = useRef(states)
  statesRef.current = states
  const loadingSet = useRef<Set<number>>(new Set())
  const mounted = useRef(true)
  useEffect(() => () => void (mounted.current = false), [])

  const type = plan[index]
  const isTransfer = type === 'transfer'
  const isLast = index === plan.length - 1
  const current = states[index]
  const result = current?.result ?? null
  const locked = result?.understanding === 'strong'
  const runningXp = Object.values(states).reduce((sum, s) => sum + (s.result?.xpAwarded ?? 0), 0)

  const patch = (i: number, partial: Partial<QState>) =>
    setStates((prev) => ({ ...prev, [i]: { ...prev[i], ...partial } }))

  // Load the question for the current index once (cached afterward so Back works).
  useEffect(() => {
    if (statesRef.current[index] || loadingSet.current.has(index)) return
    loadingSet.current.add(index)
    const t = plan[index]
    if (t === 'transfer') {
      const tq = buildTransferQuestion(ctx.concepts, makeSeed())
      loadingSet.current.delete(index)
      setStates((prev) => ({
        ...prev,
        [index]: {
          question: tq.prompt,
          companionMsg: 'Here is a fresh one to try — type the number.',
          transfer: tq,
          answer: '',
          result: null,
          hint: null,
        },
      }))
      return
    }
    generateChallengeQuestion(ctx, t)
      .then((q) => {
        loadingSet.current.delete(index)
        if (!mounted.current) return
        setStates((prev) => ({
          ...prev,
          [index]: {
            question: q.question,
            companionMsg: q.companionMessage,
            transfer: null,
            answer: '',
            result: null,
            hint: null,
          },
        }))
      })
      .catch(() => {
        loadingSet.current.delete(index)
        if (!mounted.current) return
        setStates((prev) => ({
          ...prev,
          [index]: {
            question: FALLBACK_QUESTION[t],
            companionMsg: "Here's a question for you:",
            transfer: null,
            answer: '',
            result: null,
            hint: null,
          },
        }))
      })
  }, [index, ctx, plan])

  async function check() {
    const cur = statesRef.current[index]
    if (!cur || checking) return
    const trimmed = cur.answer.trim()
    if (!trimmed) return
    setChecking(true)

    let item: ChallengeAnsweredItem
    if (isTransfer && cur.transfer) {
      // Correctness is decided by CODE; the AI only phrases the explanation.
      const correct = checkTransferAnswer(trimmed, cur.transfer.answer)
      const understanding: ChallengeUnderstanding = correct ? 'strong' : 'needs_review'
      let feedback = correct
        ? `Correct! ${cur.transfer.formula} = ${cur.transfer.answer}.`
        : `Not quite — the answer is ${cur.transfer.answer} (${cur.transfer.formula}).`
      let misconception: string | undefined
      try {
        const evalOut = await evaluateChallengeResponse({
          ctx,
          type,
          question: cur.question,
          studentAnswer: trimmed,
          codeVerdict: { correct, correctAnswer: String(cur.transfer.answer) },
        })
        feedback = evalOut.feedback || feedback
        misconception = evalOut.misconceptionDetected
      } catch {
        /* keep deterministic feedback */
      }
      item = {
        type,
        question: cur.question,
        studentAnswer: trimmed,
        feedback,
        understanding,
        misconceptionDetected: misconception,
        xpAwarded: xpForUnderstanding(understanding),
      }
    } else {
      let understanding: ChallengeUnderstanding = 'developing'
      let feedback = 'Thanks for explaining your thinking!'
      let misconception: string | undefined
      try {
        const evalOut = await evaluateChallengeResponse({
          ctx,
          type,
          question: cur.question,
          studentAnswer: trimmed,
        })
        understanding = evalOut.understanding
        feedback = evalOut.feedback || feedback
        misconception = evalOut.misconceptionDetected
      } catch {
        /* fall back to an encouraging, neutral evaluation */
      }
      item = {
        type,
        question: cur.question,
        studentAnswer: trimmed,
        feedback,
        understanding,
        misconceptionDetected: misconception,
        xpAwarded: xpForUnderstanding(understanding),
      }
    }

    try {
      await recordChallengeResponse(ctx.userId, sessionId, {
        questionType: item.type,
        question: item.question,
        studentAnswer: item.studentAnswer,
        aiFeedback: item.feedback,
        understanding: item.understanding,
        misconceptionDetected: item.misconceptionDetected,
        xpAwarded: item.xpAwarded,
      })
    } catch {
      /* persistence is best-effort; never block the learner */
    }

    if (!mounted.current) return
    patch(index, { result: item })
    setChecking(false)
  }

  async function help() {
    const cur = statesRef.current[index]
    if (!cur || hintBusy) return
    setHintBusy(true)
    try {
      const h = await requestLessonHint({
        lessonTitle: ctx.lessonTitle,
        stepTitle: TYPE_LABEL[type] || 'Challenge question',
        questionText: cur.question,
        concepts: ctx.concepts,
        earlierSteps: [],
      })
      if (mounted.current) {
        patch(index, { hint: h.tiers[0] || 'Think about which counting idea this question is really testing.' })
      }
    } catch {
      if (mounted.current) {
        patch(index, { hint: 'Think about which counting idea this question is really testing.' })
      }
    } finally {
      if (mounted.current) setHintBusy(false)
    }
  }

  function advance() {
    if (isLast) {
      const items = plan
        .map((_, i) => statesRef.current[i]?.result)
        .filter((r): r is ChallengeAnsweredItem => Boolean(r))
      onComplete(items)
      return
    }
    setIndex((i) => i + 1)
  }

  function back() {
    setIndex((i) => Math.max(0, i - 1))
  }

  // Enter moves on once the current question has been answered (a result is shown).
  // Free-text answers keep Enter for newlines; the numeric input handles its own Enter.
  const advanceRef = useRef(advance)
  advanceRef.current = advance
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey) return
      const target = e.target as HTMLElement | null
      if (target && target.tagName === 'TEXTAREA') return
      if (statesRef.current[index]?.result) {
        e.preventDefault()
        advanceRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index])

  return (
    <>
      <div className="animate-fade-up mx-auto max-w-2xl px-4 py-8 pb-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Question {index + 1} of {plan.length}
          {TYPE_LABEL[type] ? <span className="text-slate-300"> · {TYPE_LABEL[type]}</span> : null}
        </p>

        <Companion
          message={current?.companionMsg ?? ''}
          xp={runningXp}
          mood={!current || checking ? 'thinking' : result?.understanding === 'strong' ? 'celebrate' : 'happy'}
          className="mb-4"
        />

        <Card>
          {!current ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Pip is thinking of a good question…
            </div>
          ) : (
            <>
              <p className="text-base font-medium text-slate-900">{current.question}</p>

              <div className="mt-4">
                {isTransfer ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={current.answer}
                      onChange={(e) => patch(index, { answer: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        e.stopPropagation()
                        // Enter checks the answer, then (once answered) moves on.
                        if (statesRef.current[index]?.result) advance()
                        else void check()
                      }}
                      disabled={locked || checking}
                      placeholder="Type a number"
                      className="flex-1 rounded-2xl border-2 border-brand-100 bg-white px-4 py-3 font-mono text-base focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-lg"
                    />
                    {!locked && (
                      <Button onClick={() => void check()} disabled={!current.answer.trim() || checking}>
                        {checking ? 'Checking…' : 'Check'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <textarea
                      value={current.answer}
                      onChange={(e) => patch(index, { answer: e.target.value })}
                      disabled={locked || checking}
                      rows={4}
                      placeholder="Type your answer in your own words…"
                      className="w-full resize-y rounded-2xl border-2 border-brand-100 bg-white px-4 py-3 text-base focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
                    />
                    {!locked && (
                      <div className="mt-2">
                        <Button onClick={() => void check()} disabled={!current.answer.trim() || checking}>
                          {checking ? 'Checking…' : 'Check'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {result && (
                <FeedbackBox
                  variant={FEEDBACK_VARIANT[result.understanding]}
                  title={`${UNDERSTANDING_LABEL[result.understanding]} · +${result.xpAwarded} 🐟`}
                  message={
                    result.feedback +
                    (result.misconceptionDetected ? ` Watch out for: ${result.misconceptionDetected}` : '')
                  }
                />
              )}

              {!locked && (
                <div className="mt-4">
                  {current.hint ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm leading-relaxed text-slate-600">
                        <span className="font-semibold text-slate-500">Hint: </span>
                        {current.hint}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void help()}
                      disabled={hintBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      {hintBusy ? 'Thinking…' : 'Help me'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={back}
            disabled={index === 0}
            className={index === 0 ? 'invisible' : ''}
          >
            ← Back
          </Button>
          <Button onClick={advance} disabled={!result}>
            {isLast ? 'See results →' : 'Continue'}
          </Button>
        </div>
      </div>
    </>
  )
}
