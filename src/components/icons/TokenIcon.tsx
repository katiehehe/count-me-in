import { DieIcon } from './DieIcon'
import { CoinIcon } from './CoinIcon'
import { dieValueFromEmoji, isCoinEmoji } from './tokenIconUtils'

/**
 * Renders a unicode die/coin emoji as a crisp SVG icon instead. Returns null for
 * anything else so callers can fall back to their normal emoji rendering.
 */
export function TokenIcon({
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
  return null
}
