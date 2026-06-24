import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5 ${onClick ? 'cursor-pointer transition hover:border-slate-300 hover:shadow-tile-hover' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
