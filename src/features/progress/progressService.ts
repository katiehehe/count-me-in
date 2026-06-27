import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { getFirestoreDb } from '../../firebase/firebaseClient'
import type { DailyActivityDoc, LessonProgressDoc, UserProfile } from '../../firebase/firestoreTypes'
import { initialSrsState, scheduleNext } from '../practice/conceptSrs'
import { todayDateString, updateStreak } from './streaks'

function userRef(uid: string) {
  return doc(getFirestoreDb(), 'users', uid)
}

function lessonProgressRef(uid: string, lessonId: string) {
  return doc(getFirestoreDb(), 'users', uid, 'lessonProgress', lessonId)
}

function dailyActivityRef(uid: string, date: string) {
  return doc(getFirestoreDb(), 'users', uid, 'dailyActivity', date)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function ensureUserProfile(
  uid: string,
  displayName: string,
  email?: string,
): Promise<UserProfile> {
  const existing = await getUserProfile(uid)
  if (existing) return existing

  const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>
    updatedAt: ReturnType<typeof serverTimestamp>
  } = {
    uid,
    displayName,
    email,
    streakCount: 0,
    lastActiveDate: '',
    companionXp: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(userRef(uid), profile)
  const created = await getUserProfile(uid)
  return created!
}

export async function updateDisplayName(uid: string, displayName: string) {
  await updateDoc(userRef(uid), { displayName, updatedAt: serverTimestamp() })
}

/** Atomically adds companion XP (from AI Challenge Mode) to the user profile. */
export async function awardCompanionXp(uid: string, amount: number) {
  if (amount <= 0) return
  await setDoc(
    userRef(uid),
    { companionXp: increment(amount), updatedAt: serverTimestamp() },
    { merge: true },
  )
}

/** Marks the weekly review complete today (resets the 7-day cadence) and persists its weak lessons. */
export async function markWeeklyReviewDone(uid: string, weakLessonIds: string[]) {
  await setDoc(
    userRef(uid),
    {
      lastWeeklyReviewAt: todayDateString(),
      weeklyReviewWeakLessons: weakLessonIds,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/**
 * Records a spaced-repetition review for one concept, advancing its schedule
 * (correct → pushed further out; incorrect → back tomorrow). Read-modify-write is
 * atomic so concurrent reviews can't clobber each other's schedules.
 */
export async function recordConceptReview(uid: string, conceptId: string, correct: boolean) {
  const ref = userRef(uid)
  const today = todayDateString()
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    const profile = snap.exists() ? (snap.data() as UserProfile) : null
    const prev = profile?.conceptSrs?.[conceptId] ?? initialSrsState(today)
    const next = scheduleNext(prev, correct, today)
    const conceptSrs = { ...(profile?.conceptSrs ?? {}), [conceptId]: next }
    tx.set(ref, { conceptSrs, updatedAt: serverTimestamp() }, { merge: true })
  })
}

/**
 * Tallies one practice first-attempt for a concept toward the cross-lesson weak-spot
 * model. Atomic so concurrent practice answers can't clobber each other's counts.
 */
export async function recordConceptPractice(uid: string, conceptId: string, correct: boolean) {
  const ref = userRef(uid)
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    const profile = snap.exists() ? (snap.data() as UserProfile) : null
    const prev = profile?.conceptStats?.[conceptId] ?? { correct: 0, wrong: 0 }
    const next = correct
      ? { correct: prev.correct + 1, wrong: prev.wrong }
      : { correct: prev.correct, wrong: prev.wrong + 1 }
    const conceptStats = { ...(profile?.conceptStats ?? {}), [conceptId]: next }
    tx.set(ref, { conceptStats, updatedAt: serverTimestamp() }, { merge: true })
  })
}

/**
 * Schedules first reviews for newly-learned concepts (due tomorrow). Concepts that
 * already have a schedule are left untouched, so re-completing a lesson never resets
 * their spacing.
 */
export async function seedConceptSrs(uid: string, conceptIds: string[]) {
  if (!conceptIds.length) return
  const ref = userRef(uid)
  const today = todayDateString()
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    const profile = snap.exists() ? (snap.data() as UserProfile) : null
    const conceptSrs = { ...(profile?.conceptSrs ?? {}) }
    let added = false
    for (const id of conceptIds) {
      if (!conceptSrs[id]) {
        conceptSrs[id] = initialSrsState(today)
        added = true
      }
    }
    if (!added) return
    tx.set(ref, { conceptSrs, updatedAt: serverTimestamp() }, { merge: true })
  })
}

/** How much a single correct Practice Mode answer nudges mastery upward. */
export const PRACTICE_MASTERY_STEP = 0.08

/**
 * Raises a lesson's mastery score after a correct Practice answer. Mastery only
 * ever goes UP (never down) and is capped at 1. `gradedCorrect`/`gradedTotal`
 * are kept consistent with the new score so the course card's ring matches the
 * tier. No-op if there's no progress doc yet.
 */
