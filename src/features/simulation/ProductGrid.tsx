import { useEffect, useRef, useState } from 'react'
import { EventIcon } from '../../components/icons/EventIcon'
import { hasEventIcon } from '../../components/icons/tokenIconUtils'

interface ProductGridProps {
  rowLabel: string
  colLabel: string
  rows: number
  cols: number
  rowEmoji?: string
  colEmoji?: string
  pairingLabel?: string
  onComplete?: () => void
}

// Distinct hues so every row item and every column item is its own color, and
// the two stages read as clearly different palettes (cool rows, warm columns).
const ROW_COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#8b5cf6', '#0d9488', '#0891b2']
const COL_COLORS = ['#ea580c', '#16a34a', '#db2777', '#ca8a04', '#dc2626', '#7c3aed']

function Glyph({
  emoji,
  label,
  color,
  className,
}: {
  emoji?: string
  label?: string
  color?: string
  className?: string
}) {
  if (!emoji) return null
  if (hasEventIcon(emoji)) {
    return <EventIcon emoji={emoji} label={label} color={color} className={className} />
  }
  return (
    <span className="text-lg leading-none" aria-hidden>
      {emoji}
    </span>
  )
}

/**
 * An interactive area model for the counting principle. The learner pairs each
 * row item with the WHOLE set of column items one row at a time; every cell fills
 * with that unique row+column combination and the running total climbs to
 * rows × cols — making "multiply the choices at each stage" something you build
 * rather than recall. Each row and column item gets its own color.
 */
export function ProductGrid({
  rowLabel,
  colLabel,
  rows,
  cols,
  rowEmoji,
  colEmoji,
  pairingLabel = 'outcome',
  onComplete,
}: ProductGridProps) {
  const [filledRows, setFilledRows] = useState<boolean[]>(() => Array(rows).fill(false))
  const completedRef = useRef(false)

  const filledCount = filledRows.filter(Boolean).length
  const allFilled = filledCount === rows
  const total = rows * cols
  const built = filledCount * cols
  const nextRow = filledRows.findIndex((f) => !f)

  const rowColor = (i: number) => ROW_COLORS[i % ROW_COLORS.length]
  const colColor = (i: number) => COL_COLORS[i % COL_COLORS.length]

  useEffect(() => {
    if (allFilled && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [allFilled, onComplete])

  const toggleRow = (i: number) => {
    setFilledRows((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  const fillAll = () => setFilledRows(Array(rows).fill(true))
  const reset = () => setFilledRows(Array(rows).fill(false))

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div
          className="mx-auto grid w-max gap-2"
          style={{ gridTemplateColumns: `auto repeat(${cols}, 5rem)` }}
        >
          {/* Header row: corner label + one column header per col item. */}
          <div className="flex items-end justify-center pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {pairingLabel}s
          </div>
          {Array.from({ length: cols }, (_, c) => (
            <div key={`col-${c}`} className="flex flex-col items-center justify-end gap-1 pb-1">
              <Glyph emoji={colEmoji} label={colLabel} color={colColor(c)} className="h-8 w-8" />
              <span className="text-[11px] font-medium text-slate-500">
                {colLabel} {c + 1}
              </span>
            </div>
          ))}

          {/* One body row per row item: a clickable header then its cells. */}
          {Array.from({ length: rows }, (_, r) => (
            <FragmentRow
              key={`row-${r}`}
              index={r}
              filled={filledRows[r]}
              isNext={r === nextRow}
              cols={cols}
              rowLabel={rowLabel}
              colLabel={colLabel}
              rowEmoji={rowEmoji}
              colEmoji={colEmoji}
              rowColor={rowColor(r)}
              colColor={colColor}
              onClick={() => toggleRow(r)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-brand-100 bg-brand-50/60 px-4 py-3 text-center">
        <p className="font-mono text-lg font-bold text-brand-800">
          {filledCount} {rowLabel}
          {filledCount !== 1 ? 's' : ''} × {cols} {colLabel}
          {cols !== 1 ? 's' : ''} = {built} {pairingLabel}
          {built !== 1 ? 's' : ''}
        </p>
        {!allFilled && (
          <p className="mt-1 text-xs text-slate-500">
            Tap{' '}
            <span className="font-semibold text-brand-700">
              {rowLabel} {nextRow + 1}
            </span>{' '}
            to pair it with all {cols} {colLabel}
            {cols !== 1 ? 's' : ''}.
          </p>
        )}
      </div>

      {allFilled && (
        <div className="rounded-xl border-2 border-success-500/30 bg-success-50 px-4 py-3 text-center">
          <p className="text-base font-bold text-success-700">
            {rows} × {cols} = {total} {pairingLabel}s
          </p>
          <p className="mt-1 text-sm text-success-700">
            Every {rowLabel} pairs with all {cols} {colLabel}
            {cols !== 1 ? 's' : ''}, so the counts multiply.
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {!allFilled && (
          <button
            type="button"
            onClick={fillAll}
            className="rounded-2xl border-2 border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
          >
            Fill the rest
          </button>
        )}
        {filledCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

function FragmentRow({
  index,
  filled,
  isNext,
  cols,
  rowLabel,
  colLabel,
  rowEmoji,
  colEmoji,
  rowColor,
  colColor,
  onClick,
}: {
  index: number
  filled: boolean
  isNext: boolean
  cols: number
  rowLabel: string
  colLabel: string
  rowEmoji?: string
  colEmoji?: string
  rowColor: string
  colColor: (i: number) => string
  onClick: () => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={`${rowLabel} ${index + 1}${filled ? ' — paired, tap to clear' : ''}`}
        className={`flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-left transition-all ${
          filled
            ? 'bg-white'
            : isNext
              ? 'animate-pulse border-brand-300 bg-white ring-2 ring-brand-100'
              : 'border-slate-200 bg-white hover:border-brand-300'
        }`}
        style={filled ? { borderColor: rowColor } : undefined}
      >
        <Glyph emoji={rowEmoji} label={rowLabel} color={rowColor} className="h-8 w-8" />
        <span className="whitespace-nowrap text-xs font-semibold text-slate-600">
          {rowLabel} {index + 1}
        </span>
      </button>
      {Array.from({ length: cols }, (_, c) => (
        <div
          key={c}
          aria-label={
            filled ? `${rowLabel} ${index + 1} with ${colLabel} ${c + 1}` : undefined
          }
          className={`flex h-16 w-full items-center justify-center gap-0.5 rounded-xl transition-all duration-200 ${
            filled ? 'border-2 bg-white shadow-sm' : 'border-2 border-dashed border-slate-200 bg-slate-50'
          }`}
          style={filled ? { borderColor: `${rowColor}66` } : undefined}
        >
          {filled && (
            <>
              <Glyph emoji={rowEmoji} label={rowLabel} color={rowColor} className="h-8 w-8" />
              <Glyph emoji={colEmoji} label={colLabel} color={colColor(c)} className="h-8 w-8" />
            </>
          )}
        </div>
      ))}
    </>
  )
}
