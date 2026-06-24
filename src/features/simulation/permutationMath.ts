export function factorial(n: number): number {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

export function permutationCount(n: number): number {
  return factorial(n)
}

/**
 * Number of ordered selections of k items from n (nPr = n! / (n - k)!).
 * Order matters. Example: arranging 3 of 5 finalists → permutations(5, 3) = 60.
 */
export function permutations(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) result *= n - i
  return result
}

/**
 * Number of unordered selections of k items from n (nCr = n! / (k! · (n - k)!)).
 * Order does NOT matter. Example: a committee of 3 from 10 → combinations(10, 3) = 120.
 */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  // Compute multiplicatively to keep numbers small and exact for contest sizes.
  const kk = Math.min(k, n - k)
  let result = 1
  for (let i = 0; i < kk; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}

/**
 * Product of the sizes of each independent stage (fundamental counting principle).
 * Example: 3 shirts × 2 socks → countingPrinciple([3, 2]) = 6.
 */
export function countingPrinciple(sizes: number[]): number {
  return sizes.reduce((product, size) => product * size, 1)
}

export function formatFactorial(n: number): string {
  if (n <= 1) return '1'
  return Array.from({ length: n }, (_, i) => n - i).join(' × ')
}

export function checkNumericAnswer(
  userAnswer: number,
  correctAnswer: number,
  tolerance = 0,
): boolean {
  return Math.abs(userAnswer - correctAnswer) <= tolerance
}

export function orderingKey(order: string[]): string {
  return order.join('|')
}

/**
 * Counts the distinct arrangements of a multiset, i.e. n! / (c1! · c2! · …),
 * where `counts` are the group sizes of identical items.
 * Example: BANANA → multisetPermutationCount([3, 2, 1]) = 60.
 */
export function multisetPermutationCount(counts: number[]): number {
  const n = counts.reduce((a, b) => a + b, 0)
  let result = factorial(n)
  for (const c of counts) result /= factorial(c)
  return Math.round(result)
}

/** Formats the multiset formula, e.g. "6! / (3! × 2! × 1!)". */
export function formatMultisetFormula(counts: number[]): string {
  const n = counts.reduce((a, b) => a + b, 0)
  return `${n}! / (${counts.map((c) => `${c}!`).join(' × ')})`
}

export function allPermutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  const result: T[][] = []
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)]
    for (const perm of allPermutations(rest)) {
      result.push([items[i], ...perm])
    }
  }
  return result
}
