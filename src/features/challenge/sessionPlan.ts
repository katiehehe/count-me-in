import { mulberry32 } from '../../content/randomize'
import type { ChallengeGroundingContext, ChallengeQuestionType } from './challengeTypes'
import { hasTransferQuestion } from './transferQuestions'

/**
 * Picks the 2-4 question mix for a Challenge session, grounded in lesson state:
 *  - always an `explain_it_back` (core retrieval practice),
 *  - a `catch_the_mistake` when the learner actually made mistakes,
 *  - a deterministic `transfer` when the concept supports a code-checked problem,
 *  - a `real_life_example` to enrich (and to guarantee a minimum of 2).
 * Deterministic given `seed`, so a session is reproducible and unit-testable.
 */
export function planSession(ctx: ChallengeGroundingContext, seed: number): ChallengeQuestionType[] {
  const rng = mulberry32(seed)
  const plan: ChallengeQuestionType[] = ['explain_it_back']

  if (ctx.mistakes.length > 0) plan.push('catch_the_mistake')
  if (hasTransferQuestion(ctx.concepts)) plan.push('transfer')

  if (plan.length < 2) {
    // Guarantee at least two questions.
    plan.push('real_life_example')
  } else if (plan.length < 4 && rng() < 0.6) {
    // Sometimes enrich toward a fuller session.
    plan.push('real_life_example')
  }

  return plan.slice(0, 4)
}
