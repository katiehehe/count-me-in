import { useEffect, useRef, useState } from 'react'
import { Math as Tex } from '../../components/Math'
import { choose } from '../../content/probabilityMath'

interface SequenceBuilderProps {
  slots: number
  heads: number
  /** Label for a chosen slot (default 'H'). */
  onLabel?: string
  /** Label for an unchosen slot (default 'T'). */
  offLabel?: string
  /** What is being placed, for the banner/status (default 'heads'). */
  unit?: string
  onComplete?: () => void
}

const keyOf = (s: Set<number>) => [...s].sort((a, b) => a - b).join(',')

/**
 * "Build every arrangement" explorer for the binomial count: the learner taps slots
 * to place exactly `heads` chosen slots among `slots`, and each new distinct arrangement
 * is recorded until all C(slots, heads) are found. It turns "how many ways?" into a thing
 * the learner enumerates, making C(n,k) concrete before the formula names it. Labels are
 * configurable so it works for coins (H/T) or binomial factors (b/a).
 */
export function SequenceBuilder({
  slots,
  heads,
  onLabel = 'H',
  offLabel = 'T',
  unit = 'heads',
  onComplete,
}: SequenceBuilderProps) {
  const total = choose(slots, heads)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [found, setFound] = useState<string[]>([])
  const completedRef = useRef(false)

  const solved = found.length >= total

  useEffect(() => {
    if (selected.size !== heads) return
    const key = keyOf(selected)
    setFound((prev) => (prev.includes(key) ? prev : [...prev, key]))
  }, [selected, heads])

  useEffect(() => {
    if (found.length >= total && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [found, total, onComplete])

  const toggle = (i: number) => {
    if (solved) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const currentKey = selected.size === heads ? keyOf(selected) : null
  const alreadyFound = currentKey !== null && found.includes(currentKey)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Tap slots to choose exactly <span className="font-bold">{heads} {unit}</span>. Find all the
        different arrangements.
      </div>

      <div className="flex justify-center gap-2 rounded-3xl border-2 border-brand-100 bg-white/70 p-4">
        {Array.from({ length: slots }).map((_, i) => {
          const head = selected.has(i)
          return (
            <button
              key={i}
              type="button"
              disabled={solved}
              onClick={() => toggle(i)}
              aria-label={`Slot ${i + 1}: ${head ? onLabel : offLabel}`}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-bold transition-all ${
                head
                  ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-400 hover:border-brand-300'
              }`}
            >
              {head ? onLabel : offLabel}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        {solved ? (
          <p className="text-sm font-semibold text-success-700">
            🎉 All {total} arrangements — that’s{' '}
            <Tex className="text-success-700">{`\\binom{${slots}}{${heads}} = ${total}`}</Tex>.
          </p>
        ) : selected.size !== heads ? (
          <p className="text-sm text-slate-600">
            {selected.size} of {heads} {unit} placed. Found{' '}
            <span className="font-bold text-brand-600">{found.length}</span> of {total} arrangements.
          </p>
        ) : alreadyFound ? (
          <p className="text-sm font-medium text-slate-500">
            Already found that one — rearrange to a new pattern. {found.length} of {total} so far.
          </p>
        ) : (
          <p className="text-sm font-semibold text-success-700">
            New arrangement! {found.length} of {total} found.
          </p>
        )}
      </div>

      {found.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {found.map((key) => {
            const headSet = new Set(key.split(',').map(Number))
            return (
              <div key={key} className="flex gap-0.5 rounded-lg border border-slate-200 bg-white p-1.5">
                {Array.from({ length: slots }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-3.5 w-3.5 rounded-full border ${
                      headSet.has(i) ? 'border-brand-500 bg-brand-500' : 'border-slate-300 bg-white'
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
