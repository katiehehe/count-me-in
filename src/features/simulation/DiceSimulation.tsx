import { useMemo, useState } from 'react'

interface DiceSimulationProps {
  faces: number[]
  rolls?: number
  /** Accepted for config compatibility but no longer used — faces are fixed. */
  editable?: boolean
  onComplete?: () => void
}

interface RollResult {
  /** Tally of how many times each face VALUE came up. */
  counts: Record<number, number>
  total: number
}

function rollDice(faces: number[], rolls: number): RollResult {
  const counts: Record<number, number> = {}
  for (const f of faces) counts[f] = counts[f] ?? 0
  for (let i = 0; i < rolls; i++) {
    const face = faces[Math.floor(Math.random() * faces.length)]
    counts[face] = (counts[face] ?? 0) + 1
  }
  return { counts, total: rolls }
}

/** Round up to a "nice" axis maximum (1, 2, 2.5, 5, 10 × 10ⁿ) for clean grid ticks. */
function niceCeil(value: number): number {
  if (value <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const frac = value / pow
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10
  return niceFrac * pow
}

const CHART_HEIGHT = 200
const TICK_COUNT = 4

/**
 * Roll a die `rolls` times in the background and show the outcome distribution
 * as a bar chart — building probability intuition by doing, not by formula.
 */
export function DiceSimulation({ faces, rolls = 1000, onComplete }: DiceSimulationProps) {
  const [result, setResult] = useState<RollResult | null>(null)
  const [rolling, setRolling] = useState(false)

  const distinctValues = useMemo(
    () => Array.from(new Set(faces)).sort((a, b) => a - b),
    [faces],
  )

  const handleRoll = () => {
    setRolling(true)
    // Defer so the "Rolling…" state paints before the (fast) synchronous sim.
    window.setTimeout(() => {
      setResult(rollDice(faces, rolls))
      setRolling(false)
      onComplete?.()
    }, 250)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleRoll}
          disabled={rolling}
          className="rounded-2xl bg-brand-500 px-6 py-3 text-base font-bold text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {rolling ? 'Rolling…' : `🎲 Roll ${rolls.toLocaleString()}×`}
        </button>
      </div>

      {result &&
        (() => {
          const maxCount = Math.max(1, ...distinctValues.map((v) => result.counts[v] ?? 0))
          const axisMax = niceCeil(maxCount)
          const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
            Math.round((axisMax / TICK_COUNT) * i),
          )
          return (
            <div className="rounded-2xl border-2 border-brand-100 bg-white/70 p-4">
              <p className="mb-4 text-center text-sm font-semibold text-slate-600">
                Outcomes over {result.total.toLocaleString()} rolls
              </p>
              <div className="flex">
                <div
                  className="relative mr-2 w-9 shrink-0"
                  style={{ height: CHART_HEIGHT }}
                  aria-hidden
                >
                  {ticks.map((t) => (
                    <span
                      key={t}
                      className="absolute right-0 -translate-y-1/2 text-[10px] font-medium text-slate-400"
                      style={{ bottom: `${(t / axisMax) * 100}%` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="relative border-b border-l border-slate-300"
                    style={{ height: CHART_HEIGHT }}
                  >
                    {ticks.map((t) => (
                      <div
                        key={t}
                        className={`absolute left-0 right-0 border-t ${
                          t === 0 ? 'border-slate-300' : 'border-slate-200'
                        }`}
                        style={{ bottom: `${(t / axisMax) * 100}%` }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-end gap-px">
                      {distinctValues.map((value) => {
                        const count = result.counts[value] ?? 0
                        const pct = Math.round((count / result.total) * 100)
                        const heightPct = (count / axisMax) * 100
                        return (
                          <div
                            key={value}
                            className="flex h-full flex-1 flex-col items-center justify-end"
                          >
                            <span className="mb-0.5 text-[10px] font-bold text-slate-500">
                              {count}
                            </span>
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-accent-400 transition-[height] duration-500"
                              style={{ height: `${heightPct}%` }}
                              aria-label={`Face ${value}: ${count} rolls (${pct}%)`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex gap-px pt-1.5">
                    {distinctValues.map((value) => {
                      const count = result.counts[value] ?? 0
                      const pct = Math.round((count / result.total) * 100)
                      return (
                        <div key={value} className="flex flex-1 flex-col items-center gap-0.5">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                            {value}
                          </span>
                          <span className="text-[10px] text-slate-400">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
