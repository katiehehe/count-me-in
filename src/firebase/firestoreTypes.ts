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
  /** Local date (YYYY-MM-DD) the learner last completed a weekly review. */
  lastWeeklyReviewAt?: string
  /** Lesson ids flagged as weak in the last completed review (the persisted summary). */
  weeklyReviewWeakLessons?: string[]
  /** Per-concept spaced-repetition schedules, keyed by concept id. */
  conceptSrs?: Record<string, ConceptSrsState>
  /** Cumulative cross-lesson practice tallies per concept (drives weak-spot targeting). */
  conceptStats?: Record<string, { correct: number; wrong: number }>
}

/**
 * SM-2-lite spaced-repetition schedule for a single concept. `due` is the local
 * calendar date (YYYY-MM-DD) the concept next needs review; a correct answer
 * pushes it further out, a miss brings it back to tomorrow.
 */
export interface ConceptSrsState {
  reps: number
  intervalDays: number
  ease: number
  due: string
  lapses: number
  lastReviewed: string
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
