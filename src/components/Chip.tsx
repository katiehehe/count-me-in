import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  /** Extra classes — typically a pastel `bg-*`/`text-*` pair. */
  className?: string
}

/** A small, sharp-cornered tag used for concepts, statuses, and metadata. */
export function Chip({ children, className = 'bg-slate-100 text-slate-500' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  )
}
