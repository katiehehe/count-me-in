interface StarButtonProps {
  starred: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
  className?: string
}

const sizes = {
  sm: 'h-10 w-10 text-2xl',
  md: 'h-12 w-12 text-3xl',
}

export function StarButton({ starred, onToggle, size = 'md', className = '' }: StarButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      aria-pressed={starred}
      aria-label={starred ? 'Unstar this question' : 'Star this question to review later'}
      title={starred ? 'Starred — tap to remove' : 'Star this question to review later'}
      className={`inline-flex shrink-0 items-center justify-center rounded-full leading-none transition-transform transition-colors active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
        starred ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'
      } ${sizes[size]} ${className}`}
    >
      <span aria-hidden>{starred ? '★' : '☆'}</span>
    </button>
  )
}
