import type { Lesson } from './types'
import { joinTimes } from './randomize'

const dieOutcomes = [
  { id: 'd1', label: '1', emoji: '⚀', color: '#2d5894' },
  { id: 'd2', label: '2', emoji: '⚁', color: '#2d5894' },
  { id: 'd3', label: '3', emoji: '⚂', color: '#2d5894' },
  { id: 'd4', label: '4', emoji: '⚃', color: '#2d5894' },
  { id: 'd5', label: '5', emoji: '⚄', color: '#2d5894' },
  { id: 'd6', label: '6', emoji: '⚅', color: '#2d5894' },
]

const coinOutcomes = [
  { id: 'heads', label: 'Heads', emoji: '🪙', color: '#d97706' },
  { id: 'tails', label: 'Tails', emoji: '🪙', color: '#c2410c' },
]

export const independentEventsLesson: Lesson = {
  id: 'independent-events',
  title: 'Independent Events',
  description: 'Multiply probabilities when one event does not affect another.',
  hook: 'Flip a coin and roll a die — what are the odds of heads AND a 6?',
  estimatedMinutes: 11,
  prerequisites: ['combinations-vs-permutations'],
  concepts: ['independent-events', 'counting-principle'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Two Events at Once',
      body: 'Two events are INDEPENDENT when one does not change the odds of the other — like a coin flip and a die roll. The counting principle from earlier turns into a rule for probability: to get the chance of BOTH happening, multiply their individual probabilities.',
      prompt: 'P(A and B) = P(A) × P(B) when A and B are independent.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'worked-coin-die',
      type: 'worked-example',
      title: 'Watch Me Count One',
      body: 'Let me find the chance of Heads AND a 6 by counting the combined outcomes.',
      workedExampleConfig: {
        kind: 'connections',
        voice: 'nova',
        connections: {
          leftLabel: 'Coin',
          rightLabel: 'Die',
          left: coinOutcomes,
          right: dieOutcomes,
          pairingLabel: 'outcome',
        },
        script: [
          {
            say: 'Our job is to find the probability of getting Heads and a six together — one coin flip and one die roll. Start with the coin: two equally likely sides, Heads and Tails.',
            highlight: 'left',
          },
          { say: 'A die has six equally likely faces, one through six.', highlight: 'right' },
          {
            say: 'Each coin side pairs with each die face, so there are two times six — twelve — equally likely combined outcomes.',
            highlight: 'product',
          },
          {
            say: 'Only one of those twelve is Heads and a six, so the probability is one out of twelve — the same as one-half times one-sixth.',
            highlight: 'product',
          },
        ],
      },
      concepts: ['independent-events', 'counting-principle'],
    },
    {
      id: 'dependence-pairing',
      type: 'dependence-pairing',
      title: 'Which Events Affect Each Other?',
      body: 'Independence means one event does not change the odds of another. Below are 6 events. Tap two cards to pair the events where one clearly affects the other — and leave the independent pair apart.',
      dependencePairingConfig: {
        cards: [
          { id: 'clouds', label: 'Dark storm clouds roll in', emoji: '🌧️' },
          { id: 'rain', label: 'It rains this afternoon', emoji: '☔' },
          { id: 'injury', label: 'The star player gets injured', emoji: '🤕' },
          { id: 'loss', label: 'The team loses the game', emoji: '🏀' },
          { id: 'red-die', label: 'You roll a 4 on the red die', emoji: '⚃', color: '#dc2626' },
          { id: 'blue-die', label: 'You roll a 2 on the blue die', emoji: '⚁', color: '#2563eb' },
        ],
        dependentPairs: [
          ['clouds', 'rain'],
          ['injury', 'loss'],
        ],
      },
      feedback: {
        correct:
          'Exactly! Storm clouds make rain more likely, and losing the star player changes the team’s odds — those events are dependent. But two separate dice don’t affect each other at all, so they stay independent. Independence is what lets us simply multiply probabilities.',
        incorrect: '',
        hint: 'Ask: if the first event happens, does it change the chance of the second? When the answer is yes, the events are dependent and belong together; when the second event’s odds stay put, they are independent.',
        computationHint: 'Pair clouds with rain and injury with loss, then leave the red die and blue die unpaired — neither die changes the other.',
      },
      concepts: ['independent-events'],
    },
    {
      id: 'count-outcomes',
      type: 'numeric-question',
      title: 'Count the Combined Outcomes',
      body: 'A coin has 2 equally likely outcomes (Heads, Tails). A standard die has 6 equally likely outcomes (1–6). You flip the coin and roll the die.',
      prompt: 'How many equally likely combined outcomes are there from one coin flip and one die roll?',
      question: {
        inputType: 'numeric',
        correctAnswer: 12,
        tolerance: 0,
        explanation: '2 coin outcomes × 6 die outcomes = 12 equally likely combined outcomes.',
        misconceptionTags: ['counting-principle'],
      },
      feedback: {
        correct: 'Yes! 2 × 6 = 12 equally likely (coin, die) pairs.',
        incorrect: 'Use the counting principle: 2 coin outcomes × 6 die outcomes.',
        hint: 'Each coin result opens up the full set of die results, so every coin–die pair gets counted — that is the counting principle, multiplying the options at each stage.',
        computationHint: '2 coin outcomes × 6 die outcomes = 12 combined outcomes.',
      },
      concepts: ['counting-principle', 'independent-events'],
    },
    {
      id: 'connect-coin-die',
      type: 'connection',
      title: 'Match Every Outcome',
      body: 'Connect each of the 6 die faces to each of the 2 coin sides. Every line you draw is one combined (die, coin) outcome — and they are all equally likely. Find all of them.',
      connectionConfig: {
        leftLabel: 'Die',
        rightLabel: 'Coin',
        leftItems: dieOutcomes,
        rightItems: coinOutcomes,
        pairingLabel: 'outcome',
      },
      feedback: {
        correct:
          'Every die face connects to both coin sides: 6 × 2 = 12 outcomes, each equally likely. That is the counting principle drawing the whole sample space.',
        incorrect: '',
        hint: 'Every die face can land beside either coin side, so no face is limited to just one — each one needs a line to both Heads and Tails.',
        computationHint: '6 die faces × 2 coin sides = 12 lines in all.',
      },
      concepts: ['counting-principle', 'independent-events'],
    },
    {
      id: 'pick-outcome',
      type: 'outcome-select',
      title: 'Find One Outcome',
      body: 'Here are all 12 equally likely combined outcomes, every die face joined to every coin side. Find the single one that is “Heads and a 6”.',
      outcomeSelectConfig: {
        leftLabel: 'Die',
        rightLabel: 'Coin',
        leftItems: dieOutcomes,
        rightItems: coinOutcomes,
        targetLeftId: 'd6',
        targetRightId: 'heads',
        pairingLabel: 'outcome',
      },
      feedback: {
        correct:
          'That highlighted line is the 1 outcome out of 12 that is “Heads and a 6”. So its probability is 1/12.',
        incorrect: '',
        hint: 'You are after the one line that satisfies both conditions at once — the die showing the target face together with the target coin side.',
        computationHint: 'Connect the die showing 6 to Heads — that single line is 1 of 12, or 1/12.',
      },
      concepts: ['independent-events'],
    },
    {
      id: 'single-prob',
      type: 'multiple-choice',
      title: 'One Favorable Outcome',
      body: 'Among those 12 equally likely (coin, die) outcomes, exactly one is "Heads and a 6".',
      prompt: 'If 1 of the 12 equally likely outcomes is "Heads and 6", what is the probability of getting Heads and a 6?',
      question: {
        inputType: 'multiple-choice',
        choices: ['1/2', '1/6', '1/12', '2/12'],
        correctChoiceIndex: 2,
        explanation: '1 favorable outcome out of 12 equally likely outcomes = 1/12.',
        misconceptionTags: ['probability-basics'],
      },
      feedback: {
        correct: 'Right — 1 out of 12 equally likely outcomes is 1/12.',
        incorrect: 'Probability = favorable outcomes ÷ total equally likely outcomes.',
        choiceFeedback: {
          '1/2': 'That is just the coin. We need Heads AND a 6 together.',
          '1/6': 'That is just the die. We need both conditions at once.',
          '2/12': 'There is only 1 outcome that is Heads-and-6, not 2.',
        },
        hint: 'With equally likely outcomes, a probability is the count you want over the total count — so compare how many outcomes are Heads-and-6 to the full 12.',
        computationHint: '1 favorable outcome ÷ 12 equally likely outcomes = 1/12.',
      },
      concepts: ['independent-events'],
    },
    {
      id: 'multiply-rule',
      type: 'multiple-choice',
      title: 'The Multiply Rule',
      body: 'A fair coin has P(Heads) = 1/2 and a fair die has P(rolling a 6) = 1/6.',
      prompt: 'What is P(Heads and a 6)?',
      question: {
        inputType: 'multiple-choice',
        choices: ['1/8', '1/12', '1/36', '2/6'],
        correctChoiceIndex: 1,
        explanation: '1/2 × 1/6 = 1/12, matching the counting approach.',
        misconceptionTags: ['multiply-probabilities'],
      },
      feedback: {
        correct: 'Exactly! 1/2 × 1/6 = 1/12.',
        incorrect: 'Multiply the fractions: (1×1)/(2×6).',
        choiceFeedback: {
          '1/8': 'That would be 1/2 × 1/4. The die has 6 faces, so use 1/6.',
          '1/36': 'That is 1/6 × 1/6 (two dice). Here one event is a coin: 1/2.',
          '2/6': 'That adds/combines incorrectly. Multiply 1/2 and 1/6.',
        },
        hint: 'The flip and the roll are independent, so combine them with the multiply rule — multiply the numerators together and the denominators together.',
        computationHint: '1/2 × 1/6 = (1×1)/(2×6) = 1/12.',
      },
      concepts: ['independent-events'],
    },
    {
      id: 'spinner-gamble',
      type: 'probability',
      title: 'Tune the Odds',
      body: 'Here is the multiply rule made visual. Event A is the blue band, event B is the orange band, and the green overlap is “A and B”. Drag the sliders to set each probability and watch the green win-zone — its size is always P(A) × P(B). Then spin to drop random points and see how often they land in BOTH.',
      probabilityConfig: {
        eventALabel: 'A',
        eventBLabel: 'B',
        initialAPercent: 50,
        initialBPercent: 50,
      },
      feedback: {
        correct:
          'The green area is exactly P(A) × P(B), and about that fraction of your spins land inside it. Shrinking either event shrinks the overlap — independent “and” multiplies.',
        incorrect: '',
        hint: 'The green zone only counts spins inside BOTH bands, so it has to be smaller than either band alone — that shrink is what multiplying two fractions below 1 does.',
        computationHint: 'At the starting 50% and 50%, the overlap is 0.5 × 0.5 = 0.25, so about 25 of every 100 spins land in green.',
      },
      concepts: ['independent-events'],
    },
    {
      id: 'two-coins',
      type: 'fraction-question',
      title: 'Two Heads in a Row',
      body: 'A fair coin has P(Heads) = 1/2. You flip it twice and want Heads both times.',
      prompt: 'What is P(Heads then Heads)? Enter your answer as a fraction (e.g. 1/4).',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/4',
        explanation: '1/2 × 1/2 = 1/4.',
        misconceptionTags: ['multiply-probabilities'],
      },
      feedback: {
        correct: 'Yes! 1/2 × 1/2 = 1/4.',
        incorrect: 'Multiply 1/2 × 1/2 — multiply the numerators and the denominators: (1×1)/(2×2).',
        hint: 'Each flip is independent, so a second Heads is no easier to get — every extra flip multiplies in another 1/2, making the combined chance smaller.',
        computationHint: '1/2 × 1/2 = 1/4.',
      },
      randomize: (r) => {
        const k = r.uniqueInt('coin-flips', 2, 4)
        const denom = 2 ** k
        const probExpr = joinTimes(Array(k).fill('1/2'))
        return {
          title: `${k} Heads in a Row`,
          body: `A fair coin has P(Heads) = 1/2. You flip it ${k} times and want Heads every time.`,
          prompt: `What is P(Heads on all ${k} flips)? Enter your answer as a fraction.`,
          question: { correctAnswer: `1/${denom}`, explanation: `${probExpr} = 1/${denom}.` },
          feedback: {
            correct: `Yes! ${probExpr} = 1/${denom}.`,
            incorrect: `Multiply the fractions: ${probExpr} = 1/${denom}.`,
            hint: 'Each flip is independent, so a second Heads is no easier to get — every extra flip multiplies in another 1/2, making the combined chance smaller.',
            computationHint: `${probExpr} = 1/${denom}.`,
          },
        }
      },
      concepts: ['independent-events'],
    },
    {
      id: 'two-dice',
      type: 'fraction-question',
      title: 'Double Sixes',
      body: 'Each fair die has 6 faces, so P(a specific number) = 1/6. You roll two dice and want a 6 on the first die AND a 6 on the second.',
      prompt: 'What is P(rolling a 6 on both dice)? Enter your answer as a fraction (e.g. 1/36).',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/36',
        explanation: '1/6 × 1/6 = 1/36.',
        misconceptionTags: ['multiply-probabilities'],
      },
      feedback: {
        correct: 'Correct! 1/6 × 1/6 = 1/36.',
        incorrect: 'Multiply the fractions: (1×1)/(6×6) = 1/36.',
        hint: 'The two dice are independent, so the second die is still 1 in 6 no matter what the first showed — multiply the two 1/6 chances and the joint result is far rarer than either alone.',
        computationHint: '1/6 × 1/6 = 1/36.',
      },
      concepts: ['independent-events', 'counting-principle'],
    },
    {
      id: 'three-heads',
      type: 'fraction-question',
      title: 'Three Heads',
      body: 'A fair coin has P(Heads) = 1/2. You flip it three times and want Heads all three times.',
      prompt: 'What is P(Heads on all three flips)? Enter your answer as a fraction (e.g. 1/8).',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/8',
        explanation: '1/2 × 1/2 × 1/2 = 1/8.',
        misconceptionTags: ['multiply-probabilities'],
      },
      feedback: {
        correct: 'Yes! 1/8.',
        incorrect: 'Multiply the fractions: (1×1×1)/(2×2×2) = 1/8.',
        hint: 'Independent flips don’t build on each other, so every Heads you require simply multiplies in another 1/2 — three of them stack three halves together.',
        computationHint: '1/2 × 1/2 × 1/2 = 1/8.',
      },
      randomize: (r) => {
        const k = r.uniqueInt('coin-flips', 2, 4)
        const denom = 2 ** k
        const probExpr = joinTimes(Array(k).fill('1/2'))
        return {
          title: `${k} Heads`,
          body: `A fair coin has P(Heads) = 1/2. You flip it ${k} times and want Heads every time.`,
          prompt: `What is P(Heads on all ${k} flips)? Enter your answer as a fraction.`,
          question: { correctAnswer: `1/${denom}`, explanation: `${probExpr} = 1/${denom}.` },
          feedback: {
            correct: `Yes! 1/${denom}.`,
            incorrect: `Multiply the fractions: ${probExpr} = 1/${denom}.`,
            hint: 'Independent flips don’t build on each other, so every Heads you require simply multiplies in another 1/2.',
            computationHint: `${probExpr} = 1/${denom}.`,
          },
        }
      },
      concepts: ['independent-events'],
    },
    {
      id: 'tails-even',
      type: 'multiple-choice',
      title: 'Coin and Die',
      body: 'A fair coin is flipped and a fair die (faces 1–6) is rolled. The even faces are 2, 4, and 6.',
      prompt: 'What is P(Tails and an even number)?',
      question: {
        inputType: 'multiple-choice',
        choices: ['1/2', '1/4', '1/6', '1/3'],
        correctChoiceIndex: 1,
        explanation: 'P(Tails) = 1/2, P(even) = 1/2, so 1/2 × 1/2 = 1/4.',
        misconceptionTags: ['multiply-probabilities'],
      },
      feedback: {
        correct: 'Right — 1/2 × 1/2 = 1/4.',
        incorrect: 'P(even) = 3 of 6 = 1/2. Then multiply by P(Tails) = 1/2.',
        hint: 'Find each event’s own probability first — remember 3 of the 6 faces are even — then, since the coin and die are independent, multiply the two.',
        computationHint: 'P(Tails) = 1/2 and P(even) = 3/6 = 1/2, so 1/2 × 1/2 = 1/4.',
      },
      concepts: ['independent-events'],
    },
    {
      id: 'formula-ab',
      type: 'multiple-choice',
      title: 'The Rule, Stated',
      body: 'For independent events, the "and" probability follows one operation.',
      prompt: 'For two independent events A and B, P(A and B) equals:',
      question: {
        inputType: 'multiple-choice',
        choices: ['P(A) + P(B)', 'P(A) × P(B)', 'P(A) − P(B)', 'the larger of P(A), P(B)'],
        correctChoiceIndex: 1,
        explanation: 'Independent events multiply: P(A and B) = P(A) × P(B).',
        misconceptionTags: ['multiply-probabilities'],
      },
      feedback: {
        correct: 'Right — multiply for independent "and".',
        incorrect: 'AND with independence means multiply.',
        hint: 'Independence means one event doesn’t shift the other’s odds, so the “and” compounds the chances the way the counting principle compounds choices — it doesn’t add them.',
        computationHint: 'P(A and B) = P(A) × P(B) — the probabilities multiply.',
      },
      concepts: ['independent-events'],
    },
    {
      id: 'spinner',
      type: 'fraction-question',
      title: 'Spin Twice',
      body: 'A spinner lands on red with probability 1/3. You spin it twice.',
      prompt: 'What is P(red on both spins)? Enter your answer as a fraction (e.g. 1/9).',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/9',
        explanation: '1/3 × 1/3 = 1/9.',
        misconceptionTags: ['multiply-probabilities'],
      },
      feedback: {
        correct: 'Yes — 1/3 × 1/3 = 1/9.',
        incorrect: 'Multiply the fractions: (1×1)/(3×3) = 1/9.',
        hint: 'The two spins are independent, so the second is still 1/3 no matter what the first did — multiply the per-spin chances and the both-spins result is smaller than a single spin.',
        computationHint: '1/3 × 1/3 = 1/9.',
      },
      randomize: (r) => {
        const m = r.uniqueInt('spin-base', 3, 6)
        const denom = m * m
        return {
          body: `A spinner lands on red with probability 1/${m}. You spin it twice.`,
          prompt: 'What is P(red on both spins)? Enter your answer as a fraction.',
          question: { correctAnswer: `1/${denom}`, explanation: `1/${m} × 1/${m} = 1/${denom}.` },
          feedback: {
            correct: `Yes — 1/${m} × 1/${m} = 1/${denom}.`,
            incorrect: `Multiply the fractions: (1×1)/(${m}×${m}) = 1/${denom}.`,
            hint: 'The two spins are independent, so the second is still the same chance no matter what the first did — multiply the per-spin chances and the both-spins result is smaller than a single spin.',
            computationHint: `1/${m} × 1/${m} = 1/${denom}.`,
          },
        }
      },
      concepts: ['independent-events'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned that independent events multiply: the chance of both happening is the product of their individual probabilities — the counting principle applied to probability.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
