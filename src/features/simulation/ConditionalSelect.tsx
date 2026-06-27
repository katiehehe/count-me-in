import { useEffect, useRef, useState } from 'react'
import { Math as Tex } from '../../components/Math'
import type { SampleOutcome } from '../../content/types'
import { conditionalProb, fracLatex } from '../../content/probabilityMath'

interface ConditionalSelectProps {
  outcomes: SampleOutcome[]
  givenIds: string[]
  favorableIds: string[]
  givenLabel: string
  favorableLabel: string
  onComplete?: () => void
}

/**
 * A clickable sample-space explorer for conditioning. Outcomes OUTSIDE the given
 * event B dim away (B becomes the whole world), and the learner taps every outcome
 * that is also A. When their selection matches A ∩ B exactly, the step completes and
 * the conditional probability |A∩B|/|B| resolves — making "restrict, then count"
 * something the learner does, not just reads.
 */
export function ConditionalSelect({
  outcomes,
  givenIds,
  favorableIds,
  givenLabel,
  favorableLabel,
  onComplete,
}: ConditionalSelectProps) {
  const given = new Set(givenIds)
  const fav = new Set(favorableIds)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [solved, setSolved] = useState(false)
  const completedRef = useRef(false)

  const matches =
    selected.size === fav.size && [...selected].every((id) => fav.has(id))

  useEffect(() => {
    if (matches && !solved) {
      setSolved(true)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
    }
  }, [matches, solved, onComplete])

  const toggle = (id: string) => {
    if (solved || !given.has(id)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const p = conditionalProb(favorableIds.length, givenIds.length)
  const overSelected = [...selected].some((id) => !fav.has(id))

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Given <span className="font-bold">{givenLabel}</span>, tap every outcome that is{' '}
        <span className="font-bold">{favorableLabel}</span>.
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border-2 border-brand-100 bg-white/70 p-4">
        {outcomes.map((o) => {
          const inGiven = given.has(o.id)
          const isSelected = selected.has(o.id)
          const confirmed = solved && fav.has(o.id)
          return (
            <button
              key={o.id}
              type="button"
              disabled={!inGiven || solved}
              onClick={() => toggle(o.id)}
              aria-label={o.label}
              className={`flex h-14 min-w-14 flex-col items-center justify-center rounded-xl border-2 px-2 text-sm font-bold transition-all ${
                !inGiven
                  ? 'border-slate-200 bg-slate-50 text-slate-300 opacity-40'
                  : confirmed
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
              }`}
            >
              {o.emoji && <span className="text-lg leading-none">{o.emoji}</span>}
              <span className={o.emoji ? 'text-[11px]' : ''}>{o.label}</span>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        {solved ? (
          <p className="text-sm font-semibold text-success-700">
            🎉 That is the favorable set inside the given {givenIds.length} —{' '}
            <Tex className="text-success-700">{`P = ${fracLatex(p)}`}</Tex>.
          </p>
        ) : overSelected ? (
          <p className="text-sm font-medium text-error-600">
            One of those is not {favorableLabel}. Remember the world is now just the highlighted given
            set.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            The dimmed outcomes are outside the given set, so they no longer count. Selected{' '}
            {selected.size} of the {givenIds.length} possible.
          </p>
        )}
      </div>
    </div>
  )
}
