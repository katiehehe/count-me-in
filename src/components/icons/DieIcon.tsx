interface DieIconProps {
  /** Face value to show. 1–6 render as pips; anything else renders as a number. */
  value: number
  /** Fill color of the die body. Defaults to the brand navy. */
  faceColor?: string
  /** Color of the pips / number. Defaults to white. */
  pipColor?: string
  className?: string
}

// 3×3 grid coordinates (in the 100×100 viewBox) used to place pips.
const TL: [number, number] = [28, 28]
const TR: [number, number] = [72, 28]
const ML: [number, number] = [28, 50]
const MR: [number, number] = [72, 50]
const C: [number, number] = [50, 50]
const BL: [number, number] = [28, 72]
const BR: [number, number] = [72, 72]

const PIPS: Record<number, [number, number][]> = {
  1: [C],
  2: [TL, BR],
  3: [TL, C, BR],
  4: [TL, TR, BL, BR],
  5: [TL, TR, C, BL, BR],
  6: [TL, TR, ML, MR, BL, BR],
}

/**
 * A clean, scalable die face. Values 1–6 show the classic pip arrangement;
 * larger-sided dice (d10, d11, …) fall back to a centered numeral so the same
 * component works for any face value.
 */
export function DieIcon({
  value,
  faceColor = '#2d5894',
  pipColor = '#ffffff',
  className,
}: DieIconProps) {
  const pips = PIPS[value]
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`Die showing ${value}`}>
      <rect x="6" y="6" width="88" height="88" rx="22" fill={faceColor} />
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="22"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      {pips ? (
        pips.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="9" fill={pipColor} />)
      ) : (
        <text
          x="50"
          y="54"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="50"
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          fill={pipColor}
        >
          {value}
        </text>
      )}
    </svg>
  )
}
