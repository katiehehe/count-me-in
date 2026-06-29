import { describe, expect, it } from 'vitest'
import { shouldAdvanceOnEnter } from './enterAdvance'

describe('shouldAdvanceOnEnter', () => {
  it('does NOT advance on the keystroke that submits a correct answer', () => {
    // Before the press the step wasn't satisfiable yet; React then grades it correct
    // mid-keystroke (canAdvanceNow flips true). It must still wait for the next Enter.
    expect(
      shouldAdvanceOnEnter({ advancibleBeforeKey: false, canAdvanceNow: true, locked: false }),
    ).toBe(false)
  })

  it('advances on a later Enter, once the step was already satisfied beforehand', () => {
    expect(
      shouldAdvanceOnEnter({ advancibleBeforeKey: true, canAdvanceNow: true, locked: false }),
    ).toBe(true)
  })

  it('never advances on a wrong or unanswered step', () => {
    expect(
      shouldAdvanceOnEnter({ advancibleBeforeKey: false, canAdvanceNow: false, locked: false }),
    ).toBe(false)
  })

  it('respects the one-shot lock (no rapid double-advance / skip)', () => {
    expect(
      shouldAdvanceOnEnter({ advancibleBeforeKey: true, canAdvanceNow: true, locked: true }),
    ).toBe(false)
  })
})
