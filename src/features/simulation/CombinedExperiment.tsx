import { useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface CombinedExperimentProps {
  trials?: number
  dieFaces?: number
  targetFace: number
  coinLabels?: [string, string]
  targetCoinIndex: 0 | 1
  onComplete?: () => void
}

const CHART_HEIGHT = 150
const BINS = 15

/**
 * Runs batches of combined die-roll + coin-flip trials, each counting how often
 * BOTH the target face AND the target coin side come up. Every batch's hit count
 * is recorded and plotted as a histogram so the learner sees the counts scatter
 * around the expected mean of trials × (1/dieFaces) × (1/2).
 */
export function CombinedExperiment({
  trials = 1200,
  dieFaces = 6,
  targetFace,
  coinLabels = ['Heads', 'Tails'],
  targetCoinIndex,
  onComplete,
}: CombinedExperimentProps) {
  const reducedMotion = useReducedMotion()
  const [history, setHistory] = useState<number[]>([])
  const [running, setRunning] = useState(false)
  const completedRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  const expected = Math.round(trials / (dieFaces * 2))
  const coinLabel = coinLabels[targetCoinIndex]

  const runBatch = (): number => {
    let hits = 0
    for (let i = 0; i < trials; i++) {
      const face = 1 + Math.floor(Math.random() * dieFaces)
      const coin = Math.floor(Math.random() * 2)
      if (face === targetFace && coin === targetCoinIndex) hits++
    }
    return hits
  }

  const addRuns = (n: number) => {
    const apply = () => {
      const next: number[] = []
      for (let i = 0; i < n; i++) next.push(runBatch())
      setHistory((prev) => [...prev, ...next])
      setRunning(false)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
    }
    if (reducedMotion) {
      apply()
      return
    }
    setRunning(true)
    timerRef.current = window.setTimeout(apply, 350)
  }

  const reset = () => setHistory([])

  const runs = history.length
  const latest = runs ? history[runs - 1] : null
  const mean = runs ? history.reduce((a, b) => a + b, 0) / runs : 0

  const lo = Math.min(expected, ...(runs ? history : [expected])) - 4
  const hi = Math.max(expected, ...(runs ? history : [expected])) + 4
  const start = Math.max(0, lo)
  const binWidth = Math.max(1, Math.ceil((hi - start) / BINS))
  const span = binWidth * BINS
  const bins = Array<number>(BINS).fill(0)
  for (const v of history) {
    const idx = Math.min(BINS - 1, Math.max(0, Math.floor((v - start) / binWidth)))
    bins[idx]++
  }
  const maxBin = Math.max(1, ...bins)
  const expectedLeft = Math.min(100, Math.max(0, ((expected - start) / span) * 100))

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-brand-700">
          Each trial: roll a {dieFaces}-sided die <span aria-hidden>🎲</span> and flip a coin{' '}
          <span aria-hidden>🪙</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Each batch = {trials.toLocaleString()} trials, counting how many are{' '}
          <span className="font-bold">{targetFace}</span> AND{' '}
          <span className="font-bold">{coinLabel}</span>
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => addRuns(1)}
          disabled={running}
          className="rounded-2xl bg-brand-500 px-5 py-3 text-base font-bold text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {running ? 'Running…' : `Run a batch (${trials.toLocaleString()})`}
        </button>
        <button
          type="button"
          onClick={() => addRuns(25)}
          disabled={running}
          className="rounded-2xl border-2 border-brand-200 bg-white px-5 py-3 text-base font-bold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60"
        >
          Run 25 batches
        </button>
        {runs > 0 && (
          <button
            type="button"
            onClick={reset}
            disabled={running}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            Reset
          </button>
        )}
      </div>

      {latest !== null && (
        <p className="text-center text-sm text-slate-600">
          Latest batch: <span className="font-bold text-brand-600">{latest}</span> trials were{' '}
          {targetFace} AND {coinLabel}
        </p>
      )}

      {runs > 0 && (
        <div className="rounded-2xl border-2 border-brand-100 bg-white/70 p-4">
          <p className="mb-3 text-center text-sm font-semibold text-slate-600">
            Count of “{targetFace} and {coinLabel}” across {runs} batch{runs !== 1 ? 'es' : ''}
          </p>
          <div className="relative" style={{ height: CHART_HEIGHT }}>
            <div className="absolute inset-0 flex items-end gap-px">
              {bins.map((c, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-500 to-accent-400 transition-[height] duration-300"
                  style={{ height: `${(c / maxBin) * 100}%` }}
                  aria-label={`${start + i * binWidth}–${start + (i + 1) * binWidth - 1}: ${c} batches`}
                />
              ))}
            </div>
            <div
              className="absolute bottom-0 top-0 border-l-2 border-dashed border-warm-500"
              style={{ left: `${expectedLeft}%` }}
            >
              <span className="absolute -top-1 -translate-x-1/2 whitespace-nowrap rounded bg-warm-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                expected {expected}
              </span>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
            <span>{start}</span>
            <span>count per batch →</span>
            <span>{start + span}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-lg font-bold text-slate-700">{mean.toFixed(1)}</div>
              <div className="text-[11px] text-slate-500">average over {runs} batches</div>
            </div>
            <div className="rounded-xl bg-brand-50 px-3 py-2">
              <div className="text-lg font-bold text-brand-700">{expected}</div>
              <div className="text-[11px] text-slate-500">
                expected = {trials.toLocaleString()} ÷ {dieFaces * 2}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Each batch&apos;s count bounces around, but they cluster near{' '}
            <span className="font-semibold text-brand-700">{expected}</span> — and the more batches
            you run, the closer the average gets.
          </p>
        </div>
      )}
    </div>
  )
}
