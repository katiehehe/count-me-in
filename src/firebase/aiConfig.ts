import { isFirebaseConfigured } from './firebaseClient'

/**
 * Whether AI Challenge Mode is available. Kept in its own dependency-free module
 * (it does NOT import the AI client / `firebase/functions`) so that eager code
 * paths — like the lesson player checking whether to route into Challenge Mode —
 * can read the flag without pulling the AI/Functions code into the initial bundle.
 */
export function isAiEnabled(): boolean {
  return isFirebaseConfigured() && import.meta.env.VITE_AI_ENABLED === 'true'
}
