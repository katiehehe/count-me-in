import { getFirebaseAuth } from './firebaseClient'

/**
 * Client for the Worker's `/pip-image` endpoint. Mirrors `ttsClient`/`aiClient`:
 * POSTs the prompt with the learner's Firebase ID token and returns the stored
 * image URL. The OpenAI key, moderation, and image generation all stay
 * server-side in the Worker.
 */

export type PipImageErrorCode =
  | 'not_configured' // VITE_AI_PROXY_URL unset / feature off
  | 'signin_required' // anonymous or signed-out
  | 'rejected' // prompt failed moderation
  | 'failed' // network / server error

export class PipImageError extends Error {
  code: PipImageErrorCode
  constructor(code: PipImageErrorCode) {
    super(code)
    this.name = 'PipImageError'
    this.code = code
  }
}

/**
 * Whether the AI-Pip endpoint is live. Requires the Worker URL AND an explicit
 * opt-in flag, so the feature stays "coming soon" (no purchases) until the Worker
 * `/pip-image` route + R2 bucket are actually deployed.
 */
export function isPipImageConfigured(): boolean {
  return Boolean(import.meta.env.VITE_AI_PROXY_URL) && import.meta.env.VITE_AI_PIP_ENABLED === 'true'
}

function pipImageUrl(): string | null {
  const base = import.meta.env.VITE_AI_PROXY_URL
  if (!base) return null
  return `${base.replace(/\/+$/, '')}/pip-image`
}

/** Generates a custom Pip image; resolves to its durable URL or throws a PipImageError. */
export async function generatePipImage(prompt: string): Promise<{ url: string }> {
  const url = pipImageUrl()
  if (!url) throw new PipImageError('not_configured')

  const user = getFirebaseAuth().currentUser
  if (!user || user.isAnonymous) throw new PipImageError('signin_required')
  const token = await user.getIdToken()

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt }),
    })
  } catch {
    throw new PipImageError('failed')
  }

  if (res.status === 403) throw new PipImageError('signin_required')
  if (res.status === 400) {
    let code: PipImageErrorCode = 'failed'
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error === 'rejected') code = 'rejected'
    } catch {
      /* keep generic failure */
    }
    throw new PipImageError(code)
  }
  if (!res.ok) throw new PipImageError('failed')

  let data: { url?: string }
  try {
    data = (await res.json()) as { url?: string }
  } catch {
    throw new PipImageError('failed')
  }
  if (!data.url) throw new PipImageError('failed')
  return { url: data.url }
}
