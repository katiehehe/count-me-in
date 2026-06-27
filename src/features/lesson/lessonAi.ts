import { callChallengeAi } from '../../firebase/aiClient'
import { CONCEPT_LABELS } from '../../content/types'
import { coerceHintTiers } from './hintTiers'

/** A reference to an earlier lesson step the AI may point the learner back to. */
export interface LessonStepRef {
  id: string
  title: string
}

export interface LessonHelpContext {
  lessonTitle: string
  stepTitle: string
  /** The question text the learner currently sees. */
  questionText: string
  /** Multiple-choice options, if any. */
  choices?: string[]
  /** Concept ids this step teaches. */
  concepts: string[]
  /** Earlier steps (id + title) the AI may recommend revisiting. */
  earlierSteps: LessonStepRef[]
  /** Feedback only: the learner's (incorrect) answer. */
  learnerAnswer?: string
  /** Feedback only: the verified correct answer. */
  correctAnswer?: string
}

export interface LessonHelp {
  text: string
  /** An earlier step id to revisit (validated to exist), or null. */
  reviewStepId: string | null
}

export interface LessonHints {
  /** Exactly three escalating hints: nudge → method → revealed answer. */
  tiers: string[]
  /** An earlier step id to revisit (validated to exist), or null. */
  reviewStepId: string | null
}

const PERSONA =
  'You are Pip, a warm cat tutor inside a counting & probability app. Be concise ' +
  '(1-3 sentences), encouraging, and specific to THIS question. Never break character ' +
  'and never go off-topic.'

function conceptLabels(ids: string[]): string {
  return ids.map((c) => CONCEPT_LABELS[c] ?? c).join(', ') || '(general)'
}

function earlierStepsBlock(steps: LessonStepRef[]): string {
  if (!steps.length) return '(none — this is an early step)'
  return steps.map((s) => `  - id "${s.id}": ${s.title}`).join('\n')
}

function buildHintPrompt(ctx: LessonHelpContext): string {
  return [
    PERSONA,
    '',
    `Lesson: "${ctx.lessonTitle}"`,
    `Concepts: ${conceptLabels(ctx.concepts)}`,
    `Current question: "${ctx.questionText}"`,
    ctx.choices?.length ? `Choices: ${ctx.choices.join(' | ')}` : '',
    ctx.correctAnswer ? `The verified correct answer is: "${ctx.correctAnswer}".` : '',
    '',
    'Earlier steps in this lesson the learner can revisit to relearn an idea:',
    earlierStepsBlock(ctx.earlierSteps),
    '',
    'Task: Produce EXACTLY 3 escalating hints for THIS question, each one short:',
    '  1) a gentle conceptual nudge — no specifics, no numbers worked out;',
    '  2) a more concrete hint about how to set it up or which method to use;',
    '  3) REVEAL and briefly explain the answer. ' +
      (ctx.correctAnswer
        ? 'State the verified correct answer above exactly — do not invent a different value.'
        : 'State the final answer with a one-line why.'),
    'If revisiting one specific earlier step above would genuinely help, set reviewStepId ' +
      'to that exact step id; otherwise null.',
    'Return JSON: {"hints": [tier1, tier2, tier3], "reviewStepId": <an earlier step id or null>}.',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildFeedbackPrompt(ctx: LessonHelpContext): string {
  return [
    PERSONA,
    '',
    `Lesson: "${ctx.lessonTitle}"`,
    `Concepts: ${conceptLabels(ctx.concepts)}`,
    `Question: "${ctx.questionText}"`,
    ctx.choices?.length ? `Choices: ${ctx.choices.join(' | ')}` : '',
    `The learner answered: "${ctx.learnerAnswer ?? ''}" (incorrect).`,
    ctx.correctAnswer ? `The verified correct answer is: "${ctx.correctAnswer}".` : '',
    '',
    'Earlier steps in this lesson the learner can revisit to relearn an idea:',
    earlierStepsBlock(ctx.earlierSteps),
    '',
    'Task: In plain language tuned to THEIR specific answer, explain what likely went ' +
      'wrong and how to think about it correctly. Be kind and brief. If revisiting one ' +
      'specific earlier step above would help them relearn it, set reviewStepId to that ' +
      'exact step id; otherwise null.',
    'Return JSON: {"text": <feedback>, "reviewStepId": <an earlier step id or null>}.',
  ]
    .filter(Boolean)
    .join('\n')
}

// The model is schema-constrained, but validate anyway: only accept a reviewStepId
// that is actually one of the earlier steps we offered (never a forward/unknown id).
function normalize(raw: Partial<LessonHelp>, earlierSteps: LessonStepRef[]): LessonHelp {
  const reviewStepId =
    typeof raw.reviewStepId === 'string' && earlierSteps.some((s) => s.id === raw.reviewStepId)
      ? raw.reviewStepId
      : null
  return { text: (raw.text ?? '').trim(), reviewStepId }
}

export async function requestLessonHint(ctx: LessonHelpContext): Promise<LessonHints> {
  const raw = await callChallengeAi<{ hints?: unknown; reviewStepId?: unknown }>(
    'lesson_hints',
    buildHintPrompt(ctx),
  )
  const reviewStepId =
    typeof raw.reviewStepId === 'string' && ctx.earlierSteps.some((s) => s.id === raw.reviewStepId)
      ? raw.reviewStepId
      : null
  return { tiers: coerceHintTiers(raw.hints), reviewStepId }
}

export async function requestLessonFeedback(ctx: LessonHelpContext): Promise<LessonHelp> {
  const raw = await callChallengeAi<Partial<LessonHelp>>('lesson_feedback', buildFeedbackPrompt(ctx))
  return normalize(raw, ctx.earlierSteps)
}
