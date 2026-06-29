import { describe, expect, it } from 'vitest'
import { course } from '../../content/course'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { isGradedStepType } from '../progress/mastery'
import {
  BASE_CAP,
  MAX_LEVEL,
  crossLessonWeakConcepts,
  generateProblem,
  lessonWeakConceptIds,
  nextLevel,
  xpForLevel,
} from './practiceEngine'

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
  'mutually-exclusive',
  'binomial-coin',
  'binomial-theorem',
  'inclusion-exclusion',
  'stars-and-bars',
  'contest-counting',
  'applied-probability',
  'synthesis',
  'probability',
  'expected-value',
  'decision-ev',
]

/** Builds a progress doc that marks every graded step in a lesson first-try wrong. */
function allWrong(lessonId: string): LessonProgressDoc {
  const lesson = course.lessons.find((l) => l.id === lessonId)!
  const stepAnswers: Record<string, unknown> = {}
  for (const step of lesson.steps) {
    if (isGradedStepType(step.type)) {
      stepAnswers[step.id] = { answer: 0, correct: false, firstAttemptCorrect: false, attempts: 1 }
    }
  }
  return { lessonId, stepAnswers } as unknown as LessonProgressDoc
}

describe('generateProblem', () => {
  it('produces positive integer answers for every concept and difficulty', () => {
    for (const concept of CONCEPTS) {
      for (let d = 1; d <= MAX_LEVEL; d++) {
        for (let seed = 0; seed < 15; seed++) {
          const p = generateProblem(concept, d, seed)
          expect(Number.isInteger(p.answer), `${concept} d${d}`).toBe(true)
          expect(p.answer).toBeGreaterThan(0)
          expect(p.prompt.length).toBeGreaterThan(0)
          expect(p.formula.length).toBeGreaterThan(0)
          expect(p.explanation.length).toBeGreaterThan(0)
          // The explanation states the verified answer (informative, not just the calc).
          expect(p.explanation).toContain(String(p.answer))
        }
      }
    }
  })

  it('is deterministic for a given seed', () => {
    expect(generateProblem('combinations', 3, 99)).toEqual(generateProblem('combinations', 3, 99))
  })
})

describe('nextLevel', () => {
  it('rises on correct (capped) and falls on wrong (floored at 1)', () => {
    expect(nextLevel(1, false, BASE_CAP)).toBe(1)
    expect(nextLevel(2, true, BASE_CAP)).toBe(3)
    expect(nextLevel(BASE_CAP, true, BASE_CAP)).toBe(BASE_CAP)
    expect(nextLevel(BASE_CAP, true, MAX_LEVEL)).toBe(BASE_CAP + 1)
    expect(nextLevel(3, false, BASE_CAP)).toBe(2)
  })
})

describe('xpForLevel', () => {
  it('scales with level and clamps to the valid range', () => {
    expect(xpForLevel(1)).toBeLessThan(xpForLevel(5))
    expect(xpForLevel(0)).toBe(xpForLevel(1))
    expect(xpForLevel(99)).toBe(xpForLevel(MAX_LEVEL))
  })
})

describe('weakness extraction', () => {
  it('lessonWeakConceptIds returns the wrong-step concepts (and nothing without mistakes)', () => {
    const lesson = course.lessons[0]
    expect(lessonWeakConceptIds(allWrong(lesson.id), lesson).length).toBeGreaterThan(0)
    expect(lessonWeakConceptIds(null, lesson)).toEqual([])
  })

  it('crossLessonWeakConcepts aggregates across lessons and is empty with no mistakes', () => {
    expect(crossLessonWeakConcepts([])).toEqual([])
    const weak = crossLessonWeakConcepts(course.lessons.map((l) => allWrong(l.id)))
    expect(weak.length).toBeGreaterThan(0)
    // Sorted by misses, descending.
    for (let i = 1; i < weak.length; i++) {
      expect(weak[i - 1].misses).toBeGreaterThanOrEqual(weak[i].misses)
    }
  })

  it('crossLessonWeakConcepts: practice corrects cancel a concept out of the list', () => {
    const lesson = course.lessons[0]
    const baseline = crossLessonWeakConcepts([allWrong(lesson.id)])
    expect(baseline.length).toBeGreaterThan(0)
    const target = baseline[0]
    // Enough practice corrects to fully offset the lesson misses → weakness 0 → drops out.
    const stats = { [target.conceptId]: { correct: target.misses + 3, wrong: 0 } }
    const after = crossLessonWeakConcepts([allWrong(lesson.id)], stats)
    expect(after.find((w) => w.conceptId === target.conceptId)).toBeUndefined()
  })

  it('crossLessonWeakConcepts: practice wrongs add a concept even with no lesson misses', () => {
    const weak = crossLessonWeakConcepts([], { combinations: { correct: 1, wrong: 4 } })
    const entry = weak.find((w) => w.conceptId === 'combinations')
    expect(entry).toBeTruthy()
    expect(entry!.misses).toBe(3)
  })
})
