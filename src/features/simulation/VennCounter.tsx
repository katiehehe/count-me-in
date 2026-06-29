import { useEffect, useRef, useState } from 'react'

interface VennCounterProps {
  a: number
  b: number
  both: number
  aLabel: string
  bLabel: string
  onComplete?: () => void
}

/**
 * Interactive inclusion–exclusion counter. The learner adds |A|, then adds |B| — and
 * watches the running total over-count because the overlap was added twice — then
 * subtracts |A ∩ B| once to land on the true union. Enacting include–include–exclude
 * makes "subtract the double-count" something the learner does, not just reads.
 */
export function VennCounter({ a, b, both, aLabel, bLabel, onComplete }: VennCounterProps) {
  const [addedA, setAddedA] = useState(false)
  const [addedB, setAddedB] = useState(false)
  const [subtracted, setSubtracted] = useState(false)
  const completedRef = useRef(false)

  const union = a + b - both
  const total = (addedA ? a : 0) + (addedB ? b : 0) - (subtracted ? both : 0)
  const doubleCounted = addedA && addedB && !subtracted
  const solved = addedA && addedB && subtracted

  useEffect(() => {
    if (solved && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [solved, onComplete])

  const btn =
    'rounded-2xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Build <span className="font-bold">|{aLabel} ∪ {bLabel}|</span>: add each set, then fix the
        double-count.
      </div>

      <svg viewBox="0 0 240 150" className="mx-auto w-full max-w-xs" role="img" aria-label="Venn counter">
        <defs>
          <clipPath id="venn-counter-clip">
            <circle cx="150" cy="80" r="56" />
          </clipPath>
        </defs>
        <rect x="2" y="2" width="236" height="146" rx="14" fill="#f8fafc" stroke="#e2e8f0" />
        <circle
          cx="90"
          cy="80"
          r="56"
          fill="#e11d5422"
          stroke="#e11d54"
          strokeWidth="2"
          style={{ opacity: addedA ? 1 : 0.25, transition: 'opacity 300ms ease' }}
        />
        <circle
          cx="150"
          cy="80"
          r="56"
          fill="#2d589422"
          stroke="#2d5894"
          strokeWidth="2"
          style={{ opacity: addedB ? 1 : 0.25, transition: 'opacity 300ms ease' }}
        />
        <circle
          cx="90"
          cy="80"
          r="56"
          clipPath="url(#venn-counter-clip)"
          fill={solved ? '#15803d' : '#f59e0b'}
          fillOpacity={doubleCounted || solved ? 0.55 : 0}
          style={{ transition: 'fill 300ms ease, fill-opacity 300ms ease' }}
        />
        {addedA && (
          <text x="62" y="86" textAnchor="middle" fontSize="16" fontWeight="700" fill="#be123c">
            {a - both}
          </text>
        )}
        {addedB && (
          <text x="178" y="86" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1e3f6f">
            {b - both}
          </text>
        )}
        {(doubleCounted || solved) && (
          <text x="120" y="86" textAnchor="middle" fontSize="16" fontWeight="700" fill="#78350f">
            {both}
          </text>
        )}
      </svg>

      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-4xl font-bold ${
            solved ? 'text-success-700' : doubleCounted ? 'text-amber-600' : 'text-brand-600'
          }`}
        >
          {total}
        </span>
        <span className="text-xs text-slate-500">running total</span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setAddedA(true)}
          disabled={addedA}
          className={`${btn} border-2 border-error-200 bg-white text-error-600 hover:bg-error-50`}
        >
          + |{aLabel}| ({a})
        </button>
        <button
          type="button"
          onClick={() => setAddedB(true)}
          disabled={addedB}
          className={`${btn} border-2 border-brand-200 bg-white text-brand-700 hover:bg-brand-50`}
        >
          + |{bLabel}| ({b})
        </button>
        <button
          type="button"
          onClick={() => setSubtracted(true)}
          disabled={!doubleCounted}
          className={`${btn} ${
            doubleCounted
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'border-2 border-slate-200 bg-white text-slate-400'
          }`}
        >
          − overlap ({both})
        </button>
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm shadow-sm shadow-brand-100/40">
        {solved ? (
          <p className="font-semibold text-success-700">
            🎉 |{aLabel} ∪ {bLabel}| = {a} + {b} − {both} = {union}. Each region is now counted exactly once.
          </p>
        ) : doubleCounted ? (
          <p className="font-medium text-amber-700">
            {a} + {b} = {a + b}, but the {both} in the overlap got counted twice. Subtract it once!
          </p>
        ) : (
          <p className="text-slate-600">Add both sets first, then correct the overlap.</p>
        )}
      </div>
    </div>
  )
}
