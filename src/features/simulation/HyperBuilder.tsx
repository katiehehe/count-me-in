import { useEffect, useRef, useState } from 'react'
import { Math as Tex } from '../../components/Math'
import { choose, fracText, hyperProb } from '../../content/probabilityMath'

interface HyperBuilderProps {
  total: number
  special: number
  draw: number
  target: number
  specialLabel: string
  otherLabel: string
  onComplete?: () => void
}

/**
 * Builds the favorable count of a hypergeometric draw by hand: the learner steps how
 * many of the special items are in the draw, and the favorable count
 * C(special,k)·C(other,draw−k) and the probability update live. Forming the target k
 * completes the step — making "favorable ÷ total, each counted with combinations" tangible.
 */
export function HyperBuilder({
  total,
  special,
  draw,
  target,
  specialLabel,
  otherLabel,
  onComplete,
}: HyperBuilderProps) {
  const other = total - special
  const minK = Math.max(0, draw - other)
  const maxK = Math.min(special, draw)
  const [k, setK] = useState(minK)
  const completedRef = useRef(false)

  const favorable = choose(special, k) * choose(total - special, draw - k)
  const p = hyperProb(total, special, draw, k)
  const solved = k === target

  useEffect(() => {
    if (solved && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [solved, onComplete])

  const chip = (filled: boolean, color: 'special' | 'other') => {
    const base = color === 'special' ? '#e11d54' : '#2d5894'
    return {
      backgroundColor: filled ? base : '#ffffff',
      borderColor: base,
      opacity: filled ? 1 : 0.35,
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Draw {draw} of {total}. Use −/+ to set how many are {specialLabel}; aim for{' '}
        <span className="font-bold">
          {target} {specialLabel}
        </span>
        .
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-3xl border-2 border-brand-100 bg-white/70 p-4">
        {Array.from({ length: special }).map((_, i) => (
          <span
            key={`s${i}`}
            className="h-7 w-7 rounded-full border-2"
            style={chip(i < k, 'special')}
            aria-hidden
          />
        ))}
        <span className="mx-1 text-slate-300">|</span>
        {Array.from({ length: other }).map((_, i) => (
          <span
            key={`o${i}`}
            className="h-7 w-7 rounded-full border-2"
            style={chip(i < draw - k, 'other')}
            aria-hidden
          />
        ))}
      </div>

      <div className="flex justify-center gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#e11d54' }} aria-hidden />
          {specialLabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#2d5894' }} aria-hidden />
          {otherLabel}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setK((v) => Math.max(minK, v - 1))}
          disabled={k <= minK}
          className="h-10 w-10 rounded-full border-2 border-brand-200 text-lg font-bold text-brand-700 disabled:opacity-40"
        >
          −
        </button>
        <span className="text-sm text-slate-600">
          {k} {specialLabel} drawn
        </span>
        <button
          type="button"
          onClick={() => setK((v) => Math.min(maxK, v + 1))}
          disabled={k >= maxK}
          className="h-10 w-10 rounded-full border-2 border-brand-200 text-lg font-bold text-brand-700 disabled:opacity-40"
        >
          +
        </button>
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        <Tex className="text-slate-700">{`\\binom{${special}}{${k}}\\binom{${other}}{${draw - k}} = ${favorable}`}</Tex>
        <div className="mt-1 text-sm text-slate-600">
          P ={' '}
          <Tex className="text-brand-700">{`\\dfrac{${favorable}}{${choose(total, draw)}} = ${fracText(p)}`}</Tex>
        </div>
        {solved && (
          <p className="mt-2 text-sm font-semibold text-success-700">
            🎉 Exactly {target} {specialLabel}: favorable {favorable} of {choose(total, draw)} → {fracText(p)}.
          </p>
        )}
      </div>
    </div>
  )
}
