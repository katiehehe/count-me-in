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
      className={`rounded-3xl border border-brand-100/80 bg-white/90 p-5 shadow-sm shadow-brand-100/40 backdrop-blur-sm ${onClick ? 'cursor-pointer transition hover:border-brand-200 hover:shadow-md hover:shadow-brand-100/60' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
