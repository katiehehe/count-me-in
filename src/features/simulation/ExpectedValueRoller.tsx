import { useCallback, useEffect, useRef, useState } from 'react'
import { DieIcon } from '../../components/icons/DieIcon'
import { InteractionGuide } from './InteractionGuide'
import { useReducedMotion } from './useReducedMotion'

// The learner must roll enough times to actually watch the average converge.
const GIST_ROLLS = 100

interface ExpectedValueRollerProps {
  /** Number of die sides; faces are 1…sides, each equally likely. */
  sides?: number
  onComplete?: () => void
}

const CHART_HEIGHT = 150
const TICK_COUNT = 4
// Keep the running-average line cheap to draw no matter how many rolls happen.
const MAX_POINTS = 240

const formatTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

/**
 * Rolls a fair `sides`-sided die over and over and plots the running AVERAGE of
 * every roll so far. The line visibly settles onto the expected value
 * (sides + 1) / 2 — making "expected value = long-run average" something the
 * learner watches happen rather than just computes.
 */
export function ExpectedValueRoller({ sides = 11, onComplete }: ExpectedValueRollerProps) {
  const reducedMotion = useReducedMotion()
  const expected = (sides + 1) / 2

  const [count, setCount] = useState(0)
  const [sum, setSum] = useState(0)
  const [face, setFace] = useState<number | null>(null)
  const [avgHistory, setAvgHistory] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [auto, setAuto] = useState(false)

  const completedRef = useRef(false)
  const shuffleRef = useRef<number | null>(null)
  const autoRef = useRef<number | null>(null)
  // Running totals live in refs so updates stay pure (no nested setState) and the
  // auto-roll loop can read the latest count without re-subscribing each tick.
  const countRef = useRef(0)
  const sumRef = useRef(0)

  const average = count > 0 ? sum / count : 0

  const markComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [onComplete])

  // Apply `n` fresh rolls at once, updating the running total + average line.
  const applyRolls = useCallback(
    (n: number) => {
      let added = 0
      let last = 1
      for (let i = 0; i < n; i++) {
        last = 1 + Math.floor(Math.random() * sides)
        added += last
      }
      countRef.current += n
      sumRef.current += added
      const newAvg = sumRef.current / countRef.current
      setFace(last)
      setCount(countRef.current)
      setSum(sumRef.current)
      setAvgHistory((prev) => {
        const next = [...prev, newAvg]
        return next.length > MAX_POINTS
          ? next.filter((_, i) => i % 2 === 0).concat(next[next.length - 1])
          : next
      })
      if (countRef.current >= GIST_ROLLS) markComplete()
    },
    [sides, markComplete],
  )

  // A single roll, with a brief face-shuffle animation before it settles.
  const rollOnce = useCallback(() => {
    if (reducedMotion) {
      applyRolls(1)
      return
    }
    setRolling(true)
    let ticks = 0
    if (shuffleRef.current) window.clearInterval(shuffleRef.current)
    shuffleRef.current = window.setInterval(() => {
      setFace(1 + Math.floor(Math.random() * sides))
      ticks += 1
      if (ticks >= 6) {
        if (shuffleRef.current) window.clearInterval(shuffleRef.current)
        shuffleRef.current = null
        setRolling(false)
        applyRolls(1)
      }
    }, 55)
  }, [applyRolls, reducedMotion, sides])

  // Auto-roll loop: fire a roll on an interval until stopped or the cap is hit.
  useEffect(() => {
    if (!auto) return
    autoRef.current = window.setInterval(() => {
      if (countRef.current >= 1000) {
        setAuto(false)
        return
      }
      applyRolls(1)
    }, 90)
    return () => {
      if (autoRef.current) window.clearInterval(autoRef.current)
    }
  }, [auto, applyRolls])

  useEffect(() => {
    return () => {
      if (shuffleRef.current) window.clearInterval(shuffleRef.current)
      if (autoRef.current) window.clearInterval(autoRef.current)
    }
  }, [])

  const reset = () => {
    setAuto(false)
    countRef.current = 0
    sumRef.current = 0
    setCount(0)
    setSum(0)
    setFace(null)
    setAvgHistory([])
  }

  // Map an average value (in [1, sides]) to a Y pixel in the chart.
  const yFor = (v: number) => {
    const t = (v - 1) / (sides - 1)
    return CHART_HEIGHT - t * CHART_HEIGHT
  }
  const expectedY = yFor(expected)
  const axisTicks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => 1 + ((sides - 1) * i) / TICK_COUNT)
  const points = avgHistory
    .map((v, i) => {
      const x = avgHistory.length <= 1 ? 0 : (i / (avgHistory.length - 1)) * 100
      return `${x},${yFor(v)}`
    })
    .join(' ')

  const gap = count > 0 ? Math.abs(average - expected) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
        <div className="flex flex-col items-center gap-1">
          <div
            className={`transition-transform duration-150 ${rolling ? 'scale-110 -rotate-6' : ''}`}
          >
            <DieIcon value={face ?? 1} className={`h-20 w-20 ${face === null ? 'opacity-30' : ''}`} />
          </div>
          <span className="text-xs font-medium text-slate-400">{sides}-sided die</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl border-2 border-brand-100 bg-white/70 px-4 py-2">
            <div className="text-2xl font-bold text-brand-600">
              {count > 0 ? average.toFixed(2) : '—'}
            </div>
            <div className="text-[11px] text-slate-500">running average</div>
          </div>
          <div className="rounded-2xl border-2 border-success-100 bg-success-50/60 px-4 py-2">
            <div className="text-2xl font-bold text-success-700">{expected.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500">expected value</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-brand-100 bg-white/70 p-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span>average per roll</span>
          <span>{count.toLocaleString()} rolls</span>
        </div>
        <div className="flex">
          <div className="relative mr-2 w-7 shrink-0" style={{ height: CHART_HEIGHT }} aria-hidden>
            {axisTicks.map((t) => (
              <span
                key={t}
                className="absolute right-0 -translate-y-1/2 text-[10px] font-medium text-slate-400"
                style={{ top: yFor(t) }}
              >
                {formatTick(t)}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1" style={{ height: CHART_HEIGHT }}>
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 100 ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden
            >
              {axisTicks.map((t) => (
                <line
                  key={t}
                  x1="0"
                  y1={yFor(t)}
                  x2="100"
                  y2={yFor(t)}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <line
                x1="0"
                y1={expectedY}
                x2="100"
                y2={expectedY}
                stroke="#059669"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              />
              {avgHistory.length > 1 && (
                <polyline
                  points={points}
                  fill="none"
                  stroke="#2d5894"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <span
              className="absolute right-1 -translate-y-1/2 rounded bg-success-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ top: expectedY }}
            >
              {expected.toFixed(1)}
            </span>
          </div>
        </div>
        {gap !== null && (
          <p className="mt-2 text-center text-xs text-slate-500">
            Off the expected value by{' '}
            <span className="font-bold text-brand-600">{gap.toFixed(2)}</span> — keep rolling and
            this shrinks toward 0.
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={rollOnce}
          disabled={rolling || auto}
          className="rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-bold sm:px-5 sm:py-3 sm:text-base text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {rolling ? 'Rolling…' : 'Roll once'}
        </button>
        <button
          type="button"
          onClick={() => applyRolls(50)}
          disabled={auto}
          className="rounded-2xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-bold sm:px-5 sm:py-3 sm:text-base text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60"
        >
          Roll 50×
        </button>
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          className={`rounded-2xl px-4 py-2.5 text-sm font-bold sm:px-5 sm:py-3 sm:text-base transition-colors ${
            auto
              ? 'bg-error-500 text-white hover:bg-error-600'
              : 'border-2 border-brand-200 bg-white text-brand-700 hover:bg-brand-50'
          }`}
        >
          {auto ? 'Stop' : 'Auto-roll'}
        </button>
        {count > 0 && (
          <button
            type="button"
            onClick={reset}
            disabled={auto}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            Reset
          </button>
        )}
      </div>

      <InteractionGuide
        steps={[
          { label: 'Roll once', done: count >= 1 },
          {
            label: `Roll 50× or Auto-roll to reach ${GIST_ROLLS} rolls (${Math.min(count, GIST_ROLLS)}/${GIST_ROLLS})`,
            done: count >= GIST_ROLLS,
          },
        ]}
      />
    </div>
  )
}
