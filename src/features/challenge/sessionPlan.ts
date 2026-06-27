import type { ChallengeGroundingContext, ChallengeQuestionType } from './challengeTypes'
import { hasTransferQuestion } from './transferQuestions'

/**
 * Challenge Mode is a fixed 4-step sequence so each session covers a distinct
 * kind of thinking (rather than three near-identical prompts):
 *   1. answer a review question      → a code-checked `transfer` problem
 *   2. correct a mistake             → `catch_the_mistake`
 *   3. explain your thinking         → `explain_it_back`
 *   4. give a real-world example     → `real_life_example`
 *
 * The review question falls back to `explain_it_back` only if the concept has no
 * deterministic transfer generator (so we never pose an ungradable numeric).
 */
export function planSession(ctx: ChallengeGroundingContext): ChallengeQuestionType[] {
  const reviewQuestion: ChallengeQuestionType = hasTransferQuestion(ctx.concepts)
    ? 'transfer'
    : 'explain_it_back'
  return [reviewQuestion, 'catch_the_mistake', 'explain_it_back', 'real_life_example']
}
