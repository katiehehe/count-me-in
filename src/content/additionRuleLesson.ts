import type { Lesson } from './types'
import { binomialProb, fracText, multiplyFracs, reduceFrac } from './probabilityMath'

const P = { n: 1, d: 3 }
const Q = { n: 2, d: 3 }

function oneSeqFor(k: number) {
  const heads = Array.from({ length: k }, () => P)
  const tails = Array.from({ length: 5 - k }, () => Q)
  return multiplyFracs([...heads, ...tails])
}

export const additionRuleLesson: Lesson = {
  id: 'addition-rule',
  title: 'Adding Probabilities',
  description:
    'When events can’t both happen, their chances ADD. Build that addition rule, then use it to derive the binomial: count the ways with C(n,k), multiply by one way’s pᵏq^(n−k), and add.',
  hook: 'A weighted coin, 5 flips — what’s the chance of exactly 2 heads?',
  estimatedMinutes: 12,
  prerequisites: ['complement-rule'],
  concepts: ['mutually-exclusive', 'binomial-coin'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'When “Or” Means Add',
      body: 'Two events are MUTUALLY EXCLUSIVE (disjoint) when they cannot both happen at once.\n\nFor those, the chance of one OR the other is just the sum: $P(A \\text{ or } B) = P(A) + P(B)$.\n\nRoll one die: $P(2 \\text{ or } 5) = \\tfrac16 + \\tfrac16 = \\tfrac26$, because a single roll can’t be both a 2 and a 5.\n\nThe catch: only add when the events are disjoint. “Even” and “a 2” overlap (a 2 is even), so you can’t simply add those — the addition rule needs non-overlapping events.',
      prompt: 'Mutually exclusive $\\Rightarrow P(A \\text{ or } B) = P(A) + P(B)$. Only add when the events can’t both happen.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'worked-disjoint',
      type: 'worked-example',
      title: 'Watch Me Add Two Chances',
      body: 'One die roll. Let me find the chance of rolling a 2 or a 5.',
      workedExampleConfig: {
        kind: 'disjoint',
        voice: 'nova',
        disjoint: { sides: 6, faces: [2, 5] },
        script: [
          {
            say: 'Our job is the chance of rolling a 2 or a 5 on one die. Here are the six equally likely faces.',
            highlight: 'faces',
          },
          {
            say: 'A single roll can’t be both a 2 and a 5 — those outcomes are mutually exclusive. Light up the two we want.',
            highlight: 'highlight',
          },
          {
            say: 'Because they can’t happen together, we simply add their chances: one-sixth plus one-sixth is two-sixths, which is one-third.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['mutually-exclusive'],
    },
    {
      id: 'or-two-faces',
      type: 'fraction-question',
      title: 'Roll This or That',
      body: 'You roll one fair 6-sided die. The faces 3 and 6 can’t both come up on a single roll.',
      prompt: 'What is the probability of rolling a 3 or a 6? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/3',
        explanation:
          'The two outcomes are mutually exclusive, so add: 1/6 + 1/6 = 2/6 = 1/3.',
        misconceptionTags: ['mutually-exclusive'],
      },
      feedback: {
        correct: 'Yes — 1/6 + 1/6 = 2/6 = 1/3.',
        incorrect: 'The two faces can’t both happen, so add their probabilities.',
        hint: 'A single die can’t land on both faces at once, so the events are disjoint — that means you may add their separate chances.',
        computationHint: '1/6 + 1/6 = 2/6 = 1/3.',
      },
      randomize: (r) => {
        const a = r.uniqueInt('add-a', 1, 5)
        const b = r.uniqueInt('add-b', a + 1, 6)
        const p = reduceFrac(2, 6)
        return {
          body: `You roll one fair 6-sided die. The faces ${a} and ${b} can’t both come up on a single roll.`,
          prompt: `What is the probability of rolling a ${a} or a ${b}? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `The two outcomes are mutually exclusive, so add: 1/6 + 1/6 = 2/6 = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — 1/6 + 1/6 = 2/6 = ${fracText(p)}.`,
            incorrect: 'The two faces can’t both happen, so add their probabilities.',
            hint: 'A single die can’t land on both faces at once, so the events are disjoint — that means you may add their separate chances.',
            computationHint: `1/6 + 1/6 = 2/6 = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['mutually-exclusive'],
    },
    {
      id: 'disjoint-check',
      type: 'multiple-choice',
      title: 'When Can You Add?',
      body: 'The addition rule P(A or B) = P(A) + P(B) has one condition.',
      prompt: 'For which pair can you simply ADD the two probabilities?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Rolling a 2 vs. rolling a 5 on one die',
          'Rolling an even number vs. rolling a 2 on one die',
          'Drawing a red card vs. drawing a heart from a deck',
          'A number greater than 3 vs. a 4 on one die',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Only mutually-exclusive events add. A 2 and a 5 can’t both happen on one roll, so add. The others overlap (a 2 is even; a heart is red; a 4 is greater than 3), so adding would double-count.',
        misconceptionTags: ['mutually-exclusive'],
      },
      feedback: {
        correct: 'Right — only "2 vs. 5" are disjoint, so only those simply add.',
        incorrect: 'Look for the pair that can’t both be true at once — the others share outcomes.',
        choiceFeedback: {
          'Rolling an even number vs. rolling a 2 on one die':
            'A 2 is even, so these overlap — adding would count the 2 twice.',
          'Drawing a red card vs. drawing a heart from a deck':
            'Every heart is red, so these overlap — not mutually exclusive.',
          'A number greater than 3 vs. a 4 on one die':
            'A 4 is greater than 3, so these overlap — you’d double-count the 4.',
        },
        hint: 'Mutually exclusive means the two events can never be true on the same outcome. Which pair has no shared outcome at all?',
        computationHint: 'A 2 and a 5 share no outcome; the other three pairs each share one (the 2, the hearts, the 4), so only the first is safe to add.',
      },
      concepts: ['mutually-exclusive'],
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'A weighted coin lands heads 1/3 of the time. Flip it 5 times — guess the probability of exactly 2 heads. A fraction is fine.',
        answer: '80/243',
        revealNote: 'about 0.33',
      },
    },
    {
      id: 'worked-binomial',
      type: 'worked-example',
      title: 'Watch Me Build the Binomial',
      body: 'A coin lands heads 1/3 of the time (tails 2/3). Let me find the chance of exactly 2 heads in 5 flips — by counting ways and adding.',
      workedExampleConfig: {
        kind: 'binomial',
        voice: 'nova',
        binomial: { n: 5, k: 2, p: { n: 1, d: 3 }, sequence: [1, 0, 0, 1, 0] },
        script: [
          {
            say: 'Start with one specific sequence: heads, tails, tails, heads, tails. The flips are independent, so multiply their chances — one-third for each head, two-thirds for each tail. Two heads and three tails give one-third squared times two-thirds cubed, which is eight over two hundred forty-three.',
            highlight: 'sequence',
          },
          {
            say: 'But that is just one way to get exactly two heads. How many sequences have two heads among the five slots? Choose which two slots are heads: that is five-choose-two, which is ten. Here are all ten.',
            highlight: 'ways',
          },
          {
            say: 'Every one of those ten sequences has the very same probability, eight over two forty-three. And they are mutually exclusive — one run of five flips can’t be two different sequences at once. So by the addition rule, we add them.',
            highlight: 'add',
          },
          {
            say: 'Ten times eight over two forty-three is eighty over two forty-three. That is the binomial formula: five-choose-two, times one-third squared, times two-thirds cubed — count the ways, times one way’s probability.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['binomial-coin', 'mutually-exclusive'],
    },
    {
      id: 'build-sequences',
      type: 'sequence-build',
      title: 'Find Every Arrangement',
      body: 'Here are 5 coin slots. Place exactly 2 heads, then keep rearranging to find every distinct arrangement — that count is C(5,2).',
      sequenceBuildConfig: { slots: 5, heads: 2 },
      feedback: {
        correct:
          'All 10 arrangements — that’s C(5,2). Each is equally likely and mutually exclusive, so P(exactly 2 heads) adds them: 10 × (one sequence’s probability).',
        incorrect: '',
        hint: 'Hold one head fixed and move the other through the remaining slots, then move the first — that’s how you reach all of them without repeats.',
        computationHint: 'There are C(5,2) = 10 ways to choose which 2 of the 5 slots are heads.',
      },
      concepts: ['binomial-coin', 'combinations'],
    },
    {
      id: 'one-sequence',
      type: 'fraction-question',
      title: 'One Specific Sequence',
      body: 'A coin lands heads with probability 1/3 (tails 2/3). Consider the exact sequence H T T H T over 5 flips.',
      prompt: 'What is the probability of that one specific sequence? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '8/243',
        explanation:
          'Independent flips multiply: (1/3)(2/3)(2/3)(1/3)(2/3) = (1/3)²(2/3)³ = 8/243.',
        misconceptionTags: ['binomial-coin'],
      },
      feedback: {
        correct: 'Yes — (1/3)²(2/3)³ = 8/243.',
        incorrect: 'Multiply the per-flip chances: 1/3 for each head, 2/3 for each tail.',
        hint: 'The flips are independent, so multiply each flip’s probability — a head contributes 1/3, a tail 2/3.',
        computationHint: '(1/3)²(2/3)³ = 8/243.',
      },
      concepts: ['binomial-coin'],
    },
    {
      id: 'ways-count',
      type: 'numeric-question',
      title: 'How Many Ways?',
      body: 'You flip a coin 5 times and want exactly 2 of them to be heads.',
      prompt: 'How many of the 5-flip sequences have exactly 2 heads?',
      question: {
        inputType: 'numeric',
        correctAnswer: 10,
        tolerance: 0,
        explanation: 'Choose which 2 of the 5 slots are heads: C(5,2) = 10.',
        misconceptionTags: ['binomial-coin', 'combinations'],
      },
      feedback: {
        correct: 'Right — C(5,2) = 10 arrangements.',
        incorrect: 'Count the ways to pick which 2 of the 5 flips are heads: that’s a combination.',
        hint: 'Order of the slots doesn’t matter for "which are heads," so this is a combination — choose 2 of the 5 positions.',
        computationHint: 'C(5,2) = (5 × 4) ÷ 2 = 10.',
      },
      concepts: ['binomial-coin', 'combinations'],
    },
    {
      id: 'binomial-full',
      type: 'fraction-question',
      title: 'Put It Together',
      body: 'A coin lands heads with probability 1/3. You flip it 5 times.',
      prompt: 'What is the probability of getting exactly 2 heads? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '80/243',
        explanation:
          'Count × one-way probability: C(5,2) · (1/3)²(2/3)³ = 10 · 8/243 = 80/243.',
        misconceptionTags: ['binomial-coin'],
      },
      feedback: {
        correct: 'Yes — 10 · 8/243 = 80/243.',
        incorrect: 'Multiply the number of ways, C(5,2) = 10, by one sequence’s probability 8/243.',
        hint: 'Combine the two pieces: how many ways (a combination) times the probability of any one such sequence (a product of 1/3’s and 2/3’s).',
        computationHint: 'C(5,2) · (1/3)²(2/3)³ = 10 · 8/243 = 80/243.',
      },
      randomize: (r) => {
        const k = r.uniqueInt('binom-k', 1, 3)
        const p = binomialProb(5, k, { n: 1, d: 3 })
        const ways = [5, 10, 10][k - 1]
        const per = fracText(oneSeqFor(k))
        return {
          prompt: `What is the probability of getting exactly ${k} heads? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Count × one-way probability: C(5,${k}) · (1/3)^${k}(2/3)^${5 - k} = ${ways} · ${per} = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — ${ways} · ${per} = ${fracText(p)}.`,
            incorrect: `Multiply the number of ways, C(5,${k}), by one sequence’s probability ${per}.`,
            hint: 'Combine the two pieces: how many ways (a combination) times the probability of any one such sequence (a product of 1/3’s and 2/3’s).',
            computationHint: `C(5,${k}) · (1/3)^${k}(2/3)^${5 - k} = ${ways} · ${per} = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['binomial-coin', 'mutually-exclusive'],
    },
    {
      id: 'binomial-formula',
      type: 'multiple-choice',
      title: 'Name the Formula',
      body: 'You flip a coin n times; it lands heads with probability p (tails q = 1 − p).',
      prompt: 'What is P(exactly k heads)?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'C(n,k) · pᵏ · q^(n−k)',
          'pᵏ · q^(n−k)',
          'C(n,k) · p · q',
          'C(n,k) + pᵏ + q^(n−k)',
        ],
        correctChoiceIndex: 0,
        explanation:
          'One sequence with k heads has probability pᵏq^(n−k); there are C(n,k) such sequences, all equally likely and mutually exclusive, so you add them: C(n,k)·pᵏq^(n−k).',
        misconceptionTags: ['binomial-coin'],
      },
      feedback: {
        correct: 'Exactly — count the ways C(n,k), times one way’s probability pᵏq^(n−k).',
        incorrect: 'You need BOTH the count of sequences and the probability of one sequence.',
        choiceFeedback: {
          'pᵏ · q^(n−k)': 'That’s just ONE sequence. You must add all C(n,k) of them.',
          'C(n,k) · p · q': 'The exponents matter: k heads give pᵏ and n−k tails give q^(n−k).',
          'C(n,k) + pᵏ + q^(n−k)': 'These pieces multiply, not add — you add the C(n,k) equal sequences, which gives the product.',
        },
        hint: 'Two pieces: how many sequences have k heads, and what is each one’s probability? The equal, mutually-exclusive sequences add up to count × one-way.',
        computationHint: 'C(n,k) sequences, each pᵏq^(n−k), added together = C(n,k)·pᵏq^(n−k).',
      },
      concepts: ['binomial-coin'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned the addition rule — mutually-exclusive chances add — and used it to build the binomial: P(exactly k heads) = C(n,k)·pᵏq^(n−k). Count the ways with a combination, multiply by one way’s probability, and add because the ways can’t overlap.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
