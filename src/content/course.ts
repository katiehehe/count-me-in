import type { Course } from './types'
import { countingPrincipleLesson } from './countingPrincipleLesson'
import { arrangingDistinctObjectsLesson } from './arrangingDistinctObjectsLesson'
import { identicalObjectsLesson } from './identicalObjectsLesson'
import { combinationsVsPermutationsLesson } from './combinationsVsPermutationsLesson'
import { independentEventsLesson } from './independentEventsLesson'
import { probabilityDistributionsLesson } from './probabilityDistributionsLesson'
import { expectedValueLesson } from './expectedValueLesson'

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
    independentEventsLesson,
    probabilityDistributionsLesson,
    expectedValueLesson,
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
