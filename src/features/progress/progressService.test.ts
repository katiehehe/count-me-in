import { beforeEach, describe, expect, it, vi } from 'vitest'

// Shared in-memory Firestore stand-in. Hoisted so the vi.mock factories below
// (which are themselves hoisted) can reference it without TDZ errors.
const h = vi.hoisted(() => ({
  store: new Map<string, Record<string, unknown>>(),
  writeLog: [] as Array<{ path: string; op: string; data: Record<string, unknown> }>,
  ctrl: { getDocDelay: null as Promise<void> | null },
}))

vi.mock('../../firebase/firebaseClient', () => ({
  getFirestoreDb: () => ({}),
}))

vi.mock('firebase/firestore', () => {
  const refFor = (...segs: string[]) => ({ path: segs.join('/') })
  const snapshotOf = (data: Record<string, unknown> | undefined) => ({
    exists: () => data !== undefined,
    data: () => (data === undefined ? undefined : structuredClone(data)),
  })
  return {
    doc: (_db: unknown, ...segs: string[]) => refFor(...segs),
    collection: (_db: unknown, ...segs: string[]) => refFor(...segs),
    serverTimestamp: () => '__serverTimestamp__',
    Timestamp: { now: () => ({ __ts: 1 }) },
    getDoc: async (ref: { path: string }) => {
      // Capture the snapshot at call time so a delayed read returns *stale* data.
      const captured = h.store.has(ref.path)
        ? structuredClone(h.store.get(ref.path)!)
        : undefined
      if (h.ctrl.getDocDelay) await h.ctrl.getDocDelay
      return snapshotOf(captured)
    },
    getDocs: async (ref: { path: string }) => {
      const prefix = ref.path + '/'
      const docs = [...h.store.entries()]
        .filter(([k]) => k.startsWith(prefix))
        .map(([, v]) => ({ data: () => structuredClone(v) }))
      return { docs }
    },
    setDoc: async (ref: { path: string }, data: Record<string, unknown>) => {
      h.store.set(ref.path, structuredClone(data))
      h.writeLog.push({ path: ref.path, op: 'set', data: structuredClone(data) })
    },
    updateDoc: async (ref: { path: string }, data: Record<string, unknown>) => {
      const cur = h.store.get(ref.path) ?? {}
      h.store.set(ref.path, { ...cur, ...structuredClone(data) })
      h.writeLog.push({ path: ref.path, op: 'update', data: structuredClone(data) })
    },
    runTransaction: async (
      _db: unknown,
      fn: (tx: {
        get: (ref: { path: string }) => Promise<ReturnType<typeof snapshotOf>>
        set: (ref: { path: string }, data: Record<string, unknown>) => void
        update: (ref: { path: string }, data: Record<string, unknown>) => void
      }) => Promise<void>,
    ) => {
      const tx = {
        get: async (ref: { path: string }) =>
          snapshotOf(h.store.has(ref.path) ? structuredClone(h.store.get(ref.path)!) : undefined),
        set: (ref: { path: string }, data: Record<string, unknown>) => {
          h.store.set(ref.path, structuredClone(data))
          h.writeLog.push({ path: ref.path, op: 'tx-set', data: structuredClone(data) })
        },
        update: (ref: { path: string }, data: Record<string, unknown>) => {
          const cur = h.store.get(ref.path) ?? {}
          h.store.set(ref.path, { ...cur, ...structuredClone(data) })
          h.writeLog.push({ path: ref.path, op: 'tx-update', data: structuredClone(data) })
        },
      }
      await fn(tx)
    },
  }
})

import {
  advanceStep,
  getLessonProgress,
  recordStepAnswer,
  restartLesson,
  saveLessonProgress,
} from './progressService'

const PROGRESS_PATH = 'users/u1/lessonProgress/L'

beforeEach(() => {
  h.store.clear()
  h.writeLog.length = 0
  h.ctrl.getDocDelay = null
})

describe('advanceStep write race (Bug #1)', () => {
  it('writes only the step pointer, never stepAnswers/mastery', async () => {
    await recordStepAnswer('u1', 'L', 's1', 5, true)
    h.writeLog.length = 0

    await advanceStep('u1', 'L', 2)

    const writes = h.writeLog.filter((w) => w.op === 'update' || w.op === 'set')
    expect(writes.length).toBeGreaterThan(0)
    for (const w of writes) {
      expect(w.data).not.toHaveProperty('stepAnswers')
      expect(w.data).not.toHaveProperty('masteryScore')
      expect(w.data).not.toHaveProperty('conceptMastery')
    }
    expect(h.store.get(PROGRESS_PATH)?.currentStepIndex).toBe(2)
  })

  it('preserves an answer that commits between advanceStep read and write', async () => {
    // Doc exists at step 0 with no answers yet.
    await saveLessonProgress('u1', { lessonId: 'L', currentStepIndex: 0 })
    h.writeLog.length = 0

    // Gate advanceStep's reads so they observe the *pre-answer* state, then let
    // a real answer commit before advanceStep gets to write.
    let release!: () => void
    h.ctrl.getDocDelay = new Promise<void>((r) => {
      release = r
    })
    const advancing = advanceStep('u1', 'L', 1)
    await recordStepAnswer('u1', 'L', 's1', 9, true)
    h.ctrl.getDocDelay = null
    release()
    await advancing

    const finalDoc = h.store.get(PROGRESS_PATH) as
      | { currentStepIndex: number; stepAnswers?: Record<string, { answer: unknown }> }
      | undefined
    expect(finalDoc?.currentStepIndex).toBe(1)
    expect(finalDoc?.stepAnswers?.s1?.answer).toBe(9)
  })

  it('advanceStep does not erase a persisted seed', async () => {
    await saveLessonProgress('u1', { lessonId: 'L', currentStepIndex: 0, seed: 12345 })
    await advanceStep('u1', 'L', 3)
    const doc = await getLessonProgress('u1', 'L')
    expect(doc?.seed).toBe(12345)
    expect(doc?.currentStepIndex).toBe(3)
  })

  it('recordStepAnswer locks firstAttempt fields on the first commit', async () => {
    await recordStepAnswer('u1', 'L', 's1', 3, false, ['off-by-one'])
    await recordStepAnswer('u1', 'L', 's1', 5, true)

    const rec = (h.store.get(PROGRESS_PATH) as { stepAnswers: Record<string, {
      firstAttemptCorrect: boolean
      firstAttemptAnswer: unknown
      correct: boolean
      attempts: number
    }> }).stepAnswers.s1
    expect(rec.firstAttemptCorrect).toBe(false)
    expect(rec.firstAttemptAnswer).toBe(3)
    expect(rec.correct).toBe(true)
    expect(rec.attempts).toBe(2)
  })
})

describe('seed persistence (Bug #2)', () => {
  it('round-trips a seed through save + get', async () => {
    await saveLessonProgress('u1', {
      lessonId: 'L',
      currentStepIndex: 0,
      seed: 987654321,
    })
    const doc = await getLessonProgress('u1', 'L')
    expect(doc?.seed).toBe(987654321)
  })

  it('restartLesson persists the reshuffled seed and clears answers', async () => {
    await recordStepAnswer('u1', 'L', 's1', 4, true)
    await saveLessonProgress('u1', { lessonId: 'L', seed: 111 })

    await restartLesson('u1', 'L', 222)

    const doc = await getLessonProgress('u1', 'L')
    expect(doc?.seed).toBe(222)
    expect(doc?.stepAnswers).toEqual({})
    expect(doc?.currentStepIndex).toBe(0)
  })
})
