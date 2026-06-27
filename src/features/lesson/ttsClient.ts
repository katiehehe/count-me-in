import { isAiEnabled } from '../../firebase/aiConfig'
import { getFirebaseAuth } from '../../firebase/firebaseClient'

/**
 * Narration for the worked-example teacher. `speakLine` resolves when the line
 * FINISHES, which is the signal the player uses to advance to the next beat.
 * Priority: real OpenAI voice via the Worker → the browser's Web Speech API →
 * a silent text-length delay, so the walkthrough always advances even with AI off
 * or no speech support.
 */

const blobCache = new Map<string, Blob>()

let currentAudio: HTMLAudioElement | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let settle: (() => void) | null = null

function ttsUrl(): string | null {
  const base = import.meta.env.VITE_AI_PROXY_URL
  if (!base) return null
  return `${base.replace(/\/+$/, '')}/tts`
}

function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1
  return Math.max(0.5, Math.min(2.5, speed))
}

/** Wraps an async narration in a single resolvable settle hook so cancel can end it cleanly. */
function tracked(run: (finish: () => void) => void): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      settle = null
      resolve()
    }
    settle = finish
    run(finish)
  })
}

async function fetchTtsBlob(text: string, voice: string, speed: number): Promise<Blob> {
  const key = `${voice}:${speed}:${text}`
  const cached = blobCache.get(key)
  if (cached) return cached

  const url = ttsUrl()
  if (!url) throw new Error('TTS proxy URL is not configured.')
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Must be signed in to use narration.')
  const token = await user.getIdToken()

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, voice, speed }),
  })
  if (!res.ok) throw new Error(`TTS proxy error ${res.status}`)
  const blob = await res.blob()
  blobCache.set(key, blob)
  return blob
}

function playAudioBlob(blob: Blob): Promise<void> {
  return tracked((finish) => {
    const objectUrl = URL.createObjectURL(blob)
    const audio = new Audio(objectUrl)
    currentAudio = audio
    const end = () => {
      URL.revokeObjectURL(objectUrl)
      if (currentAudio === audio) currentAudio = null
      finish()
    }
    audio.onended = end
    audio.onerror = end
    audio.play().catch(end)
  })
}

function speakBrowser(text: string, speed: number): Promise<void> {
  return tracked((finish) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speed
    currentUtterance = utterance
    const end = () => {
      if (currentUtterance === utterance) currentUtterance = null
      finish()
    }
    utterance.onend = end
    utterance.onerror = end
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

function silentDelay(text: string, speed: number): Promise<void> {
  return tracked((finish) => {
    timer = setTimeout(() => {
      timer = null
      finish()
    }, Math.min(8000, 800 + text.length * 45) / speed)
  })
}

/** Stops any in-flight narration and resolves its pending promise (pause / skip / unmount). */
export function cancelSpeech(): void {
  if (currentAudio) {
    try {
      currentAudio.pause()
    } catch {
      /* ignore */
    }
    currentAudio.src = ''
    currentAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
  }
  currentUtterance = null
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  const pending = settle
  settle = null
  if (pending) pending()
}

/** Narrates `text` and resolves when it finishes (AI voice → browser speech → silent delay). */
export async function speakLine(text: string, voice = 'nova', speed = 1): Promise<void> {
  const line = text.trim()
  if (!line) return
  const rate = clampSpeed(speed)

  if (isAiEnabled() && ttsUrl()) {
    try {
      const blob = await fetchTtsBlob(line, voice, rate)
      await playAudioBlob(blob)
      return
    } catch {
      /* fall through to browser speech / silent delay */
    }
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    await speakBrowser(line, rate)
    return
  }

  await silentDelay(line, rate)
}
