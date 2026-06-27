import { CONCEPT_LABELS } from '../../content/types'
import { callChallengeAi } from '../../firebase/aiClient'
import type { PracticeProblem } from './practiceEngine'

const PERSONA =
  'You are Pip, a cat tutor in a counting & probability app. Reword a practice ' +
  'question into a FRESH, varied real-world scenario, keeping the EXACT same numbers ' +
  'and the same operation (so the answer is unchanged). Do not state the numeric answer.'

export function conceptLabel(conceptId: string): string {
  return CONCEPT_LABELS[conceptId] ?? conceptId
}

/**
 * Asks the AI to reword a code-generated problem into a fresh scenario (the math —
 * numbers, operation, and answer — is fixed by code, never the model). Falls back
 * to the code wording if AI is unavailable, so practice always works.
 */
export async function reskinProblem(problem: PracticeProblem): Promise<string> {
  try {
    const prompt = [
      PERSONA,
      '',
      `Concept: ${conceptLabel(problem.conceptId)}`,
      `Operation/formula: ${problem.formula}`,
      `Base question: "${problem.prompt}"`,
      '',
      'Return JSON: { "prompt": <a one-paragraph word problem with the same numbers and answer> }.',
    ].join('\n')
    const raw = await callChallengeAi<{ prompt?: string }>('practice_reskin', prompt)
    return (raw.prompt ?? '').trim() || problem.prompt
  } catch {
    return problem.prompt
  }
}
