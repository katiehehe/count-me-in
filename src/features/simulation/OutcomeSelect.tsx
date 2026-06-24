import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ConnectionGroupItem } from '../../content/types'
import { TokenIcon } from '../../components/icons/TokenIcon'
import { hasTokenIcon } from '../../components/icons/tokenIconUtils'

interface OutcomeSelectProps {
  leftLabel: string
  rightLabel: string
  leftItems: ConnectionGroupItem[]
  rightItems: ConnectionGroupItem[]
  targetLeftId: string
  targetRightId: string
  pairingLabel?: string
  onComplete?: () => void
}

interface Point {
  x: number
  y: number
}

/**
 * Shows two groups with every combined outcome drawn as a faint line (the full
 * sample space). The learner must SELECT the one specific combined outcome
 * asked for (e.g. "4 + Tails") by tapping one item on each side. The matching
 * line lights up; choosing the right pair completes the step. This makes "1 of
 * N equally likely outcomes" concrete instead of an abstract multiple choice.
 */
export function OutcomeSelect({
  leftLabel,
  rightLabel,
  leftItems,
  rightItems,
  targetLeftId,
  targetRightId,
  pairingLabel = 'outcome',
  onComplete,
}: OutcomeSelectProps) {
  const total = leftItems.length * rightItems.length
  const [leftSel, setLeftSel] = useState<number | null>(null)
  const [rightSel, setRightSel] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const completedRef = useRef(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const leftRefs = useRef<Array<HTMLButtonElement | null>>([])
  const rightRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [positions, setPositions] = useState<{ left: Point[]; right: Point[] }>({
    left: [],
    right: [],
  })

  const targetLeftIndex = leftItems.findIndex((it) => it.id === targetLeftId)
  const targetRightIndex = rightItems.findIndex((it) => it.id === targetRightId)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const box = container.getBoundingClientRect()
    const centerOf = (el: HTMLButtonElement | null, anchor: 'left' | 'right'): Point | null => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        x: (anchor === 'left' ? r.right : r.left) - box.left,
        y: r.top + r.height / 2 - box.top,
      }
    }
    setPositions({
      left: leftItems.map((_, i) => centerOf(leftRefs.current[i], 'left')).filter(Boolean) as Point[],
      right: rightItems
        .map((_, i) => centerOf(rightRefs.current[i], 'right'))
        .filter(Boolean) as Point[],
    })
  }, [leftItems, rightItems])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    const handle = () => measure()
    window.addEventListener('resize', handle)
    const ro = new ResizeObserver(handle)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => {
      window.removeEventListener('resize', handle)
      ro.disconnect()
    }
  }, [measure])

  useEffect(() => {
    if (leftSel === null || rightSel === null) return
    if (leftSel === targetLeftIndex && rightSel === targetRightIndex) {
      setSolved(true)
      if (!completedRef.current) {
        completedRef.current = true
        onComplete?.()
      }
    }
  }, [leftSel, rightSel, targetLeftIndex, targetRightIndex, onComplete])

  const targetLabel = `${leftItems[targetLeftIndex]?.label ?? ''} + ${
    rightItems[targetRightIndex]?.label ?? ''
  }`

  const bothChosen = leftSel !== null && rightSel !== null
  const wrong = bothChosen && !solved

  const renderColumn = (
    items: ConnectionGroupItem[],
    refArr: React.MutableRefObject<Array<HTMLButtonElement | null>>,
    sel: number | null,
    setSel: (i: number) => void,
  ) => (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {items.map((item, i) => {
        const isSelected = sel === i
        return (
          <button
            key={item.id}
            type="button"
            disabled={solved}
            onClick={() => setSel(i)}
            ref={(el) => {
              refArr.current[i] = el
            }}
            className={`flex select-none items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left font-semibold shadow-sm transition-all ${
              isSelected
                ? 'border-brand-500 ring-2 ring-brand-300'
                : 'border-slate-200 hover:border-brand-300'
            }`}
            style={{ backgroundColor: `${item.color}1f` }}
          >
            {hasTokenIcon(item.emoji) ? (
              <TokenIcon
                emoji={item.emoji}
                label={item.label}
                color={item.color}
                className="h-9 w-9 shrink-0 drop-shadow-sm"
              />
            ) : (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg shadow-inner"
                style={{ backgroundColor: `${item.color}33` }}
                aria-hidden
              >
                {item.emoji ?? '●'}
              </span>
            )}
            <span className="text-sm leading-tight text-slate-700">{item.label}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Tap to find <span className="font-bold">{targetLabel}</span> among all {total}{' '}
        {pairingLabel}
        {total !== 1 ? 's' : ''}
      </div>

      <div
        ref={containerRef}
        className="relative grid grid-cols-2 gap-12 rounded-3xl border-2 border-brand-100 bg-white/70 p-4 sm:gap-20 sm:p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 -top-0.5 flex justify-between px-4 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:px-6">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {leftItems.map((_, li) =>
            rightItems.map((_, ri) => {
              const a = positions.left[li]
              const c = positions.right[ri]
              if (!a || !c) return null
              const isSel = leftSel === li && rightSel === ri
              const isTarget = solved && li === targetLeftIndex && ri === targetRightIndex
              return (
                <line
                  key={`${li}-${ri}`}
                  x1={a.x}
                  y1={a.y}
                  x2={c.x}
                  y2={c.y}
                  stroke={isTarget ? '#15803d' : isSel ? '#2d5894' : '#cbd5e1'}
                  strokeWidth={isTarget || isSel ? 3 : 1}
                  strokeLinecap="round"
                />
              )
            }),
          )}
        </svg>

        <div className="relative z-10 mt-4">
          {renderColumn(leftItems, leftRefs, leftSel, setLeftSel)}
        </div>
        <div className="relative z-10 mt-4">
          {renderColumn(rightItems, rightRefs, rightSel, setRightSel)}
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        {solved ? (
          <p className="text-sm font-semibold text-success-700">
            🎉 That is the 1 outcome out of {total} — so its probability is 1/{total}.
          </p>
        ) : wrong ? (
          <p className="text-sm font-medium text-error-600">
            That is {leftItems[leftSel]?.label} + {rightItems[rightSel]?.label}. Look for{' '}
            {targetLabel}.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Pick one {leftLabel.toLowerCase().replace(/s$/, '')} and one{' '}
            {rightLabel.toLowerCase().replace(/s$/, '')} to highlight that combined outcome.
          </p>
        )}
      </div>
    </div>
  )
}
