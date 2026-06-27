interface SegmentedProgressProps {
  /** 1-based index of the current step. */
  current: number
  total: number
  /** 1-based index of the furthest reached step (segments up to here are clickable). */
  furthest?: number
  /** Called with the 1-based step number when a reachable segment is tapped. */
  onSelect?: (step: number) => void
  /** 1-based step the AI suggests revisiting — its segment glows to draw the eye. */
  highlightStep?: number
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
  highlightStep,
  className = '',
}: SegmentedProgressProps) {
  const reachable = furthest ?? current

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
        <span>
          Step {current} of {total}
        </span>
        {highlightStep ? (
          <span className="font-semibold text-blush-600">Pip suggests revisiting the glowing step</span>
        ) : (
          onSelect && reachable > 1 && <span className="text-brand-500">Tap a segment to revisit</span>
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
          const highlighted = stepNumber === highlightStep && stepNumber !== current
          const color = done ? 'bg-brand-500' : active ? 'bg-brand-400' : 'bg-brand-100'
          // The AI "revisit" glow takes visual precedence over the other states.
          const segClass = highlighted
            ? 'bg-blush-400 ring-2 ring-blush-300 animate-pulse'
            : `${color} ${active ? 'ring-2 ring-brand-300' : ''} ${
                isFurthestReturn ? 'bg-brand-200 ring-2 ring-brand-200/70' : ''
              }`

          if (clickable) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect?.(stepNumber)}
                aria-label={
                  highlighted
                    ? `Revisit step ${stepNumber}`
                    : isFurthestReturn
                      ? 'Return to where you were'
                      : `Go to step ${stepNumber}`
                }
                title={highlighted ? 'Pip suggests revisiting this step' : undefined}
                aria-current={active ? 'step' : undefined}
                className="group flex-1 py-2 -my-2"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 group-hover:h-2.5 group-hover:opacity-90 ${segClass}`}
                />
              </button>
            )
          }

          return (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${segClass}`}
            />
          )
        })}
      </div>
    </div>
  )
}
