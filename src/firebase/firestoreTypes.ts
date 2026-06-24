import type { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  displayName: string
  email?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  streakCount: number
  lastActiveDate: string
}

export interface StepAnswerRecord {
  answer: string | number | object
  correct: boolean
  /** Whether the learner's FIRST attempt at this step was correct (drives mastery). */
  firstAttemptCorrect?: boolean
  /** The value the learner submitted on their FIRST attempt (for the review screen). */
  firstAttemptAnswer?: string | number | object
  attempts: number
  misconceptionTags: string[]
  answeredAt: Timestamp
}

export interface LessonProgressDoc {
  lessonId: string
  currentStepIndex: number
  completed: boolean
  completedAt?: Timestamp
  startedAt: Timestamp
  updatedAt: Timestamp
  stepAnswers: Record<string, StepAnswerRecord>
  masteryScore: number
  /** Graded questions answered correctly on the first try (for "x of y" display). */
  gradedCorrect?: number
  /** Total graded questions in the lesson at the time of completion. */
  gradedTotal?: number
  /** Step ids the learner has starred to revisit; cleared on restart. */
  starredSteps?: string[]
  conceptMastery: Record<string, number>
}

export interface DailyActivityDoc {
  date: string
  lessonsCompleted: number
  questionsAnswered: number
  correctAnswers: number
  activeMinutesEstimate: number
}
