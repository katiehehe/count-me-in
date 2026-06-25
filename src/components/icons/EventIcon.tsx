import { DieIcon } from './DieIcon'
import { CoinIcon } from './CoinIcon'
import { dieValueFromEmoji, isCoinEmoji } from './tokenIconUtils'

interface ThemedIconProps {
  className?: string
}

function StormCloudIcon({ className }: ThemedIconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Storm clouds">
      <path
        d="M28 60a16 16 0 0 1 1-31 22 22 0 0 1 42-3 15 15 0 0 1-3 34Z"
        fill="#64748b"
      />
      <path d="M30 31a22 22 0 0 1 38-1 15 15 0 0 0-38 1Z" fill="#94a3b8" />
      <g stroke="#3b82f6" strokeWidth="6" strokeLinecap="round">
        <line x1="34" y1="70" x2="29" y2="84" />
        <line x1="52" y1="70" x2="47" y2="84" />
        <line x1="70" y1="70" x2="65" y2="84" />
      </g>
    </svg>
  )
}

function UmbrellaIcon({ className }: ThemedIconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Umbrella">
      <path d="M50 18c20 0 36 16 36 33H14c0-17 16-33 36-33Z" fill="#dc2626" />
      <path
        d="M14 51c0-3 8-6 12-6s12 3 12 6c0-3 8-6 12-6s12 3 12 6c0-3 8-6 12-6s11 3 12 6Z"
        fill="#ef4444"
      />
      <path d="M50 51v26a8 8 0 0 1-16 0" fill="none" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

function FirstAidIcon({ className }: ThemedIconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Injury">
      <rect x="14" y="14" width="72" height="72" rx="18" fill="#dc2626" />
      <g fill="#ffffff">
        <rect x="44" y="28" width="12" height="44" rx="4" />
        <rect x="28" y="44" width="44" height="12" rx="4" />
      </g>
    </svg>
  )
}

function BasketballIcon({ className }: ThemedIconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Basketball">
      <circle cx="50" cy="50" r="40" fill="#ea7317" />
      <g fill="none" stroke="#7c2d12" strokeWidth="4">
        <circle cx="50" cy="50" r="40" />
        <line x1="50" y1="10" x2="50" y2="90" />
        <line x1="10" y1="50" x2="90" y2="50" />
        <path d="M22 22c14 10 22 26 22 28s-8 18-22 28" />
        <path d="M78 22c-14 10-22 26-22 28s8 18 22 28" />
      </g>
    </svg>
  )
}

function ShirtIcon({ className, color = '#3b82f6' }: ThemedIconProps & { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Shirt">
      <path
        d="M36 16 25 24 10 40 22 52 30 45 30 86 70 86 70 45 78 52 90 40 75 24 64 16C60 25 40 25 36 16Z"
        fill={color}
        stroke="#0f172a"
        strokeOpacity="0.15"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PantsIcon({ className, color = '#1e3a8a' }: ThemedIconProps & { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Pants">
      <path
        d="M28 14H72L70 30 64 88H50L50 46 45 88H31L36 30 28 22Z"
        fill={color}
        stroke="#0f172a"
        strokeOpacity="0.15"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="28" y="14" width="44" height="7" rx="2" fill="#0f172a" fillOpacity="0.25" />
    </svg>
  )
}

function MealIcon({ className, color = '#f59e0b' }: ThemedIconProps & { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Meal">
      {/* The whole plate is tinted so each main dish reads clearly as its color. */}
      <circle cx="56" cy="54" r="30" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="3" />
      <circle cx="56" cy="54" r="20" fill={color} fillOpacity="0.55" />
      <circle cx="56" cy="54" r="12" fill={color} />
      <g stroke="#475569" strokeWidth="4" strokeLinecap="round">
        <line x1="14" y1="20" x2="14" y2="46" />
        <line x1="22" y1="20" x2="22" y2="46" />
        <line x1="18" y1="20" x2="18" y2="84" />
      </g>
    </svg>
  )
}

function SockIcon({
  className,
  color = '#64748b',
  striped = false,
}: ThemedIconProps & { color?: string; striped?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Socks">
      <path
        d="M38 12 L62 12 L62 50 L82 50 Q92 50 92 63 Q92 78 78 78 L52 78 Q38 78 38 62 Z"
        fill={color}
        stroke="#0f172a"
        strokeOpacity="0.15"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Cuff band */}
      <rect x="36" y="12" width="28" height="9" rx="3" fill="#0f172a" fillOpacity="0.22" />
      {striped && (
        <g stroke="#ffffff" strokeWidth="5" strokeOpacity="0.9" strokeLinecap="round">
          <line x1="42" y1="31" x2="60" y2="31" />
          <line x1="42" y1="42" x2="60" y2="42" />
        </g>
      )}
    </svg>
  )
}

function DrinkIcon({ className, color = '#0ea5e9' }: ThemedIconProps & { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Drink">
      <line x1="64" y1="10" x2="52" y2="40" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
      {/* The drink itself, tinted so each drink reads as its own color. */}
      <path
        d="M30 32H70L64 86H36Z"
        fill={color}
        stroke="#0f172a"
        strokeOpacity="0.2"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="26" y="26" width="48" height="8" rx="4" fill="#334155" />
    </svg>
  )
}

/**
 * Renders a crisp custom SVG for the themed emojis used on event/option cards —
 * dice, coins, weather, sports, and a first-aid mark. Returns null for anything
 * we don't have an icon for so callers can fall back to plain emoji text.
 */
export function EventIcon({
  emoji,
  label,
  color,
  className,
}: {
  emoji?: string
  label?: string
  color?: string
  className?: string
}) {
  const die = dieValueFromEmoji(emoji)
  if (die !== null) return <DieIcon value={die} faceColor={color} className={className} />
  if (isCoinEmoji(emoji)) {
    const side = (label ?? '').toLowerCase().includes('tail') ? 'tails' : 'heads'
    return <CoinIcon side={side} className={className} />
  }
  switch (emoji) {
    case '🌧️':
      return <StormCloudIcon className={className} />
    case '☔':
      return <UmbrellaIcon className={className} />
    case '🤕':
      return <FirstAidIcon className={className} />
    case '🏀':
      return <BasketballIcon className={className} />
    case '👕':
      return <ShirtIcon className={className} color={color} />
    case '👖':
      return <PantsIcon className={className} color={color} />
    case '🍽️':
      return <MealIcon className={className} color={color} />
    case '🥤':
      return <DrinkIcon className={className} color={color} />
    case '🧦':
      return (
        <SockIcon
          className={className}
          color={color}
          striped={(label ?? '').toLowerCase().includes('strip')}
        />
      )
    default:
      return null
  }
}
