import { useEffect, useRef, useState } from 'react'

interface FactorialDiscoveryProps {
  itemLabel: string
  count: number
  /**
   * Number of slots to fill. Defaults to `count` (a full factorial). Set it
   * smaller to build a partial product like nPr — e.g. count 5, slots 3 fills
   * 5 × 4 × 3.
   */
  slots?: number
  onComplete?: () => void
}

/**
 * Interactive product builder. The learner types how many choices remain for
 * EACH slot (count, then count−1, …), one slot at a time, and watches the
 * running product build up. With `slots === count` this is a full factorial; a
 * smaller `slots` builds a partial product such as an ordered selection (nPr).
 * Completes once every slot is filled in correctly.
 */
export function FactorialDiscovery({ itemLabel, count, slots, onComplete }: FactorialDiscoveryProps) {
  const slotCount = slots ?? count
  const isFullFactorial = slotCount === count
  const expected = Array.from({ length: slotCount }, (_, i) => count - i)
  const [inputs, setInputs] = useState<string[]>(() => Array(slotCount).fill(''))
  const [solved, setSolved] = useState<boolean[]>(() => Array(slotCount).fill(false))
  const completedRef = useRef(false)

  const activeSlot = solved.findIndex((s) => !s)
  const allSolved = activeSlot === -1
  const product = expected.reduce((a, b) => a * b, 1)

  useEffect(() => {
    if (allSolved && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [allSolved, onComplete])

  const handleChange = (i: number, raw: string) => {
    setInputs((prev) => {
      const next = [...prev]
      next[i] = raw
      return next
    })
    const num = parseInt(raw, 10)
    if (num === expected[i]) {
      setSolved((prev) => {
        const next = [...prev]
        next[i] = true
        return next
      })
    }
  }

  const wrongActive =
    !allSolved &&
    inputs[activeSlot].trim() !== '' &&
    parseInt(inputs[activeSlot], 10) !== expected[activeSlot]

  return (
    <div className="space-y-5">
      <div className="flex flex-nowrap items-end justify-center gap-2 overflow-x-auto px-1 pb-1">
        {expected.map((n, i) => {
          const isSolved = solved[i]
          const isActive = i === activeSlot
          return (
            <div key={i} className="flex shrink-0 items-end gap-2">
              {i > 0 && <span className="pb-6 text-xl font-bold text-slate-300">×</span>}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Slot {i + 1}
                </span>
                {isSolved ? (
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-brand-500 bg-brand-50 text-lg font-bold text-brand-700 sm:h-20 sm:w-20">
                    {n}
                    <span className="mt-0.5 text-[10px] font-normal text-slate-500">
                      {itemLabel}
                      {n !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : isActive ? (
                  <input
                    type="number"
                    inputMode="numeric"
                    autoFocus={i > 0}
                    aria-label={`Choices for slot ${i + 1}`}
                    value={inputs[i]}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`h-16 w-16 rounded-2xl border-2 text-center text-lg font-bold focus:outline-none focus:ring-4 sm:h-20 sm:w-20 ${
                      wrongActive
                        ? 'border-error-400 bg-error-50 text-error-700 focus:ring-error-100'
                        : 'animate-pulse border-brand-300 bg-white text-brand-600 focus:ring-brand-100'
                    }`}
                    placeholder="?"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 text-lg font-bold text-slate-300 sm:h-20 sm:w-20">
                    ?
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {solved.some((s) => s) && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-center">
          <p className="font-mono text-lg font-bold text-brand-800">
            {expected.filter((_, i) => solved[i]).join(' × ')}
            {allSolved ? ` = ${product}` : ' × …'}
          </p>
        </div>
      )}

      {wrongActive && (
        <p className="text-center text-sm font-medium text-error-600">
          Not quite — {activeSlot === 0
            ? `how many ${itemLabel}s can go in the first slot?`
            : `given the first ${activeSlot} slot${activeSlot !== 1 ? 's are' : ' is'} already filled, how many ${itemLabel}s are left for slot ${activeSlot + 1}?`}
        </p>
      )}

      {allSolved ? (
        <div className="rounded-xl border-2 border-success-500/30 bg-success-50 px-4 py-4 text-center">
          <p className="text-lg font-bold text-success-700">
            {expected.join(' × ')} = {product}
          </p>
          <p className="mt-1 text-sm text-success-700">
            {isFullFactorial
              ? `We write ${count}! ("${count} factorial") as shorthand for this product.`
              : `That’s ${count}P${slotCount} = ${product} — an ordered selection where each pick leaves one fewer ${itemLabel}.`}
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500">
          {activeSlot === 0
            ? `Slot 1 is empty — how many ${itemLabel}s could you place here?`
            : `Given the first ${activeSlot} slot${activeSlot !== 1 ? 's are' : ' is'} already filled, how many ${itemLabel}s remain for slot ${activeSlot + 1}?`}
        </p>
      )}
    </div>
  )
}
