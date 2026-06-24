interface FeedbackBoxProps {
  variant: 'correct' | 'incorrect' | 'neutral'
  message: string
  title?: string
}

const styles = {
  correct: 'border-success-500/30 bg-success-50 text-success-700',
  incorrect: 'border-error-500/40 bg-error-50 text-error-700',
  neutral: 'border-accent-200 bg-accent-50 text-accent-700',
}

export function FeedbackBox({ variant, message, title }: FeedbackBoxProps) {
  if (!message && !title) return null

  return (
    <div className={`mt-4 flex items-start gap-2 rounded-xl border-2 px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}>
      {variant === 'correct' && <span className="font-bold">✓</span>}
      {variant === 'incorrect' && <span className="font-bold">✗</span>}
      <div>
        {title && <span className="font-bold">{title} </span>}
        {message}
      </div>
    </div>
  )
}
