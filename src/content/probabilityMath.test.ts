import { describe, expect, it } from 'vitest'
import {
  addFracs,
  atLeastOneProb,
  binomialProb,
  binomialTermCoeff,
  choose,
  complement,
  conditionalProb,
  divideFracs,
  drawSameProb,
  expectedCount,
  expectedGivenAtLeastOne,
  expectedSum,
  fracLatex,
  fracText,
  gcd,
  handshakes,
  hyperProb,
  latticePaths,
  multiplyFracs,
  reduceFrac,
  starsAndBars,
  unionThree,
  unionTwo,
  weightedValue,
} from './probabilityMath'

describe('gcd', () => {
  it('computes the greatest common divisor', () => {
    expect(gcd(12, 8)).toBe(4)
    expect(gcd(30, 12)).toBe(6)
    expect(gcd(7, 1)).toBe(1)
    expect(gcd(0, 5)).toBe(5)
  })
})

describe('reduceFrac', () => {
  it('reduces to lowest terms', () => {
    expect(reduceFrac(12, 30)).toEqual({ n: 2, d: 5 })
    expect(reduceFrac(4, 2)).toEqual({ n: 2, d: 1 })
    expect(reduceFrac(3, 7)).toEqual({ n: 3, d: 7 })
  })
})

describe('multiplyFracs', () => {
  it('multiplies and reduces', () => {
    expect(multiplyFracs([{ n: 1, d: 2 }, { n: 4, d: 5 }])).toEqual({ n: 2, d: 5 })
    expect(multiplyFracs([{ n: 4, d: 6 }, { n: 3, d: 5 }])).toEqual({ n: 2, d: 5 })
  })
})

describe('drawSameProb', () => {
  it('computes without-replacement probability of all-same draws', () => {
    expect(drawSameProb(4, 6, 2)).toEqual({ n: 2, d: 5 })
    expect(drawSameProb(3, 5, 2)).toEqual({ n: 3, d: 10 })
    expect(drawSameProb(2, 4, 2)).toEqual({ n: 1, d: 6 })
  })
})

describe('conditionalProb', () => {
  it('restricts to the given set and reduces |A∩B|/|B|', () => {
    expect(conditionalProb(2, 3)).toEqual({ n: 2, d: 3 })
    expect(conditionalProb(3, 12)).toEqual({ n: 1, d: 4 })
    expect(conditionalProb(0, 5)).toEqual({ n: 0, d: 1 })
    expect(conditionalProb(2, 0)).toEqual({ n: 0, d: 1 })
  })
})

describe('complement', () => {
  it('returns 1 − f reduced', () => {
    expect(complement({ n: 1, d: 8 })).toEqual({ n: 7, d: 8 })
    expect(complement({ n: 25, d: 36 })).toEqual({ n: 11, d: 36 })
    expect(complement({ n: 1, d: 4 })).toEqual({ n: 3, d: 4 })
    expect(complement({ n: 0, d: 5 })).toEqual({ n: 1, d: 1 })
    expect(complement({ n: 6, d: 6 })).toEqual({ n: 0, d: 1 })
  })
})

describe('atLeastOneProb', () => {
  it('is 1 − (miss per trial)^trials, reduced', () => {
    expect(atLeastOneProb({ n: 1, d: 2 }, 3)).toEqual({ n: 7, d: 8 })
    expect(atLeastOneProb({ n: 5, d: 6 }, 2)).toEqual({ n: 11, d: 36 })
    expect(atLeastOneProb({ n: 5, d: 6 }, 3)).toEqual({ n: 91, d: 216 })
  })
})

