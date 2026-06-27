import { getLessonById } from '../../content/course'
import { mulberry32, type Rng } from '../../content/randomize'
import type { Lesson } from '../../content/types'
import type { LessonProgressDoc } from '../../firebase/firestoreTypes'
import { isGradedStepType } from '../progress/mastery'
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

/** Difficulty runs 1-5. The "base" material caps at 3; 4-5 are opt-in challenge. */
export const MIN_LEVEL = 1
export const BASE_CAP = 3
export const MAX_LEVEL = 5

export interface PracticeProblem {
  conceptId: string
  kind: string
  prompt: string
  /** Correct answer — always computed in code. */
  answer: number
  formula: string
  /** Concise but comprehensive "why", including the computation. */
  explanation: string
}

function intIn(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

// --- Difficulty-scaled problem generators (answers computed in code) ----------

function factorialProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const n = clamp(3 + d, 4, 8)
  const noun = pick(rng, ['books', 'trophies', 'paintings', 'friends', 'medals', 'photos'])
  const answer = factorial(n)
  return {
    kind: 'factorial',
    prompt: `How many different ways can ${n} distinct ${noun} be arranged in a row?`,
    answer,
    formula: formatFactorial(n),
    explanation: `Every item is distinct and order matters: ${n} choices for the first spot, ${n - 1} for the next, and so on down to 1. Multiply them all (that's ${n}!): ${formatFactorial(n)} = ${answer}.`,
  }
}

function permutationProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  void rng
  const n = clamp(4 + d, 5, 9)
  const k = d >= 3 ? 3 : 2
  const prompt =
    k === 3
      ? `In a race with ${n} runners, how many ways can gold, silver, and bronze be awarded (no ties)?`
      : `From ${n} candidates, how many ways can a president and a vice-president be chosen?`
  const answer = permutations(n, k)
  const formula = Array.from({ length: k }, (_, i) => n - i).join(' × ')
  return {
    kind: 'permutation',
    prompt,
    answer,
    formula,
    explanation: `Order matters and you fill ${k} distinct spots from ${n}, so multiply the ${k} falling factors: ${formula} = ${answer}. You stop after ${k} terms because only ${k} positions get filled.`,
  }
}

function combinationProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const n = clamp(5 + d, 6, 11)
  let k = d >= 4 ? 3 : 2
  if (k >= n) k = 2
  void rng
  const answer = combinations(n, k)
  return {
    kind: 'combination',
    prompt: `From a group of ${n} students, how many different ${k}-person teams can be chosen (order does not matter)?`,
    answer,
    formula: `C(${n}, ${k})`,
    explanation: `Order doesn't matter, so start from the ${k}-spot ordered count and divide out the ${k}! ways to reorder the same group: C(${n}, ${k}) = ${answer}.`,
  }
}

function countingPrincipleProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  // Higher difficulty: a "code" (repetition) variant or more stages.
  if (d >= 3 && rng() < 0.5) {
    const options = clamp(1 + d, 3, 7)
    const slots = d >= 4 ? 3 : 2
    return {
      kind: 'repeated',
      prompt: `A locker code is ${slots} symbols long, each chosen from ${options} symbols (repeats allowed). How many codes are possible?`,
      answer: repeatedArrangements(options, slots),
      formula: `${options}^${slots}`,
      explanation: `Each of the ${slots} slots is an independent pick from ${options} symbols, and repeats are allowed, so it's ${options} multiplied by itself ${slots} times: ${options}^${slots} = ${repeatedArrangements(options, slots)}.`,
    }
  }
  const stages = d <= 2 ? 2 : d <= 4 ? 3 : 4
  const sizes = Array.from({ length: stages }, () => intIn(rng, 2, clamp(3 + d, 3, 6)))
  const noun = pick(rng, ['smoothie', 'outfit', 'sandwich', 'sundae'])
  const answer = countingPrinciple(sizes)
  return {
    kind: 'counting_principle',
    prompt: `You build a ${noun} by picking one option at each of ${stages} stages with ${sizes.join(
      ', ',
    )} choices. How many different ${noun}s are possible?`,
    answer,
    formula: sizes.join(' × '),
    explanation: `The ${stages} stages are independent choices made one after another, so multiply the options at each stage: ${sizes.join(' × ')} = ${answer}.`,
  }
}

function multisetProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const plans: number[][] = [
    [2, 1],
    [2, 2],
    [3, 2],
    [3, 2, 1],
    [3, 3, 2],
  ]
  const counts = plans[clamp(d - 1, 0, plans.length - 1)]
  const colors = ['red', 'blue', 'green']
  void rng
  const parts = counts.map((c, i) => `${c} ${colors[i]}`).join(', ')
  const total = counts.reduce((a, b) => a + b, 0)
  const answer = multisetPermutationCount(counts)
  return {
    kind: 'multiset',
    prompt: `A bracelet is strung in a row from these identical beads: ${parts}. How many distinct color patterns are possible?`,
    answer,
    formula: formatMultisetFormula(counts),
    explanation: `Arrange all ${total} items as if distinct (${total}!), then divide out the rearrangements within each identical group (${counts
      .map((c) => `${c}!`)
      .join(' × ')}) — swapping identical items makes no new pattern: ${formatMultisetFormula(counts)} = ${answer}.`,
  }
}

function independentProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const s = clamp(2 + d, 3, 7)
  void rng
  const answer = countingPrinciple([s, 6])
  return {
    kind: 'counting_principle',
    prompt: `A spinner has ${s} equal sections and you also roll a fair 6-sided die. How many equally likely (section, die-face) combinations are there?`,
    answer,
    formula: `${s} × 6`,
    explanation: `The two choices are independent, so each of the ${s} options on one side pairs with each of the 6 on the other — multiply: ${s} × 6 = ${answer}.`,
  }
}

function expectedCountProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const rolls = [60, 120, 180, 240, 300][clamp(d - 1, 0, 4)]
  const face = intIn(rng, 1, 6)
  const answer = rolls / 6
  return {
    kind: 'expected_count',
    prompt: `If you roll a fair 6-sided die ${rolls} times, about how many times do you expect to roll a ${face}?`,
    answer,
    formula: `${rolls} × 1/6`,
    explanation: `Each of the ${rolls} trials hits the target with probability 1/6, and expected count = trials × probability: ${rolls} × 1/6 = ${answer} on average.`,
  }
}

function dependentProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const red = intIn(rng, clamp(2 + d, 3, 6), clamp(4 + d, 5, 9))
  const blue = intIn(rng, 2, clamp(2 + d, 2, 5))
  const total = red + blue
  const answer = red * (red - 1)
  return {
    kind: 'dependent',
    prompt: `A jar holds ${red} red and ${blue} blue marbles (${total} total). You draw two one after another WITHOUT putting the first back. In how many ordered ways can both draws come out red?`,
    answer,
    formula: `${red} × ${red - 1}`,
    explanation: `The first red can be any of the ${red} reds. Once it is drawn and kept, only ${red - 1} reds remain among the ${total - 1} leftover marbles, so the second draw has ${red - 1} red options: ${red} × ${red - 1} = ${answer}. That drop from ${red} to ${red - 1} is exactly what "without replacement" — dependence — does to the count.`,
  }
}

function conditionalProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const sides = [6, 6, 8, 10, 12][clamp(d - 1, 0, 4)]
  const evens: number[] = []
  for (let i = 2; i <= sides; i += 2) evens.push(i)
  const m = intIn(rng, 1, sides - 1)
  const favorable = evens.filter((e) => e > m)
  const answer = favorable.length
  return {
    kind: 'conditional',
    prompt: `A fair ${sides}-sided die (faces 1–${sides}) is rolled and you are told the result is EVEN. Among those equally likely outcomes, how many are greater than ${m}?`,
    answer,
    formula: `count of even faces > ${m}`,
    explanation: `Being told "even" restricts the world to the ${evens.length} even faces {${evens.join(', ')}} — that set is the new sample space B. Of those, the ones greater than ${m} are {${favorable.join(', ')}}, so the answer is ${answer}. The conditional probability would be P = ${answer}/${evens.length}.`,
  }
}

function complementProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const n = intIn(rng, clamp(2 + d, 3, 4), clamp(3 + d, 4, 7))
  const total = 2 ** n
  const answer = total - 1
  return {
    kind: 'complement',
    prompt: `You flip a fair coin ${n} times, giving ${total} equally likely heads/tails sequences. How many of them contain AT LEAST ONE heads?`,
    answer,
    formula: `${total} − 1`,
    explanation: `Counting "at least one heads" directly is messy, but its complement is a single outcome — all tails. So ${total} − 1 = ${answer} sequences have at least one heads. That is the complement rule: count the easy opposite (just 1) and subtract.`,
  }
}

function linearityProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  if (pick(rng, [true, false])) {
    const coins = 2 * intIn(rng, 2, 3 + d)
    const answer = coins / 2
    return {
      kind: 'linearity',
      prompt: `You flip ${coins} fair coins. By linearity of expectation, what is the expected NUMBER of heads?`,
      answer,
      formula: `${coins} × 1/2`,
      explanation: `Each coin contributes an expected 1/2 head, and the expectation of a SUM is the sum of the expectations — dependence wouldn't even matter. So E = ${coins} × 1/2 = ${answer}.`,
    }
  }
  const dice = 2 * intIn(rng, 1, 2 + d)
  const answer = (7 * dice) / 2
  return {
    kind: 'linearity',
    prompt: `You roll ${dice} fair six-sided dice. By linearity of expectation, what is the expected SUM of all ${dice} dice?`,
    answer,
    formula: `${dice} × 3.5`,
    explanation: `One die has expected value 3.5, and the expected value of a sum is the sum of the expected values. So E = ${dice} × 3.5 = ${answer} — no need to consider how the dice interact.`,
  }
}

function indicatorProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const scenario = pick(rng, ['heads', 'sixes', 'matches'] as const)
  if (scenario === 'heads') {
    const coins = 2 * intIn(rng, 2, 3 + d)
    const answer = coins / 2
    return {
      kind: 'indicator',
      prompt: `You flip ${coins} fair coins. Using the indicator method, what is the expected number of heads?`,
      answer,
      formula: `${coins} × 1/2`,
      explanation: `Let Xᵢ = 1 if coin i is heads, else 0, so the head count is X₁ + … + X${coins}. Then E[count] = ΣP(heads) = ${coins} × 1/2 = ${answer}.`,
    }
  }
  if (scenario === 'sixes') {
    const dice = 6 * intIn(rng, 1, 1 + Math.min(d, 3))
    const answer = dice / 6
    return {
      kind: 'indicator',
      prompt: `You roll ${dice} fair six-sided dice. Using the indicator method, what is the expected number of sixes?`,
      answer,
      formula: `${dice} × 1/6`,
      explanation: `Let Xᵢ = 1 if die i shows a six, else 0. Then E[sixes] = ΣP(six) = ${dice} × 1/6 = ${answer} — one probability per die, summed.`,
    }
  }
  const n = intIn(rng, 3, 5 + d)
  return {
    kind: 'indicator',
    prompt: `${n} people each toss their name in a hat and draw one back at random. What is the expected number who draw their OWN name?`,
    answer: 1,
    formula: `${n} × 1/${n}`,
    explanation: `Let Xᵢ = 1 if person i draws their own name, else 0. Each has P = 1/${n}, so E[matches] = ${n} × 1/${n} = 1 — even though the draws are dependent.`,
  }
}

function combinedCountProblem(rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  const target = pick(rng, [
    { name: 'an ace', m: 4 },
    { name: 'a king', m: 4 },
    { name: 'a heart', m: 13 },
  ] as const)
  const total = 52 * 51
  const none = (52 - target.m) * (51 - target.m)
  const answer = total - none
  return {
    kind: 'synthesis',
    prompt: `You deal 2 cards from a 52-card deck one after another (order matters, no replacement). In how many of the ${total} ordered deals is AT LEAST ONE card ${target.name}?`,
    answer,
    formula: `52 × 51 − ${52 - target.m} × ${51 - target.m}`,
    explanation: `Count the complement — the dependent "no ${target.name}" deals — and subtract. Total ordered deals: 52 × 51 = ${total}. Deals avoiding ${target.name} entirely: ${52 - target.m} × ${51 - target.m} = ${none}. So ${total} − ${none} = ${answer}. (Complement rule + dependent counting combined.)`,
  }
}

function synthesisProblem(d: number, rng: Rng): Omit<PracticeProblem, 'conceptId'> {
  if (d >= 4 && pick(rng, [true, true, false])) {
    return combinedCountProblem(rng)
  }
  const core = [dependentProblem, conditionalProblem, complementProblem]
  const all = [
    dependentProblem,
    conditionalProblem,
    complementProblem,
    linearityProblem,
    indicatorProblem,
  ]
  const gen = pick(rng, d <= 2 ? core : all)
  return gen(d, rng)
}

