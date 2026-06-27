import type { Randomizer, StepRandomization } from './randomize'

export type StepType =
  | 'intro'
  | 'multiple-choice'
  | 'numeric-question'
  | 'fraction-question'
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
  | 'expected-value-sim'
  | 'product-grid'
  | 'multiset-condense'
  | 'worked-example'
  | 'conditional-select'
  | 'complement-select'
  | 'coin-flip-sim'
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
  /**
   * Number of slots/boxes to fill. Defaults to `count` (a full factorial). Set
   * smaller to build a partial product like nPr (e.g. count 5, slots 3 → 5×4×3).
   */
  slots?: number
}

/** Which teaching diagram a worked example renders and the narration highlights. */
export type WorkedExampleKind =
  | 'slots'
  | 'connections'
  | 'group'
  | 'tree'
  | 'distribution'
  | 'draw'
  | 'sample-space'
  | 'venn'
  | 'coins-sum'
  | 'steps'

/** One outcome tile in a sample-space diagram or conditional selector. */
export interface SampleOutcome {
  id: string
  label: string
  emoji?: string
}

/** One narration beat in a worked example: a spoken line, what it reveals, and any motion. */
export interface WorkedExampleBeat {
  /** The line the teacher narrates (also shown as a caption). */
  say: string
  /**
   * Diagram element to highlight/reveal while this line plays. Targets depend on the
   * `kind`: e.g. `'pool'`/`'slot-0'`/`'product'` (slots), `'left'`/`'right'`/`'product'`
   * (connections), `'items'`/`'repeats'`/`'product'` (group), `'ordered'`/`'grouped'`/
   * `'product'` (tree), `'bars'`/`'bar-0'`/`'result'` (distribution).
   */
  highlight?: string
  /**
   * Optional choreography cue enacted on this beat, e.g. `'shuffle'` (reorder the
   * items), `'condense'` (cluster identical items), `'collapse'` (collapse duplicates).
   */
  anim?: string
}

export interface WorkedConnectionItem {
  id: string
  label: string
  emoji?: string
}

export interface WorkedGroupChip {
  id: string
  label: string
  color: string
  /** Chips sharing a `kind` are identical (a repeated group divided out as k!). */
  kind: string
}

export interface WorkedDistributionBar {
  label: string
  value: number
}

export interface WorkedExampleConfig {
  /** Which teaching diagram to render. Defaults to `'slots'` (the arrangement view). */
  kind?: WorkedExampleKind
  /** Ordered narration beats the teacher walks through. */
  script: WorkedExampleBeat[]
  /** OpenAI TTS voice (defaults to 'nova'). */
  voice?: string
  /** `'slots'`: the distinct items whose count drives the slots and per-slot choices. */
  items?: ArrangementItem[]
  /** `'connections'`: two groups whose sizes multiply to the total. */
  connections?: {
    leftLabel: string
    rightLabel: string
    left: WorkedConnectionItem[]
    right: WorkedConnectionItem[]
    pairingLabel?: string
  }
  /** `'group'`: color-coded chips with repeats → n! ÷ (∏ k!). */
  group?: {
    chips: WorkedGroupChip[]
  }
  /** `'tree'`: ordered vs unordered selections → divide out the k! orderings. */
  tree?: {
    ordered: string[]
    grouped: string[]
    divideBy: number
    orderedLabel?: string
    groupedLabel?: string
  }
  /** `'distribution'`: a small bar chart with a result caption revealed at the end. */
  distribution?: {
    bars: WorkedDistributionBar[]
    caption: string
    /** Optional LaTeX for the result (rendered with KaTeX); falls back to `caption`. */
    latex?: string
  }
  /**
   * `'draw'`: drawing without replacement. A jar of `red`/`blue` marbles, two draw
   * cards, and the P(both red) product — numbers reveal beat by beat (`'jar'`,
   * `'draw1'`, `'draw2'`, `'product'`) so the sample visibly shrinks.
   */
  draw?: {
    red: number
    blue: number
  }
  /**
   * `'sample-space'`: an outcome grid. In the default `'conditional'` mode, beats
   * reveal `'space'`, `'given'` (dim outside B), `'favorable'` (highlight A ∩ B),
   * and `'result'` (P(A|B) = |A∩B|/|B|). In `'complement'` mode, beats reveal
   * `'space'`, `'target'` (outline the big event A), `'complement'` (shade the small
   * "not A" set), and `'result'` (P(A) = 1 − |notA|/|S| in KaTeX).
   */
  sampleSpace?: {
    outcomes: SampleOutcome[]
    mode?: 'conditional' | 'complement'
    givenIds?: string[]
    favorableIds?: string[]
    /** Complement mode: ids of the small, easy-to-count "not A" set. */
    complementIds?: string[]
    /** Complement mode: name of the event A for the result box, e.g. "at least one H". */
    eventLabel?: string
    /** Optional fixed column count for a grid layout (e.g. 6 for a dice table). */
    columns?: number
  }
  /**
   * `'venn'`: overlapping regions. In `'conditional'` mode, beats reveal `'a'`,
   * `'b'`, `'overlap'` (A ∩ B), `'result'`. In `'complement'` mode, a single circle
   * A sits in the world; beats reveal `'a'`, `'complement'` (shade everything
   * outside A), and `'result'` (P(A) = 1 − P(not A)).
   */
  venn?: {
    aLabel: string
    bLabel?: string
    mode?: 'conditional' | 'complement'
    /** LaTeX for the result box; defaults to the area-ratio (or complement) formula. */
    resultLatex?: string
  }
  /**
   * `'coins-sum'`: a row of `coins` coins. Default `'expectation'` mode reveals
   * `'coins'`, `'contributions'` (a `+½` per coin), `'result'` (E = coins × ½). The
   * `'indicator'` mode instead reveals `'coins'`, `'marks'` (a concrete 0/1 Xᵢ per
   * coin + the cumulative ΣXᵢ head count from `values`), and `'result'`
   * (E[Xᵢ] = ½ ⇒ E[ΣXᵢ] = coins × ½) in KaTeX.
   */
  coinsSum?: {
    coins: number
    mode?: 'expectation' | 'indicator'
    /** Indicator mode: the concrete 0/1 outcome of each coin for the worked flip. */
    values?: number[]
  }
  /**
   * `'steps'`: a stepped-equation reveal for multi-concept problems. Each line shows
   * a KaTeX equation (with an optional caption naming the tool used) and appears only
   * once its beat `'step-0'`, `'step-1'`, … is reached — so the board starts blank.
   */
  steps?: {
    lines: { latex: string; caption?: string }[]
  }
}

