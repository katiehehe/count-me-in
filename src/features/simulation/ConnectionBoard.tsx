import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ConnectionGroupItem } from '../../content/types'
import { EventIcon } from '../../components/icons/EventIcon'
import { hasEventIcon } from '../../components/icons/tokenIconUtils'

interface ConnectionBoardProps {
  leftLabel: string
  rightLabel: string
  leftItems: ConnectionGroupItem[]
  rightItems: ConnectionGroupItem[]
  pairingLabel?: string
  onComplete?: (pairs: number) => void
}

type Side = 'left' | 'right'
interface Endpoint {
  side: Side
  index: number
}

function pairKey(leftIndex: number, rightIndex: number) {
  return `${leftIndex}-${rightIndex}`
}

interface Point {
  x: number
  y: number
}

/**
 * Two columns of items. The learner connects every left item to every right
 * item — by tapping one then the other, or by dragging a line between them —
 * and discovers that the number of pairings equals (left count) × (right count).
 */
export function ConnectionBoard({
  leftLabel,
  rightLabel,
  leftItems,
  rightItems,
  pairingLabel = 'pairing',
  onComplete,
}: ConnectionBoardProps) {
  const total = leftItems.length * rightItems.length

  const [connections, setConnections] = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<Endpoint | null>(null)
  const [dragFrom, setDragFrom] = useState<Endpoint | null>(null)
  const [dragPoint, setDragPoint] = useState<Point | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const leftRefs = useRef<Array<HTMLButtonElement | null>>([])
  const rightRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [positions, setPositions] = useState<{ left: Point[]; right: Point[] }>({
    left: [],
    right: [],
  })
  const completedRef = useRef(false)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const box = container.getBoundingClientRect()
    const centerOf = (el: HTMLButtonElement | null, anchor: Side): Point | null => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        // Anchor the line to the inner edge of each item so it spans the gap.
        x: (anchor === 'left' ? r.right : r.left) - box.left,
        y: r.top + r.height / 2 - box.top,
      }
    }
    const left = leftItems.map((_, i) => centerOf(leftRefs.current[i], 'left')).filter(Boolean) as Point[]
    const right = rightItems
      .map((_, i) => centerOf(rightRefs.current[i], 'right'))
      .filter(Boolean) as Point[]
    setPositions({ left, right })
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
    if (connections.size >= total && total > 0 && !completedRef.current) {
      completedRef.current = true
      onComplete?.(connections.size)
    }
  }, [connections.size, total, onComplete])

  const toggleConnection = useCallback((leftIndex: number, rightIndex: number) => {
    setConnections((prev) => {
      const next = new Set(prev)
      const key = pairKey(leftIndex, rightIndex)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const connectEndpoints = useCallback(
    (a: Endpoint, b: Endpoint) => {
      if (a.side === b.side) return
      const li = a.side === 'left' ? a.index : b.index
      const ri = a.side === 'right' ? a.index : b.index
      toggleConnection(li, ri)
    },
    [toggleConnection],
  )

  const handleActivate = useCallback(
    (endpoint: Endpoint) => {
      setSelected((prev) => {
        if (!prev) return endpoint
        if (prev.side === endpoint.side) {
          // Re-selecting on the same column moves the selection.
          if (prev.index === endpoint.index) return null
          return endpoint
        }
        connectEndpoints(prev, endpoint)
        return null
      })
    },
    [connectEndpoints],
  )

  const pointFromEvent = (e: React.PointerEvent): Point | null => {
    const container = containerRef.current
    if (!container) return null
    const box = container.getBoundingClientRect()
    return { x: e.clientX - box.left, y: e.clientY - box.top }
  }

  const movedRef = useRef(false)

  const handlePointerDown = (endpoint: Endpoint) => (e: React.PointerEvent) => {
    e.preventDefault()
    movedRef.current = false
    setDragFrom(endpoint)
    setDragPoint(pointFromEvent(e))
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragFrom) return
    movedRef.current = true
    setDragPoint(pointFromEvent(e))
  }

  const endpointFromTarget = (e: React.PointerEvent): Endpoint | null => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    const node = el?.closest('[data-side]') as HTMLElement | null
    if (!node) return null
    const side = node.dataset.side as Side
    const index = Number(node.dataset.index)
    if ((side !== 'left' && side !== 'right') || Number.isNaN(index)) return null
    return { side, index }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragFrom) return
    if (movedRef.current) {
      const target = endpointFromTarget(e)
      if (target) connectEndpoints(dragFrom, target)
      setSelected(null)
    } else {
      // No movement → treat as a tap.
      handleActivate(dragFrom)
    }
    setDragFrom(null)
    setDragPoint(null)
  }

  const isConnected = (li: number, ri: number) => connections.has(pairKey(li, ri))
  const leftConnected = (i: number) => rightItems.some((_, ri) => isConnected(i, ri))
  const rightConnected = (i: number) => leftItems.some((_, li) => isConnected(li, i))

  const renderColumn = (
    side: Side,
    items: ConnectionGroupItem[],
    refArr: React.MutableRefObject<Array<HTMLButtonElement | null>>,
    isItemConnected: (i: number) => boolean,
  ) => (
    <div className="flex h-full flex-col justify-center gap-3">
      {items.map((item, i) => {
        const isSelected = selected?.side === side && selected.index === i
        const connected = isItemConnected(i)
        return (
          <button
            key={item.id}
            type="button"
            data-side={side}
            data-index={i}
            ref={(el) => {
              refArr.current[i] = el
            }}
            onPointerDown={handlePointerDown({ side, index: i })}
            className={`flex touch-none select-none items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left font-semibold shadow-sm transition-all ${
              isSelected ? 'ring-2 ring-brand-300' : ''
            } ${connected ? 'shadow-md' : ''}`}
            style={{
              backgroundColor: `${item.color}24`,
              borderColor: isSelected ? '#2d5894' : item.color,
            }}
          >
            {hasEventIcon(item.emoji) ? (
              <EventIcon
                emoji={item.emoji}
                label={item.label}
                color={item.color}
                className="h-9 w-9 shrink-0 drop-shadow-sm"
              />
            ) : (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-white ring-2 ring-white/70 shadow-sm"
                style={{ backgroundColor: item.color }}
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
        Connect every {leftLabel.toLowerCase().replace(/s$/, '')} to every{' '}
        {rightLabel.toLowerCase().replace(/s$/, '')} — find all {total} {pairingLabel}
        {total !== 1 ? 's' : ''}
      </div>

      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setDragFrom(null)
          setDragPoint(null)
        }}
        className="relative grid grid-cols-2 gap-12 rounded-3xl border-2 border-brand-100 bg-white/70 p-4 sm:gap-20 sm:p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 -top-0.5 flex justify-between px-4 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:px-6">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {Array.from(connections).map((key) => {
            const [li, ri] = key.split('-').map(Number)
            const a = positions.left[li]
            const b = positions.right[ri]
            if (!a || !b) return null
            return (
              <line
                key={key}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#2d5894"
                strokeWidth={3}
                strokeLinecap="round"
              />
            )
          })}
          {dragFrom &&
            dragPoint &&
            (() => {
              const start =
                dragFrom.side === 'left'
                  ? positions.left[dragFrom.index]
                  : positions.right[dragFrom.index]
              if (!start) return null
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={dragPoint.x}
                  y2={dragPoint.y}
                  stroke="#4f78b0"
                  strokeWidth={3}
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                />
              )
            })()}
        </svg>

        <div className="relative z-10 mt-4">
          {renderColumn('left', leftItems, leftRefs, leftConnected)}
        </div>
        <div className="relative z-10 mt-4">
          {renderColumn('right', rightItems, rightRefs, rightConnected)}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Tap an item on the left, then one on the right to connect them — or drag a line
        between them. Tap a line&apos;s pair again to remove it.
      </p>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        <p className="text-sm text-slate-600">
          {pairingLabel.charAt(0).toUpperCase() + pairingLabel.slice(1)}s made:{' '}
          <span className="font-bold text-brand-600">{connections.size}</span>
          {' / '}
          <span className="font-bold text-slate-700">{total}</span>
        </p>
        {connections.size >= total && total > 0 && (
          <p className="mt-1 text-sm font-semibold text-success-700">
            🎉 {leftItems.length} × {rightItems.length} = {total}. Tap Continue when ready.
          </p>
        )}
      </div>
    </div>
  )
}
