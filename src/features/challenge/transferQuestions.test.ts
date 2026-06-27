import { describe, expect, it } from 'vitest'
import { repeatedArrangements } from '../simulation/permutationMath'
import {
  buildTransferQuestion,
  checkTransferAnswer,
  hasTransferQuestion,
} from './transferQuestions'

const CONCEPTS = [
  'counting-principle',
  'permutation',
  'distinct-objects',
  'factorial',
  'identical-objects',
  'multiset-permutation',
  'combinations',
  'independent-events',
  'dependent-events',
  'conditional-probability',
  'complement-rule',
  'linearity-expectation',
  'indicator-variables',
  'synthesis',
  'probability',
  'expected-value',
]

describe('repeatedArrangements', () => {
  it('computes options^slots', () => {
    expect(repeatedArrangements(5, 4)).toBe(625)
    expect(repeatedArrangements(2, 3)).toBe(8)
    expect(repeatedArrangements(7, 1)).toBe(7)
  })
  it('returns 1 for zero slots and 0 for negative inputs', () => {
    expect(repeatedArrangements(9, 0)).toBe(1)
    expect(repeatedArrangements(-1, 2)).toBe(0)
  })
})

describe('buildTransferQuestion', () => {
  it('produces positive, code-checkable integer answers for every concept across seeds', () => {
    for (const concept of CONCEPTS) {
      for (let seed = 0; seed < 50; seed++) {
        const q = buildTransferQuestion([concept], seed)
        expect(q.prompt.length).toBeGreaterThan(0)
        expect(q.formula.length).toBeGreaterThan(0)
        expect(Number.isInteger(q.answer)).toBe(true)
        expect(q.answer).toBeGreaterThan(0)
        // The code-computed answer must validate against its own checker.
        expect(checkTransferAnswer(q.answer, q.answer)).toBe(true)
        expect(checkTransferAnswer(q.answer + 1, q.answer)).toBe(false)
      }
    }
  })

  it('is deterministic for a given seed', () => {
    const a = buildTransferQuestion(['combinations'], 1234)
    const b = buildTransferQuestion(['combinations'], 1234)
    expect(a).toEqual(b)
  })

  it('falls back to a factorial question for unknown concepts', () => {
    const q = buildTransferQuestion(['totally-unknown'], 7)
    expect(q.conceptId).toBe('factorial')
    expect(Number.isInteger(q.answer)).toBe(true)
  })
})

describe('checkTransferAnswer', () => {
  it('accepts equivalent numbers and tolerates commas/spaces', () => {
    expect(checkTransferAnswer(120, 120)).toBe(true)
    expect(checkTransferAnswer('120', 120)).toBe(true)
    expect(checkTransferAnswer(' 1,000 ', 1000)).toBe(true)
  })
  it('rejects wrong or unparseable answers', () => {
    expect(checkTransferAnswer(121, 120)).toBe(false)
    expect(checkTransferAnswer('abc', 120)).toBe(false)
    expect(checkTransferAnswer('', 120)).toBe(false)
  })
})

describe('hasTransferQuestion', () => {
  it('is true for supported concepts and false otherwise', () => {
    expect(hasTransferQuestion(['combinations'])).toBe(true)
    expect(hasTransferQuestion(['probability', 'nope'])).toBe(true)
    expect(hasTransferQuestion(['nope'])).toBe(false)
    expect(hasTransferQuestion([])).toBe(false)
  })
})
