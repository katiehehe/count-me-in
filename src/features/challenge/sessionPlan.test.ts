import { describe, expect, it } from 'vitest'
import type { ChallengeGroundingContext, ChallengeMistake } from './challengeTypes'
import { planSession } from './sessionPlan'

function makeCtx(overrides: Partial<ChallengeGroundingContext> = {}): ChallengeGroundingContext {
  return {
    userId: 'u',
    lessonId: 'l',
    lessonTitle: 'Test Lesson',
    concepts: ['combinations'],
    completedSteps: [],
    mistakes: [],
    masteryScoreBeforeChallenge: 1,
    ...overrides,
  }
}

const mistake: ChallengeMistake = {
  stepId: 's1',
  prompt: 'p',
  userAnswer: 'x',
  correctAnswer: 'y',
}

describe('planSession', () => {
  it('always starts with explain_it_back and yields 2-4 questions', () => {
    for (let seed = 0; seed < 30; seed++) {
      const plan = planSession(makeCtx(), seed)
      expect(plan[0]).toBe('explain_it_back')
      expect(plan.length).toBeGreaterThanOrEqual(2)
      expect(plan.length).toBeLessThanOrEqual(4)
    }
  })

  it('includes catch_the_mistake only when the learner made mistakes', () => {
    const withMistakes = planSession(makeCtx({ mistakes: [mistake] }), 3)
    expect(withMistakes).toContain('catch_the_mistake')

    const noMistakes = planSession(makeCtx({ mistakes: [] }), 3)
    expect(noMistakes).not.toContain('catch_the_mistake')
  })

  it('includes a transfer question when the concept supports one', () => {
    expect(planSession(makeCtx({ concepts: ['combinations'] }), 5)).toContain('transfer')
  })

  it('omits transfer (and still has >= 2 questions) for unsupported concepts', () => {
    const plan = planSession(makeCtx({ concepts: ['no-such-concept'], mistakes: [] }), 5)
    expect(plan).not.toContain('transfer')
    expect(plan.length).toBeGreaterThanOrEqual(2)
  })

  it('is deterministic for a given seed', () => {
    const ctx = makeCtx({ mistakes: [mistake] })
    expect(planSession(ctx, 42)).toEqual(planSession(ctx, 42))
  })
})