export async function bumpMasteryFromPractice(uid: string, lessonId: string, gradedTotal?: number) {
  const existing = await getLessonProgress(uid, lessonId)
  if (!existing) return
  const current = existing.masteryScore ?? 0
  const next = Math.min(1, current + PRACTICE_MASTERY_STEP)
  if (next <= current) return
  const total = gradedTotal || existing.gradedTotal || 0
  await saveLessonProgress(uid, {
    lessonId,
    masteryScore: next,
    ...(total ? { gradedCorrect: Math.round(next * total), gradedTotal: total } : {}),
  })
}

/** How much a missed review answer lowers a lesson's mastery (mastery is never permanent). */
export const REVIEW_MASTERY_PENALTY = 0.1

/**
 * Lowers a lesson's mastery after a missed review answer, clamped at 0. A forgotten
 * lesson can fall back below the mastery threshold this way. `completed` is left
 * untouched (the lesson stays unlocked) and gradedCorrect/gradedTotal are preserved —
 * only masteryScore moves. Atomic so it can't race the review's other writes.
 */
export async function lowerMasteryFromReview(uid: string, lessonId: string, gradedTotal?: number) {
  void gradedTotal
  const ref = lessonProgressRef(uid, lessonId)
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const existing = snap.data() as LessonProgressDoc
    const current = existing.masteryScore ?? 0
    const next = Math.max(0, current - REVIEW_MASTERY_PENALTY)
    if (next === current) return
    tx.update(ref, { masteryScore: next, updatedAt: serverTimestamp() })
  })
}

export async function getAllLessonProgress(uid: string): Promise<LessonProgressDoc[]> {
  const snap = await getDocs(collection(getFirestoreDb(), 'users', uid, 'lessonProgress'))
  return snap.docs.map((d) => d.data() as LessonProgressDoc)
}

export async function getLessonProgress(
  uid: string,
  lessonId: string,
): Promise<LessonProgressDoc | null> {
  const snap = await getDoc(lessonProgressRef(uid, lessonId))
  return snap.exists() ? (snap.data() as LessonProgressDoc) : null
}

export async function saveLessonProgress(
  uid: string,
  progress: Partial<LessonProgressDoc> & { lessonId: string },
) {
  const ref = lessonProgressRef(uid, progress.lessonId)
  const existing = await getDoc(ref)
  const now = serverTimestamp()

  if (!existing.exists()) {
    await setDoc(ref, {
      currentStepIndex: progress.currentStepIndex ?? 0,
      completed: progress.completed ?? false,
      startedAt: now,
      updatedAt: now,
      stepAnswers: progress.stepAnswers ?? {},
      masteryScore: progress.masteryScore ?? 0,
      conceptMastery: progress.conceptMastery ?? {},
      ...progress,
      lessonId: progress.lessonId,
    })
  } else {
    await updateDoc(ref, { ...progress, updatedAt: now })
  }
}

export async function recordStepAnswer(
  uid: string,
  lessonId: string,
  stepId: string,
  answer: string | number | object,
  correct: boolean,
  misconceptionTags: string[] = [],
) {
  // Run the read-modify-write atomically so a fast "wrong then correct" sequence
  // can't race: whichever attempt commits first locks in firstAttemptCorrect /
  // firstAttemptAnswer, and the second attempt reads it back instead of clobbering.
  const ref = lessonProgressRef(uid, lessonId)
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    const existing = snap.exists() ? (snap.data() as LessonProgressDoc) : null
    const prev = existing?.stepAnswers?.[stepId]
    const attempts = (prev?.attempts ?? 0) + 1
    const firstAttemptCorrect = prev?.firstAttemptCorrect ?? correct
    const firstAttemptAnswer = prev?.firstAttemptAnswer ?? answer

    const stepAnswers = {
      ...(existing?.stepAnswers ?? {}),
      [stepId]: {
        answer,
        correct,
        firstAttemptCorrect,
        firstAttemptAnswer,
        attempts,
        misconceptionTags,
        answeredAt: Timestamp.now(),
      },
    }

    const now = serverTimestamp()
    if (!snap.exists()) {
      tx.set(ref, {
        lessonId,
        currentStepIndex: 0,
        completed: false,
        startedAt: now,
        updatedAt: now,
        stepAnswers,
        masteryScore: 0,
        conceptMastery: {},
      })
    } else {
      tx.update(ref, { stepAnswers, updatedAt: now })
    }
  })
}

export async function toggleStepStar(
  uid: string,
  lessonId: string,
  stepId: string,
  starred: boolean,
): Promise<string[]> {
  const existing = await getLessonProgress(uid, lessonId)
  const current = new Set(existing?.starredSteps ?? [])
  if (starred) current.add(stepId)
  else current.delete(stepId)
  const starredSteps = Array.from(current)
  await saveLessonProgress(uid, { lessonId, starredSteps })
  return starredSteps
}

export async function restartLesson(uid: string, lessonId: string, seed?: number) {
  await saveLessonProgress(uid, {
    lessonId,
    currentStepIndex: 0,
    stepAnswers: {},
    starredSteps: [],
    completedSteps: [],
    // Persist the reshuffled seed so the fresh play-through is reproducible on
    // any device, not just the browser that pressed Restart.
    ...(seed !== undefined ? { seed } : {}),
  })
}

