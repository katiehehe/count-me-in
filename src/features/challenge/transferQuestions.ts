import { mulberry32, type Rng } from '../../content/randomize'
import {
  combinations,
  countingPrinciple,
  factorial,
  formatFactorial,
  formatMultisetFormula,
  multisetPermutationCount,
  permutations,
  repeatedArrangements,
} from '../simulation/permutationMath'

/**
 * A transfer question whose correct `answer` is computed entirely in code. The AI
 * never decides correctness for these — it only phrases feedback (see
 * `buildEvaluationPrompt`'s `codeVerdict`). This satisfies the PRD's "Math
 * Verification Requirement": deterministic checkers are the source of truth.
 */
export interface TransferQuestion {
  conceptId: string
  kind: string
  prompt: string
  answer: number
  /** Human-readable formula shown in feedback, e.g. "5 × 4 × 3". */
  formula: string
}

type Generated = Omit<TransferQuestion, 'conceptId'>

function intIn(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

function countingPrincipleQ(rng: Rng): Generated {
  // Half the time use a product-of-stages problem, half a repetition (code) problem,
  // so both countingPrinciple and repeatedArrangements get exercised.
  if (rng() < 0.5) {
    const a = intIn(rng, 3, 6)
    const b = intIn(rng, 3, 6)
    const c = intIn(rng, 2, 5)
    const noun = pick(rng, ['smoothie', 'outfit', 'sundae', 'sandwich'])
    return {
      kind: 'counting-principle',
      prompt: `A shop lets you build a ${noun} by choosing 1 of ${a} bases, 1 of ${b} mix-ins, and 1 of ${c} toppings. How many different ${noun}s can you make?`,
      answer: countingPrinciple([a, b, c]),
      formula: `${a} × ${b} × ${c}`,
    }
  }
  const options = intIn(rng, 2, 5)
  const slots = intIn(rng, 2, 4)
  return {
    kind: 'repeated-arrangements',
    prompt: `A locker code is ${slots} symbols long, and each symbol is chosen from ${options} possible symbols (repeats allowed). How many different codes are possible?`,
    answer: repeatedArrangements(options, slots),
    formula: `${options}^${slots}`,
  }
}

function factorialQ(rng: Rng): Generated {
  const n = intIn(rng, 4, 7)
  const noun = pick(rng, ['books', 'trophies', 'paintings', 'friends', 'medals'])
  return {
    kind: 'factorial',
    prompt: `How many different ways can ${n} distinct ${noun} be arranged in a row?`,
    answer: factorial(n),
    formula: formatFactorial(n),
  }
}

function nprQ(rng: Rng): Generated {
  const n = intIn(rng, 5, 8)
  return {
    kind: 'permutation',
    prompt: `In a race with ${n} runners, how many different ways can the gold, silver, and bronze medals be awarded (no ties)?`,
    answer: permutations(n, 3),
    formula: `${n} × ${n - 1} × ${n - 2}`,
  }
}

function multisetQ(rng: Rng): Generated {
  const r = intIn(rng, 2, 3)
  const b = intIn(rng, 2, 3)
  const g = intIn(rng, 1, 2)
  return {
    kind: 'multiset-permutation',
    prompt: `A bracelet is strung in a row from ${r} identical red beads, ${b} identical blue beads, and ${g} identical green beads. How many distinct color patterns are possible?`,
    answer: multisetPermutationCount([r, b, g]),
    formula: formatMultisetFormula([r, b, g]),
  }
}

function combinationsQ(rng: Rng): Generated {
  const n = intIn(rng, 5, 9)
  let k = intIn(rng, 2, 3)
  if (k >= n) k = 2
  return {
    kind: 'combinations',
    prompt: `From a group of ${n} students, how many different ${k}-person teams can be chosen (order does not matter)?`,
    answer: combinations(n, k),
    formula: `C(${n}, ${k})`,
  }
}

function independentQ(rng: Rng): Generated {
  const s = intIn(rng, 3, 5)
  return {
    kind: 'independent-events',
    prompt: `A spinner has ${s} equal sections and you also roll a fair 6-sided die. How many equally likely (section, die-face) combinations are there?`,
    answer: countingPrinciple([s, 6]),
    formula: `${s} × 6`,
  }
}

function expectedCountQ(rng: Rng): Generated {
  const rolls = pick(rng, [60, 120, 180])
  const face = intIn(rng, 1, 6)
  return {
    kind: 'expected-count',
    prompt: `If you roll a fair 6-sided die ${rolls} times, about how many times do you expect to roll a ${face}?`,
    answer: rolls / 6,
    formula: `${rolls} × 1/6`,
  }
}

function dependentQ(rng: Rng): Generated {
  const red = intIn(rng, 4, 8)
  const blue = intIn(rng, 2, 5)
  const total = red + blue
  return {
    kind: 'dependent-events',
    prompt: `A drawer has ${red} red and ${blue} blue socks (${total} total). You pull two socks one after another without putting the first back. In how many ordered ways can you pull two red socks?`,
    answer: red * (red - 1),
    formula: `${red} × ${red - 1}`,
  }
}

function conditionalQ(rng: Rng): Generated {
  const choice = pick(rng, [
    { label: 'hearts', count: 3 },
    { label: 'red (hearts or diamonds)', count: 6 },
    { label: 'black (spades or clubs)', count: 6 },
    { label: 'spades', count: 3 },
  ] as const)
  return {
    kind: 'conditional-probability',
    prompt: `From a standard 52-card deck you are told the card is a FACE card (the 12 Jacks, Queens, and Kings). Restricting to those 12 equally likely cards, how many are ${choice.label}?`,
    answer: choice.count,
    formula: `count of ${choice.label} among the 12 face cards`,
  }
}

function complementQ(rng: Rng): Generated {
  const n = pick(rng, [2, 3])
  const total = 6 ** n
  const none = 5 ** n
  return {
    kind: 'complement-rule',
    prompt: `You roll ${n} fair dice (${total} equally likely outcomes). How many of those outcomes show AT LEAST ONE six?`,
    answer: total - none,
    formula: `${total} − ${none}`,
  }
}

function indicatorQ(rng: Rng): Generated {
  const item = pick(rng, ['name', 'hat', 'gift'] as const)
  const n = pick(rng, [5, 6, 8, 10])
  return {
    kind: 'indicator-variables',
    prompt: `${n} people each put their ${item} in a pile and take one back at random. By the indicator method, what is the expected number of people who get their OWN ${item}?`,
    answer: 1,
    formula: `${n} × 1/${n}`,
  }
}

function synthesisQ(rng: Rng): Generated {
  const target = pick(rng, [
    { name: 'an ace', m: 4 },
    { name: 'a king', m: 4 },
    { name: 'a heart', m: 13 },
  ] as const)
  const total = 52 * 51
  const none = (52 - target.m) * (51 - target.m)
  return {
    kind: 'synthesis',
    prompt: `You deal 2 cards from a 52-card deck one after another (order matters, no replacement). In how many of the ${total} ordered deals is AT LEAST ONE card ${target.name}? (Complement rule + dependent counting.)`,
    answer: total - none,
    formula: `52 × 51 − ${52 - target.m} × ${51 - target.m}`,
  }
}

function linearityQ(rng: Rng): Generated {
  const dice = 6 * pick(rng, [1, 2, 3])
  return {
    kind: 'linearity-expectation',
    prompt: `You roll ${dice} fair six-sided dice. By linearity of expectation, what is the expected number of sixes?`,
    answer: dice / 6,
    formula: `${dice} × 1/6`,
  }
}

const GENERATORS: Record<string, (rng: Rng) => Generated> = {
  'counting-principle': countingPrincipleQ,
  permutation: nprQ,
  'distinct-objects': factorialQ,
  factorial: factorialQ,
  'identical-objects': multisetQ,
  'multiset-permutation': multisetQ,
  combinations: combinationsQ,
  'independent-events': independentQ,
  'dependent-events': dependentQ,
  'conditional-probability': conditionalQ,
  'complement-rule': complementQ,
  'linearity-expectation': linearityQ,
  'indicator-variables': indicatorQ,
  synthesis: synthesisQ,
  probability: expectedCountQ,
  'expected-value': expectedCountQ,
}

/** Concept ids we can build a deterministic transfer question for. */
export function hasTransferQuestion(conceptIds: string[]): boolean {
  return conceptIds.some((c) => c in GENERATORS)
}

/**
 * Builds a deterministic transfer question for the most relevant lesson concept.
 * Same seed → same question, so a session is reproducible and unit-testable.
 */
export function buildTransferQuestion(conceptIds: string[], seed: number): TransferQuestion {
  const rng = mulberry32(seed)
  const conceptId = conceptIds.find((c) => c in GENERATORS) ?? 'factorial'
  const gen = GENERATORS[conceptId] ?? factorialQ
  return { conceptId, ...gen(rng) }
}

/** Grades a typed answer against the code-computed value (tolerant of commas/spaces). */
export function checkTransferAnswer(typed: string | number, answer: number): boolean {
  const n = typeof typed === 'number' ? typed : parseFloat(String(typed).replace(/[\s,]/g, ''))
  if (!Number.isFinite(n)) return false
  return Math.abs(n - answer) < 1e-9
}
