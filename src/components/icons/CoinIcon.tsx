interface CoinIconProps {
  /** Which side to render. */
  side: 'heads' | 'tails'
  className?: string
}

/**
 * A simple two-tone coin. Heads is a warm gold with an "H"; tails is a cool
 * silver with a "T" — distinct at a glance without relying on an emoji.
 */
export function CoinIcon({ side, className }: CoinIconProps) {
  const heads = side === 'heads'
  const gradId = `coin-${side}`
  const rim = heads ? '#b97e16' : '#7c8a99'
  const face = heads ? '#f6cf5b' : '#cbd5e1'
  const faceLight = heads ? '#fde9a8' : '#eef2f6'
  const label = heads ? 'H' : 'T'
  const ink = heads ? '#7a531a' : '#475569'
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={heads ? 'Coin heads' : 'Coin tails'}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={faceLight} />
          <stop offset="100%" stopColor={face} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill={rim} />
      <circle cx="50" cy="50" r="37" fill={`url(#${gradId})`} />
      <circle cx="50" cy="50" r="37" fill="none" stroke={rim} strokeOpacity="0.5" strokeWidth="2" />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="42"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        fill={ink}
      >
        {label}
      </text>
    </svg>
  )
}
