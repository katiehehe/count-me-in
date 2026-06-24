import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface ProbabilityGambleProps {
  eventALabel: string
  eventBLabel: string
  initialAPercent?: number
  initialBPercent?: number
  onComplete?: () => void
}

interface Dot {
  x: number
  y: number
  win: boolean
}

/**
 * An area model for independent "A and B". The unit square is split by two
 * sliders: a vertical band of width P(A) and a horizontal band of height P(B).
 * Their overlap rectangle is the "A and B" win zone, whose area is exactly
 * P(A) × P(B). Dropping random points (the "spinner") lands inside both regions
 * about P(A)·P(B) of the time, making the multiply rule visible and empirical.
 */
export function ProbabilityGamble({
  eventALabel,
  eventBLabel,
  initialAPercent = 50,
  initialBPercent = 50,
  onComplete,
}: ProbabilityGambleProps) {
  const reducedMotion = useReducedMotion()
  const [aPercent, setAPercent] = useState(initialAPercent)
  const [bPercent, setBPercent] = useState(initialBPercent)
  const [dots, setDots] = useState<Dot[]>([])
  const [spinning, setSpinning] = useState(false)
  const completedRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  const a = aPercent / 100
  const b = bPercent / 100
  const combined = a * b

  const wins = dots.filter((d) => d.win).length
  const empirical = dots.length > 0 ? wins / dots.length : null

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const markComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [onComplete])

  const dropPoints = (count: number) => {
    const next: Dot[] = []
    for (let i = 0; i < count; i++) {
      const x = Math.random()
      const y = Math.random()
      next.push({ x, y, win: x < a && y < b })
    }
    if (count === 1 && !reducedMotion) {
      setSpinning(true)
      timerRef.current = window.setTimeout(() => {
        setDots((prev) => [...prev.slice(-199), ...next])
        setSpinning(false)
        markComplete()
      }, 450)
    } else {
      setDots((prev) => [...prev.slice(-(200 - count)), ...next])
      markComplete()
    }
  }

  const reset = () => setDots([])

  const pct = (v: number) => `${Math.round(v * 1000) / 10}%`

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SliderRow
          label={eventALabel}
          value={aPercent}
          color="#2d5894"
          onChange={(v) => {
            setAPercent(v)
            setDots([])
          }}
        />
        <SliderRow
          label={eventBLabel}
          value={bPercent}
          color="#c2410c"
          onChange={(v) => {
            setBPercent(v)
            setDots([])
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-[18rem]">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-brand-200 bg-white">
          {/* Region A: vertical band from the left, width = P(A) */}
          <div
            className="absolute inset-y-0 left-0 bg-brand-500/15"
            style={{ width: pct(a) }}
            aria-hidden
          />
          {/* Region B: horizontal band from the top, height = P(B) */}
          <div
            className="absolute inset-x-0 top-0 bg-warm-500/15"
            style={{ height: pct(b) }}
            aria-hidden
          />
          {/* Overlap = "A and B" win zone, area = P(A)·P(B) */}
          <div
            className="absolute left-0 top-0 border-2 border-success-500 bg-success-500/30"
            style={{ width: pct(a), height: pct(b) }}
            aria-hidden
          >
            {a > 0.18 && b > 0.12 && (
              <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[10px] font-bold leading-tight text-success-800">
                A and B
              </span>
            )}
          </div>

          {dots.map((d, i) => (
            <span
              key={i}
              className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                d.win ? 'bg-success-600' : 'bg-slate-400/70'
              }`}
              style={{ left: pct(d.x), top: pct(d.y) }}
              aria-hidden
            />
          ))}

          {spinning && (
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-brand-500" />
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        <p className="text-sm text-slate-600">
          P({eventALabel}) × P({eventBLabel}) ={' '}
          <span className="font-mono font-bold text-brand-600">
            {pct(a)} × {pct(b)} = {pct(combined)}
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          The green win zone is exactly P(A) × P(B) of the whole square.
        </p>
        {empirical !== null && (
          <p className="mt-1 text-sm font-semibold text-success-700">
            {wins} of {dots.length} landed in both → {pct(empirical)} (theory: {pct(combined)})
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => dropPoints(1)}
          disabled={spinning}
          className="rounded-2xl bg-brand-500 px-5 py-3 text-base font-bold text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          🎯 Spin once
        </button>
        <button
          type="button"
          onClick={() => dropPoints(100)}
          disabled={spinning}
          className="rounded-2xl border-2 border-brand-300 bg-white px-5 py-3 text-base font-bold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60"
        >
          Spin 100×
        </button>
        {dots.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  color,
  onChange,
}: {
  label: string
  value: number
  color: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block rounded-2xl border-2 border-brand-100 bg-white/70 px-3 py-2.5">
      <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden />
          P({label})
        </span>
        <span className="font-mono text-brand-600">{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label={`Probability of ${label}, percent`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-brand-500"
      />
    </label>
  )
}
