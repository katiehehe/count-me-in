/**
 * Temporary dev tooling: unlocks every lesson so functionality can be tested
 * without playing through prerequisites.
 *
 * Active when either:
 *  - the app is running a development build (`import.meta.env.DEV`), or
 *  - the URL contains `?dev=1` (persisted for the rest of the browser session).
 *
 * Normal production visitors never hit either path, so sequential locking stays
 * fully intact for them.
 */
const DEV_KEY = 'cmi-dev-unlock'

export function isDevUnlock(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    // `?dev=1` turns it on, `?dev=0` turns it off — persisted in localStorage so
    // it survives reloads and new tabs (not just the current session).
    if (params.get('dev') === '1') {
      window.localStorage.setItem(DEV_KEY, '1')
    } else if (params.get('dev') === '0') {
      window.localStorage.removeItem(DEV_KEY)
    }
    return (
      window.localStorage.getItem(DEV_KEY) === '1' ||
      window.sessionStorage.getItem(DEV_KEY) === '1'
    )
  } catch {
    return false
  }
}
