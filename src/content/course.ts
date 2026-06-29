/**
 * The course: the flat, ordered list of lessons (order = unlock order).
 *
 * Adding a lesson:
 *  1. Create the lesson module in `src/content/`, then import + add it to
 *     `course.lessons` below.
 *  2. Add it to a unit in `curriculum.ts` so it shows on the course page.
 *
 * The Phase 2 AI features apply automatically — there is NO per-lesson wiring:
 *  - In-lesson "Ask Pip" hints + "Why was that wrong?" feedback + relearn
 *    pointers render for every graded step (multiple-choice / numeric / fraction)
 *    through the shared `StepRenderer` → `StepHelp`.
 *  - Challenge Mode runs after completion for every lesson (`LessonRenderer`
 *    routes to `/challenge/:lessonId`), grounded in the lesson's concepts and the
 *    learner's recorded mistakes.
 *
 * The only thing a brand-NEW concept id needs (enforced by `content.test.ts`):
 *  - a label in `CONCEPT_LABELS` (`types.ts`), and
 *  - a transfer generator in `features/challenge/transferQuestions.ts` so the
 *    challenge's review question is code-checked (without one it gracefully falls
 *    back to an "explain it back" question).
 */
import type { Course } from './types'
import { countingPrincipleLesson } from './countingPrincipleLesson'
import { arrangingDistinctObjectsLesson } from './arrangingDistinctObjectsLesson'
import { identicalObjectsLesson } from './identicalObjectsLesson'
import { combinationsVsPermutationsLesson } from './combinationsVsPermutationsLesson'
import { starsAndBarsLesson } from './starsAndBarsLesson'
import { independentEventsLesson } from './independentEventsLesson'
import { dependentEventsLesson } from './dependentEventsLesson'
import { conditionalProbabilityLesson } from './conditionalProbabilityLesson'
import { complementRuleLesson } from './complementRuleLesson'
import { additionRuleLesson } from './additionRuleLesson'
import { binomialTheoremLesson } from './binomialTheoremLesson'
import { inclusionExclusionLesson } from './inclusionExclusionLesson'
import { probabilityDistributionsLesson } from './probabilityDistributionsLesson'
import { expectedValueLesson } from './expectedValueLesson'
import { linearityOfExpectationLesson } from './linearityOfExpectationLesson'
import { indicatorVariablesLesson } from './indicatorVariablesLesson'
import { puttingItTogetherLesson } from './puttingItTogetherLesson'
import { contestProblemsLesson } from './contestProblemsLesson'
import { applicationsLesson } from './applicationsLesson'
import { expectedValueApplicationsLesson } from './expectedValueApplicationsLesson'

export const course: Course = {
  id: 'contest-counting',
  title: 'Contest Counting & Probability',
  subject: 'Counting and probability for contests and competitions',
  description:
    'Learn contest math through interactive puzzles — permutations, combinations, and probability intuition built by doing.',
  lessons: [
    countingPrincipleLesson,
    arrangingDistinctObjectsLesson,
    identicalObjectsLesson,
    combinationsVsPermutationsLesson,
    starsAndBarsLesson,
    independentEventsLesson,
    dependentEventsLesson,
    conditionalProbabilityLesson,
    complementRuleLesson,
    additionRuleLesson,
    binomialTheoremLesson,
    inclusionExclusionLesson,
    probabilityDistributionsLesson,
    expectedValueLesson,
    linearityOfExpectationLesson,
    indicatorVariablesLesson,
    puttingItTogetherLesson,
    contestProblemsLesson,
    applicationsLesson,
    expectedValueApplicationsLesson,
  ],
}

export function getLessonById(lessonId: string) {
  return course.lessons.find((l) => l.id === lessonId)
}

export function getLessonIndex(lessonId: string) {
  return course.lessons.findIndex((l) => l.id === lessonId)
}

export function getNextLesson(lessonId: string) {
  const index = getLessonIndex(lessonId)
  if (index === -1 || index >= course.lessons.length - 1) return null
  return course.lessons[index + 1]
}
