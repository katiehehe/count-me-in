import { type PipMood } from './PipCat'
import { PipAvatar } from './PipAvatar'

interface CompanionProps {
  /** Optional speech-bubble message from the companion. */
  message?: string
  /** Optional XP total to show as a fish badge. */
  xp?: number
  /** Companion mood drives Pip's expression. */
  mood?: PipMood
  className?: string
}

/**
 * Pip, the cat study companion. A speech bubble + fish XP next to {@link PipAvatar},
 * which automatically shows the learner's equipped look — an AI-generated image
 * for the `ai-custom` cosmetic, otherwise the SVG cat with theme/hat.
 */
export function Companion({ message, xp, mood = 'happy', className = '' }: CompanionProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blush-100 shadow-soft">
        <PipAvatar mood={mood} className="h-11 w-11" />
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
