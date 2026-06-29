/** A fraction in lowest terms (denominator always positive, 1 for whole numbers). */
export interface Frac {
  n: number
  d: number
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a || 1
}

export function reduceFrac(n: number, d: number): Frac {
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

export function multiplyFracs(fracs: Frac[]): Frac {
  const n = fracs.reduce((acc, f) => acc * f.n, 1)
  const d = fracs.reduce((acc, f) => acc * f.d, 1)
  return reduceFrac(n, d)
}

/** a ÷ b as a reduced fraction (multiply by the reciprocal). */
export function divideFracs(a: Frac, b: Frac): Frac {
  if (b.n === 0) return { n: 0, d: 1 }
  return reduceFrac(a.n * b.d, a.d * b.n)
}

/** a + b as a reduced fraction (common denominator, then reduce). */
export function addFracs(a: Frac, b: Frac): Frac {
  return reduceFrac(a.n * b.d + b.n * a.d, a.d * b.d)
}

/**
 * Weighted value (expected value): sum of each value times its probability —
 * the "weighted average" reading of expectation, E = Σ(value × prob). Returns the
 * exact reduced fraction so a payoff like $100 at probability 1/50 verifies to $2.
 */
export function weightedValue(values: number[], probs: Frac[]): Frac {
  let acc: Frac = { n: 0, d: 1 }
  for (let i = 0; i < values.length; i++) {
    acc = addFracs(acc, reduceFrac(values[i] * probs[i].n, probs[i].d))
  }
  return acc
}

/**
 * Probability of drawing the same kind `draws` times in a row WITHOUT replacement,
 * starting from `same` of that kind out of `total`. Each draw shrinks both counts,
 * so the chance shifts — that conditional shrink is what makes the events dependent.
 */
export function drawSameProb(same: number, total: number, draws: number): Frac {
  const fracs: Frac[] = []
  for (let i = 0; i < draws; i++) fracs.push({ n: same - i, d: total - i })
  return multiplyFracs(fracs)
}

/**
 * Conditional probability P(A | B) = |A ∩ B| / |B|: restrict the world to B, then
 * ask how many of those outcomes are also A. Returns the reduced fraction.
 */
export function conditionalProb(intersection: number, given: number): Frac {
  if (given <= 0) return { n: 0, d: 1 }
  return reduceFrac(intersection, given)
}

/**
 * The complement 1 − f as a reduced fraction. The heart of the complement rule:
 * when the event you want is awkward, compute its easy opposite and subtract.
 */
export function complement(f: Frac): Frac {
  if (f.d <= 0) return { n: 0, d: 1 }
  return reduceFrac(f.d - f.n, f.d)
}

/**
 * P(at least one success over `trials` independent tries) = 1 − P(none), where
 * `missPerTrial` is the chance a single trial fails. Returns the reduced fraction —
 * e.g. atLeastOneProb({n:5,d:6}, 2) = 11/36 for "at least one six in two dice".
 */
export function atLeastOneProb(missPerTrial: Frac, trials: number): Frac {
  let none: Frac = { n: 1, d: 1 }
  for (let i = 0; i < trials; i++) none = { n: none.n * missPerTrial.n, d: none.d * missPerTrial.d }
  return complement(none)
}

/**
 * Expected count over `trials` independent (or dependent!) trials, each contributing
 * `prob` on average: E = trials × prob. Linearity of expectation means this is exact
 * for a SUM no matter how the trials interact — e.g. expectedCount(10, {1,2}) = 5
 * heads, expectedCount(n, {1,6}) = n/6 sixes.
 */
export function expectedCount(trials: number, prob: Frac): Frac {
  return reduceFrac(trials * prob.n, prob.d)
}

/**
 * Expected value of a sum of `trials` parts that each average `perPart`. Identical
 * math to {@link expectedCount}, named for the "sum of expectations" reading —
 * e.g. expectedSum(n, {7,2}) = 3.5n for the sum of n fair dice.
 */
export function expectedSum(trials: number, perPart: Frac): Frac {
  return expectedCount(trials, perPart)
}

/**
 * Expected number of successes GIVEN at least one, over `trials` independent trials
 * each with probability `prob`. Combines three tools: E[N] = trials × prob
 * (linearity/indicators), P(N ≥ 1) = 1 − (1−prob)^trials (complement), and — since
 * N = 0 contributes nothing — E[N | N ≥ 1] = E[N] / P(N ≥ 1) (conditional). E.g.
 * expectedGivenAtLeastOne(4, {1,6}) = 864/671 for "expected sixes given at least one".
 */
export function expectedGivenAtLeastOne(trials: number, prob: Frac): Frac {
  const eN = expectedCount(trials, prob)
  const miss: Frac = { n: prob.d - prob.n, d: prob.d }
  const atLeast = atLeastOneProb(miss, trials)
  return divideFracs(eN, atLeast)
}

/** C(n, k): the number of ways to choose k of n items (0 for out-of-range inputs). */
export function choose(n: number, k: number): number {
  if (n < 0 || k < 0 || k > n) return 0
  k = Math.min(k, n - k)
  let result = 1
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1)
  return Math.round(result)
}

