import { HintButton } from '../../components/HintButton'
import { isAiEnabled } from '../../firebase/aiConfig'
import { PipCat } from '../challenge/PipCat'

/** Persisted in-lesson AI help for a step (survives navigation via stepState). */
export type StepAiHelp =
  | {
      kind: 'hint'
      /** The three escalating hints; `revealedTier` controls how many are shown. */
      tiers: string[]
      revealedTier: number
      reviewStepId: string | null
    }
  | { kind: 'feedback'; text: string; reviewStepId: string | null }

interface StepHelpProps {
  /** Static fallback hint (used when AI is off). */
  hint?: string
  computationHint?: string
  aiHelp?: StepAiHelp | null
  aiBusy?: boolean
  /** True when the current answer is wrong → offer "Why was that wrong?". */
  wrong?: boolean
  onRequestHint?: () => void
  onRequestFeedback?: () => void
  onRevisit?: (stepId: string) => void
  /** Title of the recommended revisit step (resolved by the parent). */
  reviewStepTitle?: string
  className?: string
}

// Deliberately understated: hints are a last resort, so the trigger reads as a
// quiet text-button (no pink fill), not a primary call to action.
const BTN =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] disabled:opacity-50'

/**
 * In-lesson help. With AI enabled, Pip gives an adaptive hint (and, after a wrong
 * answer, tailored feedback) that can point back to an earlier step to relearn.
 * With AI off (or not wired), it falls back to the hand-written two-tier hint, so
 * the lesson always works without AI.
 */
export function StepHelp({
  hint,
  computationHint,
  aiHelp,
  aiBusy,
  wrong,
  onRequestHint,
  onRequestFeedback,
  onRevisit,
  reviewStepTitle,
  className = '',
}: StepHelpProps) {
  if (!isAiEnabled() || !onRequestHint) {
    return <HintButton hint={hint} computationHint={computationHint} className={className} />
  }

  const hintHelp = aiHelp && aiHelp.kind === 'hint' ? aiHelp : null
  const feedbackHelp = aiHelp && aiHelp.kind === 'feedback' ? aiHelp : null
  const revealed = hintHelp ? Math.min(hintHelp.revealedTier, hintHelp.tiers.length) : 0

  // The "Ask Pip for a hint" trigger now lives in the lesson's bottom bar (less
  // distracting in the question area); here we render only the revealed hint/feedback
  // plus the contextual "Why was that wrong?" affordance.
  const hasBubble = (hintHelp !== null && revealed > 0) || (feedbackHelp !== null && Boolean(feedbackHelp.text))
  const hasRow = (Boolean(wrong) && Boolean(onRequestFeedback)) || Boolean(aiBusy)
  if (!hasBubble && !hasRow) return null

  const reviewStepId = aiHelp?.reviewStepId ?? null
  const revisit =
    reviewStepId && reviewStepTitle && onRevisit ? (
      <div className="mt-2.5">
        <button
          type="button"
          onClick={() => onRevisit(reviewStepId)}
          className="inline-flex items-center gap-1 rounded-full border border-blush-300 bg-white px-3 py-1 text-xs font-bold text-blush-600 hover:bg-blush-50"
        >
          ↩ Revisit: {reviewStepTitle}
        </button>
      </div>
    ) : null

  return (
    <div className={`mt-4 space-y-3 ${className}`}>
      {hasRow && (
        <div className="flex flex-wrap items-center gap-2">
          {wrong && onRequestFeedback && (
            <button type="button" onClick={onRequestFeedback} disabled={aiBusy} className={BTN}>
              Why was that wrong?
            </button>
          )}
          {aiBusy && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blush-400 border-t-transparent" />
              Pip is thinking…
            </span>
          )}
        </div>
      )}

      {hintHelp && revealed > 0 && (
        <div className="rounded-2xl border-2 border-blush-200 bg-blush-50 p-4">
          <div className="flex items-start gap-2.5">
            <PipCat mood="happy" className="mt-0.5 h-7 w-7 shrink-0" />
            <div className="flex-1 space-y-2.5 text-sm leading-relaxed text-slate-700">
              {hintHelp.tiers.slice(0, revealed).map((t, i) => {
                const isAnswer = hintHelp.tiers.length >= 3 && i === hintHelp.tiers.length - 1
                return isAnswer ? (
                  <div
                    key={i}
                    className="rounded-xl border-2 border-success-500/30 bg-success-50 px-3 py-2 text-success-800"
                  >
                    <span className="font-bold">✓ Answer: </span>
                    {t}
                  </div>
                ) : (
                  <div key={i}>
                    <span className="font-semibold text-blush-600">Hint {i + 1}: </span>
                    {t}
                  </div>
                )
              })}
              {revisit}
            </div>
          </div>
        </div>
      )}

      {feedbackHelp && feedbackHelp.text && (
        <div className="rounded-2xl border-2 border-blush-200 bg-blush-50 p-4">
          <div className="flex items-start gap-2.5">
            <PipCat mood="thinking" className="mt-0.5 h-7 w-7 shrink-0" />
            <div className="text-sm leading-relaxed text-slate-700">
              <span className="font-semibold text-blush-600">Pip: </span>
              {feedbackHelp.text}
              {revisit}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
