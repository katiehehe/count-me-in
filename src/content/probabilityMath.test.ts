import { describe, expect, it } from 'vitest'
import {
  atLeastOneProb,
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
  multiplyFracs,
  reduceFrac,
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

describe('expectedGivenAtLeastOne', () => {
  it('combines linearity, complement, and conditioning', () => {
    expect(expectedGivenAtLeastOne(2, { n: 1, d: 6 })).toEqual({ n: 12, d: 11 })
    expect(expectedGivenAtLeastOne(3, { n: 1, d: 6 })).toEqual({ n: 108, d: 91 })
    expect(expectedGivenAtLeastOne(4, { n: 1, d: 6 })).toEqual({ n: 864, d: 671 })
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
