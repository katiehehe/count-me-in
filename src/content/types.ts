import type { Randomizer, StepRandomization } from './randomize'

export type StepType =
  | 'intro'
  | 'multiple-choice'
  | 'numeric-question'
  | 'arrangement'
  | 'connection'
  | 'tree'
  | 'simulation'
  | 'factorial-discovery'
  | 'probability'
  | 'outcome-select'
  | 'condensing'
  | 'combined-experiment'
  | 'dependence-pairing'
  | 'completion'

export interface Course {
  id: string
  title: string
  subject: string
  description: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  description: string
  hook: string
  estimatedMinutes: number
  prerequisites: string[]
  concepts: string[]
  steps: LessonStep[]
}

export interface ArrangementConfig {
  items: ArrangementItem[]
  /** Total number of distinct orderings that exist (shown for context). */
  targetCount?: number
  /** Unique orderings the learner must discover to complete the step. */
  goalCount?: number
  /**
   * When true, two items that share the same `kind` are treated as visually
   * identical, so swapping them does NOT count as a new ordering. Used to teach
   * permutations with identical objects. Defaults to false (every item distinct).
   */
  keyByKind?: boolean
  prompt?: string
}

export interface ArrangementItem {
  id: string
  label: string
  color: string
  /** Optional emoji/icon shown prominently in place of a plain colored dot. */
  emoji?: string
  /** Items sharing the same `kind` are visually identical when keyByKind is on. */
  kind?: string
}

export interface FactorialDiscoveryConfig {
  itemLabel: string
  count: number
}

export interface ConnectionGroupItem {
  id: string
  label: string
  emoji?: string
  color: string
}

export interface ConnectionConfig {
  /** Label for the left-hand group, e.g. "Shirts". */
  leftLabel: string
  /** Label for the right-hand group, e.g. "Socks". */
  rightLabel: string
  leftItems: ConnectionGroupItem[]
  rightItems: ConnectionGroupItem[]
  /** Noun for one completed pairing, e.g. "outfit". Defaults to "pairing". */
  pairingLabel?: string
}

export interface TreeOption {
  id: string
  label: string
  emoji?: string
  color: string
}

export interface TreeStage {
  /** Label for this decision stage, e.g. "Bun". */
  label: string
  options: TreeOption[]
}

export interface TreeConfig {
  /** Ordered decision stages; the tree branches once per stage. */
  stages: TreeStage[]
  /** Noun for one complete path through the tree, e.g. "burger". */
  pairingLabel?: string
}

export interface SimulationConfig {
  /** The face values printed on the die (length = number of sides). */
  faces: number[]
  /** How many times to roll per simulation run. Defaults to 1000. */
  rolls?: number
  /** When true, the learner can edit the face values and re-roll. */
  editable?: boolean
}

export interface ProbabilityConfig {
  /** Label for event A, e.g. "Lands on blue". */
  eventALabel: string
  /** Label for event B, e.g. "Lands on a star". */
  eventBLabel: string
  /** Starting P(A) as a percentage 0–100. Defaults to 50. */
  initialAPercent?: number
  /** Starting P(B) as a percentage 0–100. Defaults to 50. */
  initialBPercent?: number
}

export interface OutcomeSelectConfig {
  /** Label for the left-hand group, e.g. "Die". */
  leftLabel: string
  /** Label for the right-hand group, e.g. "Coin". */
  rightLabel: string
  leftItems: ConnectionGroupItem[]
  rightItems: ConnectionGroupItem[]
  /** The id of the left item in the asked-for combined outcome. */
  targetLeftId: string
  /** The id of the right item in the asked-for combined outcome. */
  targetRightId: string
  /** Noun for one combined outcome, e.g. "outcome". Defaults to "outcome". */
  pairingLabel?: string
}

export interface CondensingConfig {
  /** The chosen group of people/items whose orderings collapse into one group. */
  items: ConnectionGroupItem[]
  /** Noun for one unordered group, e.g. "team" or "committee". Defaults to "group". */
  groupLabel?: string
}

export interface CombinedExperimentConfig {
  /** How many combined trials to run. Defaults to 1200. */
  trials?: number
  /** Number of die faces (1…dieFaces). Defaults to 6. */
  dieFaces?: number
  /** The die face the learner is hunting for, e.g. 4. */
  targetFace: number
  /** Labels for the two coin sides. Defaults to ["Heads", "Tails"]. */
  coinLabels?: [string, string]
  /** Which coin side is the target: 0 = first label, 1 = second label. */
  targetCoinIndex: 0 | 1
}

export interface DependenceCard {
  id: string
  label: string
  emoji?: string
}

export interface DependencePairingConfig {
  cards: DependenceCard[]
  /** Pairs of card ids that are dependent (one event affects the other). Order within a pair does not matter. */
  dependentPairs: [string, string][]
}

export interface LessonStep {
  id: string
  type: StepType
  title: string
  body: string
  prompt?: string
  arrangementConfig?: ArrangementConfig
  connectionConfig?: ConnectionConfig
  treeConfig?: TreeConfig
  simulationConfig?: SimulationConfig
  factorialConfig?: FactorialDiscoveryConfig
  probabilityConfig?: ProbabilityConfig
  outcomeSelectConfig?: OutcomeSelectConfig
  condensingConfig?: CondensingConfig
  combinedExperimentConfig?: CombinedExperimentConfig
  dependencePairingConfig?: DependencePairingConfig
  /** When set, renders a systematic, color-coded list of all orderings of these items. */
  orderingsDisplay?: ArrangementItem[]
  question?: Question
  feedback?: FeedbackMap
  nextButtonLabel?: string
  concepts?: string[]
  /**
   * Optional per-session generator. When present, {@link resolveLesson} calls it
   * once at lesson load with a seeded {@link Randomizer} to fill in fresh numbers,
   * templated prompts, and the matching correct answer for this play-through.
   */
  randomize?: (r: Randomizer) => StepRandomization
}

export interface Question {
  inputType: 'multiple-choice' | 'numeric' | 'slider' | 'select'
  choices?: string[]
  correctAnswer?: string | number
  tolerance?: number
  correctChoiceIndex?: number
  explanation: string
  misconceptionTags?: string[]
}

export interface FeedbackMap {
  correct: string
  incorrect: string
  /**
   * First-tier hint: a CONCEPTUAL nudge — how to think about the problem, which
   * idea applies, how to set it up. It should NOT hand over the arithmetic.
   */
  hint?: string
  /**
   * Second-tier hint, revealed only after {@link hint}: the concrete computation
   * (the formula plugged in / the arithmetic to perform). For randomized steps,
   * template this through the `randomize` hook just like other text so it shows
   * the run's actual numbers and stays consistent with the graded answer.
   */
  computationHint?: string
  choiceFeedback?: Record<string, string>
}

export const CONCEPT_LABELS: Record<string, string> = {
  permutation: 'Permutations',
  factorial: 'Factorials',
  'counting-principle': 'Counting Principle',
  'distinct-objects': 'Distinct Objects',
  'identical-objects': 'Identical Objects',
  'multiset-permutation': 'Dividing Out Repeats',
  combinations: 'Combinations',
  'independent-events': 'Independent Events',
  probability: 'Probability',
  'expected-value': 'Expected Value',
}
