/**
 * Curriculum map — the *presentation* layer that groups the flat `course.lessons`
 * list into named units so the learning progression (Counting → Probability →
 * Expectation → Challenge) is visible at a glance.
 *
 * This file is intentionally pure data: it references real lessons by id (and
 * never duplicates their content) and declares "coming soon" placeholders for
 * lessons that don't exist yet, so the roadmap shows where the course is headed.
 * All progress, mastery, and unlock logic still lives in `useCourseProgress`.
 */

export type UnitAccent = 'counting' | 'probability' | 'expectation' | 'challenge'

export interface CurriculumLessonDef {
  /** Real lesson id (matches `course.lessons`) or a synthetic id for placeholders. */
  lessonId: string
  /** True for not-yet-built lessons shown only to convey the roadmap. */
  comingSoon?: boolean
  /** Display title. For real lessons the live lesson title takes precedence. */
  title?: string
  /** One-line "what you'll be able to do" objective. */
  objective: string
  /** Short conceptual tags, e.g. "Order matters", "Overcounting". */
  tags: string[]
}

export interface CurriculumUnitDef {
  id: string
  /** Small label above the title, e.g. "Unit 01". */
  eyebrow: string
  title: string
  description: string
  accent: UnitAccent
  lessons: CurriculumLessonDef[]
}

export const CURRICULUM_UNITS: CurriculumUnitDef[] = [
  {
    id: 'counting-foundations',
    eyebrow: 'Unit 01',
    title: 'Counting Foundations',
    description: 'Learn how to count outcomes before turning them into probabilities.',
    accent: 'counting',
    lessons: [
      {
        lessonId: 'counting-principle-lines',
        objective: 'Multiply independent choices to count outcomes fast.',
        tags: ['Counting', 'Multiply choices'],
      },
      {
        lessonId: 'arranging-distinct-objects',
        objective: 'Put distinct items in order using factorials.',
        tags: ['Order matters', 'Factorials'],
      },
      {
        lessonId: 'identical-objects',
        objective: 'Divide out repeats when some items are identical.',
        tags: ['Overcounting', 'Identical items'],
      },
      {
        lessonId: 'combinations-vs-permutations',
        objective: 'Decide when order matters and avoid overcounting.',
        tags: ['Order matters', 'Overcounting'],
      },
      {
        lessonId: 'stars-and-bars',
        objective: 'Distribute identical items into bins — combinations with repetition.',
        tags: ['Distributing', 'Combinations with repetition'],
      },
    ],
  },
  {
    id: 'probability-core',
    eyebrow: 'Unit 02',
    title: 'Probability Core',
    description: 'Use counting tools to measure uncertainty, independence, and conditional events.',
    accent: 'probability',
    lessons: [
      {
        lessonId: 'independent-events',
        objective: 'Multiply probabilities when events don’t affect each other.',
        tags: ['Probability', 'Independence'],
      },
      {
        lessonId: 'dependent-events',
        objective: 'Update probabilities when one event changes the next.',
        tags: ['Probability', 'Dependence'],
      },
      {
        lessonId: 'conditional-probability',
        objective: 'Reason about probability given partial information.',
        tags: ['Probability', 'Conditioning'],
      },
      {
        lessonId: 'complement-rule',
        objective: 'Count the opposite when it’s easier than counting directly.',
        tags: ['Probability', 'Complement'],
      },
      {
        lessonId: 'addition-rule',
        objective: 'Add disjoint chances, then count weighted-coin (binomial) outcomes.',
        tags: ['Probability', 'Binomial'],
      },
      {
        lessonId: 'binomial-theorem',
        objective: 'See why combinations are the coefficients of (a+b)ⁿ, with Pascal’s triangle.',
        tags: ['Algebra', 'Binomial'],
      },
      {
        lessonId: 'inclusion-exclusion',
        objective: 'Count overlapping groups: add the parts, subtract the double-counted overlaps.',
        tags: ['Probability', 'Counting'],
      },
      {
        lessonId: 'probability-distributions',
        objective: 'See how outcomes spread out over many trials.',
        tags: ['Probability', 'Distributions'],
      },
    ],
  },
  {
    id: 'expectation',
    eyebrow: 'Unit 03',
    title: 'Expectation & Random Variables',
    description: 'Turn probabilities into long-run averages, payoffs, and strategy.',
    accent: 'expectation',
    lessons: [
      {
        lessonId: 'expected-value',
        objective: 'Turn probabilities into long-run averages and payoffs.',
        tags: ['Expectation', 'Averages'],
      },
      {
        lessonId: 'linearity-of-expectation',
        objective: 'Add up per-part expectations — even when the parts overlap.',
        tags: ['Expectation', 'Linearity'],
      },
      {
        lessonId: 'indicator-variables',
        objective: 'Count by summing simple 0/1 random variables.',
        tags: ['Expectation', 'Indicators'],
      },
    ],
  },
  {
    id: 'challenge-arena',
    eyebrow: 'Unit 04',
    title: 'Challenge Arena',
    description: 'Apply everything to contest-style problems and mixed review.',
    accent: 'challenge',
    lessons: [
      {
        lessonId: 'putting-it-together',
        objective: 'Combine all five probability tools on multi-step problems.',
        tags: ['Review', 'Capstone'],
      },
      {
        lessonId: 'contest-problems',
        objective: 'Choose and combine counting tools on olympiad-flavored puzzles.',
        tags: ['Contest', 'Technique selection'],
      },
      {
        lessonId: 'counting-probability-applications',
        objective: 'Count favorable ÷ total to turn realistic scenarios into probabilities.',
        tags: ['Applications', 'Favorable ÷ total'],
      },
      {
        lessonId: 'expected-value-applications',
        objective: 'Use expectation to make strategic decisions under uncertainty.',
        tags: ['Expectation', 'Strategy'],
      },
    ],
  },
]
