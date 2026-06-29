import { useEffect, useRef, useState } from 'react'
import { latticePaths } from '../../content/probabilityMath'

interface LatticePathBoardProps {
  m: number
  n: number
  onComplete?: () => void
}

type Node = [number, number]

function moveString(path: Node[]): string {
  let s = ''
  for (let i = 1; i < path.length; i++) {
    s += path[i][0] > path[i - 1][0] ? 'R' : 'U'
  }
  return s
}

/**
 * Lattice-path tracer. The learner clicks right/up to walk a monotonic path from the
 * bottom-left corner to the top-right; each distinct completed path is recorded and a
 * counter climbs toward C(m+n, n). Tracing the paths by hand makes "a path = a sequence
 * of R's and U's = a combination" concrete.
 */
export function LatticePathBoard({ m, n, onComplete }: LatticePathBoardProps) {
  const [path, setPath] = useState<Node[]>([[0, 0]])
  const [found, setFound] = useState<Set<string>>(() => new Set())
  const completedRef = useRef(false)

  const total = latticePaths(m, n)
  const cur = path[path.length - 1]
  const atEnd = cur[0] === m && cur[1] === n
  const solved = found.size >= total

  useEffect(() => {
    if (solved && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [solved, onComplete])

  const step = (dir: 'R' | 'U') => {
    if (atEnd) return
    const [ci, cj] = cur
    if (dir === 'R' && ci >= m) return
    if (dir === 'U' && cj >= n) return
    const next: Node[] = [...path, dir === 'R' ? [ci + 1, cj] : [ci, cj + 1]]
    setPath(next)
    const last = next[next.length - 1]
    if (last[0] === m && last[1] === n) {
      const key = moveString(next)
      setFound((f) => (f.has(key) ? f : new Set(f).add(key)))
    }
  }

  const cell = 46
  const pad = 22
  const W = pad * 2 + m * cell
  const H = pad * 2 + n * cell
  const px = (i: number) => pad + i * cell
  const py = (j: number) => pad + (n - j) * cell
  const points = path.map(([i, j]) => `${px(i)},${py(j)}`).join(' ')

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Trace right/up paths from the bottom-left to the top-right corner. Find all {total}.
      </div>

      <div className="flex justify-center rounded-3xl border-2 border-brand-100 bg-white/70 p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[16rem]" role="img" aria-label="lattice path board">
          {Array.from({ length: n + 1 }).map((_, j) => (
            <line key={`h${j}`} x1={px(0)} y1={py(j)} x2={px(m)} y2={py(j)} stroke="#e2e8f0" strokeWidth="1.5" />
          ))}
          {Array.from({ length: m + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={px(i)} y1={py(0)} x2={px(i)} y2={py(n)} stroke="#e2e8f0" strokeWidth="1.5" />
          ))}
          {path.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="#2d5894"
              strokeWidth="4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          <circle cx={px(0)} cy={py(0)} r="5" fill="#15803d" />
          <circle cx={px(m)} cy={py(n)} r="5" fill="#e11d54" />
          <circle cx={px(cur[0])} cy={py(cur[1])} r="6" fill="#2d5894" />
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => step('R')}
          disabled={atEnd || cur[0] >= m}
          className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
        >
          → Right
        </button>
        <button
          type="button"
          onClick={() => step('U')}
          disabled={atEnd || cur[1] >= n}
          className="rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-40"
        >
          ↑ Up
        </button>
        <button
          type="button"
          onClick={() => setPath([[0, 0]])}
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
        >
          Restart path
        </button>
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm shadow-sm shadow-brand-100/40">
        {solved ? (
          <p className="font-semibold text-success-700">
            🎉 You found all {total} paths — that’s C({m}+{n}, {n}) = {total}.
          </p>
        ) : atEnd ? (
          <p className="text-slate-600">
            Path recorded! Found <span className="font-bold text-brand-600">{found.size}</span> of {total}.
            Tap “Restart path” to trace another.
          </p>
        ) : (
          <p className="text-slate-600">
            Paths found: <span className="font-bold text-brand-600">{found.size}</span> of {total}. Reach
            the red corner to record one.
          </p>
        )}
      </div>
    </div>
  )
}
