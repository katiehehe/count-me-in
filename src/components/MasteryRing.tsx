import type { ReactNode } from 'react'

interface MasteryRingProps {
  value: number
  total: number
  /** Diameter in px. */
  size?: number
  /** Stroke width in px. */
  thickness?: number
  /** Tailwind text-* class for the progress arc (drawn with currentColor). */
  strokeClass?: string
  /** Tailwind text-* class for the track. */
  trackClass?: string
  children?: ReactNode
  className?: string
}

/** A soft, playful circular progress ring with optional center content. */
export function MasteryRing({
  value,
  total,
  size = 56,
  thickness = 6,
  strokeClass = 'text-brand-500',
  trackClass = 'text-slate-200',
  children,
  className = '',
}: MasteryRingProps) {
  const pct = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0
  const r = (size - thickness) / 2
  const circumference = 2 * Math.PI * r

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className={`${strokeClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  )
}
