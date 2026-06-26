import { getLessonById } from '../../content/course'
import { loadOrCreateSeed, resolveLesson } from '../../content/randomize'
import type { LessonStep } from '../../content/types'
import { getLessonProgress } from '../progress/progressStore'
import type { ChallengeGroundingContext, ChallengeMistake } from './challengeTypes'

type StoredAnswer = string | number | object | undefined

/** Renders a learner's submitted answer as readable text for the AI. */
function describeAnswer(step: LessonStep, answer: StoredAnswer): string {
  if (answer === undefined || answer === null) return '(no answer)'
  // Multiple choice stores the chosen index; map it back to the choice label.
  if (
    step.type === 'multiple-choice' &&
    typeof answer === 'number' &&
    step.question?.choices?.[answer] !== undefined
  ) {
    return step.question.choices[answer]
  }
  if (typeof answer === 'object') return JSON.stringify(answer)
  return String(answer)
}

/** The verified correct answer text for a graded step (from resolved content). */
function describeCorrectAnswer(step: LessonStep): string {
  const q = step.question
  if (!q) return ''
  if (q.inputType === 'multiple-choice' && q.correctChoiceIndex !== undefined) {
    return q.choices?.[q.correctChoiceIndex] ?? ''
  }
  return q.correctAnswer !== undefined ? String(q.correctAnswer) : ''
}

/**
 * Builds the structured lesson state that grounds every AI call. Resolves the
 * lesson with the SAME seed the learner played (persisted on the progress doc)
 * so prompts/answers match exactly what they saw, and derives mistakes from
 * first-attempt-incorrect graded steps. Returns null if the lesson is unknown.
 */
export async function buildGroundingContext(
  uid: string,
  lessonId: string,
): Promise<ChallengeGroundingContext | null> {
  const rawLesson = getLessonById(lessonId)
  if (!rawLesson) return null

  const progress = await getLessonProgress(uid, lessonId)
  const seed = progress?.seed ?? loadOrCreateSeed(lessonId)
  const lesson = resolveLesson(rawLesson, seed)
  const stepById = new Map(lesson.steps.map((s) => [s.id, s]))

  const stepAnswers = progress?.stepAnswers ?? {}
  const completedSet = new Set<string>([
    ...(progress?.completedSteps ?? []),
    ...Object.keys(stepAnswers),
  ])
  const completedSteps = lesson.steps.filter((s) => completedSet.has(s.id)).map((s) => s.title)

  const mistakes: ChallengeMistake[] = []
  for (const [stepId, record] of Object.entries(stepAnswers)) {
    if (record.firstAttemptCorrect !== false) continue
    const step = stepById.get(stepId)
    if (!step) continue
    mistakes.push({
      stepId,
      prompt: step.prompt || step.body || step.title,
      userAnswer: describeAnswer(step, record.firstAttemptAnswer ?? record.answer),
      correctAnswer: describeCorrectAnswer(step),
      misconceptionTag: record.misconceptionTags?.[0],
    })
  }

  return {
    userId: uid,
    lessonId,
    lessonTitle: lesson.title,
    concepts: rawLesson.concepts ?? [],
    completedSteps,
    mistakes,
    masteryScoreBeforeChallenge: progress?.masteryScore ?? 0,
  }
}
