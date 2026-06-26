import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { makeSeed } from '../../content/randomize'
import {
  evaluateChallengeResponse,
  generateChallengeQuestion,
  requestDifficultyShift,
} from './ai/challengeAi'
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

type Phase = 'thinking' | 'answering' | 'evaluating' | 'feedback'

const FALLBACK_QUESTION: Record<ChallengeQuestionType, string> = {
  explain_it_back: 'In your own words, what was the main idea of this lesson?',
  catch_the_mistake:
    'A student says you can always just multiply the number of options by itself once per slot. When does that reasoning break down for this lesson?',
  real_life_example: "Describe a real-life situation where this lesson's idea shows up.",
  transfer: '',
  difficulty_shift: '',
}

const FEEDBACK_TONE: Record<ChallengeUnderstanding, string> = {
  strong: 'border-success-300 bg-success-50 text-success-800',
  developing: 'border-brand-200 bg-brand-50 text-brand-800',
  needs_review: 'border-amber-300 bg-amber-50 text-amber-800',
}

/** The 2-4 question Q&A loop: generate → answer → feedback, with a difficulty-shift option. */
export function ChallengeConversation({ ctx, plan, sessionId, onComplete }: ChallengeConversationProps) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('thinking')
  const [question, setQuestion] = useState('')
  const [companionMsg, setCompanionMsg] = useState('')
  const [transfer, setTransfer] = useState<TransferQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<ChallengeAnsweredItem | null>(null)
  const [shiftMsg, setShiftMsg] = useState<string | null>(null)
  const [shiftBusy, setShiftBusy] = useState(false)

  const itemsRef = useRef<ChallengeAnsweredItem[]>([])
  const loadedForIndex = useRef(-1)
  const mounted = useRef(true)
  useEffect(() => () => void (mounted.current = false), [])

  const type = plan[index]
  const isTransfer = type === 'transfer'
  const isLast = index === plan.length - 1
  const runningXp = itemsRef.current.reduce((sum, i) => sum + i.xpAwarded, 0)

  useEffect(() => {
    // Guard so React strict-mode's double-invoke doesn't fire two AI calls.
    if (loadedForIndex.current === index) return
    loadedForIndex.current = index
    setPhase('thinking')
    setAnswer('')
    setResult(null)
    setShiftMsg(null)
    setTransfer(null)

    const t = plan[index]
    if (t === 'transfer') {
      const tq = buildTransferQuestion(ctx.concepts, makeSeed())
      setTransfer(tq)
      setQuestion(tq.prompt)
      setCompanionMsg('Here is a fresh one to try — type the number.')
      setPhase('answering')
      return
    }
    generateChallengeQuestion(ctx, t)
      .then((q) => {
        if (!mounted.current) return
        setQuestion(q.question)
        setCompanionMsg(q.companionMessage)
      })
      .catch(() => {
        if (!mounted.current) return
        setQuestion(FALLBACK_QUESTION[t])
        setCompanionMsg("Here's a question for you:")
      })
      .finally(() => {
        if (mounted.current) setPhase('answering')
      })
  }, [index, ctx, plan])

  async function submit() {
    const trimmed = answer.trim()
    if (phase !== 'answering' || !trimmed) return
    setPhase('evaluating')

    let item: ChallengeAnsweredItem
    if (isTransfer && transfer) {
      // Correctness is decided by CODE; the AI only phrases the explanation.
      const correct = checkTransferAnswer(trimmed, transfer.answer)
      const understanding: ChallengeUnderstanding = correct ? 'strong' : 'needs_review'
      let feedback = correct
        ? `Correct! ${transfer.formula} = ${transfer.answer}.`
        : `Not quite — the answer is ${transfer.answer} (${transfer.formula}).`
      let misconception: string | undefined
      try {
        const evalOut = await evaluateChallengeResponse({
          ctx,
          type,
          question,
          studentAnswer: trimmed,
          codeVerdict: { correct, correctAnswer: String(transfer.answer) },
        })
        feedback = evalOut.feedback || feedback
        misconception = evalOut.misconceptionDetected
      } catch {
        /* keep the deterministic feedback */
      }
      item = {
        type,
        question,
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
        const evalOut = await evaluateChallengeResponse({ ctx, type, question, studentAnswer: trimmed })
        understanding = evalOut.understanding
        feedback = evalOut.feedback || feedback
        misconception = evalOut.misconceptionDetected
      } catch {
        /* fall back to an encouraging, neutral evaluation */
      }
      item = {
        type,
        question,
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
    itemsRef.current = [...itemsRef.current, item]
    setResult(item)
    setPhase('feedback')
  }

  function next() {
    if (isLast) {
      onComplete(itemsRef.current)
      return
    }
    setIndex((i) => i + 1)
  }

  async function shift(mode: 'simpler' | 'contest' | 'example') {
    setShiftBusy(true)
    try {
      const msg = await requestDifficultyShift(ctx, question, mode)
      if (mounted.current) setShiftMsg(msg || 'No suggestion right now — give it your best shot!')
    } catch {
      if (mounted.current) setShiftMsg('Pip is napping — try again in a moment.')
    } finally {
      if (mounted.current) setShiftBusy(false)
    }
  }

  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-8 pb-28">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Question {index + 1} of {plan.length}
      </p>

      <Companion
        message={companionMsg}
        xp={runningXp}
        mood={phase === 'thinking' || phase === 'evaluating' ? 'thinking' : 'happy'}
        className="mb-4"
      />

      <Card>
        {phase === 'thinking' ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            Pip is thinking of a good question…
          </div>
        ) : (
          <>
            <p className="text-base font-medium text-slate-900">{question}</p>

            {phase !== 'feedback' ? (
              <div className="mt-4">
                {isTransfer ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void submit()
                      }
                    }}
                    placeholder="Type a number"
                    disabled={phase === 'evaluating'}
                    className="w-full rounded-lg border border-brand-200 px-3 py-2 text-base outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                ) : (
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer in your own words…"
                    rows={4}
                    disabled={phase === 'evaluating'}
                    className="w-full resize-y rounded-lg border border-brand-200 px-3 py-2 text-base outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button onClick={() => void submit()} disabled={phase === 'evaluating' || !answer.trim()}>
                    {phase === 'evaluating' ? 'Checking…' : 'Submit answer'}
                  </Button>
                  <span className="mx-1 text-xs text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => void shift('simpler')}
                    disabled={shiftBusy}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Explain simpler
                  </button>
                  <button
                    type="button"
                    onClick={() => void shift('contest')}
                    disabled={shiftBusy}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Contest-style
                  </button>
                  <button
                    type="button"
                    onClick={() => void shift('example')}
                    disabled={shiftBusy}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Another example
                  </button>
                </div>
              </div>
            ) : (
              result && (
                <div className="mt-4">
                  <div className={`rounded-2xl border px-4 py-3 ${FEEDBACK_TONE[result.understanding]}`}>
                    <p className="text-xs font-bold uppercase tracking-wide">
                      {UNDERSTANDING_LABEL[result.understanding]} · +{result.xpAwarded} 🐟
                    </p>
                    <p className="mt-1 text-sm">{result.feedback}</p>
                    {result.misconceptionDetected && (
                      <p className="mt-2 text-xs italic">
                        Watch out for: {result.misconceptionDetected}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}

            {shiftMsg && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-semibold text-brand-700">Pip: </span>
                {shiftMsg}
              </div>
            )}
          </>
        )}
      </Card>

      {phase === 'feedback' && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-end">
            <Button onClick={next}>{isLast ? 'See results →' : 'Next question →'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
