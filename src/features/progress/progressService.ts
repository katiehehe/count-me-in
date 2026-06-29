import {
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFirestoreDb } from '../../firebase/firebaseClient'
import type {
  DailyActivityDoc,
  LeaderboardEntry,
  LessonProgressDoc,
  UserProfile,
} from '../../firebase/firestoreTypes'
import { initialSrsState, scheduleNext } from '../practice/conceptSrs'
import { nextStreakFields, todayDateString } from './streaks'
import { levelFromXp } from './xpLevels'
import {
  canAfford,
  computeBuyAiPip,
  computeSetCustomPip,
  cosmeticById,
  isCosmeticOwned,
  STREAK_FREEZE_COST,
} from './xpWallet'

function userRef(uid: string) {
  return doc(getFirestoreDb(), 'users', uid)
}

function lessonProgressRef(uid: string, lessonId: string) {
  return doc(getFirestoreDb(), 'users', uid, 'lessonProgress', lessonId)
}

function dailyActivityRef(uid: string, date: string) {
  return doc(getFirestoreDb(), 'users', uid, 'dailyActivity', date)
}

function leaderboardRef(uid: string) {
  return doc(getFirestoreDb(), 'leaderboard', uid)
}

/** First name only — the leaderboard is public, so never expose a full name or email. */
function firstNameOnly(displayName: string): string {
  const first = (displayName ?? '').trim().split(/\s+/)[0]
  return first || 'Learner'
}

/** Mirrors the user's lifetime XP into the minimal public leaderboard doc. */
async function upsertLeaderboardEntry(uid: string, displayName: string, companionXp: number) {
  await setDoc(
    leaderboardRef(uid),
    {
      uid,
      displayName: firstNameOnly(displayName),
      companionXp,
      level: levelFromXp(companionXp).level,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
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
    spentXp: 0,
    xpToday: 0,
    xpTodayDate: '',
    streakFreezeTokens: 0,
    unlockedCosmetics: [],
    equippedCosmetic: null,
    customPipUrl: null,
    customPipPrompt: null,
    customPipGensLeft: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(userRef(uid), profile)
  const created = await getUserProfile(uid)
  return created!
}

export async function updateDisplayName(uid: string, displayName: string) {
  await updateDoc(userRef(uid), { displayName, updatedAt: serverTimestamp() })
  // Keep the public leaderboard name in sync (only if they're already ranked).
  try {
    const p = await getUserProfile(uid)
    if (p && (p.companionXp ?? 0) > 0) {
      await upsertLeaderboardEntry(uid, displayName, p.companionXp ?? 0)
    }
  } catch {
    /* best-effort */
  }
}

/**
 * Adds LIFETIME XP (never decremented) and rolls it into today's `xpToday` tally
 * for the daily goal, resetting that tally on a new day. Runs in a transaction so
 * rapid awards can't race. Best-effort side writes: a daily-history `xpEarned`
 * increment and the public leaderboard mirror.
 */
export async function awardCompanionXp(uid: string, amount: number) {
  if (amount <= 0) return
  const ref = userRef(uid)
  const today = todayDateString()
  let newTotal = amount
  let displayName = 'Learner'
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    const p = snap.exists() ? (snap.data() as UserProfile) : null
    newTotal = (p?.companionXp ?? 0) + amount
    const xpToday = (p?.xpTodayDate === today ? p?.xpToday ?? 0 : 0) + amount
    displayName = p?.displayName ?? 'Learner'
    tx.set(
      ref,
      { companionXp: newTotal, xpToday, xpTodayDate: today, updatedAt: serverTimestamp() },
      { merge: true },
    )
  })
  try {
    await setDoc(
      dailyActivityRef(uid, today),
      { date: today, xpEarned: increment(amount) },
      { merge: true },
    )
  } catch {
    /* best-effort: the header reads profile.xpToday, not this history doc */
  }
  try {
    await upsertLeaderboardEntry(uid, displayName, newTotal)
  } catch {
    /* best-effort */
  }
}

/**
 * Buys one streak-freeze token from the SPENDABLE balance (companionXp − spentXp),
 * incrementing `spentXp` (lifetime XP is untouched). Returns false if unaffordable.
 */
export async function buyStreakFreezeToken(uid: string): Promise<boolean> {
  const ref = userRef(uid)
  let ok = false
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const p = snap.data() as UserProfile
    if (!canAfford(p, STREAK_FREEZE_COST)) return
    tx.set(
      ref,
      {
        spentXp: (p.spentXp ?? 0) + STREAK_FREEZE_COST,
        streakFreezeTokens: (p.streakFreezeTokens ?? 0) + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    ok = true
  })
  return ok
}

/**
 * Buys a cosmetic by id, charging the catalog price (looked up in code, never from
 * the caller) against the spendable balance. Returns false if unknown, already
 * owned, or unaffordable.
 */
