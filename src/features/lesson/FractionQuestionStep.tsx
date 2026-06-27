import { useState } from 'react'
import { Button } from '../../components/Button'
import { FeedbackBox } from '../../components/FeedbackBox'
import type { FeedbackMap, Question } from '../../content/types'
import { fractionsEqual, isReduced, parseFraction } from './fraction'
import { StepHelp, type StepAiHelp } from './StepHelp'

interface FractionQuestionStepProps {
  prompt?: string
  question: Question
  feedback?: FeedbackMap
  hint?: string
  computationHint?: string
  onAnswer: (value: string, correct: boolean) => void
  disabled?: boolean
  showResult?: boolean
  lastAnswer?: string | null
  aiHelp?: StepAiHelp | null
  aiBusy?: boolean
  onRequestHint?: () => void
  onRequestFeedback?: () => void
  onRevisit?: (stepId: string) => void
  reviewStepTitle?: string
}

export function FractionQuestionStep({
  prompt,
  question,
  feedback,
  hint,
  computationHint,
  onAnswer,
  disabled,
  showResult,
  lastAnswer,
  aiHelp,
  aiBusy,
  onRequestHint,
  onRequestFeedback,
  onRevisit,
  reviewStepTitle,
}: FractionQuestionStepProps) {
  const [value, setValue] = useState(lastAnswer ?? '')
  // Set only when the learner submits something that isn't a valid fraction, so
  // we can nudge the format without recording a wrong attempt.
  const [formatError, setFormatError] = useState(false)

  const target = parseFraction(String(question.correctAnswer ?? ''))

  const checkValue = (input: string) => {
    const parsed = parseFraction(input)
    if (!parsed || !target) return false
    return fractionsEqual(parsed, target)
  }

  const isCorrect = showResult && lastAnswer != null && checkValue(lastAnswer)

  // After a wrong answer the input stays editable so the learner can fix it and
  // re-check immediately. Once correct, it locks.
  const locked = !!isCorrect

  // Gentle "you could simplify" nudge — still fully correct, just not reduced.
  const correctButUnreduced =
    isCorrect && (() => {
      const parsed = lastAnswer != null ? parseFraction(lastAnswer) : null
      return parsed ? !isReduced(parsed) : false
    })()

  const handleSubmit = (): boolean => {
    const parsed = parseFraction(value)
    if (!parsed) {
      setFormatError(true)
      return false
    }
    setFormatError(false)
    const correct = checkValue(value)
    onAnswer(value.trim(), correct)
    return correct
  }

  return (
    <div>
      {prompt && <p className="mb-4 text-base font-medium text-slate-800 sm:text-lg">{prompt}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          inputMode="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/[^0-9/]/g, ''))
            if (formatError) setFormatError(false)
          }}
          disabled={disabled || locked}
          placeholder="Enter a fraction, e.g. 1/8"
          aria-label="Answer as a fraction"
          className="flex-1 rounded-2xl border-2 border-brand-100 bg-white px-4 py-3 font-mono text-base focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-lg"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            // Enter only submits and shows the explanation; a second Enter advances.
            handleSubmit()
          }}
        />
        {!locked && (
          <Button onClick={handleSubmit} disabled={!value || disabled}>
            Check
          </Button>
        )}
      </div>
      {formatError && !showResult && (
        <p className="mt-2 text-sm text-warm-600">
          Enter your answer as a fraction like <span className="font-mono font-semibold">1/8</span>.
        </p>
      )}
      {showResult && (
        <FeedbackBox
          variant={isCorrect ? 'correct' : 'incorrect'}
          title={isCorrect ? 'Correct!' : undefined}
          message={
            isCorrect
              ? question.explanation || feedback?.correct || ''
              : 'Not quite — give it another try. Stuck? Use the hint below.'
          }
        />
      )}
      {correctButUnreduced && (
        <p className="mt-2 text-sm text-slate-500">
          Tip: that&apos;s right, and it also simplifies to lowest terms.
        </p>
      )}
      {showResult && !isCorrect && (
        <p className="mt-2 text-sm text-slate-500">Edit your fraction above and check again.</p>
      )}
      {!locked && (
        <StepHelp
          hint={hint}
          computationHint={computationHint}
          aiHelp={aiHelp}
          aiBusy={aiBusy}
          wrong={!!showResult && !isCorrect}
          onRequestHint={onRequestHint}
          onRequestFeedback={onRequestFeedback}
          onRevisit={onRevisit}
          reviewStepTitle={reviewStepTitle}
        />
      )}
    </div>
  )
}