describe('expectedCount / expectedSum', () => {
  it('multiplies trials by the per-trial fraction and reduces', () => {
    expect(expectedCount(10, { n: 1, d: 2 })).toEqual({ n: 5, d: 1 })
    expect(expectedCount(6, { n: 1, d: 6 })).toEqual({ n: 1, d: 1 })
    expect(expectedCount(4, { n: 1, d: 6 })).toEqual({ n: 2, d: 3 })
    expect(expectedCount(5, { n: 1, d: 13 })).toEqual({ n: 5, d: 13 })
  })

  it('handles the hat / fixed-point case: n indicators each P=1/n sum to 1', () => {
    expect(expectedCount(7, { n: 1, d: 7 })).toEqual({ n: 1, d: 1 })
    expect(expectedCount(100, { n: 1, d: 100 })).toEqual({ n: 1, d: 1 })
  })

  it('expectedSum is the sum-of-parts reading of the same math', () => {
    expect(expectedSum(2, { n: 7, d: 2 })).toEqual({ n: 7, d: 1 })
    expect(expectedSum(4, { n: 7, d: 2 })).toEqual({ n: 14, d: 1 })
    expect(expectedSum(3, { n: 7, d: 2 })).toEqual({ n: 21, d: 2 })
  })
})

describe('divideFracs', () => {
  it('multiplies by the reciprocal and reduces', () => {
    expect(divideFracs({ n: 1, d: 3 }, { n: 11, d: 36 })).toEqual({ n: 12, d: 11 })
    expect(divideFracs({ n: 2, d: 3 }, { n: 671, d: 1296 })).toEqual({ n: 864, d: 671 })
    expect(divideFracs({ n: 5, d: 1 }, { n: 0, d: 1 })).toEqual({ n: 0, d: 1 })
  })
})

describe('addFracs', () => {
  it('adds over a common denominator and reduces', () => {
    expect(addFracs({ n: 1, d: 6 }, { n: 1, d: 6 })).toEqual({ n: 1, d: 3 })
    expect(addFracs({ n: 1, d: 2 }, { n: 1, d: 3 })).toEqual({ n: 5, d: 6 })
    expect(addFracs({ n: 0, d: 1 }, { n: 2, d: 1 })).toEqual({ n: 2, d: 1 })
  })
})

describe('weightedValue', () => {
  it('computes Σ(value × prob) as an exact reduced fraction', () => {
    // $100 at probability 1/50 (else $0) → expected winnings $2.
    expect(weightedValue([100, 0], [{ n: 1, d: 50 }, { n: 49, d: 50 }])).toEqual({ n: 2, d: 1 })
    // A fair die's payoff averages 7/2 = $3.50.
    expect(
      weightedValue(
        [1, 2, 3, 4, 5, 6],
        Array.from({ length: 6 }, () => ({ n: 1, d: 6 })),
      ),
    ).toEqual({ n: 7, d: 2 })
    expect(weightedValue([10, 0], [{ n: 1, d: 5 }, { n: 4, d: 5 }])).toEqual({ n: 2, d: 1 })
  })
})

describe('expectedGivenAtLeastOne', () => {
  it('combines linearity, complement, and conditioning', () => {
    expect(expectedGivenAtLeastOne(2, { n: 1, d: 6 })).toEqual({ n: 12, d: 11 })
    expect(expectedGivenAtLeastOne(3, { n: 1, d: 6 })).toEqual({ n: 108, d: 91 })
    expect(expectedGivenAtLeastOne(4, { n: 1, d: 6 })).toEqual({ n: 864, d: 671 })
  })
})

describe('choose', () => {
  it('computes C(n, k) and guards out-of-range', () => {
    expect(choose(5, 2)).toBe(10)
    expect(choose(5, 0)).toBe(1)
    expect(choose(5, 5)).toBe(1)
    expect(choose(6, 3)).toBe(20)
    expect(choose(10, 3)).toBe(120)
    expect(choose(5, 6)).toBe(0)
    expect(choose(5, -1)).toBe(0)
  })
})

