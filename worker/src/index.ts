/**
 * Cloudflare Worker: the secure OpenAI proxy for AI Challenge Mode.
 *
 * The browser calls this Worker (never OpenAI directly), so the OpenAI key stays
 * server-side as a Worker secret. Requests are auth-gated by verifying the
 * caller's Firebase ID token, so only signed-in learners can spend the budget.
 *
 * Secrets / vars:
 *   OPENAI_API_KEY      (secret)  — `wrangler secret put OPENAI_API_KEY`
 *   FIREBASE_PROJECT_ID (var)     — used to validate the ID token audience
 *   ALLOWED_ORIGINS     (var)     — comma-separated CORS allowlist
 */

interface Env {
  OPENAI_API_KEY: string
  FIREBASE_PROJECT_ID: string
  ALLOWED_ORIGINS: string
  /** R2 bucket holding generated custom-Pip images. */
  PIP_BUCKET: R2Bucket
}

const MODEL = 'gpt-4o'

// OpenAI Structured Outputs (strict): every property required +
// additionalProperties:false; optional fields are nullable instead of omitted.
const questionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['question', 'expectedConcepts', 'feedbackStyle', 'companionMessage'],
  properties: {
    question: { type: 'string' },
    expectedConcepts: { type: 'array', items: { type: 'string' } },
    feedbackStyle: { type: 'string', enum: ['encouraging', 'corrective', 'socratic'] },
    companionMessage: { type: 'string' },
  },
}

const evaluationSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'understanding',
    'feedback',
    'followUpQuestion',
    'misconceptionDetected',
    'recommendedNextAction',
    'xpAwarded',
  ],
  properties: {
    understanding: { type: 'string', enum: ['strong', 'developing', 'needs_review'] },
    feedback: { type: 'string' },
    followUpQuestion: { type: ['string', 'null'] },
    misconceptionDetected: { type: ['string', 'null'] },
    recommendedNextAction: { type: 'string', enum: ['continue', 'review_lesson', 'try_practice'] },
    xpAwarded: { type: 'integer' },
  },
}

// In-lesson adaptive hint / wrong-answer feedback. `reviewStepId` optionally
// points the learner back to an earlier lesson step to "relearn" (or null).
const lessonHelpSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'reviewStepId'],
  properties: {
    text: { type: 'string' },
    reviewStepId: { type: ['string', 'null'] },
  },
}

// Three escalating in-lesson hints in one call: gentle nudge → concrete method →
// the revealed answer. `reviewStepId` may point back to an earlier step (or null).
const lessonHintsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['hints', 'reviewStepId'],
  properties: {
    hints: { type: 'array', items: { type: 'string' } },
    reviewStepId: { type: ['string', 'null'] },
  },
}

// Practice Mode: the app generates a problem in CODE (concept, difficulty, exact
// numbers, verified answer); the model only re-words it into a fresh real-world
// scenario keeping the same numbers/operation. It never decides the answer.
const practiceReskinSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['prompt'],
  properties: {
    prompt: { type: 'string' },
  },
}

const SCHEMAS: Record<string, Record<string, unknown>> = {
  question: questionSchema,
  evaluate: evaluationSchema,
  lesson_hint: lessonHelpSchema,
  lesson_hints: lessonHintsSchema,
  lesson_feedback: lessonHelpSchema,
  practice_reskin: practiceReskinSchema,
}

// --- Firebase ID token verification (RS256 via WebCrypto) ---------------------

interface Jwk {
  kid: string
  n: string
  e: string
  kty: string
}

let keyCache: { keys: Record<string, CryptoKey>; expiresAt: number } | null = null

async function getGooglePublicKeys(): Promise<Record<string, CryptoKey>> {
  const now = Date.now()
  if (keyCache && keyCache.expiresAt > now) return keyCache.keys

  const res = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  )
  const data = (await res.json()) as { keys: Jwk[] }
  const keys: Record<string, CryptoKey> = {}
  for (const jwk of data.keys) {
    keys[jwk.kid] = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
  }
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? '3600')
  keyCache = { keys, expiresAt: now + maxAge * 1000 }
  return keys
}

function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base64UrlToString(input: string): string {
  return new TextDecoder().decode(base64UrlToBytes(input))
}

/** Verifies a Firebase ID token and returns the uid, or null if invalid. */
async function verifyFirebaseToken(token: string, projectId: string): Promise<string | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, sigB64] = parts

  let header: { kid?: string; alg?: string }
  let payload: { aud?: string; iss?: string; exp?: number; sub?: string }
  try {
    header = JSON.parse(base64UrlToString(headerB64))
    payload = JSON.parse(base64UrlToString(payloadB64))
  } catch {
    return null
  }
  if (header.alg !== 'RS256' || !header.kid) return null

  const keys = await getGooglePublicKeys()
  const key = keys[header.kid]
  if (!key) return null

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(sigB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  )
  if (!valid) return null

  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < now) return null
  if (payload.aud !== projectId) return null
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
  if (!payload.sub) return null
  return payload.sub
}

