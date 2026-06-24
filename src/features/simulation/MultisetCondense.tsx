import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { InteractionGuide } from './InteractionGuide'
import { allPermutations, factorial } from './permutationMath'
import { useReducedMotion } from './useReducedMotion'

export interface MultisetGroup {
  label: string
  color: string
  count: number
}

interface MultisetCondenseProps {
  groups?: MultisetGroup[]
  onComplete?: () => void
}

interface Card {
  id: string
  n: number
  color: string
  key: string
}

interface ArrowLine {
  d: string
  len: number
  gi: number
}

type Phase = 'intro' | 'perms' | 'nonumbers' | 'condensed'

const DEFAULT_GROUPS: MultisetGroup[] = [
  { label: 'Red', color: '#dc2626', count: 2 },
  { label: 'Blue', color: '#2563eb', count: 2 },
]

// Distinct colors for each condensed pattern (and its bundle of arrows).
const PATTERN_COLORS = [
  '#2563eb',
  '#ea580c',
  '#16a34a',
  '#db2777',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#0d9488',
]

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

function MiniCard({ color, n, showNumber }: { color: string; n: number; showNumber: boolean }) {
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-md border-2 text-[11px] font-bold"
      style={{ backgroundColor: `${color}26`, borderColor: `${color}99`, color: '#334155' }}
    >
      <span style={{ opacity: showNumber ? 1 : 0, transition: 'opacity 450ms ease' }}>{n}</span>
    </span>
  )
}

/**
 * Opening walkthrough for combinations vs permutations. Four cards — two red,
 * two blue, numbered 1–4 — make 4! = 24 distinct orderings. The learner steps
 * through it: generate the 24 orderings, drop the numbers (so the two reds and
 * the two blues become identical), then draw the arrows that condense every
 * group of matching orderings onto a single color pattern — landing on
 * 24 ÷ (2!·2!) = 6, since each pattern is counted 2!·2! = 4 times.
 */