/** A fraction raised to a non-negative integer power, reduced. */
function fracPow(f: Frac, exp: number): Frac {
  let n = 1
  let d = 1
  for (let i = 0; i < exp; i++) {
    n *= f.n
    d *= f.d
  }
  return reduceFrac(n, d)
}

/**
 * Binomial probability P(exactly k successes in n trials), success chance `p`:
 * C(n,k) · pᵏ · (1−p)^(n−k), as an exact reduced fraction. The k successes each
 * contribute p and the n−k failures each contribute q = 1−p (independence), and the
 * C(n,k) equally likely arrangements are mutually exclusive, so they add — e.g.
 * binomialProb(5, 2, {n:1,d:3}) = 80/243 for "exactly 2 heads in 5 flips, p = 1/3".
 */
export function binomialProb(n: number, k: number, p: Frac): Frac {
  if (k < 0 || k > n) return { n: 0, d: 1 }
  const q: Frac = { n: p.d - p.n, d: p.d }
  return multiplyFracs([{ n: choose(n, k), d: 1 }, fracPow(p, k), fracPow(q, n - k)])
}

function intPow(base: number, exp: number): number {
  let r = 1
  for (let i = 0; i < exp; i++) r *= base
  return r
}

/**
 * The integer coefficient of the a^(n−k) b^k term in (a+b)^n: C(n,k)·a^(n−k)·b^k.
 * With b = 1 this is the coefficient of x^k in (a + x)^n — e.g.
 * binomialTermCoeff(5, 3, 2, 1) = C(5,3)·2² = 40 (the x³ coefficient in (2 + x)^5).
 */
export function binomialTermCoeff(n: number, k: number, a: number, b: number): number {
  if (k < 0 || k > n) return 0
  return choose(n, k) * intPow(a, n - k) * intPow(b, k)
}

/**
 * Monotonic lattice paths from (0,0) to (m,n) using only right/up steps: arrange m R's
 * and n U's in any order, so C(m+n, n).
 */
export function latticePaths(m: number, n: number): number {
  return choose(m + n, n)
}

/** Handshakes / round-robin / "choose a pair" among n people: C(n, 2). */
export function handshakes(n: number): number {
  return choose(n, 2)
}

/**
 * Stars and bars: the number of ways to put `n` identical items into `k` distinct bins
 * = the number of non-negative integer solutions to x₁ + … + x_k = n. Lay n stars and
 * k−1 bars in a row and choose which positions are bars: C(n + k − 1, k − 1).
 */
export function starsAndBars(n: number, k: number): number {
  return choose(n + k - 1, k - 1)
}

/**
 * Inclusion–exclusion for two sets: |A ∪ B| = |A| + |B| − |A ∩ B|. Adding the two
 * sets counts their overlap twice, so subtract it once.
 */
export function unionTwo(a: number, b: number, both: number): number {
  return a + b - both
}

/**
 * Inclusion–exclusion for three sets: add the singles, subtract every pairwise overlap
 * (each double-counted), then add back the triple overlap (subtracted one time too many):
 * |A∪B∪C| = a + b + c − ab − ac − bc + abc.
 */
export function unionThree(
  a: number,
  b: number,
  c: number,
  ab: number,
  ac: number,
  bc: number,
  abc: number,
): number {
  return a + b + c - ab - ac - bc + abc
}

/**
 * Hypergeometric probability of drawing exactly `k` of the `K` special items when you
 * draw `n` from `N` total (without replacement): C(K,k)·C(N−K,n−k) / C(N,n), as an
 * exact reduced fraction. The favorable count multiplies "choose the special" by
 * "choose the rest" (counting principle); the total is "choose the draw."
 * e.g. hyperProb(5, 3, 2, 2) = 3/10 ("both of 2 drawn are red", 3 red of 5).
 */
export function hyperProb(N: number, K: number, n: number, k: number): Frac {
  if (k < 0 || k > K || n - k < 0 || n - k > N - K || n < 0 || n > N) return { n: 0, d: 1 }
  return reduceFrac(choose(K, k) * choose(N - K, n - k), choose(N, n))
}

/** A fraction as compact KaTeX, e.g. {n:2,d:5} → "\tfrac{2}{5}" (whole numbers as-is). */
export function fracLatex(f: Frac): string {
  return f.d === 1 ? String(f.n) : `\\tfrac{${f.n}}{${f.d}}`
}

/** A fraction as plain text, e.g. {n:2,d:5} → "2/5" (whole numbers as-is). */
export function fracText(f: Frac): string {
  return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`
}
