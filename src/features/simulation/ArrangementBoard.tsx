import { useCallback, useEffect, useRef, useState } from 'react'
import type { ArrangementItem } from '../../content/types'
import { orderingKey, permutationCount } from './permutationMath'

interface ArrangementBoardProps {
  items: ArrangementItem[]
  targetCount?: number
  goalCount?: number
  /** Treat items with the same `kind` as visually identical when counting orderings. */
  keyByKind?: boolean
  /**
   * When true the board is used outside a lesson (e.g. the landing-page demo),
   * so the success message celebrates without telling the learner to "Continue"
   * (there is no Continue button in that context).
   */
  standalone?: boolean
  onExploreComplete?: (uniqueFound: number, total: number) => void
}

export function ArrangementBoard({
  items,
  targetCount,
  goalCount,
  keyByKind = false,
  standalone = false,
  onExploreComplete,
}: ArrangementBoardProps) {
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]))

  // The visual signature of an item: its `kind` when counting identical items,
  // otherwise its unique id. Swapping two items with the same signature does
  // not produce a new ordering.
  const sigOf = useCallback(
    (id: string) => (keyByKind ? itemMap[id]?.kind ?? id : id),
    [keyByKind, itemMap],
  )
  const signatureKey = useCallback(
    (ord: string[]) => orderingKey(ord.map(sigOf)),
    [sigOf],
  )

  // A representative item for each signature, so the orderings list can render
  // identical items consistently.
  const repBySig: Record<string, ArrangementItem> = {}
  for (const i of items) {
    const s = keyByKind ? i.kind ?? i.id : i.id
    if (!repBySig[s]) repBySig[s] = i
  }

  const [order, setOrder] = useState<string[]>(() => items.map((i) => i.id))
  const [seen, setSeen] = useState<Set<string>>(
    () => new Set([orderingKey(items.map((i) => (keyByKind ? i.kind ?? i.id : i.id)))]),
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [flash, setFlash] = useState<[number, number] | null>(null)
  const completedRef = useRef(false)
  const ghostRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    ghostRef.current = img
  }, [])

  const total = targetCount ?? permutationCount(items.length)
  const goal = Math.min(goalCount ?? total, total)
  const reachedGoal = seen.size >= goal

  const itemForKey = (key: string) => key.split('|').map((sig) => repBySig[sig])

  useEffect(() => {
    if (reachedGoal && !completedRef.current) {
      completedRef.current = true
      onExploreComplete?.(seen.size, total)
    }
  }, [reachedGoal, seen.size, total, onExploreComplete])

  const recordOrdering = useCallback(
    (newOrder: string[]) => {
      setSeen((prev) => {
        const next = new Set(prev)
        next.add(signatureKey(newOrder))
        return next
      })
    },
    [signatureKey],
  )

  const swap = useCallback(
    (from: number, to: number) => {
      if (from === to) return
      setOrder((prev) => {
        const next = [...prev]
        ;[next[from], next[to]] = [next[to], next[from]]
        recordOrdering(next)
        return next
      })
      setFlash([from, to])
      window.setTimeout(() => setFlash(null), 420)
    },
    [recordOrdering],
  )

  const handleSlotActivate = (index: number) => {
    if (selected === null) {
      setSelected(index)
    } else if (selected === index) {
      setSelected(null)
    } else {
      swap(selected, index)
      setSelected(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-700">
        Goal: discover {goal} different ordering{goal !== 1 ? 's' : ''}
        {total > goal ? ` (out of ${total} total)` : ''}
      </div>

      <div className="flex flex-nowrap items-end justify-center gap-2 overflow-x-auto px-1 pb-1 sm:gap-3">
        {order.map((id, index) => {
          const item = itemMap[id]
          const isDragTarget = dragOverIndex === index && dragIndex !== index
          const isSelected = selected === index
          const isFlashing = flash?.includes(index) ?? false
          return (
            <div key={`slot-${index}`} className="flex shrink-0 flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Slot {index + 1}
              </span>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverIndex(index)
                }}
                onDragLeave={() => setDragOverIndex((cur) => (cur === index ? null : cur))}
                onDrop={() => {
                  if (dragIndex !== null) swap(dragIndex, index)
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                className={`flex h-24 w-[4.25rem] items-center justify-center rounded-2xl border-2 border-dashed p-1.5 transition-colors sm:h-28 sm:w-24 ${
                  isDragTarget || (selected !== null && selected !== index)
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    if (ghostRef.current) {
                      e.dataTransfer.setDragImage(ghostRef.current, 0, 0)
                    }
                    e.dataTransfer.effectAllowed = 'move'
                    setDragIndex(index)
                    setSelected(null)
                  }}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setDragOverIndex(null)
                  }}
                  onClick={() => handleSlotActivate(index)}
                  className={`flex h-full w-full cursor-grab flex-col items-center justify-center rounded-xl border-2 shadow-sm transition-[box-shadow,border-color,transform] duration-150 active:cursor-grabbing ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-300'
                      : 'border-transparent'
                  } ${isFlashing ? 'scale-105' : ''} ${
                    dragIndex === index ? 'ring-2 ring-brand-400 ring-offset-1' : ''
                  }`}
                  style={{
                    backgroundColor: `${item.color}26`,
                    borderColor: isSelected ? undefined : `${item.color}55`,
                  }}
                >
                  {item.emoji ? (
                    <span
                      className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl shadow-inner sm:h-9 sm:w-9 sm:text-2xl"
                      style={{ backgroundColor: `${item.color}33` }}
                      aria-hidden
                    >
                      {item.emoji}
                    </span>
                  ) : (
                    <span
                      className="mb-1 h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11"
                      style={{
                        background: `radial-gradient(circle at 32% 28%, #ffffffe6, ${item.color} 58%, ${item.color})`,
                        boxShadow:
                          'inset -2px -3px 6px rgba(0,0,0,0.28), 0 3px 5px rgba(0,0,0,0.18)',
                      }}
                      aria-label={item.label}
                    />
                  )}
                  <span className="line-clamp-2 w-full px-0.5 text-center text-[10px] font-bold leading-[1.15] break-words hyphens-auto text-slate-700 sm:text-[11px]">
                    {item.label}
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-slate-500">
        {selected !== null
          ? 'Now tap another slot to switch the two — or drag a block onto another slot.'
          : 'Drag a block onto another slot to swap them — or tap one, then tap another.'}
      </p>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        <p className="text-sm text-slate-600">
          Unique orderings found:{' '}
          <span className="font-bold text-brand-600">{seen.size}</span>
          {' / '}
          <span className="font-bold text-slate-700">{goal}</span>
        </p>
        {reachedGoal && (
          <p className="mt-1 text-sm font-semibold text-success-700">
            {standalone
              ? `🎉 You found all ${goal}!`
              : '🎉 Goal reached! Tap Continue when you are ready.'}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        {Array.from(seen).map((key, i) => (
          <div
            key={key}
            className="flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-1.5"
          >
            <span className="text-[11px] font-bold text-slate-400">#{i + 1}</span>
            <div className="flex flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto">
              {itemForKey(key).map((item, pos) => (
                <span key={`${key}-${item?.id}`} className="flex shrink-0 items-center gap-1.5">
                  {pos > 0 && <span className="text-slate-300">→</span>}
                  <span
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: `${item?.color}22`, color: '#334155' }}
                  >
                    {item?.emoji ? (
                      <span aria-hidden>{item.emoji}</span>
                    ) : (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 32% 28%, #ffffffe6, ${item?.color} 60%)`,
                          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.25)',
                        }}
                      />
                    )}
                    {item?.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
