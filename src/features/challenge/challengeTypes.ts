import type { Timestamp } from 'firebase/firestore'

/** The kinds of prompts a Challenge Mode session can pose. */
export type ChallengeQuestionType =
  | 'explain_it_back'
  | 'catch_the_mistake'
  | 'transfer'
  | 'real_life_example'
  | 'difficulty_shift'

/** Soft, non-pass/fail understanding label. Drives recommendations, never gating. */
export type ChallengeUnderstanding = 'strong' | 'developing' | 'needs_review'

export type RecommendedNextAction = 'continue' | 'review_lesson' | 'try_practice'

/** A mistake the learner made during the lesson, used to ground the AI. */
export interface ChallengeMistake {
  stepId: string
  prompt: string
  userAnswer: string
  correctAnswer: string
  misconceptionTag?: string
}

/**
 * Structured lesson state every AI call is grounded in (PRD "Structured AI
 * Grounding"). `concepts` are concept ids; the prompt builder maps them to
 * human-readable labels. `challengeQuestionType` is added per call.
 */
export interface ChallengeGroundingContext {
  userId: string
  lessonId: string
  lessonTitle: string
  concepts: string[]
  completedSteps: string[]
  mistakes: ChallengeMistake[]
  masteryScoreBeforeChallenge: number
}

/** AI output when generating a question (PRD "AI Output Format"). */
export interface ChallengeQuestionOutput {
  question: string
  expectedConcepts: string[]
  feedbackStyle: 'encouraging' | 'corrective' | 'socratic'
  companionMessage: string
}

/** AI output when evaluating a learner response (PRD "AI Output Format"). */
export interface ChallengeEvaluationOutput {
  understanding: ChallengeUnderstanding
  feedback: string
  followUpQuestion?: string
  misconceptionDetected?: string
  recommendedNextAction: RecommendedNextAction
  xpAwarded: number
}

/** One answered question accumulated in-memory during a live session. */
export interface ChallengeAnsweredItem {
  type: ChallengeQuestionType
  question: string
  studentAnswer: string
  feedback: string
  understanding: ChallengeUnderstanding
  misconceptionDetected?: string
  xpAwarded: number
}

/** Firestore: users/{uid}/challengeSessions/{sessionId}. */
export interface ChallengeSessionDoc {
  sessionId: string
  lessonId: string
  startedAt: Timestamp
  completedAt?: Timestamp
  questionCount: number
  understanding: ChallengeUnderstanding
  xpEarned: number
  recommendedNextAction: RecommendedNextAction
}

/** Firestore: users/{uid}/challengeSessions/{sessionId}/responses/{responseId}. */
export interface ChallengeResponseDoc {
  responseId: string
  questionType: ChallengeQuestionType
  question: string
  studentAnswer: string
  aiFeedback: string
  understanding: ChallengeUnderstanding
  misconceptionDetected?: string
  xpAwarded: number
  createdAt: Timestamp
}
