import { afterEach, describe, expect, it, vi } from 'vitest'
import { isDevUnlock } from './devMode'

// Guards Bug #6: the dev unlock must never be reachable in a production build,
// so sequential lesson gating can't be bypassed by ?dev=1 / localStorage.

describe('dev unlock gating', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is disabled in production builds', () => {
    vi.stubEnv('DEV', false)
    expect(isDevUnlock()).toBe(false)
  })

  it('is available in development builds', () => {
    vi.stubEnv('DEV', true)
    // No window in the node test env → dev defaults to unlocked.
    expect(isDevUnlock()).toBe(true)
  })
})
