import { callChallengeAi } from '../../../firebase/aiClient'
import type {
  ChallengeEvaluationOutput,
  ChallengeGroundingContext,
  ChallengeQuestionOutput,
  ChallengeQuestionType,
  ChallengeUnderstanding,
  RecommendedNextAction,
} from '../challengeTypes'
import { buildDifficultyShiftPrompt, buildEvaluationPrompt, buildQuestionPrompt } from './prompts'

const UNDERSTANDINGS: readonly ChallengeUnderstanding[] = ['strong', 'developing', 'needs_review']
const ACTIONS: readonly RecommendedNextAction[] = ['continue', 'review_lesson', 'try_practice']
const STYLES = ['encouraging', 'corrective', 'socratic'] as const

// The model is schema-constrained, but normalize anyway so a stray value can
// never crash the UI — we clamp enums and supply sensible text fallbacks.
function clampEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export async function generateChallengeQuestion(
  ctx: ChallengeGroundingContext,
  type: ChallengeQuestionType,
): Promise<ChallengeQuestionOutput> {
  const raw = await callChallengeAi<Partial<ChallengeQuestionOutput>>(
    'question',
    buildQuestionPrompt(ctx, type),
  )
  return {
    question:
      (raw.question ?? '').trim() || 'In your own words, what was the main idea of this lesson?',
    expectedConcepts: Array.isArray(raw.expectedConcepts) ? raw.expectedConcepts : [],
    feedbackStyle: clampEnum(raw.feedbackStyle, STYLES, 'encouraging'),
    companionMessage: (raw.companionMessage ?? '').trim() || "Let's see what stuck!",
  }
}

export async function evaluateChallengeResponse(args: {
  ctx: ChallengeGroundingContext
  type: ChallengeQuestionType
  question: string
  studentAnswer: string
  codeVerdict?: { correct: boolean; correctAnswer: string }
}): Promise<ChallengeEvaluationOutput> {
  const raw = await callChallengeAi<Partial<ChallengeEvaluationOutput>>(
    'evaluate',
    buildEvaluationPrompt(args),
  )
  return {
    understanding: clampEnum(raw.understanding, UNDERSTANDINGS, 'developing'),
    feedback: (raw.feedback ?? '').trim() || 'Thanks for sharing your thinking!',
    followUpQuestion: raw.followUpQuestion?.trim() || undefined,
    misconceptionDetected: raw.misconceptionDetected?.trim() || undefined,
    recommendedNextAction: clampEnum(raw.recommendedNextAction, ACTIONS, 'continue'),
    xpAwarded: typeof raw.xpAwarded === 'number' ? raw.xpAwarded : 0,
  }
}

export async function requestDifficultyShift(
  ctx: ChallengeGroundingContext,
  question: string,
  mode: 'simpler' | 'contest' | 'example',
): Promise<string> {
  const raw = await callChallengeAi<{ companionMessage?: string }>(
    'shift',
    buildDifficultyShiftPrompt({ ctx, question, mode }),
  )
  return (raw.companionMessage ?? '').trim()
}
