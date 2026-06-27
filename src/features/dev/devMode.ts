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

const FORCE_WEEKLY_KEY = 'cmi-force-weekly'

/**
 * Demo override: forces the weekly Review to be available regardless of the
 * once-a-week schedule (e.g. to record a walkthrough right after completing one).
 * Unlike isDevUnlock this works in production too — it only re-surfaces an existing,
 * safe feature and does NOT bypass sequential lesson gating. Toggle with
 * `?weeklyReview=1` (on) / `?weeklyReview=0` (off); the choice persists locally.
 */
export function isWeeklyReviewForced(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('weeklyReview') === '1') {
      window.localStorage.setItem(FORCE_WEEKLY_KEY, 'on')
    } else if (params.get('weeklyReview') === '0') {
      window.localStorage.removeItem(FORCE_WEEKLY_KEY)
    }
    return window.localStorage.getItem(FORCE_WEEKLY_KEY) === 'on'
  } catch {
    return false
  }
}
