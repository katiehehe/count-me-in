import { useState } from 'react'

interface HintButtonProps {
  hint?: string
  computationHint?: string
  className?: string
}

/**
 * Two-tiered hand-written hints. The first tap reveals a conceptual nudge (how to
 * think about the problem). Once shown, a second button reveals the concrete
 * computation. No AI — Phase 1 only.
 */
export function HintButton({ hint, computationHint, className = '' }: HintButtonProps) {
  const [conceptRevealed, setConceptRevealed] = useState(false)
  const [computationRevealed, setComputationRevealed] = useState(false)

  if (!hint) return null

  return (
    <div className={`mt-4 space-y-3 ${className}`}>
      {!conceptRevealed ? (
        <button
          type="button"
          onClick={() => setConceptRevealed(true)}
          className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-accent-200 bg-accent-50 px-4 py-2 text-sm font-semibold text-accent-700 transition-colors hover:bg-accent-100 active:scale-[0.98]"
        >
          <span aria-hidden>💡</span> Help me
        </button>
      ) : (
        <>
          <div className="rounded-2xl border-2 border-accent-200 bg-accent-50 p-4">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-accent-700">
              <span aria-hidden className="mt-0.5">
                💡
              </span>
              <span>
                <span className="font-semibold">Hint: </span>
                {hint}
              </span>
            </p>
          </div>

          {computationHint &&
            (!computationRevealed ? (
              <button
                type="button"
                onClick={() => setComputationRevealed(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-accent-200 bg-white px-4 py-2 text-sm font-semibold text-accent-700 transition-colors hover:bg-accent-50 active:scale-[0.98]"
              >
                <span aria-hidden>🧮</span> Show me the math
              </button>
            ) : (
              <div className="rounded-2xl border-2 border-accent-200 bg-accent-50 p-4">
                <p className="flex items-start gap-2 text-sm leading-relaxed text-accent-700">
                  <span aria-hidden className="mt-0.5">
                    🧮
                  </span>
                  <span>
                    <span className="font-semibold">The computation: </span>
                    {computationHint}
                  </span>
                </p>
              </div>
            ))}
        </>
      )}
    </div>
  )
}