// --- OpenAI -----------------------------------------------------------------

async function callOpenAI(action: string, prompt: string, apiKey: string): Promise<unknown> {
  const schema = SCHEMAS[action]
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a structured tutoring assistant for a counting & probability app. ' +
            'Always reply with JSON matching the provided schema, and never include any ' +
            'text outside the JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_schema', json_schema: { name: action, schema, strict: true } },
      temperature: 0.6,
      max_tokens: 1024,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty OpenAI response')
  return JSON.parse(content)
}

// --- Text-to-speech ---------------------------------------------------------

const TTS_VOICES = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function clampTtsSpeed(speed: unknown): number {
  const n = typeof speed === 'number' ? speed : Number(speed)
  if (!Number.isFinite(n)) return 1
  return Math.max(0.25, Math.min(4, n))
}

/** Synthesizes speech via OpenAI, preferring the newer model and falling back to tts-1. */
async function openAiTts(
  text: string,
  voice: string,
  speed: number,
  apiKey: string,
): Promise<ArrayBuffer> {
  const call = (model: string) =>
    fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: text, voice, response_format: 'mp3', speed }),
    })
  let res = await call('gpt-4o-mini-tts')
  if (!res.ok) res = await call('tts-1')
  if (!res.ok) throw new Error(`OpenAI TTS HTTP ${res.status}`)
  return res.arrayBuffer()
}

/**
 * POST /tts → { text, voice?, speed? } → mp3 audio. Identical lines are cached in
 * the Cloudflare edge cache (keyed by a hash of voice+speed+text) so repeated
 * narration is served from cache — but a different speed caches separately so it
 * never returns a wrong-speed clip.
 */
async function handleTts(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  cors: Record<string, string>,
): Promise<Response> {
  let body: { text?: string; voice?: string; speed?: number }
  try {
    body = (await request.json()) as { text?: string; voice?: string; speed?: number }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, cors)
  }

  const text = (body.text ?? '').trim()
  const voice = body.voice && TTS_VOICES.has(body.voice) ? body.voice : 'nova'
  const speed = clampTtsSpeed(body.speed)
  if (!text || text.length > 4000) return json({ error: 'Invalid request' }, 400, cors)

  const cache = caches.default
  const cacheKey = new Request(
    `https://tts.cache/${voice}/${speed}/${await sha256Hex(`${voice}:${speed}:${text}`)}`,
  )
  const hit = await cache.match(cacheKey)
  if (hit) return new Response(hit.body, { status: 200, headers: { 'Content-Type': 'audio/mpeg', ...cors } })

  let audio: ArrayBuffer
  try {
    audio = await openAiTts(text, voice, speed, env.OPENAI_API_KEY)
  } catch {
    return json({ error: 'TTS request failed' }, 502, cors)
  }

  const toCache = new Response(audio, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=2592000' },
  })
  ctx.waitUntil(cache.put(cacheKey, toCache.clone()))
  return new Response(toCache.body, { status: 200, headers: { 'Content-Type': 'audio/mpeg', ...cors } })
}

// --- Custom Pip image (AI) --------------------------------------------------

// A FIXED wholesome style wrapper. The user's text is inserted only as a "theme",
// so it can't override the mascot style, and the prompt forbids text/people/etc.
const PIP_STYLE_PREFIX =
  'A cute, wholesome, round chibi cartoon cat mascot character, kawaii style, big friendly ' +
  'eyes, soft pastel colors, simple flat vector illustration, centered, on a plain solid ' +
  'light background. Strictly child-appropriate and friendly. No text, words, letters, ' +
  'numbers, logos, watermarks, humans, weapons, blood, or anything scary or inappropriate. ' +
  'It must be a single adorable cat. Theme the cat as: '

function buildPipPrompt(theme: string): string {
  // Drop control characters (without a control-char regex), then collapse spaces.
  const printable = Array.from(theme)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0
      return code >= 0x20 && code !== 0x7f
    })
    .join('')
  const clean = printable.replace(/\s+/g, ' ').trim().slice(0, 300)
  return `${PIP_STYLE_PREFIX}"${clean}".`
}

/** Runs the prompt through OpenAI moderation; true means it should be rejected. */
async function moderateFlagged(input: string, apiKey: string): Promise<boolean> {
  const res = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'omni-moderation-latest', input }),
  })
  if (!res.ok) throw new Error(`Moderation HTTP ${res.status}`)
  const data = (await res.json()) as { results?: { flagged?: boolean }[] }
  return data.results?.some((r) => r.flagged) ?? false
}

