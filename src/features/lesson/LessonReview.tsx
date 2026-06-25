import type { Lesson, LessonStep } from '../../content/types'
import { CONCEPT_LABELS } from '../../content/types'
import type { LessonProgressDoc, StepAnswerRecord } from '../../firebase/firestoreTypes'
import { Card } from '../../components/Card'
import { MasteryBadge } from '../../components/MasteryBadge'
import { StarButton } from '../../components/StarButton'

interface LessonReviewProps {
  lesson: Lesson
  progress: LessonProgressDoc
  starredSteps: string[]
  onToggleStar: (stepId: string) => void
  onJumpToStep: (stepIndex: number) => void
}

interface ReviewRow {
  stepId: string
  stepIndex: number
  prompt: string
  userAnswerLabel: string
  correctAnswerLabel?: string
  /** true / false on first attempt, or null if the step was never answered. */
  firstCorrect: boolean | null
  starred: boolean
}

function describeAnswer(step: LessonStep, record: StepAnswerRecord | undefined) {
  let firstCorrect: boolean | null = null
  let firstAnswer: string | number | object | undefined

  if (record) {
    // Show the ORIGINAL first attempt (later edits/replays are always correct,
    // which would otherwise hide what the learner actually got wrong).
    firstCorrect = record.firstAttemptCorrect ?? record.correct
    firstAnswer = record.firstAttemptAnswer ?? record.answer
  }

  let userAnswerLabel = '—'
  let correctAnswerLabel: string | undefined

  if (step.type === 'multiple-choice' && step.question?.choices) {
    const idx = typeof firstAnswer === 'number' ? firstAnswer : -1
    const correctIdx = step.question.correctChoiceIndex ?? -1
    userAnswerLabel = step.question.choices[idx] ?? '—'
    correctAnswerLabel = step.question.choices[correctIdx]
  } else if (step.type === 'numeric-question' || step.type === 'fraction-question') {
    userAnswerLabel = firstAnswer !== undefined ? String(firstAnswer) : '—'
    correctAnswerLabel =
      step.question?.correctAnswer !== undefined ? String(step.question.correctAnswer) : undefined
  }

  return { firstCorrect, userAnswerLabel, correctAnswerLabel }
}

function buildSections(lesson: Lesson, progress: LessonProgressDoc, starredSteps: string[]) {
  // Union of the live (optimistic) stars and whatever is saved in Firestore.
  const starredSet = new Set([...starredSteps, ...(progress.starredSteps ?? [])])

  const wrongRows: ReviewRow[] = []
  const starredRows: ReviewRow[] = []

  for (const [stepIndex, step] of lesson.steps.entries()) {
    const record = progress.stepAnswers?.[step.id]
    const starred = starredSet.has(step.id)
    const { firstCorrect, userAnswerLabel, correctAnswerLabel } = describeAnswer(step, record)

    const row: ReviewRow = {
      stepId: step.id,
      stepIndex,
      prompt: step.prompt ?? step.title,
      userAnswerLabel,
      correctAnswerLabel,
      firstCorrect,
      starred,
    }

    // Wrong-on-first-try uses an EXPLICIT false (never a fallback to record.correct,
    // which is always true once the learner edits their way to the right answer).
    if (firstCorrect === false) wrongRows.push(row)
    // Starred steps appear regardless of whether they have an answer record yet.
    if (starred) starredRows.push(row)
  }

  return { wrongRows, starredRows }
}

function ReviewRowCard({
  row,
  variant,
  onToggleStar,
  onJumpToStep,
}: {
  row: ReviewRow
  variant: 'wrong' | 'starred'
  onToggleStar: (stepId: string) => void
  onJumpToStep: (stepIndex: number) => void
}) {
  const answered = row.firstCorrect !== null
  const isWrong = row.firstCorrect === false
  const tone =
    variant === 'wrong'
      ? 'border-error-100 bg-error-50'
      : 'border-amber-100 bg-amber-50/60'

  return (
    <button
      type="button"
      onClick={() => onJumpToStep(row.stepIndex)}
      aria-label={`Go to question ${row.stepIndex + 1}`}
      className={`w-full cursor-pointer rounded-2xl border-2 p-3 text-left transition hover:brightness-95 ${tone}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{row.prompt}</p>
        <StarButton size="sm" starred={row.starred} onToggle={() => onToggleStar(row.stepId)} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {answered ? (
          <span className={isWrong ? 'text-error-700' : 'text-success-700'}>
            {isWrong ? '✗' : '✓'} Your answer:{' '}
            <span className="font-semibold">{row.userAnswerLabel}</span>
          </span>
        ) : (
          <span className="text-slate-400">Not answered yet</span>
        )}
        {row.correctAnswerLabel && (isWrong || !answered) && (
          <span className="text-slate-500">
            Correct: <span className="font-semibold">{row.correctAnswerLabel}</span>
          </span>
        )}
      </div>
    </button>
  )
}

export function LessonReview({
  lesson,
  progress,
  starredSteps,
  onToggleStar,
  onJumpToStep,
}: LessonReviewProps) {
  const { wrongRows, starredRows } = buildSections(lesson, progress, starredSteps)
  const conceptMastery = progress.conceptMastery ?? {}

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-slate-500">Your mastery</p>
            <MasteryBadge
              masteryScore={progress.masteryScore}
              correct={progress.gradedCorrect}
              total={progress.gradedTotal}
              showCount
            />
          </div>
          {Object.keys(conceptMastery).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(conceptMastery).map(([id, score]) => (
                <span
                  key={id}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                >
                  {CONCEPT_LABELS[id] ?? id}: {Math.round(score * 100)}%
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-h4 mb-1">Wrong on first try</h2>
          <p className="mb-3 text-sm text-slate-500">
            Questions you missed before getting them right.
          </p>
          {wrongRows.length > 0 ? (
            <div className="space-y-3">
              {wrongRows.map((row) => (
                <ReviewRowCard
                  key={row.stepId}
                  row={row}
                  variant="wrong"
                  onToggleStar={onToggleStar}
                  onJumpToStep={onJumpToStep}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Nice — you nailed every question on the first try. 🎉
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-h4 mb-1">Starred for review</h2>
          <p className="mb-3 text-sm text-slate-500">
            Tap the ☆ on any question to save it here.
          </p>
          {starredRows.length > 0 ? (
            <div className="space-y-3">
              {starredRows.map((row) => (
                <ReviewRowCard
                  key={row.stepId}
                  row={row}
                  variant="starred"
                  onToggleStar={onToggleStar}
                  onJumpToStep={onJumpToStep}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No starred questions yet. Tap the ☆ on a question to save it.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
