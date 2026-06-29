import { describe, expect, it } from 'vitest'
import { course } from './course'
import { CURRICULUM_UNITS } from './curriculum'
import { resolveLesson } from './randomize'
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

// The numeric input strips any leading "−", so a learner can never type a negative
// number. Every graded numeric answer must therefore be typeable (>= 0), across the
// base content AND every randomized variant.
describe('graded numeric answers are typeable', () => {
  it('no numeric-question resolves to a negative correct answer', () => {
    for (const lesson of course.lessons) {
      for (let seed = 0; seed < 12; seed++) {
        for (const step of resolveLesson(lesson, seed).steps) {
          if (step.question?.inputType !== 'numeric') continue
          const answer = step.question.correctAnswer as number
          expect(
            Number.isFinite(answer) && answer >= 0,
            `${lesson.id}/${step.id} (seed ${seed}) has untypeable answer ${answer}`,
          ).toBe(true)
        }
      }
    }
  })
})

describe('expected-value-applications capstone', () => {
  const lesson = course.lessons.find((l) => l.id === 'expected-value-applications')

  it('is registered as the final lesson of the course', () => {
    expect(lesson).toBeDefined()
    expect(course.lessons.at(-1)?.id).toBe('expected-value-applications')
  })

  it('reuses the steps worked example and the EV simulation', () => {
    const kinds = lesson!.steps.map((s) => s.type)
    expect(kinds).toContain('expected-value-sim')
    const worked = lesson!.steps.find((s) => s.type === 'worked-example')
    expect(worked?.workedExampleConfig?.kind).toBe('steps')
    expect(worked?.workedExampleConfig?.steps?.lines.length).toBeGreaterThan(0)
  })

  it('exercises the decision concept plus its expectation building blocks', () => {
    const used = new Set(lesson!.steps.flatMap((s) => s.concepts ?? []))
    for (const c of ['decision-ev', 'expected-value', 'linearity-expectation', 'indicator-variables']) {
      expect(used.has(c), `missing concept tag "${c}"`).toBe(true)
    }
  })
})

describe('course rollout is complete', () => {
  it('no curriculum lesson is still flagged comingSoon', () => {
    const stillComingSoon = CURRICULUM_UNITS.flatMap((u) => u.lessons)
      .filter((l) => l.comingSoon)
      .map((l) => l.lessonId)
    expect(stillComingSoon).toEqual([])
  })

  it('every curriculum lesson resolves to a built lesson', () => {
    for (const unit of CURRICULUM_UNITS) {
      for (const def of unit.lessons) {
        expect(
          course.lessons.some((l) => l.id === def.lessonId),
          `curriculum references unbuilt lesson "${def.lessonId}"`,
        ).toBe(true)
      }
    }
  })
})
