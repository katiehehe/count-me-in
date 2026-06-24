import { FeedbackBox } from '../../components/FeedbackBox'
import { HintButton } from '../../components/HintButton'
import type { FeedbackMap, Question } from '../../content/types'

interface MultipleChoiceStepProps {
  prompt?: string
  question: Question
  feedback?: FeedbackMap
  hint?: string
  computationHint?: string
  onAnswer: (choiceIndex: number, correct: boolean) => void
  disabled?: boolean
  showResult?: boolean
  selectedIndex?: number | null
  /**
   * When true (lesson questions), choices stay clickable even after the learner
   * answers correctly, so they can probe the wrong options to see why each fails.
   * When false (mastery check), the first answer locks in.
   */
  allowChange?: boolean
  /** Sticky: the learner has already chosen the correct answer at least once. */
  everCorrect?: boolean
}

export function MultipleChoiceStep({
  prompt,
  question,
  feedback,
  hint,
  computationHint,
  onAnswer,
  disabled,
  showResult,
  selectedIndex,
  allowChange = false,
  everCorrect = false,
}: MultipleChoiceStepProps) {
  const isCorrect = selectedIndex === question.correctChoiceIndex
  // Lesson questions never lock — even after a correct pick the learner can tap
  // the wrong options to see why they fail. Mastery mode locks on first answer.
  const locked = !!showResult && !allowChange
  // Once they've answered correctly, keep the correct choice highlighted green.
  const solved = everCorrect || (!!showResult && isCorrect)

  const handleSelect = (index: number) => {
    if (disabled || locked) return
    onAnswer(index, index === question.correctChoiceIndex)
  }

  const getFeedbackMessage = () => {
    if (!showResult || selectedIndex === null || selectedIndex === undefined) return ''
    if (isCorrect) return question.explanation || feedback?.correct || ''
    // On a wrong pick, show the misconception nudge for that specific choice if we
    // have one (it explains why the option is wrong WITHOUT revealing the answer).
    // Otherwise just prompt a retry — never fall back to the answer-revealing
    // explanation, so the solution isn't spoiled before they want it.
    const choice = question.choices?.[selectedIndex]
    if (choice && feedback?.choiceFeedback?.[choice]) return feedback.choiceFeedback[choice]
    return 'Not quite — give it another try. Stuck? Use the hint below.'
  }

  return (
    <div>
      {prompt && <p className="mb-4 text-base font-medium text-slate-800 sm:text-lg">{prompt}</p>}
      <div className="space-y-2.5">
        {question.choices?.map((choice, i) => {
          let style = 'border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50'
          if ((locked || solved) && i === question.correctChoiceIndex) {
            style = 'border-success-500 bg-success-50 text-success-700'
          } else if (showResult && i === selectedIndex && i !== question.correctChoiceIndex) {
            style = 'border-error-500 bg-error-50 text-error-700'
          } else if (selectedIndex === i && !showResult) {
            style = 'border-brand-400 bg-brand-50'
          }

          return (
            <button
              key={choice}
              onClick={() => handleSelect(i)}
              disabled={disabled || locked}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-sm font-medium transition-colors sm:px-4 sm:text-base ${style}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  (locked || solved) && i === question.correctChoiceIndex
                    ? 'border-success-500 bg-success-500 text-white'
                    : showResult && i === selectedIndex && i !== question.correctChoiceIndex
                      ? 'border-error-500 bg-error-500 text-white'
                      : 'border-brand-200 text-brand-500'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {choice}
            </button>
          )
        })}
      </div>
      {showResult && (
        <FeedbackBox
          variant={isCorrect ? 'correct' : 'incorrect'}
          title={isCorrect ? 'Correct!' : undefined}
          message={getFeedbackMessage()}
        />
      )}
      {showResult && !isCorrect && allowChange && (
        <p className="mt-2 text-sm text-slate-500">
          {solved
            ? 'That option’s logic doesn’t hold — the green answer is still correct. Tap others to compare.'
            : 'Pick another answer to try again.'}
        </p>
      )}
      {!locked && <HintButton hint={hint} computationHint={computationHint} />}
    </div>
  )
}
