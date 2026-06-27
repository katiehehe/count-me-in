/** Joins factors into a LaTeX product, e.g. [3,2,1] → "3 \times 2 \times 1". */
export function timesLatex(factors: number[]): string {
  return factors.join(' \\times ')
}

/** A LaTeX fraction a/b, e.g. fractionLatex('6', '2') → "\dfrac{6}{2}". */
export function fractionLatex(numerator: string, denominator: string): string {
  return `\\dfrac{${numerator}}{${denominator}}`
}

/** Rotates an array left by `by` (wrapping), used to "rearrange" items into a new order. */
export function rotate<T>(arr: T[], by = 1): T[] {
  if (arr.length === 0) return arr
  const n = ((by % arr.length) + arr.length) % arr.length
  return [...arr.slice(n), ...arr.slice(0, n)]
}
