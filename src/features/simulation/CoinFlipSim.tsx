import { useCallback, useEffect, useRef, useState } from 'react'
import { InteractionGuide } from './InteractionGuide'
import { useReducedMotion } from './useReducedMotion'

// Enough flips to actually watch the average of heads settle onto coins/2.
const GIST_FLIPS = 100
const CHART_HEIGHT = 150
const TICK_COUNT = 5
const MAX_POINTS = 240
const AUTO_CAP = 2000

interface CoinFlipSimProps {
  /** Coins flipped per trial. Defaults to 10. */
  coins?: number
  /** Label each coin Xᵢ ∈ {0,1} and show the cumulative ΣXᵢ for the latest flip. */
  showIndicators?: boolean
  onComplete?: () => void
}

const formatTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

/**
 * Flips `coins` fair coins per trial and plots the running AVERAGE number of heads
 * across trials. The line settles onto coins / 2 — making "we expect 5 heads" a
 * thing the learner watches converge, the experimental mirror of the linearity
 * argument (each coin contributes 1/2). Foreshadows indicator variables: each flip
 * is a 0/1 whose long-run average is the per-coin expectation.
 */
export function CoinFlipSim({ coins = 10, showIndicators = false, onComplete }: CoinFlipSimProps) {
  const reducedMotion = useReducedMotion()
  const expected = coins / 2

  const [count, setCount] = useState(0)
  const [sum, setSum] = useState(0)
  const [lastFlip, setLastFlip] = useState<boolean[] | null>(null)
  const [avgHistory, setAvgHistory] = useState<number[]>([])
  const [flipping, setFlipping] = useState(false)
  const [auto, setAuto] = useState(false)

  const completedRef = useRef(false)
  const flipTimer = useRef<number | null>(null)
  const autoRef = useRef<number | null>(null)
  const countRef = useRef(0)
  const sumRef = useRef(0)

  const average = count > 0 ? sum / count : 0
  const lastHeads = lastFlip ? lastFlip.filter(Boolean).length : null

  const markComplete = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [onComplete])

  const applyFlips = useCallback(
    (n: number) => {
      let addedHeads = 0
      let last: boolean[] = []
      for (let t = 0; t < n; t++) {
        last = []
        let heads = 0
        for (let c = 0; c < coins; c++) {
          const isHead = Math.random() < 0.5
          last.push(isHead)
          if (isHead) heads += 1
        }
        addedHeads += heads
      }
      countRef.current += n
      sumRef.current += addedHeads
      const newAvg = sumRef.current / countRef.current
      setLastFlip(last)
      setCount(countRef.current)
      setSum(sumRef.current)
      setAvgHistory((prev) => {
        const next = [...prev, newAvg]
        return next.length > MAX_POINTS
          ? next.filter((_, i) => i % 2 === 0).concat(next[next.length - 1])
          : next
      })
      if (countRef.current >= GIST_FLIPS) markComplete()
    },
    [coins, markComplete],
  )

  const flipOnce = useCallback(() => {
    if (reducedMotion) {
      applyFlips(1)
      return
    }
    setFlipping(true)
    if (flipTimer.current) window.clearTimeout(flipTimer.current)
    flipTimer.current = window.setTimeout(() => {
      setFlipping(false)
      applyFlips(1)
    }, 240)
  }, [applyFlips, reducedMotion])

  useEffect(() => {
    if (!auto) return
    autoRef.current = window.setInterval(() => {
      if (countRef.current >= AUTO_CAP) {
        setAuto(false)
        return
      }
      applyFlips(5)
    }, 60)
    return () => {
      if (autoRef.current) window.clearInterval(autoRef.current)
    }
  }, [auto, applyFlips])

  useEffect(() => {
    return () => {
      if (flipTimer.current) window.clearTimeout(flipTimer.current)
      if (autoRef.current) window.clearInterval(autoRef.current)
    }
  }, [])

  const reset = () => {
    setAuto(false)
    countRef.current = 0
    sumRef.current = 0
    setCount(0)
    setSum(0)
    setLastFlip(null)
    setAvgHistory([])
  }

  const yFor = (v: number) => CHART_HEIGHT - (v / coins) * CHART_HEIGHT
  const expectedY = yFor(expected)
  const axisTicks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (coins * i) / TICK_COUNT)
  const points = avgHistory
    .map((v, i) => {
      const x = avgHistory.length <= 1 ? 0 : (i / (avgHistory.length - 1)) * 100
      return `${x},${yFor(v)}`
    })
    .join(' ')
  const gap = count > 0 ? Math.abs(average - expected) : null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-white/70 p-4">
        <div className="mb-2 text-center text-[11px] font-medium text-slate-400">
          {showIndicators ? 'each coin is Xᵢ = 1 if heads, else 0' : `latest flip of ${coins} coins`}
        </div>
        <div className={`flex flex-wrap justify-center gap-1.5 transition-transform ${flipping ? 'scale-105' : ''}`}>
          {(lastFlip ?? Array.from({ length: coins }, () => null)).map((isHead, i) => (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                flipping
                  ? 'border-amber-300 bg-amber-100 text-amber-500'
                  : isHead === null
                    ? 'border-slate-200 bg-slate-50 text-slate-300'
                    : isHead
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              {flipping
                ? '?'
                : isHead === null
                  ? '·'
                  : showIndicators
                    ? isHead
                      ? '1'
                      : '0'
                    : isHead
                      ? 'H'
                      : 'T'}
            </span>
          ))}
        </div>
        {lastHeads !== null && !flipping && (
          <p className="mt-2 text-center text-sm text-slate-600">
            {showIndicators ? (
              <>
                ΣXᵢ = <span className="font-bold text-brand-600">{lastHeads}</span> heads this flip
              </>
            ) : (
              <>
                <span className="font-bold text-brand-600">{lastHeads}</span> heads this flip
              </>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl border-2 border-brand-100 bg-white/70 px-4 py-2">
          <div className="text-2xl font-bold text-brand-600">{count > 0 ? average.toFixed(2) : '—'}</div>
          <div className="text-[11px] text-slate-500">average heads / flip</div>
        </div>
        <div className="rounded-2xl border-2 border-success-100 bg-success-50/60 px-4 py-2">
          <div className="text-2xl font-bold text-success-700">{expected.toFixed(1)}</div>
          <div className="text-[11px] text-slate-500">expected (n × ½)</div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-brand-100 bg-white/70 p-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <span>average heads</span>
          <span>{count.toLocaleString()} flips</span>
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
            Off the expected {expected.toFixed(1)} by{' '}
            <span className="font-bold text-brand-600">{gap.toFixed(2)}</span> — keep flipping and this
            shrinks toward 0.
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={flipOnce}
          disabled={flipping || auto}
          className="rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-bold sm:px-5 sm:py-3 sm:text-base text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {flipping ? 'Flipping…' : 'Flip once'}
        </button>
        <button
          type="button"
          onClick={() => applyFlips(100)}
          disabled={auto}
          className="rounded-2xl border-2 border-brand-200 bg-white px-4 py-2.5 text-sm font-bold sm:px-5 sm:py-3 sm:text-base text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60"
        >
          Flip 100×
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
          {auto ? 'Stop' : 'Auto-flip'}
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
          { label: 'Flip once', done: count >= 1 },
          {
            label: `Flip 100× or Auto-flip to reach ${GIST_FLIPS} flips (${Math.min(count, GIST_FLIPS)}/${GIST_FLIPS})`,
            done: count >= GIST_FLIPS,
          },
        ]}
      />
    </div>
  )
}
