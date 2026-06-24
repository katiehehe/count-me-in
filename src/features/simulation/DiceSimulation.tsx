import { useMemo, useRef, useState } from 'react'
import { DieIcon } from '../../components/icons/DieIcon'
import { InteractionGuide } from './InteractionGuide'

// Roll a few times so the learner sees each run differs yet stays ~uniform.
const GIST_ROLLS = 3

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
  /** Downsampled running average of the face values, for the convergence line. */
  avgHistory: number[]
}

// Cap on plotted points so the convergence line stays cheap to draw.
const MAX_POINTS = 200

function rollDice(faces: number[], rolls: number): RollResult {
  const counts: Record<number, number> = {}
  for (const f of faces) counts[f] = counts[f] ?? 0
  const avgHistory: number[] = []
  const step = Math.max(1, Math.floor(rolls / MAX_POINTS))
  let sum = 0
  for (let i = 0; i < rolls; i++) {
    const face = faces[Math.floor(Math.random() * faces.length)]
    counts[face] = (counts[face] ?? 0) + 1
    sum += face
    if (i % step === 0 || i === rolls - 1) avgHistory.push(sum / (i + 1))
  }
  return { counts, total: rolls, avgHistory }
}

const formatTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

/** Round up to a "nice" axis maximum (1, 2, 2.5, 5, 10 × 10ⁿ) for clean grid ticks. */
function niceCeil(value: number): number {
  if (value <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const frac = value / pow
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10
  return niceFrac * pow
}

const CHART_HEIGHT = 200
const LINE_HEIGHT = 130
const TICK_COUNT = 4

/**
 * Roll a die `rolls` times in the background and show the outcome distribution
 * as a bar chart — building probability intuition by doing, not by formula.
 */
export function DiceSimulation({ faces, rolls = 1000, onComplete }: DiceSimulationProps) {
  const [result, setResult] = useState<RollResult | null>(null)
  const [rolling, setRolling] = useState(false)
  const [rollCount, setRollCount] = useState(0)
  const completedRef = useRef(false)

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
      setRollCount((prev) => {
        const next = prev + 1
        if (next >= GIST_ROLLS && !completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
        return next
      })
    }, 250)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleRoll}
          disabled={rolling}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-bold sm:px-6 sm:py-3 sm:text-base text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          <DieIcon
            value={5}
            faceColor="#ffffff"
            pipColor="#2d5894"
            className={`h-5 w-5 ${rolling ? 'animate-spin' : ''}`}
          />
          {rolling ? 'Rolling…' : `Roll ${rolls.toLocaleString()}×`}
        </button>
      </div>

      <InteractionGuide
        steps={[
          {
            label: `Roll ${rolls.toLocaleString()}× three times to compare runs (${Math.min(rollCount, GIST_ROLLS)}/${GIST_ROLLS})`,
            done: rollCount >= GIST_ROLLS,
          },
        ]}
      />

      {result &&
        (() => {
          const maxCount = Math.max(1, ...distinctValues.map((v) => result.counts[v] ?? 0))
          const axisMax = niceCeil(maxCount)
          const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
            Math.round((axisMax / TICK_COUNT) * i),
          )

          // Convergence line: running average of face values settling onto the mean.
          const expected = faces.reduce((a, b) => a + b, 0) / faces.length
          const fLo = Math.min(...distinctValues)
          const fHi = Math.max(...distinctValues)
          const yFor = (v: number) => LINE_HEIGHT - ((v - fLo) / (fHi - fLo || 1)) * LINE_HEIGHT
          const expectedY = yFor(expected)
          const avgTicks = Array.from(
            { length: TICK_COUNT + 1 },
            (_, i) => fLo + ((fHi - fLo) * i) / TICK_COUNT,
          )
          const linePoints = result.avgHistory
            .map((v, i) => {
              const x = result.avgHistory.length <= 1 ? 0 : (i / (result.avgHistory.length - 1)) * 100
              return `${x},${yFor(v)}`
            })
            .join(' ')

          return (
            <div className="space-y-4">
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
                          {value >= 1 && value <= 6 ? (
                            <DieIcon value={value} className="h-7 w-7" />
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                              {value}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-brand-100 bg-white/70 p-4">
              <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>average roll value →</span>
                <span>{result.total.toLocaleString()} rolls</span>
              </div>
              <div className="flex">
                <div
                  className="relative mr-2 w-7 shrink-0"
                  style={{ height: LINE_HEIGHT }}
                  aria-hidden
                >
                  {avgTicks.map((t) => (
                    <span
                      key={t}
                      className="absolute right-0 -translate-y-1/2 text-[10px] font-medium text-slate-400"
                      style={{ top: yFor(t) }}
                    >
                      {formatTick(t)}
                    </span>
                  ))}
                </div>
                <div className="relative min-w-0 flex-1" style={{ height: LINE_HEIGHT }}>
                  <svg
                    className="absolute inset-0 h-full w-full overflow-visible"
                    viewBox={`0 0 100 ${LINE_HEIGHT}`}
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    {avgTicks.map((t) => (
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
                    {result.avgHistory.length > 1 && (
                      <polyline
                        points={linePoints}
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
              <p className="mt-2 text-center text-xs text-slate-500">
                Early on the average swings around, but over {result.total.toLocaleString()} rolls it
                settles onto the expected{' '}
                <span className="font-semibold text-brand-700">{expected.toFixed(1)}</span>.
              </p>
            </div>
            </div>
          )
        })()}
    </div>
  )
}