/** Generates a PNG via OpenAI Images (gpt-image-1, falling back to dall-e-2). */
async function generatePipImageBytes(prompt: string, apiKey: string): Promise<Uint8Array> {
  // gpt-image-1 returns base64 (b64_json) and rejects a response_format param.
  const primary = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024', quality: 'low', n: 1 }),
  })
  if (primary.ok) {
    const d = (await primary.json()) as { data?: { b64_json?: string }[] }
    const b64 = d.data?.[0]?.b64_json
    if (b64) return base64UrlToBytes(b64)
  }
  // Fallback: dall-e-2 supports a small 512×512 render and explicit b64_json.
  const fallback = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'dall-e-2', prompt, size: '512x512', n: 1, response_format: 'b64_json' }),
  })
  if (!fallback.ok) throw new Error(`Image HTTP ${fallback.status}`)
  const d = (await fallback.json()) as { data?: { b64_json?: string }[] }
  const b64 = d.data?.[0]?.b64_json
  if (!b64) throw new Error('No image bytes')
  return base64UrlToBytes(b64)
}

/** The token's Firebase sign-in provider (e.g. 'anonymous', 'google.com'), if present. */
function tokenSignInProvider(token: string): string | null {
  try {
    const payload = JSON.parse(base64UrlToString(token.split('.')[1])) as {
      firebase?: { sign_in_provider?: string }
    }
    return payload.firebase?.sign_in_provider ?? null
  } catch {
    return null
  }
}

/**
 * POST /pip-image → { prompt } → { url }. Moderates the prompt, wraps it in the
 * fixed wholesome style, generates a PNG, stores it in R2 under an unguessable
 * key, and returns an absolute URL to the public GET route below. Restricted to
 * real (non-anonymous) accounts to cap AI cost/abuse.
 */
async function handlePipImage(
  request: Request,
  env: Env,
  uid: string,
  token: string,
  cors: Record<string, string>,
): Promise<Response> {
  if (tokenSignInProvider(token) === 'anonymous') {
    return json({ error: 'signin_required' }, 403, cors)
  }

  let body: { prompt?: string }
  try {
    body = (await request.json()) as { prompt?: string }
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, cors)
  }
  const prompt = (body.prompt ?? '').trim()
  if (!prompt || prompt.length > 500) return json({ error: 'Invalid request' }, 400, cors)

  let flagged: boolean
  try {
    flagged = await moderateFlagged(prompt, env.OPENAI_API_KEY)
  } catch {
    return json({ error: 'moderation_failed' }, 502, cors)
  }
  if (flagged) return json({ error: 'rejected' }, 400, cors)

  let bytes: Uint8Array
  try {
    bytes = await generatePipImageBytes(buildPipPrompt(prompt), env.OPENAI_API_KEY)
  } catch {
    return json({ error: 'generation_failed' }, 502, cors)
  }

  const key = `pip/${uid}/${crypto.randomUUID()}.png`
  try {
    await env.PIP_BUCKET.put(key, bytes, { httpMetadata: { contentType: 'image/png' } })
  } catch {
    return json({ error: 'storage_failed' }, 502, cors)
  }

  const origin = new URL(request.url).origin
  return json({ url: `${origin}/${key}` }, 200, cors)
}

/** GET /pip/<key> → streams the stored PNG (public; the key holds a random id). */
async function handlePipGet(url: URL, env: Env): Promise<Response> {
  const key = decodeURIComponent(url.pathname.slice(1))
  if (!key.startsWith('pip/')) return new Response('Not found', { status: 404 })
  const obj = await env.PIP_BUCKET.get(key)
  if (!obj) return new Response('Not found', { status: 404 })
  return new Response(obj.body, {
    status: 200,
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// --- HTTP plumbing ----------------------------------------------------------

function corsHeaders(origin: string, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const allow = allowed.includes(origin) ? origin : (allowed[0] ?? '*')
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const cors = corsHeaders(origin, env)
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })

    // Public image delivery (no auth): the key carries an unguessable random id.
    if (request.method === 'GET' && url.pathname.startsWith('/pip/')) {
      return handlePipGet(url, env)
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors)

    const authHeader = request.headers.get('Authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return json({ error: 'Missing auth token' }, 401, cors)

    const uid = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID)
    if (!uid) return json({ error: 'Invalid auth token' }, 401, cors)

    // The same Worker serves the challenge proxy (root), TTS (/tts), and the
    // custom-Pip image generator (/pip-image).
    if (url.pathname.endsWith('/pip-image')) return handlePipImage(request, env, uid, token, cors)
    if (url.pathname.endsWith('/tts')) return handleTts(request, env, ctx, cors)

    let body: { action?: string; prompt?: string }
    try {
      body = (await request.json()) as { action?: string; prompt?: string }
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, cors)
    }

    const action = body.action ?? ''
    const prompt = body.prompt ?? ''
    if (!SCHEMAS[action] || !prompt || prompt.length > 8000) {
      return json({ error: 'Invalid request' }, 400, cors)
    }

    try {
      const result = await callOpenAI(action, prompt, env.OPENAI_API_KEY)
      return json(result, 200, cors)
    } catch {
      return json({ error: 'AI request failed' }, 502, cors)
    }
  },
}
