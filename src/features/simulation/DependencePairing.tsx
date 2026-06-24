import { useEffect, useRef, useState } from 'react'
import type { DependenceCard } from '../../content/types'

interface DependencePairingProps {
  cards: DependenceCard[]
  dependentPairs: [string, string][]
  onComplete?: () => void
}

const key = (a: string, b: string) => [a, b].sort().join('|')

export function DependencePairing({ cards, dependentPairs, onComplete }: DependencePairingProps) {
  const [pairs, setPairs] = useState<[string, string][]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const completedRef = useRef(false)

  const targetKeys = new Set(dependentPairs.map(([a, b]) => key(a, b)))
  const pairedIds = new Set(pairs.flat())
  const cardById = (id: string) => cards.find((c) => c.id === id)

  const isComplete = pairs.length === dependentPairs.length && pairs.every(([a, b]) => targetKeys.has(key(a, b)))

  useEffect(() => {
    if (isComplete && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [isComplete, onComplete])

  const unpair = (id: string) => {
    setPairs((prev) => prev.filter(([a, b]) => a !== id && b !== id))
    setError(null)
  }

  const tapCard = (id: string) => {
    if (pairedIds.has(id)) {
      unpair(id)
      return
    }
    setError(null)
    if (selected === null) {
      setSelected(id)
      return
    }
    if (selected === id) {
      setSelected(null)
      return
    }
    if (targetKeys.has(key(selected, id))) {
      setPairs((prev) => [...prev, [selected, id]])
      setSelected(null)
    } else {
      const a = cardById(selected)
      const b = cardById(id)
      setError(
        `“${a?.label}” and “${b?.label}” don’t change each other’s odds — they’re independent. Find a pair where one event affects the other.`,
      )
      setSelected(null)
    }
  }

  const unpaired = cards.filter((c) => !pairedIds.has(c.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2.5">
        {unpaired.map((card) => {
          const isSel = selected === card.id
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => tapCard(card.id)}
              className={`flex h-20 w-36 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-center transition-all ${
                isSel
                  ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100'
                  : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
            >
              {card.emoji && (
                <span className="text-xl leading-none" aria-hidden>
                  {card.emoji}
                </span>
              )}
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-slate-700">
                {card.label}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="rounded-xl border border-error-100 bg-error-50 px-3 py-2 text-center text-sm font-medium text-error-700">
          {error}
        </p>
      )}

      {pairs.length > 0 && (
        <div className="space-y-2">
          <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-400">
            Dependent pairs — one affects the other
          </p>
          {pairs.map(([a, b]) => {
            const ca = cardById(a)
            const cb = cardById(b)
            return (
              <div
                key={key(a, b)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-success-200 bg-success-50 px-3 py-2"
              >
                <span className="flex-1 text-right text-sm font-semibold text-slate-700">
                  {ca?.emoji} {ca?.label}
                </span>
                <span className="shrink-0 text-xs font-bold text-success-600" aria-hidden>
                  ↔ affects
                </span>
                <span className="flex-1 text-left text-sm font-semibold text-slate-700">
                  {cb?.emoji} {cb?.label}
                </span>
                <button
                  type="button"
                  onClick={() => unpair(a)}
                  aria-label="Unpair these events"
                  className="shrink-0 rounded-full px-2 py-0.5 text-slate-400 hover:bg-white hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
