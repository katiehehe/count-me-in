import { describe, expect, it } from 'vitest'
import { course } from './course'

// Guards Bug #3: the dice simulation no longer supports editing faces, so no
// lesson may promise that interaction or set the dead `editable` flag. If face
// editing is ever restored in DiceSimulation, update these expectations.

const FACE_EDIT_PROMISES = [/change the face values/i, /edit the faces/i, /change the faces/i]

describe('lesson content matches component capabilities', () => {
  it('no simulation step promises editable dice faces', () => {
    for (const lesson of course.lessons) {
      for (const step of lesson.steps) {
        if (step.type !== 'simulation') continue
        for (const pattern of FACE_EDIT_PROMISES) {
          expect(step.body ?? '').not.toMatch(pattern)
        }
      }
    }
  })

  it('no simulationConfig sets the unsupported editable flag', () => {
    for (const lesson of course.lessons) {
      for (const step of lesson.steps) {
        expect(step.simulationConfig?.editable).not.toBe(true)
      }
    }
  })
})
