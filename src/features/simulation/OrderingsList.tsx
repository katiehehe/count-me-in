import type { ArrangementItem } from '../../content/types'
import { allPermutations } from './permutationMath'

interface OrderingsListProps {
  items: ArrangementItem[]
}

/**
 * Shows every distinct ordering of the items in a systematic, color-coded list
 * so the learner can literally count them.
 */
export function OrderingsList({ items }: OrderingsListProps) {
  const orderings = allPermutations(items)

  return (
    <div className="mb-5 rounded-3xl border-2 border-accent-100 bg-accent-50/60 p-4">
      <p className="mb-3 text-center text-sm font-semibold text-accent-700">
        Every possible ordering — count them!
      </p>
      <ol className="flex flex-col gap-2">
        {orderings.map((ordering, i) => (
          <li
            key={ordering.map((o) => o.id).join('-')}
            className="flex items-center gap-2 rounded-2xl border border-accent-100 bg-white px-3 py-2"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-700">
              {i + 1}
            </span>
            <div className="flex flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto">
              {ordering.map((item, pos) => (
                <span key={item.id} className="flex shrink-0 items-center gap-1.5">
                  {pos > 0 && <span className="text-slate-300">→</span>}
                  <span
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: `${item.color}22`, color: '#334155' }}
                  >
                    {item.emoji ? (
                      <span aria-hidden>{item.emoji}</span>
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    {item.label}
                  </span>
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
