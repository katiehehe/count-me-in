import type {
  ArrangementConfig,
  CombinedExperimentConfig,
  FactorialDiscoveryConfig,
  FeedbackMap,
  Lesson,
  LessonStep,
  Question,
  SimulationConfig,
} from './types'

/** Returns a float in [0, 1). */
export type Rng = () => number

/** Small, fast, deterministic PRNG. Same seed → same sequence. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A fresh, well-spread 32-bit seed. */
export function makeSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0
}

const SEED_PREFIX = 'cmi:lesson-seed:'

/**
 * Returns the persisted seed for a lesson, creating one on first use. Persisting
 * keeps a single play-through internally consistent across reloads (and matches
 * the saved answers shown in review), while {@link refreshSeed} reshuffles on restart.
 */
export function loadOrCreateSeed(lessonId: string): number {
  try {
    const key = SEED_PREFIX + lessonId
    const existing = window.localStorage.getItem(key)
    if (existing !== null) {
      const parsed = Number(existing)
      if (Number.isFinite(parsed)) return parsed >>> 0
    }
    const seed = makeSeed()
    window.localStorage.setItem(key, String(seed))
    return seed
  } catch {
    return makeSeed()
  }
}

/** Generates and persists a brand-new seed for a lesson (used on restart). */
export function refreshSeed(lessonId: string): number {
  const seed = makeSeed()
  try {
    window.localStorage.setItem(SEED_PREFIX + lessonId, String(seed))
  } catch {
    /* localStorage unavailable — caller still gets a fresh seed for this session */
  }
  return seed
}

/**
 * Seeded value generator with distinctness "pools": values drawn from the same
 * pool name are guaranteed not to repeat within one lesson resolution, so two
 * questions never land on, say, the same 4×3 multiplication.
 */
export class Randomizer {
  private rng: Rng
  private pools = new Map<string, Set<string>>()
  private cache = new Map<string, unknown>()

  constructor(seed: number) {
    this.rng = mulberry32(seed)
  }

  /**
   * Computes a value once and reuses it for the same `key`. Lets two different
   * steps (e.g. an interactive widget and the question that grades it) share the
   * exact same randomized numbers within one play-through.
   */
  sharedValue<T>(key: string, gen: () => T): T {
    if (this.cache.has(key)) return this.cache.get(key) as T
    const value = gen()
    this.cache.set(key, value)
    return value
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.rng() * (max - min + 1))
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.rng() * items.length)]
  }

  private seen(pool: string, key: string): boolean {
    return this.pools.get(pool)?.has(key) ?? false
  }

  private mark(pool: string, key: string): void {
    let set = this.pools.get(pool)
    if (!set) {
      set = new Set<string>()
      this.pools.set(pool, set)
    }
    set.add(key)
  }

  /** Draws from `gen` until it yields a value whose `key` is unused in `pool`. */
  unique<T>(pool: string, gen: () => T, key: (value: T) => string, attempts = 60): T {
    for (let i = 0; i < attempts; i++) {
      const value = gen()
      const k = key(value)
      if (!this.seen(pool, k)) {
        this.mark(pool, k)
        return value
      }
    }
    const fallback = gen()
    this.mark(pool, key(fallback))
    return fallback
  }

  /** A distinct integer (within `pool`) in [min, max]. */
  uniqueInt(pool: string, min: number, max: number): number {
    return this.unique(
      pool,
      () => this.int(min, max),
      (v) => String(v),
    )
  }

  /** A pair of factors in [min, max], distinct from other pairs in `pool` (order-insensitive). */
  factorPair(pool: string, min: number, max: number): [number, number] {
    return this.unique(
      pool,
      () => [this.int(min, max), this.int(min, max)] as [number, number],
      ([a, b]) => [a, b].sort((x, y) => x - y).join('x'),
    )
  }

  /** A triple of factors in [min, max], distinct from other triples in `pool` (order-insensitive). */
  factorTriple(pool: string, min: number, max: number): [number, number, number] {
    return this.unique(
      pool,
      () => [this.int(min, max), this.int(min, max), this.int(min, max)] as [number, number, number],
      ([a, b, c]) => [a, b, c].sort((x, y) => x - y).join('x'),
    )
  }
}

export function factorial(n: number): number {
  let product = 1
  for (let i = 2; i <= n; i++) product *= i
  return product
}

/** "5 × 4 × 3 × 2 × 1" */
export function descendingProduct(n: number): string {
  const parts: number[] = []
  for (let i = n; i >= 1; i--) parts.push(i)
  return parts.join(' × ')
}

/** "n × (n-1) × … for k terms": 8 × 7 × 6 for n=8, k=3. */
export function fallingProduct(n: number, k: number): string {
  const parts: number[] = []
  for (let i = 0; i < k; i++) parts.push(n - i)
  return parts.join(' × ')
}

export function fallingValue(n: number, k: number): number {
  let product = 1
  for (let i = 0; i < k; i++) product *= n - i
  return product
}

/** nCr via the falling-product ÷ k! form used throughout the lessons. */
export function choose(n: number, k: number): number {
  return fallingValue(n, k) / factorial(k)
}

export function product(nums: number[]): number {
  return nums.reduce((a, b) => a * b, 1)
}

export function joinTimes(nums: number[]): string {
  return nums.join(' × ')
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}

/** Overrides a step may declare via its `randomize` hook. */
export interface StepRandomization {
  title?: string
  body?: string
  prompt?: string
  nextButtonLabel?: string
  question?: Partial<Question>
  feedback?: Partial<FeedbackMap>
  arrangementConfig?: Partial<ArrangementConfig>
  factorialConfig?: Partial<FactorialDiscoveryConfig>
  combinedExperimentConfig?: Partial<CombinedExperimentConfig>
  simulationConfig?: Partial<SimulationConfig>
}

function mergeStep(step: LessonStep, override: StepRandomization): LessonStep {
  const next: LessonStep = { ...step }
  if (override.title !== undefined) next.title = override.title
  if (override.body !== undefined) next.body = override.body
  if (override.prompt !== undefined) next.prompt = override.prompt
  if (override.nextButtonLabel !== undefined) next.nextButtonLabel = override.nextButtonLabel
  if (override.question) next.question = { ...step.question, ...override.question } as Question
  if (override.feedback) next.feedback = { ...step.feedback, ...override.feedback } as FeedbackMap
  if (override.arrangementConfig && step.arrangementConfig)
    next.arrangementConfig = { ...step.arrangementConfig, ...override.arrangementConfig }
  if (override.factorialConfig && step.factorialConfig)
    next.factorialConfig = { ...step.factorialConfig, ...override.factorialConfig }
  if (override.combinedExperimentConfig && step.combinedExperimentConfig)
    next.combinedExperimentConfig = {
      ...step.combinedExperimentConfig,
      ...override.combinedExperimentConfig,
    }
  if (override.simulationConfig && step.simulationConfig)
    next.simulationConfig = { ...step.simulationConfig, ...override.simulationConfig }
  return next
}

/**
 * Returns a concrete copy of `lesson` with every `randomize`-enabled step filled
 * in from a single seeded {@link Randomizer}. Same seed → identical lesson, so a
 * re-render of any step is stable; a new seed reshuffles all values at once while
 * preserving distinctness rules across questions.
 */
export function resolveLesson(lesson: Lesson, seed: number): Lesson {
  const randomizer = new Randomizer(seed)
  return {
    ...lesson,
    steps: lesson.steps.map((step) =>
      step.randomize ? mergeStep(step, step.randomize(randomizer)) : step,
    ),
  }
}
