import { useState } from 'react'
import { Button } from '../../components/Button'
import { RichText } from '../../components/RichText'

interface PrequestionStepProps {
  prompt: string
  answer: number | string
  revealNote?: string
  /** True once a guess has been locked in (from persisted step state). */
  submitted: boolean
  /** The guess the learner locked in, restored from step state on revisit. */
  guess: string | null
  onSubmit: (guess: string) => void
}

function normalize(s: string): string {
  return s.trim().replace(/\s+/g, '')
}

/** Loose "did they nail it?" check — only drives an encouraging message, never grading. */
function isSpotOn(guess: string, answer: number | string): boolean {
  const g = normalize(guess)
  if (!g) return false
  const a = normalize(String(answer))
  if (g === a) return true
  const gn = Number(g)
  const an = Number(a)
  return Number.isFinite(gn) && Number.isFinite(an) && gn === an
}

/**
 * A predict-then-reveal primer (the pretesting effect): the learner makes a quick,
 * ungraded guess BEFORE the idea is taught, then the answer is revealed immediately so
 * the following worked example explains the "why". Wrong guesses are welcomed — the
 * value is the generative attempt, so this never touches mastery, XP, or concept stats.
 */
export function PrequestionStep({
  prompt,
  answer,
  revealNote,
  submitted,
  guess,
  onSubmit,
}: PrequestionStepProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    const g = value.trim()
    if (!g) return
    onSubmit(g)
  }

  const spotOn = submitted && guess !== null && isSpotOn(guess, answer)

  return (
    <div>
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-bold text-accent-700">
        🔮 Quick guess first
      </div>
      <RichText className="mb-4 text-base font-medium text-slate-800 sm:text-lg">{prompt}</RichText>

      {!submitted ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9./-]/g, ''))}
              placeholder="Your best guess"
              autoFocus
              className="flex-1 rounded-2xl border-2 border-accent-100 bg-white px-4 py-3 font-mono text-base focus:border-accent-400 focus:outline-none focus:ring-4 focus:ring-accent-100 sm:text-lg"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                submit()
              }}
            />
            <Button onClick={submit} disabled={!value.trim()}>
              Lock in my guess
            </Button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            No grade here — taking a guess first helps the idea stick, even when it’s off.
          </p>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-accent-200 bg-accent-50/60 px-4 py-4">
          <p className="text-base text-slate-800">
            You guessed <span className="font-bold">{guess}</span>. The answer is{' '}
            <span className="font-bold text-accent-700">{String(answer)}</span>
            {revealNote ? ` (${revealNote})` : ''} — let’s see why.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {spotOn ? 'Nice — spot on! 🎯' : 'Guessing wrong actually helps it stick. Watch how it works 👇'}
          </p>
        </div>
      )}
    </div>
  )
}
