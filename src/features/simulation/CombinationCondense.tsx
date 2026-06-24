import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ConnectionGroupItem } from '../../content/types'
import { Button } from '../../components/Button'
import { allPermutations, factorial, formatFactorial } from './permutationMath'
import { useReducedMotion } from './useReducedMotion'

interface CombinationCondenseProps {
  items: ConnectionGroupItem[]
  groupLabel?: string
  onComplete?: () => void
}

interface ArrowLine {
  d: string
  len: number
}

/** Approximate length of a cubic Bézier by sampling — used for the draw-on animation. */
function cubicLength(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
) {
  let len = 0
  let px = x0
  let py = y0
  const N = 18
  for (let i = 1; i <= N; i++) {
    const t = i / N
    const mt = 1 - t
    const a = mt * mt * mt
    const b = 3 * mt * mt * t
    const c = 3 * mt * t * t
    const e = t * t * t
    const x = a * x0 + b * x1 + c * x2 + e * x3
    const y = a * y0 + b * y1 + c * y2 + e * y3
    len += Math.hypot(x - px, y - py)
    px = x
    py = y
  }
  return len
}

function Chip({ item }: { item: ConnectionGroupItem }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg border-2 px-2 py-1 text-xs font-bold"
      style={{
        backgroundColor: `${item.color}1f`,
        borderColor: `${item.color}66`,
        color: '#334155',
      }}
    >
      <span aria-hidden>{item.emoji ?? '•'}</span>
      {item.label}
    </span>
  )
}

/**
 * Visualizes overcounting: every one of the k! ordered arrangements of the same
 * chosen group is a DIFFERENT permutation but the SAME unordered combination.
 * All k! permutation rows on the left are joined by arrows to a single
 * combination card on the right, making "divide by k!" concrete.
 */
export function CombinationCondense({
  items,
  groupLabel = 'group',
  onComplete,
}: CombinationCondenseProps) {
  const reducedMotion = useReducedMotion()
  const perms = allPermutations(items)
  const k = items.length
  const kFact = factorial(k)
  const [mapped, setMapped] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const [lines, setLines] = useState<ArrowLine[]>([])
  const completedRef = useRef(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLDivElement | null>(null)
  const leftColRef = useRef<HTMLDivElement | null>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  const recompute = useCallback(() => {
    const c = containerRef.current
    const t = targetRef.current
    const col = leftColRef.current
    if (!c || !t || !col) return
    const cRect = c.getBoundingClientRect()
    const tRect = t.getBoundingClientRect()
    const colRect = col.getBoundingClientRect()
    const x2 = tRect.left - cRect.left - 4
    const y2 = tRect.top - cRect.top + tRect.height / 2
    // Start every connector from the same vertical line just right of the left
    // column so they don't stagger with each row's varying width.
    const x1 = colRect.right - cRect.left + 8
    const dx = x2 - x1
    const next: ArrowLine[] = []
    for (const row of rowRefs.current) {
      if (!row) continue
      const r = row.getBoundingClientRect()
      const y1 = r.top - cRect.top + r.height / 2
      // Cubic Bézier with horizontal tangents at both ends → a smooth bundle
      // that leaves each row level and arrives level into the team card.
      const c1x = x1 + dx * 0.5
      const c2x = x2 - dx * 0.5
      const d = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`
      next.push({ d, len: cubicLength(x1, y1, c1x, y1, c2x, y2, x2, y2) })
    }
    setLines(next)
  }, [])

  useLayoutEffect(() => {
    if (!mapped) {
      setLines([])
      setDrawn(false)
      return
    }
    recompute()
    if (reducedMotion) {
      setDrawn(true)
      return
    }
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [mapped, recompute, reducedMotion])

  useEffect(() => {
    if (!mapped) return
    const onResize = () => recompute()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mapped, recompute])

  const handleMap = () => {
    setMapped(true)
    if (!completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        These {kFact} orderings all use the same {k} people — so they are the same {groupLabel}.
      </div>

      <div ref={containerRef} className="relative rounded-3xl border-2 border-brand-100 bg-white/70 p-4">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <marker
              id="combo-arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#16a34a" />
            </marker>
          </defs>
          {lines.map((l, i) => (
            <path
              key={i}
              d={l.d}
              fill="none"
              stroke="#16a34a"
              strokeWidth={2}
              strokeLinecap="round"
              markerEnd="url(#combo-arrowhead)"
              strokeDasharray={l.len}
              strokeDashoffset={drawn ? 0 : l.len}
              style={{
                transition: reducedMotion ? 'none' : 'stroke-dashoffset 550ms ease',
                transitionDelay: reducedMotion ? '0ms' : `${i * 70}ms`,
              }}
            />
          ))}
        </svg>

        <div className="relative flex items-center justify-between gap-4 sm:gap-6">
          <div ref={leftColRef} className="shrink-0 space-y-2">
            {perms.map((perm, i) => (
              <div
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el
                }}
                className="flex items-center gap-2"
              >
                <span className="w-5 shrink-0 text-right text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {perm.map((item, j) => (
                    <Chip key={`${item.id}-${j}`} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex w-28 shrink-0 items-center justify-center sm:w-44">
            <div
              ref={targetRef}
              className={`rounded-2xl border-2 px-3 py-3 text-center transition-all duration-300 ${
                mapped
                  ? 'border-success-500 bg-success-50'
                  : 'border-dashed border-slate-300 bg-slate-50/60'
              }`}
            >
              {mapped ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-success-600">
                    1 {groupLabel}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {items.map((item) => (
                      <Chip key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400">
                  the unique
                  <br />
                  {groupLabel} goes
                  <br />
                  here
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {mapped && (
        <p className="text-center text-sm font-semibold text-success-700">
          All {kFact} permutations point to the same {groupLabel} → divide by {k}! ={' '}
          {formatFactorial(k)} = {kFact}.
        </p>
      )}

      <div className="flex justify-center">
        {!mapped ? (
          <Button onClick={handleMap}>Map all {kFact} → 1 {groupLabel} →</Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              setMapped(false)
            }}
          >
            ↻ Replay
          </Button>
        )}
      </div>
    </div>
  )
}
