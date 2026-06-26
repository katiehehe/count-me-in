import type { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  displayName: string
  email?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  streakCount: number
  lastActiveDate: string
  /** Companion XP earned in AI Challenge Mode (reflection points). */
  companionXp?: number
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
  /**
   * The randomization seed this play-through was generated with. Persisted so a
   * learner who resumes on another device/browser sees the SAME numbers they
   * answered (localStorage alone can't survive a device switch or cleared cache).
   */
  seed?: number
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
  /**
   * Ids of non-graded interactive steps (drag/connect/tree/sim/…) the learner
   * has completed. Graded steps live in `stepAnswers`; this captures the rest so
   * resume / backward navigation doesn't force a redo. Cleared on restart.
   */
  completedSteps?: string[]
  conceptMastery: Record<string, number>
}

export interface DailyActivityDoc {
  date: string
  lessonsCompleted: number
  questionsAnswered: number
  correctAnswers: number
  activeMinutesEstimate: number
}
