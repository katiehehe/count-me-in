import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import type { ChallengeUnderstanding, RecommendedNextAction } from './challengeTypes'
import { ACTION_LABEL, UNDERSTANDING_LABEL } from './challengeXp'
import { Companion } from './Companion'

interface ChallengeSummaryProps {
  overall: ChallengeUnderstanding
  xpEarned: number
  /** Specific misconceptions the AI flagged (already deduped/filtered). May be empty. */
  conceptsToReview: string[]
  recommended: RecommendedNextAction
  hasNextLesson: boolean
  onNextLesson: () => void
  onReviewLesson: () => void
  onBackToCourse: () => void
  /** Label for the back/exit button (e.g. "Back to review" in the spaced-review round-trip). */
  backLabel?: string
}

const MOOD: Record<ChallengeUnderstanding, 'happy' | 'thinking' | 'celebrate'> = {
  strong: 'celebrate',
  developing: 'happy',
  needs_review: 'thinking',
}

function ConceptList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'review' }) {
  return (
    <div className="flex-1">
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      {items.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((c) => (
            <li
              key={c}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tone === 'good'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {c}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-400">—</p>
      )}
    </div>
  )
}

/** End-of-challenge reflection summary, XP, concept breakdown, and recommendation. */
export function ChallengeSummary({
  overall,
  xpEarned,
  conceptsToReview,
  recommended,
  hasNextLesson,
  onNextLesson,
  onReviewLesson,
  onBackToCourse,
  backLabel,
}: ChallengeSummaryProps) {
  return (
    <div className="animate-fade-up mx-auto max-w-2xl px-4 py-10">
      <Card>
        <Companion
          mood={MOOD[overall]}
          xp={xpEarned}
          message="That's a wrap — thanks for thinking it through with me!"
        />

        <div className="mt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Reflection summary
          </p>
          <h1 className="text-h2 mt-1">{UNDERSTANDING_LABEL[overall]}</h1>
          <p className="mt-1 text-sm text-slate-600">
            You earned <span className="font-bold text-amber-600">🐟 {xpEarned} XP</span> this round.
          </p>
        </div>

        {conceptsToReview.length > 0 && (
          <div className="mt-6">
            <ConceptList title="Worth reviewing" items={conceptsToReview} tone="review" />
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-center">
          <p className="text-sm font-medium text-slate-700">
            Recommended next: <span className="font-bold text-brand-700">{ACTION_LABEL[recommended]}</span>
          </p>
        </div>
      </Card>

      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {recommended === 'continue' && hasNextLesson ? (
          <>
            <Button size="lg" onClick={onNextLesson}>
              Next lesson →
            </Button>
            <Button variant="secondary" onClick={onReviewLesson}>
              Review this lesson
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" variant={recommended === 'continue' ? 'primary' : 'secondary'} onClick={onReviewLesson}>
              Review this lesson
            </Button>
            {hasNextLesson && (
              <Button variant={recommended === 'continue' ? 'secondary' : 'primary'} onClick={onNextLesson}>
                Next lesson →
              </Button>
            )}
          </>
        )}
        <Button variant="ghost" onClick={onBackToCourse}>
          {backLabel ?? 'Back to course'}
        </Button>
      </div>
    </div>
  )
}
