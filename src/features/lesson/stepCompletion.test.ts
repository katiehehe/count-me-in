import { describe, expect, it } from 'vitest'
import { canAdvance, interactiveDoneState, type StepState } from './StepRenderer'
import type { LessonStep, StepType } from '../../content/types'

// Guards Bug #7: restoring a completed interactive step must satisfy canAdvance.
// interactiveDoneState is the typed inverse of canAdvance's per-type checks, so
// applying it to a fresh state must make the step advancible for every type.

const INTERACTIVE_TYPES: StepType[] = [
  'arrangement',
  'connection',
  'tree',
  'simulation',
  'probability',
  'outcome-select',
  'condensing',
  'combined-experiment',
  'dependence-pairing',
  'factorial-discovery',
  'worked-example',
  'conditional-select',
  'complement-select',
  'coin-flip-sim',
]

const blankState: StepState = { answered: false, correct: null, answer: null }

describe('interactiveDoneState <-> canAdvance', () => {
  it('a fresh interactive step cannot advance', () => {
    for (const type of INTERACTIVE_TYPES) {
      const step = { id: 's', type, title: '' } as LessonStep
      expect(canAdvance(step, blankState)).toBe(false)
    }
  })

  it('restoring completion makes every interactive type advancible', () => {
    for (const type of INTERACTIVE_TYPES) {
      const step = { id: 's', type, title: '' } as LessonStep
      const restored: StepState = { ...blankState, answered: true, ...interactiveDoneState(type) }
      expect(canAdvance(step, restored)).toBe(true)
    }
  })
})
