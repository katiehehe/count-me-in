import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// Restrained and editorial — crisp fills and thin borders — but with a soft
// colored shadow for depth and a small press on click.
const variants = {
  primary:
    'bg-brand-600 text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 active:scale-[0.98]',
  secondary:
    'bg-white text-brand-700 border border-brand-300 shadow-sm hover:bg-brand-50 hover:border-brand-400 active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-600 hover:bg-brand-50/70 active:scale-[0.98]',
}

// Slightly more compact on phones (smaller text + horizontal padding) while
// keeping a comfortable tap height; scales up at the `sm` breakpoint.
const sizes = {
  sm: 'px-3 py-1.5 text-sm sm:px-3.5',
  md: 'px-4 py-2.5 text-base sm:px-5',
  lg: 'px-5 py-2.5 text-base sm:px-7 sm:py-3 sm:text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
