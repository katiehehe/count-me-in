import { describe, expect, it } from 'vitest'
import { course } from './course'
import { CONCEPT_LABELS } from './types'
import { hasTransferQuestion } from '../features/challenge/transferQuestions'

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

// These guardrails keep the Phase 2 AI features working for EVERY lesson — including
// ones added later — without per-lesson wiring. If a new lesson introduces a concept
// the engine doesn't know about, these fail with a message pointing to the fix.
describe('AI features stay wired for every lesson', () => {
  it('every concept id a lesson uses has a human-readable CONCEPT_LABELS entry', () => {
    for (const lesson of course.lessons) {
      const conceptIds = new Set<string>([
        ...(lesson.concepts ?? []),
        ...lesson.steps.flatMap((s) => s.concepts ?? []),
      ])
      for (const id of conceptIds) {
        expect(
          CONCEPT_LABELS[id],
          `Missing CONCEPT_LABELS["${id}"] (used in lesson "${lesson.id}"). Add it in src/content/types.ts.`,
        ).toBeTruthy()
      }
    }
  })

  it('every lesson has a concept with a deterministic transfer generator', () => {
    for (const lesson of course.lessons) {
      expect(
        hasTransferQuestion(lesson.concepts ?? []),
        `Lesson "${lesson.id}" has no concept with a transfer generator — add one in ` +
          `src/features/challenge/transferQuestions.ts so Challenge Mode can pose a ` +
          `code-checked review question for it.`,
      ).toBe(true)
    }
  })
})
