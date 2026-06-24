import { useState } from 'react'

export interface GuideStep {
  label: string
  done: boolean
}

/**
 * A small "what do I click?" helper for interactive sims. Shows a checklist of
 * the actions the learner still needs to take to get the gist of the simulation,
 * and names the next button to press. Pairs with widgets that only report
 * completion (enabling "Next") once every required action is done.
 */
export function InteractionGuide({ steps }: { steps: GuideStep[] }) {
  const [open, setOpen] = useState(false)
  const next = steps.find((s) => !s.done)

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
      >
        🧭 Which button do I press?
      </button>
      {open && (
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          {next ? (
            <p className="mb-2 font-semibold text-slate-700">
              Next: tap <span className="text-brand-700">“{next.label}”</span>.
            </p>
          ) : (
            <p className="mb-2 font-semibold text-success-700">
              All done — you can press Next to continue!
            </p>
          )}
          <ul className="space-y-1">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={s.done ? 'text-success-600' : 'text-slate-300'} aria-hidden>
                  {s.done ? '✓' : '○'}
                </span>
                <span className={s.done ? 'text-slate-400 line-through' : 'text-slate-600'}>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
