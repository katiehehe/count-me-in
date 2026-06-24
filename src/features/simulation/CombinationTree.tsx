import { useEffect, useRef, useState } from 'react'
import type { TreeOption, TreeStage } from '../../content/types'
import { Button } from '../../components/Button'

interface CombinationTreeProps {
  stages: TreeStage[]
  pairingLabel?: string
  onComplete?: () => void
}

function TreeNode({
  option,
  isRoot,
  delayMs,
}: {
  option?: TreeOption
  isRoot?: boolean
  delayMs: number
}) {
  return (
    <div
      className="branch-in flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 text-xs font-semibold shadow-sm"
      style={{
        animationDelay: `${delayMs}ms`,
        backgroundColor: isRoot ? '#1e3f6f' : `${option?.color ?? '#94a3b8'}1f`,
        borderColor: isRoot ? '#1e3f6f' : `${option?.color ?? '#94a3b8'}66`,
        color: isRoot ? '#ffffff' : '#334155',
      }}
    >
      {isRoot ? (
        <span>Start</span>
      ) : (
        <>
          <span aria-hidden>{option?.emoji ?? '•'}</span>
          <span className="whitespace-nowrap">{option?.label}</span>
        </>
      )}
    </div>
  )
}

/**
 * A decision tree that branches out one stage at a time. Each stage multiplies
 * the number of paths, making the counting principle visible: the number of
 * leaves equals the product of the stage sizes. Reveal is animated (and the
 * animation is disabled under prefers-reduced-motion via CSS).
 */
export function CombinationTree({ stages, pairingLabel = 'combo', onComplete }: CombinationTreeProps) {
  const [revealed, setRevealed] = useState(0)
  const completedRef = useRef(false)

  const allRevealed = revealed >= stages.length
  const sizes = stages.map((s) => s.options.length)
  const total = sizes.reduce((p, s) => p * s, 1)
  const revealedProduct = sizes.slice(0, revealed).reduce((p, s) => p * s, 1)

  useEffect(() => {
    if (allRevealed && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  }, [allRevealed, onComplete])

  // Recursively render the subtree to the right of a node. Each level is a
  // <ul> whose ::before draws the parent's outgoing stub and whose <li>
  // pseudo-elements draw the vertical bracket plus each child's incoming stub.
  const renderChildren = (stageIndex: number, keyPrefix: string, baseDelay: number) => {
    if (stageIndex >= stages.length || stageIndex >= revealed) return null
    const options = stages[stageIndex].options
    return (
      <ul className="tree-branch">
        {options.map((opt, idx) => (
          <li key={`${keyPrefix}-${opt.id}`} className="tree-leaf">
            <TreeNode option={opt} delayMs={baseDelay + idx * 60} />
            {renderChildren(stageIndex + 1, `${keyPrefix}-${opt.id}`, baseDelay + 80)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm font-semibold text-brand-700">
        {stages.map((s, i) => (
          <span
            key={s.label}
            className={`rounded-full border-2 px-3 py-1 ${
              i < revealed ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white text-slate-400'
            }`}
          >
            {s.label}: {s.options.length}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-3xl border-2 border-brand-100 bg-white/70 p-4">
        <div className="combo-tree mx-auto flex w-max items-center">
          <TreeNode isRoot delayMs={0} />
          {renderChildren(0, 'root', 0)}
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm shadow-brand-100/40">
        {revealed === 0 ? (
          <p className="text-sm text-slate-600">
            Tap “Branch out” to grow the tree. Each full path from Start to a leaf is one unique choice.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Paths so far:{' '}
            <span className="font-mono font-bold text-brand-600">
              {sizes.slice(0, revealed).join(' × ')} = {revealedProduct}
            </span>
          </p>
        )}
        {allRevealed && (
          <p className="mt-1 text-sm font-semibold text-success-700">
            🎉 Each path is one unique choice, so the number of paths is how many choices we have.
            There are {total} leaves, so {total} {pairingLabel}
            {total !== 1 ? 's' : ''} ({sizes.join(' × ')} = {total}).
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!allRevealed ? (
          <Button onClick={() => setRevealed((r) => Math.min(r + 1, stages.length))}>
            Branch out →
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              completedRef.current = true
              setRevealed(0)
            }}
          >
            ↻ Replay
          </Button>
        )}
      </div>
    </div>
  )
}
