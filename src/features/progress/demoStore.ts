import { Timestamp } from 'firebase/firestore'
import type { LessonProgressDoc, UserProfile } from '../../firebase/firestoreTypes'
import { todayDateString, updateStreak } from './streaks'

/**
 * A zero-write, in-memory progress store used for anonymous "demo" sessions.
 *
 * It mirrors the {@link progressService} API exactly but never touches Firestore.
 * State lives only in module memory for the lifetime of the tab, so a guest can
 * play through and unlock lessons within a session, yet nothing is ever
 * persisted — a reload starts completely fresh. This keeps demo traffic from
 * writing throwaway documents to the database.
 */

const profiles = new Map<string, UserProfile>()
const lessonsByUser = new Map<string, Map<string, LessonProgressDoc>>()

function lessonsFor(uid: string): Map<string, LessonProgressDoc> {
  let m = lessonsByUser.get(uid)
  if (!m) {
    m = new Map()
    lessonsByUser.set(uid, m)
  }
  return m
}

/** Wipe a demo user's in-memory state (used on sign-out). */
export function clearDemoUser(uid: string) {
  profiles.delete(uid)
  lessonsByUser.delete(uid)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return profiles.get(uid) ?? null
}

export async function ensureUserProfile(
  uid: string,
  displayName: string,
  email?: string,
): Promise<UserProfile> {
  const existing = profiles.get(uid)
  if (existing) return existing
  const now = Timestamp.now()
  const profile: UserProfile = {
    uid,
    displayName,
    email,
    streakCount: 0,
    lastActiveDate: '',
    companionXp: 0,
    createdAt: now,
    updatedAt: now,
  }
  profiles.set(uid, profile)
  return profile
}

export async function awardCompanionXp(uid: string, amount: number) {
  if (amount <= 0) return
  const profile = profiles.get(uid)
  if (!profile) return
  profile.companionXp = (profile.companionXp ?? 0) + amount
  profile.updatedAt = Timestamp.now()
}

export async function updateDisplayName(uid: string, displayName: string) {
  const profile = profiles.get(uid)
  if (profile) {
    profile.displayName = displayName
    profile.updatedAt = Timestamp.now()
  }
}

export async function getAllLessonProgress(uid: string): Promise<LessonProgressDoc[]> {
  return Array.from(lessonsFor(uid).values())
}

export async function getLessonProgress(
  uid: string,
  lessonId: string,
): Promise<LessonProgressDoc | null> {
  return lessonsFor(uid).get(lessonId) ?? null
}

export async function saveLessonProgress(
  uid: string,
  progress: Partial<LessonProgressDoc> & { lessonId: string },
) {
  const map = lessonsFor(uid)
  const existing = map.get(progress.lessonId)
  const now = Timestamp.now()
  if (!existing) {
    map.set(progress.lessonId, {
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
    map.set(progress.lessonId, { ...existing, ...progress, updatedAt: now })
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
  const map = lessonsFor(uid)
  const existing = map.get(lessonId) ?? null
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

  const now = Timestamp.now()
  if (!existing) {
    map.set(lessonId, {
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
    map.set(lessonId, { ...existing, stepAnswers, updatedAt: now })
  }
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
    ...(seed !== undefined ? { seed } : {}),
  })
}

export async function markStepComplete(uid: string, lessonId: string, stepId: string) {
  const map = lessonsFor(uid)
  const existing = map.get(lessonId)
  const completedSteps = Array.from(new Set([...(existing?.completedSteps ?? []), stepId]))
  await saveLessonProgress(uid, { lessonId, completedSteps })
}

export async function advanceStep(uid: string, lessonId: string, stepIndex: number) {
  await saveLessonProgress(uid, { lessonId, currentStepIndex: stepIndex })
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

  const keepNew = masteryScore >= (existing?.masteryScore ?? 0)
  const bestMasteryScore = keepNew ? masteryScore : existing!.masteryScore
  const bestGradedCorrect = keepNew ? gradedCorrect ?? existing?.gradedCorrect : existing?.gradedCorrect
  const bestGradedTotal = gradedTotal ?? existing?.gradedTotal
  const bestConceptMastery = { ...(existing?.conceptMastery ?? {}) }
  for (const [id, score] of Object.entries(conceptMastery)) {
    bestConceptMastery[id] = Math.max(bestConceptMastery[id] ?? 0, score)
  }

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

  if (!alreadyCompleted) bumpStreak(uid)
}

export async function recordLearningActivity(uid: string, _correct: boolean) {
  void _correct
  bumpStreak(uid)
}

function bumpStreak(uid: string) {
  const profile = profiles.get(uid)
  if (!profile) return
  const today = todayDateString()
  const { streakCount, lastActiveDate } = updateStreak(
    profile.streakCount,
    profile.lastActiveDate || null,
    today,
  )
  profile.streakCount = streakCount
  profile.lastActiveDate = lastActiveDate
  profile.updatedAt = Timestamp.now()
}
