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
import {
  handshakes,
  latticePaths,
  starsAndBars,
  unionTwo,
  weightedValue,
} from '../../content/probabilityMath'

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

function mutuallyExclusiveQ(rng: Rng): Generated {
  const choice = pick(rng, [
    'a King or a Queen',
    'an Ace or a King',
    'a 7 or a 10',
    'a Jack or a Queen',
  ])
  return {
    kind: 'mutually-exclusive',
    prompt: `From a standard 52-card deck, a single card can’t be two ranks at once. How many cards are ${choice}? (Add the disjoint counts.)`,
    answer: 8,
    formula: '4 + 4',
  }
}

function binomialCoinQ(rng: Rng): Generated {
  const n = pick(rng, [5, 6, 7])
  const k = pick(rng, [2, 3])
  return {
    kind: 'binomial-coin',
    prompt: `A coin is flipped ${n} times. How many of the sequences have exactly ${k} heads?`,
    answer: combinations(n, k),
    formula: `C(${n}, ${k})`,
  }
}

function binomialTheoremQ(rng: Rng): Generated {
  const n = pick(rng, [4, 5, 6])
  const k = pick(rng, [1, 2, 3])
  return {
    kind: 'binomial-theorem',
    prompt: `In the expansion of (a + b)^${n}, what is the coefficient of a^${n - k} b^${k}? (It’s the number of ways to choose which ${k} factors give b.)`,
    answer: combinations(n, k),
    formula: `C(${n}, ${k})`,
  }
}

function inclusionExclusionQ(rng: Rng): Generated {
  const opt = pick(rng, [
    { q: 'a heart or a king', a: 13, b: 4, both: 1 },
    { q: 'a heart or a face card', a: 13, b: 12, both: 3 },
    { q: 'a spade or a queen', a: 13, b: 4, both: 1 },
  ] as const)
  return {
    kind: 'inclusion-exclusion',
    prompt: `From a standard 52-card deck, how many cards are ${opt.q}? (Add the two groups, then subtract the overlap counted twice.)`,
    answer: unionTwo(opt.a, opt.b, opt.both),
    formula: `${opt.a} + ${opt.b} − ${opt.both}`,
  }
}

function starsAndBarsQ(rng: Rng): Generated {
  const k = pick(rng, [3, 4])
  const n = pick(rng, [5, 6, 7])
  return {
    kind: 'stars-and-bars',
    prompt: `In how many ways can ${n} identical candies be distributed among ${k} kids (a kid may get 0)? Use stars and bars.`,
    answer: starsAndBars(n, k),
    formula: `C(${n}+${k}−1, ${k}−1)`,
  }
}

function appliedProbabilityQ(rng: Rng): Generated {
  if (rng() < 0.5) {
    const k = pick(rng, [1, 2, 3])
    return {
      kind: 'applied-probability',
      prompt: `How many 5-card hands contain exactly ${k} ace${k === 1 ? '' : 's'}? (Choose the aces, then the rest.)`,
      answer: combinations(4, k) * combinations(48, 5 - k),
      formula: `C(4,${k})·C(48,${5 - k})`,
    }
  }
  const h = pick(rng, [2, 3])
  return {
    kind: 'applied-probability',
    prompt: `How many ${h}-card hands contain at least one ace? (Total minus the no-ace hands.)`,
    answer: combinations(52, h) - combinations(48, h),
    formula: `C(52,${h}) − C(48,${h})`,
  }
}

function contestCountingQ(rng: Rng): Generated {
  if (rng() < 0.5) {
    const nn = pick(rng, [6, 8, 10, 12])
    return {
      kind: 'contest-counting',
      prompt: `${nn} people each shake hands once with every other person. How many handshakes happen in total?`,
      answer: handshakes(nn),
      formula: `C(${nn}, 2)`,
    }
  }
  const mm = pick(rng, [2, 3, 4])
  const nn = pick(rng, [2, 3])
  return {
    kind: 'contest-counting',
    prompt: `How many right/up lattice paths go from (0,0) to (${mm},${nn})?`,
    answer: latticePaths(mm, nn),
    formula: `C(${mm}+${nn}, ${nn})`,
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

function decisionEvQ(rng: Rng): Generated {
  if (pick(rng, [true, false])) {
    const k = pick(rng, [4, 5, 10, 20, 25])
    const v = intIn(rng, 2, 5)
    const prize = k * v
    const ev = weightedValue([prize, 0], [{ n: 1, d: k }, { n: k - 1, d: k }])
    return {
      kind: 'decision-ev',
      prompt: `A raffle ticket wins $${prize} with probability 1/${k} and nothing otherwise. What ticket price (in dollars) makes the game fair — equal to the expected winnings?`,
      answer: ev.n / ev.d,
      formula: `${prize} × 1/${k}`,
    }
  }
  const perPlay = intIn(rng, 2, 5)
  const plays = 10 * pick(rng, [1, 2, 3])
  return {
    kind: 'decision-ev',
    prompt: `Each play of a game has expected winnings of $${perPlay}. By linearity, what total winnings (in dollars) do you expect over ${plays} independent plays?`,
    answer: perPlay * plays,
    formula: `${plays} × ${perPlay}`,
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
  'mutually-exclusive': mutuallyExclusiveQ,
  'binomial-coin': binomialCoinQ,
  'binomial-theorem': binomialTheoremQ,
  'inclusion-exclusion': inclusionExclusionQ,
  'stars-and-bars': starsAndBarsQ,
  'contest-counting': contestCountingQ,
  'applied-probability': appliedProbabilityQ,
  synthesis: synthesisQ,
  probability: expectedCountQ,
  'expected-value': expectedCountQ,
  'decision-ev': decisionEvQ,
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