export async function purchaseCosmetic(uid: string, cosmeticId: string): Promise<boolean> {
  const cosmetic = cosmeticById(cosmeticId)
  if (!cosmetic || cosmetic.cost <= 0) return false
  const ref = userRef(uid)
  let ok = false
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const p = snap.data() as UserProfile
    if (isCosmeticOwned(p, cosmeticId)) return
    if (!canAfford(p, cosmetic.cost)) return
    tx.set(
      ref,
      {
        spentXp: (p.spentXp ?? 0) + cosmetic.cost,
        unlockedCosmetics: [...(p.unlockedCosmetics ?? []), cosmeticId],
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    ok = true
  })
  return ok
}

/** Equips a cosmetic (must be owned, or null/'default' to reset). Returns success. */
export async function equipCosmetic(uid: string, cosmeticId: string | null): Promise<boolean> {
  const ref = userRef(uid)
  let ok = false
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const p = snap.data() as UserProfile
    if (cosmeticId && !isCosmeticOwned(p, cosmeticId)) return
    tx.set(ref, { equippedCosmetic: cosmeticId, updatedAt: serverTimestamp() }, { merge: true })
    ok = true
  })
  return ok
}

/**
 * Buys the premium AI-Pip feature: spends `AI_PIP_COST` from the spendable
 * balance, unlocks `ai-custom`, and (re)fills the generation allowance. Returns
 * false if unaffordable.
 */
export async function buyAiPip(uid: string): Promise<boolean> {
  const ref = userRef(uid)
  let ok = false
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const r = computeBuyAiPip(snap.data() as UserProfile)
    if (!r) return
    tx.set(ref, { ...r, updatedAt: serverTimestamp() }, { merge: true })
    ok = true
  })
  return ok
}

/**
 * Applies a generated Pip image: stores the url + prompt, consumes one generation,
 * and equips `ai-custom`. Returns false if no generations remain.
 */
export async function setCustomPip(uid: string, url: string, prompt: string): Promise<boolean> {
  const ref = userRef(uid)
  let ok = false
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const r = computeSetCustomPip(snap.data() as UserProfile, url, prompt)
    if (!r) return
    tx.set(ref, { ...r, updatedAt: serverTimestamp() }, { merge: true })
    ok = true
  })
  return ok
}

/** Top leaderboard entries by lifetime XP (desc). */
export async function getLeaderboardTop(max = 50): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(getFirestoreDb(), 'leaderboard'),
    orderBy('companionXp', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as LeaderboardEntry)
}

/** 1-based rank of a given lifetime XP (count of strictly-higher entries + 1). */
export async function getUserLeaderboardRank(companionXp: number): Promise<number> {
  const q = query(collection(getFirestoreDb(), 'leaderboard'), where('companionXp', '>', companionXp))
  const c = await getCountFromServer(q)
  return c.data().count + 1
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
    // Answering a review question counts as real work, so it keeps the daily streak alive.
    const streak = nextStreakFields(
      profile?.streakCount ?? 0,
      profile?.lastActiveDate || null,
      profile?.streakFreezeTokens ?? 0,
      today,
    )
    tx.set(ref, { conceptSrs, ...streak, updatedAt: serverTimestamp() }, { merge: true })
  })
}

/**
 * Tallies one practice first-attempt for a concept toward the cross-lesson weak-spot
 * model. Atomic so concurrent practice answers can't clobber each other's counts.
 */
export async function recordConceptPractice(uid: string, conceptId: string, correct: boolean) {
  const ref = userRef(uid)
  const today = todayDateString()
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    const profile = snap.exists() ? (snap.data() as UserProfile) : null
    const prev = profile?.conceptStats?.[conceptId] ?? { correct: 0, wrong: 0 }
    const next = correct
      ? { correct: prev.correct + 1, wrong: prev.wrong }
      : { correct: prev.correct, wrong: prev.wrong + 1 }
    const conceptStats = { ...(profile?.conceptStats ?? {}), [conceptId]: next }
    // Practicing is real work, so it keeps the daily streak alive (idempotent per day).
    const streak = nextStreakFields(
      profile?.streakCount ?? 0,
      profile?.lastActiveDate || null,
      profile?.streakFreezeTokens ?? 0,
      today,
    )
    tx.set(ref, { conceptStats, ...streak, updatedAt: serverTimestamp() }, { merge: true })
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
  const ref = userRef(uid)
  const today = todayDateString()
  // Transaction so a freeze-token decrement can't race a concurrent purchase.
  await runTransaction(getFirestoreDb(), async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const profile = snap.data() as UserProfile
    const fields = nextStreakFields(
      profile.streakCount ?? 0,
      profile.lastActiveDate || null,
      profile.streakFreezeTokens ?? 0,
      today,
    )
    tx.set(ref, { ...fields, updatedAt: serverTimestamp() }, { merge: true })
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

  // Default each counter — the doc may have been created by an XP-only write
  // (awardCompanionXp) that set just `date` + `xpEarned`, leaving these unset.
  const current = snap.data() as DailyActivityDoc
  await updateDoc(ref, {
    lessonsCompleted: (current.lessonsCompleted ?? 0) + (opts.lessonCompleted ? 1 : 0),
    questionsAnswered: (current.questionsAnswered ?? 0) + (opts.answered ? 1 : 0),
    correctAnswers: (current.correctAnswers ?? 0) + (opts.correct ? 1 : 0),
    activeMinutesEstimate: (current.activeMinutesEstimate ?? 0) + 1,
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