describe('binomialProb', () => {
  it('is C(n,k) · pᵏ · q^(n−k) as an exact reduced fraction', () => {
    expect(binomialProb(5, 2, { n: 1, d: 3 })).toEqual({ n: 80, d: 243 })
    expect(binomialProb(5, 2, { n: 3, d: 5 })).toEqual({ n: 144, d: 625 })
    expect(binomialProb(2, 2, { n: 1, d: 2 })).toEqual({ n: 1, d: 4 })
    expect(binomialProb(3, 0, { n: 1, d: 2 })).toEqual({ n: 1, d: 8 })
    expect(binomialProb(5, 6, { n: 1, d: 3 })).toEqual({ n: 0, d: 1 })
  })
})

describe('binomialTermCoeff', () => {
  it('is C(n,k)·a^(n−k)·b^k', () => {
    expect(binomialTermCoeff(3, 1, 1, 1)).toBe(3)
    expect(binomialTermCoeff(4, 2, 1, 1)).toBe(6)
    expect(binomialTermCoeff(5, 3, 2, 1)).toBe(40)
    expect(binomialTermCoeff(5, 3, 2, 3)).toBe(1080)
    expect(binomialTermCoeff(5, 6, 2, 1)).toBe(0)
  })
})

describe('hyperProb', () => {
  it('is C(K,k)·C(N−K,n−k) / C(N,n), reduced', () => {
    expect(hyperProb(5, 3, 2, 2)).toEqual({ n: 3, d: 10 })
    expect(hyperProb(5, 3, 2, 1)).toEqual({ n: 3, d: 5 })
    expect(hyperProb(8, 2, 3, 0)).toEqual({ n: 5, d: 14 })
    expect(hyperProb(7, 3, 3, 3)).toEqual({ n: 1, d: 35 })
    expect(hyperProb(52, 4, 5, 2)).toEqual({ n: 2162, d: 54145 })
    expect(hyperProb(5, 3, 2, 3)).toEqual({ n: 0, d: 1 })
  })
})

describe('latticePaths / handshakes', () => {
  it('latticePaths counts monotonic R/U paths as C(m+n, n)', () => {
    expect(latticePaths(2, 2)).toBe(6)
    expect(latticePaths(3, 2)).toBe(10)
    expect(latticePaths(4, 3)).toBe(35)
    expect(latticePaths(3, 0)).toBe(1)
  })

  it('handshakes counts pairs as C(n, 2)', () => {
    expect(handshakes(5)).toBe(10)
    expect(handshakes(2)).toBe(1)
    expect(handshakes(10)).toBe(45)
  })
})

describe('starsAndBars', () => {
  it('counts non-negative solutions / distributions as C(n+k−1, k−1)', () => {
    expect(starsAndBars(5, 3)).toBe(21)
    expect(starsAndBars(3, 2)).toBe(4)
    expect(starsAndBars(0, 3)).toBe(1)
    expect(starsAndBars(6, 4)).toBe(84)
    expect(starsAndBars(10, 1)).toBe(1)
  })
})

describe('unionTwo / unionThree', () => {
  it('unionTwo subtracts the double-counted overlap', () => {
    expect(unionTwo(18, 15, 7)).toBe(26)
    expect(unionTwo(13, 12, 3)).toBe(22)
    expect(unionTwo(10, 5, 0)).toBe(15)
  })

  it('unionThree applies the full ± pattern', () => {
    expect(unionThree(40, 35, 30, 12, 10, 8, 4)).toBe(79)
    expect(unionThree(10, 10, 10, 0, 0, 0, 0)).toBe(30)
    expect(unionThree(5, 5, 5, 5, 5, 5, 5)).toBe(5)
  })
})

describe('fracLatex / fracText', () => {
  it('formats fractions, collapsing whole numbers', () => {
    expect(fracLatex({ n: 2, d: 5 })).toBe('\\tfrac{2}{5}')
    expect(fracLatex({ n: 3, d: 1 })).toBe('3')
    expect(fracText({ n: 2, d: 5 })).toBe('2/5')
    expect(fracText({ n: 3, d: 1 })).toBe('3')
  })
})