/** Config for the interactive conditional sample-space selector. */
export interface ConditionalSelectConfig {
  outcomes: SampleOutcome[]
  /** Ids forming the given event B (the restricted world). */
  givenIds: string[]
  /** Ids of the favorable event A within B (what the learner must select). */
  favorableIds: string[]
  /** Plain-language name of the given condition, e.g. "a heart". */
  givenLabel: string
  /** Plain-language name of the favorable event, e.g. "a face card". */
  favorableLabel: string
}

/** Config for the 10-coin trial simulator (running average heads → coins/2). */
export interface CoinFlipSimConfig {
  /** Coins flipped per trial. Defaults to 10. */
  coins?: number
  /** Label each coin as an indicator Xᵢ ∈ {0,1} and show the cumulative ΣXᵢ. */
  showIndicators?: boolean
}

/** Config for the interactive "select the complement" sample-space explorer. */
export interface ComplementSelectConfig {
  outcomes: SampleOutcome[]
  /** Ids of the small complement (the "not A" set) the learner must tap. */
  complementIds: string[]
  /** Plain-language name of the complement, e.g. "fewer than two heads". */
  complementLabel: string
  /** Plain-language name of the target event A, e.g. "at least two heads". */
  eventLabel: string
  /** Optional fixed column count for a grid layout (e.g. 4). Defaults to wrap. */
  columns?: number
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
  /** Optional accent color for the card's icon (e.g. a red vs blue die). */
  color?: string
}

export interface DependencePairingConfig {
  cards: DependenceCard[]
  /** Pairs of card ids that are dependent (one event affects the other). Order within a pair does not matter. */
  dependentPairs: [string, string][]
}

export interface ExpectedValueSimConfig {
  /** Number of die sides; faces are 1…sides, each equally likely. Defaults to 11. */
  sides?: number
}

export interface MultisetGroupConfig {
  label: string
  /** Hex color for this group's cards. */
  color: string
  /** How many identical cards of this color. */
  count: number
}

export interface MultisetCondenseConfig {
  /** Color groups of identical cards. Defaults to 2 red + 2 blue. */
  groups?: MultisetGroupConfig[]
}

export interface ProductGridConfig {
  /** Noun for the first-stage items (grid rows), e.g. "shirt". */
  rowLabel: string
  /** Noun for the second-stage items (grid columns), e.g. "pant". */
  colLabel: string
  rows: number
  cols: number
  /** Optional emoji shown beside each row item. */
  rowEmoji?: string
  /** Optional emoji shown above each column item. */
  colEmoji?: string
  /** Noun for one combined outcome, e.g. "outfit". Defaults to "outcome". */
  pairingLabel?: string
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
  expectedValueSimConfig?: ExpectedValueSimConfig
  productGridConfig?: ProductGridConfig
  multisetCondenseConfig?: MultisetCondenseConfig
  workedExampleConfig?: WorkedExampleConfig
  conditionalSelectConfig?: ConditionalSelectConfig
  complementSelectConfig?: ComplementSelectConfig
  coinFlipSimConfig?: CoinFlipSimConfig
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
  inputType: 'multiple-choice' | 'numeric' | 'slider' | 'select' | 'fraction'
  choices?: string[]
  /**
   * The correct answer. For `fraction` questions this is a fraction string such
   * as `'1/12'` (or a whole-number string); any equivalent fraction the learner
   * types is accepted as correct (e.g. `3/12` matches `1/4`).
   */
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
  'dependent-events': 'Dependent Events',
  'conditional-probability': 'Conditional Probability',
  'complement-rule': 'The Complement Rule',
  'linearity-expectation': 'Linearity of Expectation',
  'indicator-variables': 'Indicator Variables',
  synthesis: 'Mixed Review',
  probability: 'Probability',
  'expected-value': 'Expected Value',
}
