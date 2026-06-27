import { useState } from 'react'
import { Button } from '../../components/Button'
import { FeedbackBox } from '../../components/FeedbackBox'
import type { FeedbackMap, Question } from '../../content/types'
import { StepHelp, type StepAiHelp } from './StepHelp'

interface NumericQuestionStepProps {
  prompt?: string
  question: Question
  feedback?: FeedbackMap
  hint?: string
  computationHint?: string
  onAnswer: (value: number, correct: boolean) => void
  disabled?: boolean
  showResult?: boolean
  lastAnswer?: number | null
  aiHelp?: StepAiHelp | null
  aiBusy?: boolean
  onRequestHint?: () => void
  onRequestFeedback?: () => void
  onRevisit?: (stepId: string) => void
  reviewStepTitle?: string
}

export function NumericQuestionStep({
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
}: NumericQuestionStepProps) {
  const [value, setValue] = useState(
    lastAnswer !== null && lastAnswer !== undefined ? String(lastAnswer) : '',
  )

  const checkValue = (num: number) =>
    typeof question.correctAnswer === 'number' &&
    Math.abs(num - question.correctAnswer) <= (question.tolerance ?? 0)

  const isCorrect =
    showResult &&
    lastAnswer !== null &&
    lastAnswer !== undefined &&
    checkValue(lastAnswer)

  // After a wrong answer the input stays editable so the learner can fix it and
  // re-check immediately — no "Try again" step. Once correct, it locks.
  const locked = !!isCorrect

  const handleSubmit = (): boolean => {
    const num = parseFloat(value)
    if (isNaN(num)) return false
    const correct = checkValue(num)
    onAnswer(num, correct)
    return correct
  }

  return (
    <div>
      {prompt && <p className="mb-4 text-base font-medium text-slate-800 sm:text-lg">{prompt}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))}
          disabled={disabled || locked}
          placeholder="Type your answer"
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
      {showResult && !isCorrect && (
        <p className="mt-2 text-sm text-slate-500">
          Edit your number above and check again.
        </p>
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
