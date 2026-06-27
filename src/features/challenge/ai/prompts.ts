import { CONCEPT_LABELS } from '../../../content/types'
import type { ChallengeGroundingContext, ChallengeQuestionType } from '../challengeTypes'

const PERSONA =
  'You are "Pip", a warm, encouraging cat study companion inside a learn-by-doing ' +
  'math app for contest counting and probability. You are NOT a general chatbot: ' +
  'you only run a short, structured retrieval-practice check about the lesson the ' +
  'learner just finished. Keep every message short (1-3 sentences), friendly, and ' +
  'focused strictly on the lesson concepts below. Never answer off-topic requests.'

function labelFor(conceptId: string): string {
  return CONCEPT_LABELS[conceptId] ?? conceptId
}

/** Renders the grounded lesson state shared by every prompt. */
function groundingBlock(ctx: ChallengeGroundingContext): string {
  const concepts = ctx.concepts.map(labelFor).join(', ') || '(none listed)'
  const completed = ctx.completedSteps.slice(0, 8).join('; ') || '(none recorded)'
  const mistakes = ctx.mistakes.length
    ? ctx.mistakes
        .map(
          (m, i) =>
            `  ${i + 1}. Prompt: "${m.prompt}" | Their answer: "${m.userAnswer}" | ` +
            `Correct: "${m.correctAnswer}"${m.misconceptionTag ? ` | Misconception tag: ${m.misconceptionTag}` : ''}`,
        )
        .join('\n')
    : '  (the learner made no first-try mistakes)'
  return [
    `Lesson just completed: "${ctx.lessonTitle}"`,
    `Concepts taught: ${concepts}`,
    `Steps the learner worked through: ${completed}`,
    `Mastery score before this check (0-1): ${ctx.masteryScoreBeforeChallenge.toFixed(2)}`,
    `Mistakes made during the lesson:\n${mistakes}`,
  ].join('\n')
}

const QUESTION_INSTRUCTIONS: Record<ChallengeQuestionType, string> = {
  explain_it_back:
    'Ask the learner to explain a CORE idea of this lesson in their own words ' +
    '(retrieval practice). Favor "why" over "compute". Do not ask them to do arithmetic.',
  catch_the_mistake:
    'Present a SHORT, plausible but WRONG line of reasoning a student might use for ' +
    'this lesson (ideally related to a mistake they actually made above), and ask ' +
    'them to identify what is wrong with it. Do not reveal the flaw yourself.',
  real_life_example:
    'Ask the learner to give a real-life situation where this concept shows up, to ' +
    'build meaning-making and transfer. Keep it open and concrete.',
  transfer:
    'Pose a slightly harder application problem of the same concept.',
  difficulty_shift:
    'Re-explain at the requested difficulty.',
}

/** Prompt that asks the model to author one challenge question of the given type. */
export function buildQuestionPrompt(
  ctx: ChallengeGroundingContext,
  type: ChallengeQuestionType,
): string {
  return [
    PERSONA,
    '',
    groundingBlock(ctx),
    '',
    `Task: Write ONE "${type}" question.`,
    QUESTION_INSTRUCTIONS[type],
    '',
    'Return JSON only, matching the schema: question (the text shown to the learner), ' +
      'expectedConcepts (concept labels your question targets), feedbackStyle, and ' +
      'companionMessage (a brief, in-character one-liner from Pip introducing it).',
  ].join('\n')
}

/**
 * Prompt to evaluate a free-response answer. For deterministic transfer questions
 * the correctness is decided in CODE and passed in via `codeVerdict`; the model
 * is explicitly told to explain that verdict, never to recompute the answer.
 */
export function buildEvaluationPrompt(args: {
  ctx: ChallengeGroundingContext
  type: ChallengeQuestionType
  question: string
  studentAnswer: string
  codeVerdict?: { correct: boolean; correctAnswer: string }
}): string {
  const { ctx, type, question, studentAnswer, codeVerdict } = args
  const verdictBlock = codeVerdict
    ? [
        '',
        'IMPORTANT: This is a numeric question already graded by the app.',
        `The verified correct answer (computed by code, treat as ground truth) is: ${codeVerdict.correctAnswer}.`,
        `The learner's answer was ${codeVerdict.correct ? 'CORRECT' : 'INCORRECT'}.`,
        'Do NOT recompute or contradict this verdict. Base your feedback and the ' +
          '"understanding" label on it, and briefly explain the reasoning.',
      ].join('\n')
    : ''

  return [
    PERSONA,
    '',
    groundingBlock(ctx),
    '',
    `Question type: ${type}`,
    `Question asked: "${question}"`,
    `Learner's answer: "${studentAnswer}"`,
    verdictBlock,
    '',
    'Task: Evaluate the answer kindly and briefly. This is NOT pass/fail — use the ' +
      'understanding label to guide recommendations, not to gate progress. Identify a ' +
      'misconception only if clearly present. Return JSON matching the schema: ' +
      'understanding (strong|developing|needs_review), feedback (1-3 warm sentences), ' +
      'optional followUpQuestion, optional misconceptionDetected, recommendedNextAction ' +
      '(continue|review_lesson|try_practice), and xpAwarded (0-25 small integer).',
  ].join('\n')
}