export function MultisetCondense({ groups = DEFAULT_GROUPS, onComplete }: MultisetCondenseProps) {
  const reducedMotion = useReducedMotion()

  const { cards, n, totalPerms, denom, distinct, rows, patterns } = useMemo(() => {
    // Build the numbered cards (e.g. red#1, red#2, blue#3, blue#4).
    const built: Card[] = []
    let counter = 0
    groups.forEach((g, gi) => {
      for (let i = 0; i < g.count; i++) {
        counter += 1
        built.push({ id: `g${gi}-${i}`, n: counter, color: g.color, key: `g${gi}` })
      }
    })
    const size = built.length
    const total = factorial(size)
    const div = groups.reduce((p, g) => p * factorial(g.count), 1)

    // Group every permutation by its color pattern, preserving first-seen order.
    const perms = allPermutations(built)
    const patternOrder: string[] = []
    const byPattern = new Map<string, Card[][]>()
    for (const perm of perms) {
      const key = perm.map((c) => c.key).join('|')
      if (!byPattern.has(key)) {
        byPattern.set(key, [])
        patternOrder.push(key)
      }
      byPattern.get(key)!.push(perm)
    }
    const builtRows: { perm: Card[]; gi: number }[] = []
    patternOrder.forEach((key, gi) => {
      for (const perm of byPattern.get(key)!) builtRows.push({ perm, gi })
    })
    return {
      cards: built,
      n: size,
      totalPerms: total,
      denom: div,
      distinct: total / div,
      rows: builtRows,
      patterns: patternOrder.map((key) => byPattern.get(key)![0]),
    }
  }, [groups])

  const [phase, setPhase] = useState<Phase>('intro')
  const [drawn, setDrawn] = useState(false)
  const [lines, setLines] = useState<ArrowLine[]>([])
  const completedRef = useRef(false)

  const showNumbers = phase === 'intro' || phase === 'perms'
  const showList = phase !== 'intro'
  const condensed = phase === 'condensed'
  const denomExpr = groups.map((g) => `${g.count}!`).join(' × ')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const leftColRef = useRef<HTMLDivElement | null>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const boxRefs = useRef<(HTMLDivElement | null)[]>([])

  const recompute = useCallback(() => {
    const c = containerRef.current
    const col = leftColRef.current
    if (!c || !col) return
    const cRect = c.getBoundingClientRect()
    const colRect = col.getBoundingClientRect()
    const x1 = colRect.right - cRect.left + 8
    const next: ArrowLine[] = []
    rows.forEach((row, i) => {
      const rowEl = rowRefs.current[i]
      const boxEl = boxRefs.current[row.gi]
      if (!rowEl || !boxEl) return
      const r = rowEl.getBoundingClientRect()
      const b = boxEl.getBoundingClientRect()
      const y1 = r.top - cRect.top + r.height / 2
      const x2 = b.left - cRect.left - 4
      const y2 = b.top - cRect.top + b.height / 2
      const dx = x2 - x1
      const c1x = x1 + dx * 0.5
      const c2x = x2 - dx * 0.5
      const d = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`
      next.push({ d, len: cubicLength(x1, y1, c1x, y1, c2x, y2, x2, y2), gi: row.gi })
    })
    setLines(next)
  }, [rows])

  useLayoutEffect(() => {
    if (!condensed) {
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
  }, [condensed, recompute, reducedMotion])

  useEffect(() => {
    if (!condensed) return
    const onResize = () => recompute()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [condensed, recompute])

  useEffect(() => {
    if (condensed && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [condensed, onComplete])

  const caption = () => {
    switch (phase) {
      case 'intro':
        return `${n} cards — 2 red and 2 blue, numbered 1–${n}. As distinct cards they make ${n}! = ${totalPerms} orderings.`
      case 'perms':
        return `All ${totalPerms} orderings of the numbered cards — every one is a different permutation.`
      case 'nonumbers':
        return 'Numbers gone: the two reds are identical and the two blues are identical, so many rows now look exactly the same.'
      case 'condensed':
        return `Each red/blue pattern is counted ${denomExpr} = ${denom} times (swap the 2 reds, swap the 2 blues), so ${totalPerms} ÷ ${denom} = ${distinct} distinct arrangements.`
    }
  }

  const stepButton = () => {
    switch (phase) {
      case 'intro':
        return <Button onClick={() => setPhase('perms')}>Generate all {totalPerms} orderings →</Button>
      case 'perms':
        return <Button onClick={() => setPhase('nonumbers')}>Drop the numbers →</Button>
      case 'nonumbers':
        return <Button onClick={() => setPhase('condensed')}>Draw the arrows →</Button>
      case 'condensed':
        return (
          <Button variant="secondary" onClick={() => setPhase('intro')}>
            ↻ Replay
          </Button>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        {caption()}
      </div>

      {/* The starting deck of numbered cards. */}
      <div className="flex items-center justify-center gap-2">
        {cards.map((card) => (
          <MiniCard key={card.id} color={card.color} n={card.n} showNumber={!showList || showNumbers} />
        ))}
      </div>

      {showList && (
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-3xl border-2 border-brand-100 bg-white/70 p-4"
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <defs>
              {patterns.map((_, gi) => (
                <marker
                  key={gi}
                  id={`ms-arrow-${gi}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill={PATTERN_COLORS[gi % PATTERN_COLORS.length]} />
                </marker>
              ))}
            </defs>
            {lines.map((l, i) => (
              <path
                key={i}
                d={l.d}
                fill="none"
                stroke={PATTERN_COLORS[l.gi % PATTERN_COLORS.length]}
                strokeWidth={1.75}
                strokeLinecap="round"
                markerEnd={`url(#ms-arrow-${l.gi})`}
                strokeDasharray={l.len}
                strokeDashoffset={drawn ? 0 : l.len}
                style={{
                  transition: reducedMotion ? 'none' : 'stroke-dashoffset 600ms ease',
                  transitionDelay: reducedMotion ? '0ms' : `${i * 25}ms`,
                }}
              />
            ))}
          </svg>

          <div className="relative flex items-stretch justify-between gap-4 sm:gap-8">
            <div ref={leftColRef} className="shrink-0 space-y-1">
              {rows.map((row, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    rowRefs.current[i] = el
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span className="w-5 shrink-0 text-right text-[10px] font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    {row.perm.map((card, j) => (
                      <MiniCard
                        key={`${card.id}-${j}`}
                        color={card.color}
                        n={card.n}
                        showNumber={showNumbers}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex shrink-0 flex-col justify-around py-1">
              {patterns.map((pattern, gi) => (
                <div
                  key={gi}
                  ref={(el) => {
                    boxRefs.current[gi] = el
                  }}
                  className="flex items-center gap-1 rounded-xl border-2 px-2 py-1.5 transition-all duration-300"
                  style={
                    condensed
                      ? {
                          borderColor: PATTERN_COLORS[gi % PATTERN_COLORS.length],
                          backgroundColor: `${PATTERN_COLORS[gi % PATTERN_COLORS.length]}12`,
                        }
                      : { borderColor: '#cbd5e1', borderStyle: 'dashed' }
                  }
                >
                  {pattern.map((card, j) => (
                    <MiniCard key={`p-${gi}-${j}`} color={card.color} n={card.n} showNumber={false} />
                  ))}
                  {condensed && (
                    <span
                      className="ml-1 rounded px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: PATTERN_COLORS[gi % PATTERN_COLORS.length] }}
                    >
                      ×{denom}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showList && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
          <span className="text-slate-500">{totalPerms} orderings</span>
          <span className="text-slate-300">→</span>
          <span className={condensed ? 'text-success-700' : 'text-slate-400'}>
            {distinct} distinct patterns
          </span>
        </div>
      )}

      <div className="flex justify-center">{stepButton()}</div>

      <InteractionGuide
        steps={[
          { label: `Generate all ${totalPerms} orderings →`, done: phase !== 'intro' },
          { label: 'Drop the numbers →', done: phase === 'nonumbers' || phase === 'condensed' },
          { label: 'Draw the arrows →', done: condensed },
        ]}
      />
    </div>
  )
}
