import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirestoreDb } from '../../firebase/firebaseClient'
import { isDemoSession } from '../progress/progressStore'
import type {
  ChallengeQuestionType,
  ChallengeUnderstanding,
  RecommendedNextAction,
} from './challengeTypes'

/**
 * Persists Challenge Mode sessions and per-question responses under
 * users/{uid}/challengeSessions/{sessionId}[/responses/{responseId}].
 *
 * Anonymous demo guests are routed to {@link isDemoSession}: nothing is written
 * (mirroring the zero-write demo progress store), but a synthetic session id is
 * returned so the in-session UI works identically.
 */

function sessionsCol(uid: string) {
  return collection(getFirestoreDb(), 'users', uid, 'challengeSessions')
}

export async function createChallengeSession(uid: string, lessonId: string): Promise<string> {
  if (isDemoSession()) return `demo-${Date.now()}`
  const ref = doc(sessionsCol(uid))
  await setDoc(ref, {
    sessionId: ref.id,
    lessonId,
    startedAt: serverTimestamp(),
    questionCount: 0,
    understanding: 'developing' as ChallengeUnderstanding,
    xpEarned: 0,
    recommendedNextAction: 'continue' as RecommendedNextAction,
  })
  return ref.id
}

export async function recordChallengeResponse(
  uid: string,
  sessionId: string,
  resp: {
    questionType: ChallengeQuestionType
    question: string
    studentAnswer: string
    aiFeedback: string
    understanding: ChallengeUnderstanding
    misconceptionDetected?: string
    xpAwarded: number
  },
): Promise<void> {
  if (isDemoSession()) return
  const ref = doc(collection(getFirestoreDb(), 'users', uid, 'challengeSessions', sessionId, 'responses'))
  // Firestore rejects `undefined`; only include the optional tag when present.
  await setDoc(ref, {
    responseId: ref.id,
    questionType: resp.questionType,
    question: resp.question,
    studentAnswer: resp.studentAnswer,
    aiFeedback: resp.aiFeedback,
    understanding: resp.understanding,
    xpAwarded: resp.xpAwarded,
    ...(resp.misconceptionDetected ? { misconceptionDetected: resp.misconceptionDetected } : {}),
    createdAt: serverTimestamp(),
  })
}

export async function completeChallengeSession(
  uid: string,
  sessionId: string,
  summary: {
    questionCount: number
    understanding: ChallengeUnderstanding
    xpEarned: number
    recommendedNextAction: RecommendedNextAction
  },
): Promise<void> {
  if (isDemoSession()) return
  await setDoc(
    doc(sessionsCol(uid), sessionId),
    { ...summary, completedAt: serverTimestamp() },
    { merge: true },
  )
}
