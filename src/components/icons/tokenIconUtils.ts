const DIE_FACES: Record<string, number> = {
  '⚀': 1,
  '⚁': 2,
  '⚂': 3,
  '⚃': 4,
  '⚄': 5,
  '⚅': 6,
}

/** The die face value (1–6) for a unicode die emoji, or null if it isn't one. */
export function dieValueFromEmoji(emoji?: string): number | null {
  return emoji && emoji in DIE_FACES ? DIE_FACES[emoji] : null
}

export function isCoinEmoji(emoji?: string): boolean {
  return emoji === '🪙'
}

/** True when an emoji represents a die face or coin we can draw as a crisp icon. */
export function hasTokenIcon(emoji?: string): boolean {
  return dieValueFromEmoji(emoji) !== null || isCoinEmoji(emoji)
}

/** Themed emojis (weather, sports, clothing, food) that EventIcon draws as SVGs. */
const THEMED_EMOJIS = new Set(['🌧️', '☔', '🤕', '🏀', '👕', '👖', '🍽️', '🥤', '🧦'])

/** True when EventIcon can render a custom SVG for this emoji. */
export function hasEventIcon(emoji?: string): boolean {
  return hasTokenIcon(emoji) || (emoji !== undefined && THEMED_EMOJIS.has(emoji))
}
