/**
 * Decides whether a single Enter keystroke should advance to the next step.
 *
 * The invariant that makes Enter "two-press": the keystroke that SUBMITS an answer
 * must never also advance. React 18 flushes the answer's state synchronously during
 * the keydown, so by the time the global handler runs the step already reads as
 * "correct" — `canAdvanceNow` is true. We therefore also require that the step was
 * ALREADY satisfiable *before* this keystroke (`advancibleBeforeKey`, captured in the
 * event capture phase, before React grades it). So the submitting Enter only shows the
 * explanation; the NEXT Enter (where it was already correct beforehand) advances.
 */
export function shouldAdvanceOnEnter(opts: {
  advancibleBeforeKey: boolean
  canAdvanceNow: boolean
  locked: boolean
}): boolean {
  return opts.advancibleBeforeKey && opts.canAdvanceNow && !opts.locked
}
