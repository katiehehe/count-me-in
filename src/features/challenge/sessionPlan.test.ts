import { describe, expect, it } from 'vitest'
import type { ChallengeGroundingContext } from './challengeTypes'
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

describe('planSession', () => {
  it('is a fixed 4-step sequence covering each thinking type', () => {
    const plan = planSession(makeCtx())
    expect(plan).toEqual(['transfer', 'catch_the_mistake', 'explain_it_back', 'real_life_example'])
  })

  it('always includes catch_the_mistake (even with no recorded mistakes)', () => {
    expect(planSession(makeCtx({ mistakes: [] }))).toContain('catch_the_mistake')
  })

  it('falls back to explain_it_back for the review question when no transfer exists', () => {
    const plan = planSession(makeCtx({ concepts: ['no-such-concept'] }))
    expect(plan[0]).toBe('explain_it_back')
    expect(plan).not.toContain('transfer')
    expect(plan).toHaveLength(4)
  })
})
