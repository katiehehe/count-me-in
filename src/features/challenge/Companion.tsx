interface CompanionProps {
  /** Optional speech-bubble message from the companion. */
  message?: string
  /** Optional XP total to show as a fish badge. */
  xp?: number
  /** Companion mood drives the emoji expression. */
  mood?: 'happy' | 'thinking' | 'celebrate'
  className?: string
}

const FACE: Record<NonNullable<CompanionProps['mood']>, string> = {
  happy: '🐱',
  thinking: '🙀',
  celebrate: '😸',
}

/**
 * Pip, the one default cat study companion for Challenge Mode. Deliberately
 * simple (emoji + bubble + fish XP) — no shop, inventory, or customization, per
 * the Phase 2 scope of "a cute companion that never overshadows the learning".
 */
export function Companion({ message, xp, mood = 'happy', className = '' }: CompanionProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-3xl shadow-soft"
        aria-hidden
      >
        {FACE[mood]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-brand-700">Pip</span>
          {typeof xp === 'number' && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              🐟 {xp} XP
            </span>
          )}
        </div>
        {message && (
          <div className="mt-1 rounded-2xl rounded-tl-sm border border-brand-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-soft">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
