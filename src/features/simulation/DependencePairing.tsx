import { useEffect, useRef, useState } from 'react'
import type { DependenceCard } from '../../content/types'
import { EventIcon } from '../../components/icons/EventIcon'
import { hasEventIcon } from '../../components/icons/tokenIconUtils'

interface DependencePairingProps {
  cards: DependenceCard[]
  dependentPairs: [string, string][]
  onComplete?: () => void
}

const key = (a: string, b: string) => [a, b].sort().join('|')

// Distinct colors so each matched pair reads as its own group. Cards in the same
// pair share one color instead of being removed from the board.
const PAIR_COLORS = ['#2d9d78', '#d97706', '#7c3aed', '#2d5894', '#db2777']

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

  const pairIndexOf = (id: string) => pairs.findIndex(([a, b]) => a === id || b === id)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2.5">
        {cards.map((card) => {
          const isSel = selected === card.id
          const pi = pairIndexOf(card.id)
          const paired = pi !== -1
          const color = paired ? PAIR_COLORS[pi % PAIR_COLORS.length] : null
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => tapCard(card.id)}
              aria-label={paired ? `${card.label} — matched, tap to unpair` : card.label}
              className={`relative flex h-20 w-36 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 text-center transition-all ${
                paired
                  ? 'shadow-sm'
                  : isSel
                    ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100'
                    : 'border-slate-200 bg-white hover:border-brand-300'
              }`}
              style={color ? { backgroundColor: `${color}1f`, borderColor: color } : undefined}
            >
              {paired && (
                <span
                  className="absolute right-1.5 top-1.5 text-xs leading-none"
                  style={{ color: color ?? undefined }}
                  aria-hidden
                >
                  🔗
                </span>
              )}
              {card.emoji &&
                (hasEventIcon(card.emoji) ? (
                  <EventIcon
                    emoji={card.emoji}
                    label={card.label}
                    color={card.color}
                    className="h-7 w-7"
                  />
                ) : (
                  <span className="text-xl leading-none" aria-hidden>
                    {card.emoji}
                  </span>
                ))}
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
        <p className="text-center text-xs font-medium text-slate-500">
          Matched events share a color. Tap a colored card to unpair it.
        </p>
      )}
    </div>
  )
}
