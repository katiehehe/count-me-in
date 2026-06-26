import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirebaseApp } from './firebaseClient'

export { isAiEnabled } from './aiConfig'

type ChallengeAction = 'question' | 'evaluate' | 'shift'

type FunctionsInstance = ReturnType<typeof getFunctions>
let functionsInstance: FunctionsInstance | null = null

function getFns(): FunctionsInstance {
  if (!functionsInstance) functionsInstance = getFunctions(getFirebaseApp())
  return functionsInstance
}

/**
 * Calls the `challengeAi` Cloud Function, which runs OpenAI (gpt-4o) server-side
 * so the API key never reaches the browser. The function selects the strict JSON
 * response schema from `action` and returns structured output; callers normalize
 * the result (clamping enums, supplying fallbacks) in `ai/challengeAi.ts`.
 */
export async function callChallengeAi<T>(action: ChallengeAction, prompt: string): Promise<T> {
  const callable = httpsCallable<{ action: ChallengeAction; prompt: string }, T>(
    getFns(),
    'challengeAi',
  )
  const result = await callable({ action, prompt })
  return result.data
}
