import { getFirebaseAuth } from './firebaseClient'

export { isAiEnabled } from './aiConfig'

type ChallengeAction =
  | 'question'
  | 'evaluate'
  | 'lesson_hint'
  | 'lesson_hints'
  | 'lesson_feedback'
  | 'practice_reskin'

/**
 * Calls the OpenAI proxy (a Cloudflare Worker) which runs OpenAI gpt-4o
 * server-side so the API key never reaches the browser. We attach the learner's
 * Firebase ID token; the Worker verifies it before spending any OpenAI budget.
 * The Worker selects the strict JSON schema from `action` and returns structured
 * output; callers normalize the result in `ai/challengeAi.ts`.
 */
export async function callChallengeAi<T>(action: ChallengeAction, prompt: string): Promise<T> {
  const url = import.meta.env.VITE_AI_PROXY_URL
  if (!url) throw new Error('AI proxy URL is not configured (VITE_AI_PROXY_URL).')

  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Must be signed in to use Challenge Mode.')
  const token = await user.getIdToken()

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, prompt }),
  })
  if (!res.ok) throw new Error(`AI proxy error ${res.status}`)
  return (await res.json()) as T
}
