import { isFirebaseConfigured } from './firebaseClient'

/**
 * Whether AI Challenge Mode is available. Kept in its own tiny module so eager
 * code paths — like the lesson player deciding whether to route into Challenge
 * Mode — can read the flag without importing the AI proxy client.
 */
export function isAiEnabled(): boolean {
  return isFirebaseConfigured() && import.meta.env.VITE_AI_ENABLED === 'true'
}
