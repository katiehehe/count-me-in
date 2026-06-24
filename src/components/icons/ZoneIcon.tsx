import type { UnitAccent } from '../../content/curriculum'

interface ZoneIconProps {
  accent: UnitAccent
  className?: string
}

/**
 * Clean, friendly line/duotone symbols for each learning zone — used instead of
 * emojis. Colors inherit from the surrounding `text-*` class via currentColor.
 */
export function ZoneIcon({ accent, className = 'h-6 w-6' }: ZoneIconProps) {
  switch (accent) {
    case 'counting':
      // A 2×2 grid of counters — "count the outcomes".
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <circle cx="8" cy="8" r="2.4" fill="currentColor" opacity="0.9" />
          <circle cx="16" cy="8" r="2.4" fill="currentColor" opacity="0.5" />
          <circle cx="8" cy="16" r="2.4" fill="currentColor" opacity="0.5" />
          <circle cx="16" cy="16" r="2.4" fill="currentColor" opacity="0.9" />
        </svg>
      )
    case 'probability':
      // A die — "how likely?".
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <rect x="4" y="4" width="16" height="16" rx="4.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          <circle cx="15" cy="15" r="1.5" fill="currentColor" />
          <circle cx="15" cy="9" r="1.5" fill="currentColor" opacity="0.45" />
          <circle cx="9" cy="15" r="1.5" fill="currentColor" opacity="0.45" />
        </svg>
      )
    case 'expectation':
      // Rising bars with an average line — "long-run averages".
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <rect x="4" y="13" width="4" height="7" rx="1.5" fill="currentColor" opacity="0.5" />
          <rect x="10" y="9" width="4" height="11" rx="1.5" fill="currentColor" opacity="0.75" />
          <rect x="16" y="5" width="4" height="15" rx="1.5" fill="currentColor" />
          <path d="M3 10.5 L21 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 2.5" />
        </svg>
      )
    case 'challenge':
      // A pennant flag — "apply it, contest-style".
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
          <path d="M6 3.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M6 4.5h10.5l-2.5 3.25L16.5 11H6z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      )
  }
}
