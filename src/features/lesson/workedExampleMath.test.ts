import { describe, expect, it } from 'vitest'
import { fractionLatex, rotate, timesLatex } from './workedExampleMath'

describe('timesLatex', () => {
  it('joins factors with LaTeX \\times', () => {
    expect(timesLatex([3, 2, 1])).toBe('3 \\times 2 \\times 1')
    expect(timesLatex([5])).toBe('5')
    expect(timesLatex([])).toBe('')
  })
})

describe('fractionLatex', () => {
  it('builds a display fraction', () => {
    expect(fractionLatex('6', '2')).toBe('\\dfrac{6}{2}')
  })
})

describe('rotate', () => {
  it('rotates left by one by default and wraps', () => {
    expect(rotate(['a', 'b', 'c'])).toEqual(['b', 'c', 'a'])
    expect(rotate(['a', 'b', 'c'], 2)).toEqual(['c', 'a', 'b'])
    expect(rotate(['a', 'b', 'c'], 3)).toEqual(['a', 'b', 'c'])
  })

  it('handles negative and empty inputs', () => {
    expect(rotate(['a', 'b', 'c'], -1)).toEqual(['c', 'a', 'b'])
    expect(rotate([])).toEqual([])
  })
})
