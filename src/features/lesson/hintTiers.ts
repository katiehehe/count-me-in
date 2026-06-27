/** Fallback escalating hints used when the model returns nothing usable. */
const GENERIC_TIERS = [
  'Think about which counting idea this question is really testing.',
  'Set it up step by step using that idea before you compute.',
  'Now carry that setup through to the final number.',
]

/**
 * Coerces a model's hint list into EXACTLY three trimmed, non-empty tiers: blanks
 * are dropped, a short list is padded by repeating the last tier, a long one is
 * truncated, and an empty/garbage result falls back to three generic tiers.
 */
export function coerceHintTiers(hints: unknown): string[] {
  const arr = Array.isArray(hints) ? hints.map((h) => String(h ?? '').trim()).filter(Boolean) : []
  if (!arr.length) return [...GENERIC_TIERS]
  while (arr.length < 3) arr.push(arr[arr.length - 1])
  return arr.slice(0, 3)
}
