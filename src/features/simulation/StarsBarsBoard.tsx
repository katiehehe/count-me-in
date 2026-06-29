import { Fragment, useEffect, useRef, useState } from 'react'
import { Math as Tex } from '../../components/Math'
import { starsAndBars } from '../../content/probabilityMath'

interface StarsBarsBoardProps {
  n: number
  k: number
  /** The distribution to form (length k, sums to n). */
  target: number[]
  itemLabel?: string
  binLabel?: string
  onComplete?: () => void
}

/** Star counts between consecutive bars: the (x₁,…,x_k) the bar positions encode. */
function groupsFromBars(bars: number[], n: number): number[] {
  const sorted = [...bars].sort((a, b) => a - b)
  const groups: number[] = []
  let prev = 0
  for (const g of sorted) {
    groups.push(g - prev)
    prev = g
  }
  groups.push(n - prev)
  return groups
}

/**
 * Draggable stars-and-bars board. The learner drags (or taps) the k−1 bars among the n
 * stars; the live tuple (x₁,…,x_k) updates as the bars move. Forming the target split
 * completes the step — making the bijection "bar positions ↔ a distribution" tangible.
 * Pointer-based drag works on mouse and touch; tapping a bar cycles it one gap right.
 */
export function StarsBarsBoard({
  n,
  k,
  target,
  itemLabel = 'items',
  binLabel = 'bins',
  onComplete,
}: StarsBarsBoardProps) {
  const numBars = k - 1
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: numBars }, () => 0))
  const [explored, setExplored] = useState<Set<string>>(() => new Set([groupsFromBars(Array.from({ length: numBars }, () => 0), n).join(',')]))
  const completedRef = useRef(false)
  const dragBar = useRef<number | null>(null)
  const movedRef = useRef(false)
  const startPt = useRef<{ x: number; y: number } | null>(null)

  const groups = groupsFromBars(bars, n)
  const total = starsAndBars(n, k)
  const solved = groups.length === target.length && groups.every((g, i) => g === target[i])

  useEffect(() => {
    const key = groupsFromBars(bars, n).join(',')
    setExplored((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
  }, [bars, n])

  useEffect(() => {
    if (solved && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [solved, onComplete])

  const setBar = (i: number, gap: number) =>
    setBars((prev) => {
      const next = [...prev]
      next[i] = Math.max(0, Math.min(n, gap))
      return next
    })

  const gapFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    const node = el?.closest('[data-gap-index]') as HTMLElement | null
    if (!node) return null
    const idx = Number(node.dataset.gapIndex)
    return Number.isNaN(idx) ? null : idx
  }

  const onPointerDown = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault()
    dragBar.current = i
    movedRef.current = false
    startPt.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragBar.current === null) return
    const s = startPt.current
    if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 6) movedRef.current = true
    if (movedRef.current) {
      const g = gapFromPoint(e.clientX, e.clientY)
      if (g !== null) setBar(dragBar.current, g)
    }
  }
  const onPointerUp = () => {
    if (dragBar.current === null) return
    if (!movedRef.current) setBar(dragBar.current, (bars[dragBar.current] + 1) % (n + 1))
    dragBar.current = null
    movedRef.current = false
    startPt.current = null
  }
  const cancel = () => {
    dragBar.current = null
    movedRef.current = false
    startPt.current = null
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Drag (or tap) the {numBars} bars among the {n} stars to split the {itemLabel} as{' '}
        <span className="font-bold">({target.join(', ')})</span>.
      </div>

      <div
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={cancel}
        className="flex touch-none items-center justify-center gap-0.5 overflow-x-auto rounded-3xl border-2 border-brand-100 bg-white/70 p-4"
      >
        {Array.from({ length: n + 1 }).map((_, gap) => (
          <Fragment key={gap}>
            <div
              data-gap-index={gap}
              className={`flex h-12 min-w-7 items-center justify-center gap-0.5 rounded-md ${
                bars.includes(gap) ? 'bg-brand-50' : 'border border-dashed border-slate-200'
              }`}
            >
              {bars.map((bg, i) =>
                bg === gap ? (
                  <button
                    key={i}
                    type="button"
                    onPointerDown={onPointerDown(i)}
                    aria-label="bar"
                    className="h-10 w-2.5 shrink-0 cursor-grab touch-none rounded bg-brand-500 shadow-sm active:cursor-grabbing"
                  />
                ) : null,
              )}
            </div>
            {gap < n && (
              <span className="shrink-0 text-2xl text-amber-500" aria-hidden>
                ★
              </span>
            )}
          </Fragment>
        ))}
      </div>

      <div className="text-center">
        <Tex className="text-slate-700">{`(${groups.join(',\\,')}) :\\; ${groups.join(' + ')} = ${n}`}</Tex>
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm shadow-sm shadow-brand-100/40">
        {solved ? (
          <p className="font-semibold text-success-700">
            🎉 You formed ({target.join(', ')})! There are {total} possible splits of {n} {itemLabel}{' '}
            into {k} {binLabel} in all.
          </p>
        ) : (
          <p className="text-slate-600">
            Current split: <span className="font-bold text-brand-600">({groups.join(', ')})</span>. Splits
            explored: {explored.size} of {total}.
          </p>
        )}
      </div>
    </div>
  )
}
