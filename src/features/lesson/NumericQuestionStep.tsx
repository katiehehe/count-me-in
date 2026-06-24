import { useState } from 'react'
import { Button } from '../../components/Button'
import { FeedbackBox } from '../../components/FeedbackBox'
import { HintButton } from '../../components/HintButton'
import type { FeedbackMap, Question } from '../../content/types'

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

  const handleSubmit = () => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    onAnswer(num, checkValue(num))
  }

  return (
    <div>
      {prompt && <p className="mb-4 text-lg font-medium text-slate-800">{prompt}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          disabled={disabled || locked}
          placeholder="Type your answer"
          className="flex-1 rounded-2xl border-2 border-brand-100 bg-white px-4 py-3 text-lg font-mono focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
              : feedback?.incorrect ?? question.explanation
          }
        />
      )}
      {showResult && !isCorrect && (
        <p className="mt-2 text-sm text-slate-500">
          Edit your number above and check again.
        </p>
      )}
      {!locked && <HintButton hint={hint} computationHint={computationHint} />}
    </div>
  )
}
