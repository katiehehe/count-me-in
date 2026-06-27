import { getMasteryTier, type MasteryTierId } from '../features/progress/mastery'

interface MasteryBadgeProps {
  /** Whole-lesson mastery score as a fraction (0–1) of graded questions. */
  masteryScore: number
  /** 'pill' for a compact chip (course cards), 'large' for the completion screen. */
  size?: 'pill' | 'large'
  /** Show the underlying "x of y correct" count alongside the tier label. */
  showCount?: boolean
  /** Graded questions answered correctly (for the count display). */
  correct?: number
  /** Total graded questions (for the count display). */
  total?: number
  className?: string
}

const tierStyles: Record<MasteryTierId, { pill: string; dot: string; large: string; text: string }> = {
  red: {
    pill: 'bg-error-50 text-error-700 border-error-100',
    dot: 'bg-error-500',
    large: 'border-error-200 bg-error-50 text-error-700',
    text: 'text-error-700',
  },
  yellow: {
    pill: 'bg-butter-100 text-warm-600 border-butter-200',
    dot: 'bg-warm-400',
    large: 'border-butter-200 bg-butter-100 text-warm-600',
    text: 'text-warm-600',
  },
  green: {
    pill: 'bg-success-50 text-success-700 border-success-100',
    dot: 'bg-success-500',
    large: 'border-success-200 bg-success-50 text-success-700',
    text: 'text-success-700',
  },
}

/**
 * Presents a whole-lesson mastery score as a 3-tier colored indicator
 * (red / yellow / green) instead of a raw percentage.
 */
export function MasteryBadge({
  masteryScore,
  size = 'pill',
  showCount = false,
  correct,
  total,
  className = '',
}: MasteryBadgeProps) {
  const { tier, label } = getMasteryTier(masteryScore)
  const styles = tierStyles[tier]
  const hasCount = typeof correct === 'number' && typeof total === 'number' && total > 0
  // Defensive clamp: never display more correct than total (which would read as an
  // impossible >100%), e.g. if a lesson's graded-step count shrank after completion.
  const safeCorrect = hasCount ? Math.min(correct as number, total as number) : correct
  const countText = hasCount
    ? `${safeCorrect} of ${total} correct`
    : `${Math.round(masteryScore * 100)}%`

  if (size === 'large') {
    return (
      <div
        className={`inline-flex flex-col items-center gap-1 rounded-2xl border-2 px-6 py-3 ${styles.large} ${className}`}
      >
        <span className="text-base font-extrabold">{label}</span>
        <span className="text-xs font-semibold opacity-80">{countText}</span>
      </div>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${styles.pill} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden />
      {label}
      {showCount && (
        <span className="font-semibold opacity-80">
          {hasCount ? `(${safeCorrect}/${total})` : `(${Math.round(masteryScore * 100)}%)`}
        </span>
      )}
    </span>
  )
}
