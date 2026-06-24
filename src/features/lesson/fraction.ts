export interface Fraction {
  num: number
  den: number
}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}

/**
 * Parses a fraction the learner typed. Accepts a whole number ("4"), a simple
 * fraction ("1/8"), with optional surrounding spaces and spaces around the slash
 * ("3 / 12"). Returns null for anything that isn't a valid fraction (including a
 * zero denominator), so callers can show a format hint instead of grading it.
 */
export function parseFraction(input: string): Fraction | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  const wholeMatch = /^[+-]?\d+$/.exec(trimmed)
  if (wholeMatch) {
    return { num: Number(trimmed), den: 1 }
  }

  const fracMatch = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(trimmed)
  if (fracMatch) {
    const num = Number(fracMatch[1])
    const den = Number(fracMatch[2])
    if (den === 0) return null
    return { num, den }
  }

  return null
}

/** True when two fractions represent the same value (e.g. 3/12 and 1/4). */
export function fractionsEqual(a: Fraction, b: Fraction): boolean {
  // Cross-multiply so equivalent and sign-flipped forms compare equal.
  return a.num * b.den === b.num * a.den
}

/** True when a fraction is fully reduced (lowest terms), e.g. 1/4 but not 3/12. */
export function isReduced(f: Fraction): boolean {
  return gcd(f.num, f.den) === 1
}
