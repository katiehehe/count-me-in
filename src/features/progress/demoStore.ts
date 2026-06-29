import { Timestamp } from 'firebase/firestore'
import type { LessonProgressDoc, UserProfile } from '../../firebase/firestoreTypes'
import { initialSrsState, scheduleNext } from '../practice/conceptSrs'
import { nextStreakFields, todayDateString } from './streaks'
import {
  canAfford,
  computeBuyAiPip,
  computeSetCustomPip,
  cosmeticById,
  isCosmeticOwned,
  STREAK_FREEZE_COST,
} from './xpWallet'

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
    spentXp: 0,
    xpToday: 0,
    xpTodayDate: '',
    streakFreezeTokens: 0,
    unlockedCosmetics: [],
    equippedCosmetic: null,
    customPipUrl: null,
    customPipPrompt: null,
    customPipGensLeft: 0,
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
  const today = todayDateString()
  profile.companionXp = (profile.companionXp ?? 0) + amount
  profile.xpToday = (profile.xpTodayDate === today ? profile.xpToday ?? 0 : 0) + amount
  profile.xpTodayDate = today
  profile.updatedAt = Timestamp.now()
}

export async function buyStreakFreezeToken(uid: string): Promise<boolean> {
  const profile = profiles.get(uid)
  if (!profile) return false
  if (!canAfford(profile, STREAK_FREEZE_COST)) return false
  profile.spentXp = (profile.spentXp ?? 0) + STREAK_FREEZE_COST
  profile.streakFreezeTokens = (profile.streakFreezeTokens ?? 0) + 1
  profile.updatedAt = Timestamp.now()
  return true
}

export async function purchaseCosmetic(uid: string, cosmeticId: string): Promise<boolean> {
  const cosmetic = cosmeticById(cosmeticId)
  if (!cosmetic || cosmetic.cost <= 0) return false
  const profile = profiles.get(uid)
  if (!profile) return false
  if (isCosmeticOwned(profile, cosmeticId)) return false
  if (!canAfford(profile, cosmetic.cost)) return false
  profile.spentXp = (profile.spentXp ?? 0) + cosmetic.cost
  profile.unlockedCosmetics = [...(profile.unlockedCosmetics ?? []), cosmeticId]
  profile.updatedAt = Timestamp.now()
  return true
}

export async function equipCosmetic(uid: string, cosmeticId: string | null): Promise<boolean> {
  const profile = profiles.get(uid)
  if (!profile) return false
  if (cosmeticId && !isCosmeticOwned(profile, cosmeticId)) return false
  profile.equippedCosmetic = cosmeticId
  profile.updatedAt = Timestamp.now()
  return true
}

export async function buyAiPip(uid: string): Promise<boolean> {
  const profile = profiles.get(uid)
  if (!profile) return false
  const r = computeBuyAiPip(profile)
  if (!r) return false
  profile.spentXp = r.spentXp
  profile.unlockedCosmetics = r.unlockedCosmetics
  profile.customPipGensLeft = r.customPipGensLeft
  profile.updatedAt = Timestamp.now()
  return true
}

export async function setCustomPip(uid: string, url: string, prompt: string): Promise<boolean> {
  const profile = profiles.get(uid)
  if (!profile) return false
  const r = computeSetCustomPip(profile, url, prompt)
  if (!r) return false
  profile.customPipUrl = r.customPipUrl
  profile.customPipPrompt = r.customPipPrompt
  profile.customPipGensLeft = r.customPipGensLeft
  profile.equippedCosmetic = r.equippedCosmetic
  profile.updatedAt = Timestamp.now()
  return true
}

export async function markWeeklyReviewDone(uid: string, weakLessonIds: string[]) {
  const profile = profiles.get(uid)
  if (!profile) return
  profile.lastWeeklyReviewAt = todayDateString()
  profile.weeklyReviewWeakLessons = weakLessonIds
  profile.updatedAt = Timestamp.now()
}

export async function recordConceptReview(uid: string, conceptId: string, correct: boolean) {
  const profile = profiles.get(uid)
  if (!profile) return
  const today = todayDateString()
  const conceptSrs = profile.conceptSrs ?? {}
  const prev = conceptSrs[conceptId] ?? initialSrsState(today)
  conceptSrs[conceptId] = scheduleNext(prev, correct, today)
  profile.conceptSrs = conceptSrs
  profile.updatedAt = Timestamp.now()
  bumpStreak(uid)
}

export async function seedConceptSrs(uid: string, conceptIds: string[]) {
  const profile = profiles.get(uid)
  if (!profile) return
  const today = todayDateString()
  const conceptSrs = profile.conceptSrs ?? {}
  for (const id of conceptIds) {
    if (!conceptSrs[id]) conceptSrs[id] = initialSrsState(today)
  }
  profile.conceptSrs = conceptSrs
  profile.updatedAt = Timestamp.now()
}

export async function recordConceptPractice(uid: string, conceptId: string, correct: boolean) {
  const profile = profiles.get(uid)
  if (!profile) return
  const conceptStats = profile.conceptStats ?? {}
  const prev = conceptStats[conceptId] ?? { correct: 0, wrong: 0 }
  conceptStats[conceptId] = correct
    ? { correct: prev.correct + 1, wrong: prev.wrong }
    : { correct: prev.correct, wrong: prev.wrong + 1 }
  profile.conceptStats = conceptStats
  profile.updatedAt = Timestamp.now()
  bumpStreak(uid)
}

const PRACTICE_MASTERY_STEP = 0.08

export async function bumpMasteryFromPractice(uid: string, lessonId: string, gradedTotal?: number) {
  const existing = lessonsFor(uid).get(lessonId)
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

const REVIEW_MASTERY_PENALTY = 0.1

export async function lowerMasteryFromReview(uid: string, lessonId: string, gradedTotal?: number) {
  void gradedTotal
  const existing = lessonsFor(uid).get(lessonId)
  if (!existing) return
  const current = existing.masteryScore ?? 0
  const next = Math.max(0, current - REVIEW_MASTERY_PENALTY)
  if (next === current) return
  await saveLessonProgress(uid, { lessonId, masteryScore: next })
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
  // Keep gradedCorrect and gradedTotal paired from the same (kept) run.
  const bestGradedCorrect = keepNew ? gradedCorrect ?? existing?.gradedCorrect : existing?.gradedCorrect
  const bestGradedTotal = keepNew ? gradedTotal ?? existing?.gradedTotal : existing?.gradedTotal
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
  const fields = nextStreakFields(
    profile.streakCount ?? 0,
    profile.lastActiveDate || null,
    profile.streakFreezeTokens ?? 0,
    today,
  )
  profile.streakCount = fields.streakCount
  profile.lastActiveDate = fields.lastActiveDate
  if (fields.streakFreezeTokens !== undefined) profile.streakFreezeTokens = fields.streakFreezeTokens
  if (fields.lastStreakFreezeDate !== undefined) {
    profile.lastStreakFreezeDate = fields.lastStreakFreezeDate
  }
  profile.updatedAt = Timestamp.now()
}
