interface SegmentedProgressProps {
  /** 1-based index of the current step. */
  current: number
  total: number
  /** 1-based index of the furthest reached step (segments up to here are clickable). */
  furthest?: number
  /** Called with the 1-based step number when a reachable segment is tapped. */
  onSelect?: (step: number) => void
  className?: string
}

/**
 * A stepped progress indicator: one segment per lesson step. Segments before
 * the current step are filled, the current one is highlighted, the rest empty.
 * When `onSelect` is provided, every already-visited segment (≤ `furthest`)
 * becomes a tappable shortcut so learners can jump back to review earlier
 * questions; steps ahead of the furthest reached stay locked.
 */
export function SegmentedProgress({
  current,
  total,
  furthest,
  onSelect,
  className = '',
}: SegmentedProgressProps) {
  const reachable = furthest ?? current

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
        <span>
          Step {current} of {total}
        </span>
        {onSelect && reachable > 1 && (
          <span className="text-brand-500">Tap a segment to revisit</span>
        )}
      </div>
      <div
        className="flex items-center gap-1"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        {Array.from({ length: total }, (_, i) => {
          const stepNumber = i + 1
          const done = stepNumber < current
          const active = stepNumber === current
          const clickable = !!onSelect && stepNumber <= reachable
          const isFurthestReturn = stepNumber === reachable && current < reachable
          const color = done ? 'bg-brand-500' : active ? 'bg-brand-400' : 'bg-brand-100'

          if (clickable) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect?.(stepNumber)}
                aria-label={isFurthestReturn ? 'Return to where you were' : `Go to step ${stepNumber}`}
                title={isFurthestReturn ? 'Return to where you were' : undefined}
                aria-current={active ? 'step' : undefined}
                className="group flex-1 py-2 -my-2"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 group-hover:h-2.5 group-hover:opacity-90 ${color} ${
                    active ? 'ring-2 ring-brand-300' : ''
                  } ${isFurthestReturn ? 'bg-brand-200 ring-2 ring-brand-200/70' : ''}`}
                />
              </button>
            )
          }

          return (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${color}`}
            />
          )
        })}
      </div>
    </div>
  )
}
