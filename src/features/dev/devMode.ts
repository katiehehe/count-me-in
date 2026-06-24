/**
 * Dev tooling: unlocks every lesson so functionality can be tested without
 * playing through prerequisites.
 *
 * Availability is gated to **development builds only** (`import.meta.env.DEV`).
 * Production builds have NO unlock backdoor — `?dev=1` / localStorage are
 * ignored entirely — so sequential lesson gating is always enforced for real
 * visitors. Within a dev build it's on by default but can be toggled off with
 * `?dev=0` to exercise the real gating locally.
 */
const DEV_KEY = 'cmi-dev-unlock'

export function isDevUnlock(): boolean {
  // Hard stop in production: gating can never be bypassed by a URL param.
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return true
  try {
    const params = new URLSearchParams(window.location.search)
    // `?dev=0` simulates production gating locally; `?dev=1` restores the unlock.
    if (params.get('dev') === '0') {
      window.localStorage.setItem(DEV_KEY, 'off')
    } else if (params.get('dev') === '1') {
      window.localStorage.removeItem(DEV_KEY)
    }
    return window.localStorage.getItem(DEV_KEY) !== 'off'
  } catch {
    return true
  }
}