const GENERATORS: Record<string, (d: number, rng: Rng) => Omit<PracticeProblem, 'conceptId'>> = {
  'counting-principle': countingPrincipleProblem,
  permutation: permutationProblem,
  'distinct-objects': factorialProblem,
  factorial: factorialProblem,
  'identical-objects': multisetProblem,
  'multiset-permutation': multisetProblem,
  combinations: combinationProblem,
  'independent-events': independentProblem,
  'dependent-events': dependentProblem,
  'conditional-probability': conditionalProblem,
  'complement-rule': complementProblem,
  'linearity-expectation': linearityProblem,
  'indicator-variables': indicatorProblem,
  synthesis: synthesisProblem,
  probability: expectedCountProblem,
  'expected-value': expectedCountProblem,
}

/** Generates a verified problem for a concept at a difficulty (deterministic by seed). */
export function generateProblem(conceptId: string, difficulty: number, seed: number): PracticeProblem {
  const rng = mulberry32(seed)
  const d = clamp(Math.round(difficulty), MIN_LEVEL, MAX_LEVEL)
  const gen = GENERATORS[conceptId] ?? factorialProblem
  return { conceptId: conceptId in GENERATORS ? conceptId : 'factorial', ...gen(d, rng) }
}

/** Concept ids we can generate practice for. */
export function practiceableConcepts(conceptIds: string[]): string[] {
  return conceptIds.filter((c) => c in GENERATORS)
}

// --- Weakness extraction ------------------------------------------------------

/** Concept ids the learner got wrong on the first try in this lesson. */
export function lessonWeakConceptIds(progress: LessonProgressDoc | null, lesson: Lesson): string[] {
  if (!progress?.stepAnswers) return []
  const weak = new Set<string>()
  for (const step of lesson.steps) {
    if (!isGradedStepType(step.type)) continue
    const rec = progress.stepAnswers[step.id]
    if (rec?.firstAttemptCorrect === false) {
      for (const c of step.concepts ?? lesson.concepts) weak.add(c)
    }
  }
  return practiceableConcepts([...weak])
}

export interface WeakConcept {
  conceptId: string
  /** Blended weakness score (lesson first-try misses + practice wrongs − practice corrects). */
  misses: number
}

/**
 * Blends each concept's lesson first-try misses with live practice tallies into a
 * weakness score: `max(0, lessonMisses + practiceWrong − practiceCorrect)`. Concepts
 * with practice wrongs surface even without lesson misses, and acing a concept in
 * practice cancels its weakness so it drops out. Only weakness > 0 is returned,
 * sorted most-weak first. With no `conceptStats` it reduces to the original behavior.
 */
export function crossLessonWeakConcepts(
  allProgress: LessonProgressDoc[],
  conceptStats: Record<string, { correct: number; wrong: number }> = {},
): WeakConcept[] {
  const counts = new Map<string, number>()
  for (const progress of allProgress) {
    const lesson = getLessonById(progress.lessonId)
    if (!lesson) continue
    for (const step of lesson.steps) {
      if (!isGradedStepType(step.type)) continue
      const rec = progress.stepAnswers?.[step.id]
      if (rec?.firstAttemptCorrect === false) {
        for (const c of step.concepts ?? lesson.concepts) {
          if (c in GENERATORS) counts.set(c, (counts.get(c) ?? 0) + 1)
        }
      }
    }
  }

  const conceptIds = new Set<string>(counts.keys())
  for (const id of Object.keys(conceptStats)) {
    if (id in GENERATORS) conceptIds.add(id)
  }

  return [...conceptIds]
    .map((conceptId) => {
      const stats = conceptStats[conceptId]
      const weakness = Math.max(
        0,
        (counts.get(conceptId) ?? 0) + (stats?.wrong ?? 0) - (stats?.correct ?? 0),
      )
      return { conceptId, misses: weakness }
    })
    .filter((w) => w.misses > 0)
    .sort((a, b) => b.misses - a.misses)
}

/** Picks a concept, favoring weak ones (70%) but keeping variety from the full set. */
export function pickConcept(weak: string[], all: string[], rng: Rng): string {
  const pool = practiceableConcepts(all)
  const fallback = pool.length ? pool : ['factorial']
  if (weak.length && rng() < 0.7) return pick(rng, weak)
  return pick(rng, fallback)
}

/** Adaptive next difficulty: up on a correct answer, down on a wrong one, within the cap. */
export function nextLevel(level: number, correct: boolean, cap: number): number {
  return correct ? Math.min(cap, level + 1) : Math.max(MIN_LEVEL, level - 1)
}

/** XP for a correct answer at a difficulty (used by the cross-lesson weak-spots page). */
export function xpForLevel(level: number): number {
  return clamp(Math.round(level), MIN_LEVEL, MAX_LEVEL) * 3
}
