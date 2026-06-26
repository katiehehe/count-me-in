import { getFirebaseAuth, isFirebaseConfigured } from '../../firebase/firebaseClient'
import * as fs from './progressService'
import * as demo from './demoStore'

/**
 * Progress facade. Real (signed-in) accounts read/write Firestore via
 * {@link progressService}; anonymous "demo" guests are transparently routed to a
 * zero-write in-memory store ({@link demoStore}) so a demo session never persists
 * anything to the database. Call sites don't need to know which backend is used.
 */

/** True when the active session is an anonymous demo guest. */
export function isDemoSession(): boolean {
  if (!isFirebaseConfigured()) return false
  try {
    return getFirebaseAuth().currentUser?.isAnonymous ?? false
  } catch {
    return false
  }
}

const pick = () => (isDemoSession() ? demo : fs)

export const getUserProfile: typeof fs.getUserProfile = (...a) => pick().getUserProfile(...a)
export const ensureUserProfile: typeof fs.ensureUserProfile = (...a) => pick().ensureUserProfile(...a)
export const updateDisplayName: typeof fs.updateDisplayName = (...a) => pick().updateDisplayName(...a)
export const awardCompanionXp: typeof fs.awardCompanionXp = (...a) => pick().awardCompanionXp(...a)
export const getAllLessonProgress: typeof fs.getAllLessonProgress = (...a) =>
  pick().getAllLessonProgress(...a)
export const getLessonProgress: typeof fs.getLessonProgress = (...a) => pick().getLessonProgress(...a)
export const saveLessonProgress: typeof fs.saveLessonProgress = (...a) =>
  pick().saveLessonProgress(...a)
export const recordStepAnswer: typeof fs.recordStepAnswer = (...a) => pick().recordStepAnswer(...a)
export const toggleStepStar: typeof fs.toggleStepStar = (...a) => pick().toggleStepStar(...a)
export const restartLesson: typeof fs.restartLesson = (...a) => pick().restartLesson(...a)
export const markStepComplete: typeof fs.markStepComplete = (...a) => pick().markStepComplete(...a)
export const advanceStep: typeof fs.advanceStep = (...a) => pick().advanceStep(...a)
export const completeLesson: typeof fs.completeLesson = (...a) => pick().completeLesson(...a)
export const recordLearningActivity: typeof fs.recordLearningActivity = (...a) =>
  pick().recordLearningActivity(...a)

/** Clears any in-memory demo state for a guest (call on sign-out). */
export { clearDemoUser } from './demoStore'
