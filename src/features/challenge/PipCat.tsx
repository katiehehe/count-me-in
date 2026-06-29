import { DEFAULT_PIP_THEME, type PipHat, type PipTheme } from '../progress/xpWallet'

export type PipMood = 'happy' | 'thinking' | 'celebrate'

interface PipCatProps {
  mood?: PipMood
  className?: string
  title?: string
  /** Color theme (from an equipped cosmetic); defaults to the classic look. */
  theme?: PipTheme
  /** Optional hat overlay from an equipped cosmetic. */
  hat?: PipHat | null
}

/**
 * Pip — a custom cat companion drawn as an inline SVG (not an emoji), so it's
 * crisp at any size and can change expression. Three moods: happy (default),
 * thinking (eyes glancing up, for loading), and celebrate (closed happy eyes +
 * sparkles, for a strong result). Colors come from an optional `theme` and an
 * optional `hat` overlay, both driven by the equipped shop cosmetic.
 */
export function PipCat({
  mood = 'happy',
  className = '',
  title,
  theme = DEFAULT_PIP_THEME,
  hat = null,
}: PipCatProps) {
  const { cream, pink, dark } = theme

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title ?? 'Pip the cat'}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}

      {/* Ears */}
      <path d="M16 25 L19 8 L33 21 Z" fill={cream} />
      <path d="M48 25 L45 8 L31 21 Z" fill={cream} />
      <path d="M21 21 L23 12 L30 20 Z" fill={pink} />
      <path d="M43 21 L41 12 L34 20 Z" fill={pink} />

      {/* Head */}
      <ellipse cx="32" cy="37" rx="21" ry="18" fill={cream} />

      {/* Cheeks */}
      <ellipse cx="18.5" cy="41" rx="4.5" ry="2.8" fill={pink} opacity="0.65" />
      <ellipse cx="45.5" cy="41" rx="4.5" ry="2.8" fill={pink} opacity="0.65" />

      {/* Whiskers */}
      <g stroke={dark} strokeWidth="1.1" strokeLinecap="round" opacity="0.55">
        <line x1="8" y1="36" x2="18" y2="37" />
        <line x1="8" y1="41" x2="18" y2="40.5" />
        <line x1="56" y1="36" x2="46" y2="37" />
        <line x1="56" y1="41" x2="46" y2="40.5" />
      </g>

      {/* Eyes */}
      {mood === 'celebrate' ? (
        <g stroke={dark} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M21 36 Q24.5 31.5 28 36" />
          <path d="M36 36 Q39.5 31.5 43 36" />
        </g>
      ) : mood === 'thinking' ? (
        <g>
          <circle cx="24.5" cy="35" r="3.1" fill="#fff" stroke={dark} strokeWidth="1" />
          <circle cx="39.5" cy="35" r="3.1" fill="#fff" stroke={dark} strokeWidth="1" />
          <circle cx="24.5" cy="33.2" r="1.7" fill={dark} />
          <circle cx="39.5" cy="33.2" r="1.7" fill={dark} />
        </g>
      ) : (
        <g>
          <ellipse cx="24.5" cy="35" rx="2.9" ry="3.5" fill={dark} />
          <ellipse cx="39.5" cy="35" rx="2.9" ry="3.5" fill={dark} />
          <circle cx="25.5" cy="33.6" r="0.95" fill="#fff" />
          <circle cx="40.5" cy="33.6" r="0.95" fill="#fff" />
        </g>
      )}

      {/* Nose */}
      <path d="M30 40 L34 40 L32 42.4 Z" fill={pink} stroke={pink} strokeWidth="0.6" strokeLinejoin="round" />

      {/* Mouth */}
      {mood === 'celebrate' ? (
        <path d="M27.5 43 Q32 48 36.5 43 Z" fill={pink} opacity="0.85" />
      ) : (
        <g stroke={dark} strokeWidth="1.3" strokeLinecap="round" fill="none">
          <path d="M32 42.4 Q30 45 27.6 43.4" />
          <path d="M32 42.4 Q34 45 36.4 43.4" />
        </g>
      )}

      {/* Sparkles for celebrate */}
      {mood === 'celebrate' && (
        <g fill="#F6C453">
          <path d="M52 16 l1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 3 -1 z" />
          <path d="M10 20 l0.8 2.2 2.2 0.8 -2.2 0.8 -0.8 2.2 -0.8 -2.2 -2.2 -0.8 2.2 -0.8 z" />
        </g>
      )}

      {/* Equipped hat overlay (fixed colors so it reads on any theme) */}
      {hat === 'party' && (
        <g>
          <polygon points="32,2 23,21 41,21" fill="#EC4899" />
          <polygon points="32,2 27.5,12 36.5,12" fill="#fff" opacity="0.45" />
          <circle cx="32" cy="2.5" r="2.3" fill="#FCD34D" />
        </g>
      )}
      {hat === 'wizard' && (
        <g>
          <ellipse cx="32" cy="21" rx="15" ry="3.2" fill="#5B21B6" />
          <polygon points="32,1 24,21 40,21" fill="#6D28D9" />
          <path d="M31 7 l1 2.4 2.6 0.2 -2 1.9 0.6 2.6 -2.2-1.3 -2.2 1.3 0.6-2.6 -2-1.9 2.6-0.2 z" fill="#FCD34D" />
        </g>
      )}
    </svg>
  )
}
