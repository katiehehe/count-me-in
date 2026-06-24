import { describe, expect, it } from 'vitest'
import { resolveLesson } from './randomize'
import { course } from './course'
import { isGradedStepType } from '../features/progress/mastery'

// These tests protect the invariant that the cross-device seed fix (Bug #2)
// relies on: a given seed must reproduce the EXACT same play-through, and every
// randomized numeric answer must be a clean integer.

function gradedNumericQuestions(lessonId: string, seed: number) {
  const raw = course.lessons.find((l) => l.id === lessonId)!
  const resolved = resolveLesson(raw, seed)
  return resolved.steps
    .filter(
      (s) =>
        isGradedStepType(s.type) &&
        s.question?.inputType === 'numeric' &&
        typeof s.question.correctAnswer === 'number',
    )
    .map((s) => s.question!)
}

describe('resolveLesson determinism (Bug #2 — seed persistence)', () => {
  it('produces identical numbers for the same seed (every lesson)', () => {
    for (const lesson of course.lessons) {
      for (const seed of [1, 42, 7777, 2_000_000_000]) {
        const a = JSON.stringify(resolveLesson(lesson, seed))
        const b = JSON.stringify(resolveLesson(lesson, seed))
        expect(a).toBe(b)
      }
    }
  })

  it('produces different numbers for different seeds (at least one lesson varies)', () => {
    const varied = course.lessons.some((lesson) => {
      const a = JSON.stringify(resolveLesson(lesson, 1))
      const b = JSON.stringify(resolveLesson(lesson, 999_999))
      return a !== b
    })
    expect(varied).toBe(true)
  })
})

describe('randomized numeric answers are grading-safe', () => {
  it('every graded numeric answer is finite, and fractional ones define a tolerance', () => {
    for (const lesson of course.lessons) {
      for (let seed = 0; seed < 200; seed++) {
        for (const q of gradedNumericQuestions(lesson.id, seed)) {
          const ans = q.correctAnswer as number
          expect(Number.isFinite(ans)).toBe(true)
          // A non-integer answer can never be matched by exact float equality,
          // so it MUST carry a tolerance or grading silently rejects the truth.
          if (!Number.isInteger(ans)) {
            expect(q.tolerance).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})
