import { getLessonById } from '../../content/course'
import { MASTERY_GREEN_THRESHOLD, countGradedSteps } from '../progress/mastery'
import { awardCompanionXp, bumpMasteryFromPractice, getLessonProgress } from '../progress/progressStore'
import { xpForLevel } from './practiceEngine'

/**
 * Records a correct practice / review answer for a lesson. The lesson's mastery is
 * nudged up ONLY while it isn't yet mastered (mastery < green). Companion XP is
 * awarded only when `awardXp` is true — i.e. a clean first-try solve — so a
 * fumbled-then-correct answer still lifts mastery but earns no XP.
 *
 * `gateByMastery` (default true) stops payouts once the whole LESSON is mastered —
 * right for per-lesson practice. The cross-lesson weak-spot workout passes false:
 * it targets weak CONCEPTS, which can live inside an otherwise-mastered lesson, so
 * clearing them should still earn XP. That can't be farmed — a concept leaves the
 * workout the moment its weakness reaches 0. `bonusXp` (default 0) is a speed bonus
 * added ON TOP of the base XP, only when XP is actually awarded — a wrong or gated
 * answer earns 0 and so never reduces anyone's bonus. Returns the total XP awarded.
 */
export async function recordPracticeCorrect(
  uid: string,
  lessonId: string,
  level: number,
  awardXp = true,
  gateByMastery = true,
  bonusXp = 0,
): Promise<number> {
  const progress = await getLessonProgress(uid, lessonId)
  const before = progress?.masteryScore ?? 0
  const mastered = before >= MASTERY_GREEN_THRESHOLD
  if (gateByMastery && mastered) return 0

  if (!mastered) {
    const lesson = getLessonById(lessonId)
    await bumpMasteryFromPractice(uid, lessonId, lesson ? countGradedSteps(lesson.steps) : undefined)
  }
  if (!awardXp) return 0
  const xp = xpForLevel(level) + Math.max(0, bonusXp)
  await awardCompanionXp(uid, xp)
  return xp
}
