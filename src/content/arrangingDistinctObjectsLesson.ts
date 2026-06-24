import type { Lesson } from './types'
import { descendingProduct, factorial } from './randomize'

const trophyItems = [
  { id: 'gold', label: 'Gold', color: '#fbbf24', emoji: '🥇' },
  { id: 'silver', label: 'Silver', color: '#94a3b8', emoji: '🥈' },
  { id: 'bronze', label: 'Bronze', color: '#d97706', emoji: '🥉' },
]

const bookItems = [
  { id: 'algebra', label: 'Algebra', color: '#3b82f6', emoji: '📘' },
  { id: 'geometry', label: 'Geometry', color: '#10b981', emoji: '📐' },
  { id: 'number', label: 'Number Theory', color: '#8b5cf6', emoji: '🔢' },
  { id: 'combo', label: 'Combinatorics', color: '#f97316', emoji: '🧩' },
]

export const arrangingDistinctObjectsLesson: Lesson = {
  id: 'arranging-distinct-objects',
  title: 'Arranging Distinct Objects',
  description:
    'Discover permutations by arranging trophies on a shelf — and meet factorials along the way.',
  hook: 'Three distinct trophies, one shelf. How many ways can you line them up?',
  estimatedMinutes: 12,
  prerequisites: ['counting-principle-lines'],
  concepts: ['permutation', 'factorial', 'counting-principle', 'distinct-objects'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'The Trophy Shelf',
      body: 'You won Gold, Silver, and Bronze at a math contest. Each trophy is distinct — they look different and mean different things.',
      prompt:
        'How many different ways can you arrange these three trophies left-to-right on a shelf?',
      nextButtonLabel: 'Let me try arranging them',
    },
    {
      id: 'explore-three',
      type: 'arrangement',
      title: 'Try It Yourself',
      body: 'Drag the trophies into the three slots. Rearrange them and notice how many different orderings exist.',
      prompt: 'Drag trophies between slots to explore different arrangements.',
      arrangementConfig: {
        items: trophyItems,
        targetCount: 6,
        goalCount: 6,
      },
      feedback: {
        correct: 'Nice! You found all 6 distinct orderings. Each ordering is a permutation.',
        incorrect: 'Keep rearranging — there are more orderings to discover.',
        hint: 'Order matters here, so every different left-to-right sequence is its own arrangement. Work systematically: fix which trophy sits first, list the ways to order the rest, then change the first trophy so you never miss or repeat one.',
        computationHint: 'For each of the 3 choices of first trophy there are 2 ways to order the remaining two: 3 × 2 × 1 = 6 orderings.',
      },
      concepts: ['permutation', 'distinct-objects'],
    },
    {
      id: 'count-three',
      type: 'multiple-choice',
      title: 'Count the Orderings',
      body: 'You have 3 distinct trophies (Gold, Silver, Bronze) to place left-to-right on a shelf. Each different ordering is one permutation.',
      prompt: 'How many different ways can you arrange the 3 distinct trophies (Gold, Silver, Bronze) in a row?',
      orderingsDisplay: trophyItems,
      question: {
        inputType: 'multiple-choice',
        choices: ['3', '6', '9', '12'],
        correctChoiceIndex: 1,
        explanation:
          'There are 6 permutations of 3 distinct objects: 3 choices for the first slot, 2 for the second, and 1 for the last.',
        misconceptionTags: ['undercount', 'overcount'],
      },
      feedback: {
        correct: 'Exactly! 3 distinct objects can be arranged in 6 different ways.',
        incorrect: 'Not quite — try listing them systematically: pick first, then second, then third.',
        hint: 'Fill the slots one at a time. You have a full set of choices for the first slot, but placing a trophy uses it up, so each later slot has one fewer option. Separate choices like these multiply together.',
        computationHint: '3 choices for the first slot × 2 left for the second × 1 for the last = 6.',
        choiceFeedback: {
          '3': 'That would only count one slot at a time. Order matters across all three positions.',
          '9': 'You might be thinking 3×3. But once a trophy is placed, it cannot be used again.',
          '12': 'That overcounts — each trophy can only appear once in an arrangement.',
        },
      },
      concepts: ['permutation'],
    },
    {
      id: 'factorial-discovery',
      type: 'factorial-discovery',
      title: 'Build the Product',
      body: 'Rather than listing every arrangement, build the count slot by slot. Placing 3 distinct trophies: type how many choices you have for each slot — the first slot, then what is left for the second, then the third.',
      factorialConfig: {
        itemLabel: 'trophy',
        count: 3,
      },
      feedback: {
        correct:
          '3 × 2 × 1 = 6. We write this as 3! (read "3 factorial"). Factorial counts permutations of distinct objects.',
        incorrect: '',
        hint: 'Build the count slot by slot instead of listing. Any trophy can start, but once it is placed it leaves the pool, so each following slot has one fewer choice. Multiplying those slot choices is exactly what a factorial does.',
        computationHint: '3 × 2 × 1 = 6, which we write as 3!.',
      },
      concepts: ['factorial', 'counting-principle'],
    },
    {
      id: 'four-books',
      type: 'factorial-discovery',
      title: 'Four Slots, One at a Time',
      body: 'Now line up 4 distinct books across 4 slots. Fill them left to right. First: how many books could go in slot 1? Then — GIVEN that slot 1 is taken — how many are left for slot 2? Keep reasoning slot by slot and watch the product build to 4!.',
      factorialConfig: {
        itemLabel: 'book',
        count: 4,
      },
      feedback: {
        correct:
          '4 × 3 × 2 × 1 = 24 = 4!. Each filled slot leaves one fewer choice, GIVEN the earlier slots are already set.',
        incorrect: '',
        hint: 'Same reasoning, one more slot. Each book you place is removed from the pool, so the number of remaining choices drops by one at every slot. Multiply the choices across all the slots.',
        computationHint: '4 × 3 × 2 × 1 = 24 = 4!.',
      },
      concepts: ['factorial', 'counting-principle'],
    },
    {
      id: 'explore-four',
      type: 'arrangement',
      title: 'Four Books on a Shelf',
      body: 'Arrange these four distinct books to see how quickly the possibilities grow.',
      prompt: 'Drag books between slots. How many unique orderings exist?',
      arrangementConfig: {
        items: bookItems,
        targetCount: 24,
        goalCount: 6,
      },
      feedback: {
        correct: '24 unique orderings — that is 4! permutations of 4 distinct books.',
        incorrect: 'There are 24 total orderings. Keep exploring different arrangements!',
        hint: 'You don’t have to enumerate every ordering by hand. Recognize this as arranging 4 distinct items where each slot has one fewer choice than the last — that pattern is a factorial.',
        computationHint: '4 × 3 × 2 × 1 = 24 orderings.',
      },
      concepts: ['permutation', 'factorial'],
    },
    {
      id: 'math-word',
      type: 'numeric-question',
      title: 'Spell MATH',
      body: 'The word MATH has 4 distinct letters: M, A, T, H. You want to rearrange them into different strings (order matters).',
      prompt: 'How many distinct ways can you arrange the 4 letters of MATH?',
      question: {
        inputType: 'numeric',
        correctAnswer: 24,
        tolerance: 0,
        explanation: '4 distinct letters → 4! = 24 arrangements.',
        misconceptionTags: ['factorial-forgot'],
      },
      feedback: {
        correct: 'Yes! 4! = 24 arrangements.',
        incorrect: 'All four letters are different, so it is 4 × 3 × 2 × 1.',
        hint: 'All four letters are different and order changes the string, so this is just arranging 4 distinct objects in a row — a factorial.',
        computationHint: '4 × 3 × 2 × 1 = 4! = 24.',
      },
      concepts: ['factorial', 'permutation'],
    },
    {
      id: 'five-contestants',
      type: 'numeric-question',
      title: 'Contest Podium',
      body: 'At a math contest, 5 distinct finalists stand in a row for a photo. Order matters — each spot is different.',
      prompt: 'How many ways can 5 distinct contestants line up?',
      question: {
        inputType: 'numeric',
        correctAnswer: 120,
        tolerance: 0,
        explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120.',
        misconceptionTags: ['partial-factorial'],
      },
      feedback: {
        correct: '5! = 120. The counting principle scales beautifully!',
        incorrect: 'Multiply: 5 × 4 × 3 × 2 × 1. That is 5 factorial.',
        hint: 'Every spot in the row is distinct and each contestant is used once, so the number of choices falls by one from each position to the next. Multiplying that descending chain of choices is a factorial.',
        computationHint: '5 × 4 × 3 × 2 × 1 = 120.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('fact-n', 4, 7)
        const value = factorial(n)
        return {
          title: 'Contest Lineup',
          body: `At a math contest, ${n} distinct finalists stand in a row for a photo. Order matters — each spot is different.`,
          prompt: `How many ways can ${n} distinct contestants line up?`,
          question: { correctAnswer: value, explanation: `${n}! = ${descendingProduct(n)} = ${value}.` },
          feedback: {
            correct: `${n}! = ${value}. The counting principle scales beautifully!`,
            incorrect: `Multiply: ${descendingProduct(n)}. That is ${n} factorial.`,
            hint: 'Every spot in the row is distinct and each contestant is used once, so the number of choices falls by one from each position to the next. Multiplying that descending chain of choices is a factorial.',
            computationHint: `${descendingProduct(n)} = ${value}.`,
          },
        }
      },
      concepts: ['factorial', 'counting-principle'],
    },
    {
      id: 'six-people',
      type: 'numeric-question',
      title: 'Six in a Row',
      body: '6 distinct people line up for a relay photo, and order matters.',
      prompt: 'How many ways can 6 distinct people line up in a row?',
      question: {
        inputType: 'numeric',
        correctAnswer: 720,
        tolerance: 0,
        explanation: '6! = 6 × 5 × 4 × 3 × 2 × 1 = 720.',
        misconceptionTags: ['factorial-forgot'],
      },
      feedback: {
        correct: 'Correct! 6! = 720.',
        incorrect: 'Multiply 6 × 5 × 4 × 3 × 2 × 1.',
        hint: 'Lining up distinct people in order is a factorial. A shortcut: a row of n is just a row of n−1 with one extra person who can slot into the lineup, so you can scale the previous factorial up by n.',
        computationHint: '6 × 5 × 4 × 3 × 2 × 1 = 720, which is also 6 × 5! = 6 × 120.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('fact-n', 4, 7)
        const value = factorial(n)
        return {
          title: `${n} in a Row`,
          body: `${n} distinct people line up for a relay photo, and order matters.`,
          prompt: `How many ways can ${n} distinct people line up in a row?`,
          question: { correctAnswer: value, explanation: `${n}! = ${descendingProduct(n)} = ${value}.` },
          feedback: {
            correct: `Correct! ${n}! = ${value}.`,
            incorrect: `Multiply ${descendingProduct(n)}.`,
            hint: 'Lining up distinct people in order is a factorial. A shortcut: a row of n is just a row of n−1 with one extra person who can slot into the lineup, so you can scale the previous factorial up by n.',
            computationHint: `${descendingProduct(n)} = ${value}, which is also ${n} × ${n - 1}! = ${n} × ${factorial(n - 1)}.`,
          },
        }
      },
      concepts: ['factorial'],
    },
    {
      id: 'what-is-4fact',
      type: 'numeric-question',
      title: 'Factorial Check',
      body: 'Recall that n! multiplies every whole number from n down to 1.',
      prompt: 'What does 4! equal?',
      question: {
        inputType: 'numeric',
        correctAnswer: 24,
        tolerance: 0,
        explanation: '4! = 4 × 3 × 2 × 1 = 24.',
        misconceptionTags: ['factorial-forgot'],
      },
      feedback: {
        correct: 'Right — 4! = 24.',
        incorrect: 'Multiply step by step: 4 × 3 = 12, then × 2 = 24, then × 1.',
        hint: 'A factorial means multiplying every whole number from n all the way down to 1. Start at the top and work downward, carrying the running product.',
        computationHint: '4 × 3 × 2 × 1 = 24.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('fact-n', 4, 7)
        const value = factorial(n)
        return {
          title: `What Is ${n}!?`,
          body: 'Recall that n! multiplies every whole number from n down to 1.',
          prompt: `What does ${n}! equal?`,
          question: { correctAnswer: value, explanation: `${n}! = ${descendingProduct(n)} = ${value}.` },
          feedback: {
            correct: `Right — ${n}! = ${value}.`,
            incorrect: `Multiply step by step: ${descendingProduct(n)}.`,
            hint: 'A factorial means multiplying every whole number from n all the way down to 1. Start at the top and work downward, carrying the running product.',
            computationHint: `${descendingProduct(n)} = ${value}.`,
          },
        }
      },
      concepts: ['factorial'],
    },
    {
      id: 'five-factorial-mc',
      type: 'numeric-question',
      title: 'What Is 5!?',
      body: 'Lining up 5 distinct objects gives 5! orderings.',
      prompt: 'What does 5! equal?',
      question: {
        inputType: 'numeric',
        correctAnswer: 120,
        tolerance: 0,
        explanation: '5! = 5 × 4 × 3 × 2 × 1 = 120.',
        misconceptionTags: ['factorial-forgot'],
      },
      feedback: {
        correct: 'Yes — 5! = 120.',
        incorrect: '5! = 5 × 4 × 3 × 2 × 1. (20 is only 5 × 4 — keep going down to 1.)',
        hint: 'Keep multiplying all the way down to 1 — stopping early undercounts. It helps to build on the factorial just below: n! is n times (n−1)!.',
        computationHint: '5 × 4 × 3 × 2 × 1 = 120, which is also 5 × 4! = 5 × 24.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('fact-n', 4, 7)
        const value = factorial(n)
        return {
          title: `What Is ${n}!?`,
          body: `Lining up ${n} distinct objects gives ${n}! orderings.`,
          prompt: `What does ${n}! equal?`,
          question: { correctAnswer: value, explanation: `${n}! = ${descendingProduct(n)} = ${value}.` },
          feedback: {
            correct: `Yes — ${n}! = ${value}.`,
            incorrect: `${n}! = ${descendingProduct(n)}.`,
            hint: 'Keep multiplying all the way down to 1 — stopping early undercounts. It helps to build on the factorial just below: n! is n times (n−1)!.',
            computationHint: `${descendingProduct(n)} = ${value}, which is also ${n} × ${n - 1}! = ${n} × ${factorial(n - 1)}.`,
          },
        }
      },
      concepts: ['factorial'],
    },
    {
      id: 'why-multiply',
      type: 'multiple-choice',
      title: 'Why Multiply?',
      body: 'When you arrange distinct objects, you multiply the choices at each step rather than adding them.',
      prompt: 'Why do we multiply (not add) when counting arrangements of distinct objects?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Each choice is separate from the others',
          'Because factorials always involve multiplication',
          'To make numbers bigger for contests',
          'Because order does not matter',
        ],
        correctChoiceIndex: 0,
        explanation:
          'We multiply because the choices are separate: every option at one step can pair with every option at the next, so the counts multiply.',
        misconceptionTags: ['counting-principle'],
      },
      feedback: {
        correct: 'Exactly — because each choice is separate, every option combines with every other, so the counts multiply.',
        incorrect: 'Think about whether each choice can be paired with every option from the next step.',
        hint: 'Think about how the steps relate: every option at one step can be paired with every option at the next, so each early choice fans out into a whole set of later ones. Adding would only count them as separate piles instead of combinations.',
        computationHint: 'Two separate steps with 3 then 2 options give 3 × 2 = 6 combinations, not 3 + 2 = 5.',
      },
      concepts: ['counting-principle', 'permutation'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You discovered permutations by arranging objects — and met factorials as shorthand for the counting principle.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
