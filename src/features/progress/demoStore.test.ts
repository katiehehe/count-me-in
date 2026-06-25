import { beforeEach, describe, expect, it, vi } from 'vitest'

// demoStore only needs Timestamp.now() from firebase/firestore; mock it so the
// test stays fast and doesn't pull in the real SDK.
vi.mock('firebase/firestore', () => ({
  Timestamp: { now: () => ({ __ts: 1 }) },
}))

import { clearDemoUser, ensureUserProfile, getUserProfile, updateDisplayName } from './demoStore'

const UID = 'demo-user'

beforeEach(() => {
  clearDemoUser(UID)
})

describe('demoStore display name (guards the "Save name" prompt)', () => {
  it('reflects an updated display name on the next read', async () => {
    await ensureUserProfile(UID, 'Learner')
    await updateDisplayName(UID, 'Ada')

    const profile = await getUserProfile(UID)
    expect(profile?.displayName).toBe('Ada')
  })

  it('is a no-op for an unknown user (never throws)', async () => {
    await expect(updateDisplayName('ghost', 'Nobody')).resolves.toBeUndefined()
    expect(await getUserProfile('ghost')).toBeNull()
  })
})