/**
 * Marks a non-graded interactive step as completed. Uses arrayUnion + merge so
 * it is idempotent, never clobbers other fields, and works even before the
 * progress doc exists.
 */
export async function markStepComplete(uid: string, lessonId: string, stepId: string) {
  await setDoc(
    lessonProgressRef(uid, lessonId),
    { lessonId, completedSteps: arrayUnion(stepId), updatedAt: serverTimestamp() },
    { merge: true },
  )
}

export async function advanceStep(uid: string, lessonId: string, stepIndex: number) {
  // Only move the step pointer. This runs concurrently with the atomic
  // recordStepAnswer transaction (both are queued in LessonRenderer's
  // pendingWrites), so it must NEVER echo back stepAnswers / masteryScore /
  // conceptMastery from a non-atomic read — doing so can overwrite an answer
  // that committed in between this read and write. updateDoc merges at the
  // field level, leaving every other field (including stepAnswers) untouched.
  await saveLessonProgress(uid, {
    lessonId,
    currentStepIndex: stepIndex,
  })
}

export async function completeLesson(
  uid: string,
  lessonId: string,
  masteryScore: number,
  conceptMastery: Record<string, number>,
  gradedCorrect?: number,
  gradedTotal?: number,
) {
  const existing = await getLessonProgress(uid, lessonId)
  const alreadyCompleted = existing?.completed ?? false

  // Replaying a finished lesson must never lower a previously earned score.
  const keepNew = masteryScore >= (existing?.masteryScore ?? 0)
  const bestMasteryScore = keepNew ? masteryScore : existing!.masteryScore
  // Keep gradedCorrect and gradedTotal PAIRED from the same (kept) run so the
  // stored "x of y" can never become inconsistent (e.g. correct > total).
  const bestGradedCorrect = keepNew ? gradedCorrect ?? existing?.gradedCorrect : existing?.gradedCorrect
  const bestGradedTotal = keepNew ? gradedTotal ?? existing?.gradedTotal : existing?.gradedTotal
  const bestConceptMastery = mergeBestConceptMastery(
    existing?.conceptMastery ?? {},
    conceptMastery,
  )

  await saveLessonProgress(uid, {
    lessonId,
    currentStepIndex: existing?.currentStepIndex ?? 0,
    completed: true,
    completedAt: existing?.completedAt ?? Timestamp.now(),
    stepAnswers: existing?.stepAnswers ?? {},
    masteryScore: bestMasteryScore,
    gradedCorrect: bestGradedCorrect ?? 0,
    gradedTotal: bestGradedTotal ?? 0,
    conceptMastery: bestConceptMastery,
  })

  // Only count the lesson toward streak/daily activity on the first completion.
  if (!alreadyCompleted) {
    await recordDailyActivity(uid, { lessonCompleted: true })
    await updateUserStreak(uid)
  }
}

function mergeBestConceptMastery(
  existing: Record<string, number>,
  incoming: Record<string, number>,
): Record<string, number> {
  const merged = { ...existing }
  for (const [id, score] of Object.entries(incoming)) {
    merged[id] = Math.max(merged[id] ?? 0, score)
  }
  return merged
}

async function updateUserStreak(uid: string) {
  const profile = await getUserProfile(uid)
  if (!profile) return

  const today = todayDateString()
  const { streakCount, lastActiveDate } = updateStreak(
    profile.streakCount,
    profile.lastActiveDate || null,
    today,
  )

  await updateDoc(userRef(uid), {
    streakCount,
    lastActiveDate,
    updatedAt: serverTimestamp(),
  })
}

async function recordDailyActivity(
  uid: string,
  opts: { lessonCompleted?: boolean; answered?: boolean; correct?: boolean },
) {
  const today = todayDateString()
  const ref = dailyActivityRef(uid, today)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const doc: DailyActivityDoc = {
      date: today,
      lessonsCompleted: opts.lessonCompleted ? 1 : 0,
      questionsAnswered: opts.answered ? 1 : 0,
      correctAnswers: opts.correct ? 1 : 0,
      activeMinutesEstimate: 1,
    }
    await setDoc(ref, doc)
    return
  }

  const current = snap.data() as DailyActivityDoc
  await updateDoc(ref, {
    lessonsCompleted: current.lessonsCompleted + (opts.lessonCompleted ? 1 : 0),
    questionsAnswered: current.questionsAnswered + (opts.answered ? 1 : 0),
    correctAnswers: current.correctAnswers + (opts.correct ? 1 : 0),
    activeMinutesEstimate: current.activeMinutesEstimate + 1,
  })
}

/**
 * Records a genuine learning event (the learner answered a question) toward the
 * daily activity counters and streak. Call this on a real interaction, never on
 * merely opening a lesson — opening shouldn't inflate a "did work today" signal.
 * `updateUserStreak` is idempotent per day, so calling this on each answer is safe.
 */
export async function recordLearningActivity(uid: string, correct: boolean) {
  await recordDailyActivity(uid, { answered: true, correct })
  await updateUserStreak(uid)
}
