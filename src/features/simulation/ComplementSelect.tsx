import { useEffect, useRef, useState } from 'react'
import { Math as Tex } from '../../components/Math'
import type { SampleOutcome } from '../../content/types'
import { complement, fracLatex } from '../../content/probabilityMath'

interface ComplementSelectProps {
  outcomes: SampleOutcome[]
  complementIds: string[]
  complementLabel: string
  eventLabel: string
  columns?: number
  onComplete?: () => void
}

/**
 * A "select the complement" explorer. The learner taps the small, easy-to-describe
 * complement set inside a full sample space; when their selection matches it exactly,
 * the target outcomes light up and the answer resolves as 1 − |not A| / |S|. It turns
 * the complement rule's core move — count the easy opposite, then subtract — into an
 * action instead of a formula.
 */
export function ComplementSelect({
  outcomes,
  complementIds,
  complementLabel,
  eventLabel,
  columns,
  onComplete,
}: ComplementSelectProps) {
  const comp = new Set(complementIds)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [solved, setSolved] = useState(false)
  const completedRef = useRef(false)

  const matches = selected.size === comp.size && [...selected].every((id) => comp.has(id))

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
    if (solved) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const total = outcomes.length
  const nComp = complementIds.length
  const p = complement({ n: nComp, d: Math.max(1, total) })
  const overSelected = [...selected].some((id) => !comp.has(id))
  const gridStyle = columns
    ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : undefined

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Tap every outcome in the complement — <span className="font-bold">{complementLabel}</span>. Those
        are the easy ones to count.
      </div>

      <div
        className={`rounded-3xl border-2 border-brand-100 bg-white/70 p-4 ${
          gridStyle ? 'gap-1.5' : 'flex flex-wrap items-center justify-center gap-2'
        }`}
        style={gridStyle}
      >
        {outcomes.map((o) => {
          const isComp = comp.has(o.id)
          const isSelected = selected.has(o.id)
          const compConfirmed = solved && isComp
          const targetConfirmed = solved && !isComp
          return (
            <button
              key={o.id}
              type="button"
              disabled={solved}
              onClick={() => toggle(o.id)}
              aria-label={o.label}
              className={`flex min-w-12 flex-col items-center justify-center rounded-xl border-2 px-2 py-2 font-bold transition-all ${
                outcomes.length > 16 ? 'text-[11px]' : 'text-sm'
              } ${
                compConfirmed
                  ? 'border-amber-400 bg-amber-100 text-amber-800'
                  : targetConfirmed
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : isSelected
                      ? 'border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
              }`}
            >
              {o.emoji && <span className="text-base leading-none">{o.emoji}</span>}
              <span>{o.label}</span>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        {solved ? (
          <p className="text-sm font-semibold text-success-700">
            🎉 The complement is just {nComp} of {total} — so{' '}
            <Tex className="text-success-700">{`P(\\text{${eventLabel}}) = 1 - \\tfrac{${nComp}}{${total}} = ${fracLatex(p)}`}</Tex>
            .
          </p>
        ) : overSelected ? (
          <p className="text-sm font-medium text-error-600">
            One of those is part of “{eventLabel}”, not the complement. The complement is exactly{' '}
            {complementLabel}.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Selected {selected.size} of the {nComp} complement {nComp === 1 ? 'outcome' : 'outcomes'}. Find
            the rest, then we subtract from 1.
          </p>
        )}
      </div>
    </div>
  )
}
