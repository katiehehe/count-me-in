import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { getFirestoreDb } from '../../firebase/firebaseClient'
import type { DailyActivityDoc, LessonProgressDoc, UserProfile } from '../../firebase/firestoreTypes'
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

export async function restartLesson(uid: string, lessonId: string) {
  await saveLessonProgress(uid, {
    lessonId,
    currentStepIndex: 0,
    stepAnswers: {},
    starredSteps: [],
  })
}

export async function advanceStep(uid: string, lessonId: string, stepIndex: number) {
  const existing = await getLessonProgress(uid, lessonId)
  await saveLessonProgress(uid, {
    lessonId,
    currentStepIndex: stepIndex,
    completed: existing?.completed ?? false,
    stepAnswers: existing?.stepAnswers ?? {},
    masteryScore: existing?.masteryScore ?? 0,
    conceptMastery: existing?.conceptMastery ?? {},
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
  const bestGradedCorrect = keepNew ? gradedCorrect ?? existing?.gradedCorrect : existing?.gradedCorrect
  const bestGradedTotal = gradedTotal ?? existing?.gradedTotal
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

export async function touchActivity(uid: string) {
  await recordDailyActivity(uid, {})
  await updateUserStreak(uid)
}
