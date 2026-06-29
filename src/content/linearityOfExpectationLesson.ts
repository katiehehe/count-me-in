import type { Lesson } from './types'
import { expectedCount, fracText } from './probabilityMath'

export const linearityOfExpectationLesson: Lesson = {
  id: 'linearity-of-expectation',
  title: 'Linearity of Expectation',
  description:
    'E[X + Y] = E[X] + E[Y], always — even when the parts are dependent. The expected value of a sum is just the sum of the parts’ expected values, no full distribution required.',
  hook: 'Flip 10 coins. Expected heads? Don’t sum 1024 outcomes — add ten halves.',
  estimatedMinutes: 11,
  prerequisites: ['expected-value'],
  concepts: ['linearity-expectation', 'expected-value'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Expectation Splits Over Sums',
      body: 'Here is one of the most useful facts in probability: the expected value of a sum equals the sum of the expected values.\n\n$E[X+Y] = E[X] + E[Y]$, and it holds ALWAYS — even when X and Y are dependent, overlapping, or tangled together.\n\nSo to find the expected total of many things, you never need the whole distribution; just add up each piece’s own expectation.',
      prompt: '$E[X+Y] = E[X] + E[Y]$ — always, dependence and all.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt: 'Flip 10 fair coins. On average, how many heads would you expect? Take a guess.',
        answer: 5,
      },
    },
    {
      id: 'worked-coins-sum',
      type: 'worked-example',
      title: 'Watch Me Skip the Hard Way',
      body: 'Flip 10 coins at once. How many heads should we expect?',
      workedExampleConfig: {
        kind: 'coins-sum',
        voice: 'nova',
        coinsSum: { coins: 10 },
        script: [
          {
            say: 'Our job is to find the expected number of heads when we flip ten coins at once. The brute-force way would average over all one thousand twenty-four possible head counts, each weighted by its probability — completely unwieldy.',
            highlight: 'coins',
          },
          {
            say: 'Linearity gives a shortcut. Look at a single coin: it lands heads half the time, so on average it contributes one half of a head. Every one of the ten coins contributes the same one half.',
            highlight: 'contributions',
          },
          {
            say: 'The expected value of a sum is the sum of the expected values, so we just add ten one-halves: ten times one half is five. Five expected heads, no giant sum needed. And that one half is simply the average of a single coin’s zero-or-one outcome — the indicator idea coming next.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['linearity-expectation', 'expected-value'],
    },
    {
      id: 'simulate-coins',
      type: 'coin-flip-sim',
      title: 'Watch It Land on 5',
      body: 'Theory says 5 — let’s see it. Flip all 10 coins over and over; the running average number of heads bounces around at first, then settles right onto 5.',
      coinFlipSimConfig: { coins: 10 },
      feedback: {
        correct:
          'There it is: any single flip might give 3 or 7 heads, but average enough flips and the mean locks onto 5 — exactly the 10 × ½ that linearity predicted. The simulation and the sum-of-expectations agree.',
        incorrect: '',
        hint: 'Each coin is heads about half the time, so 10 coins average about 5 heads. Keep flipping and watch the blue line hug the dashed 5.',
        computationHint: 'Per coin: E = ½. Ten coins: 10 × ½ = 5, the value the running average converges to.',
      },
      concepts: ['linearity-expectation'],
    },
    {
      id: 'expected-heads',
      type: 'numeric-question',
      title: 'Expected Heads',
      body: 'You flip 10 fair coins.',
      prompt: 'What is the expected number of heads?',
      question: {
        inputType: 'numeric',
        correctAnswer: 5,
        tolerance: 0.01,
        explanation:
          'Each coin contributes E = ½, and expectation adds over the sum: 10 × ½ = 5. No need to enumerate outcomes.',
        misconceptionTags: ['linearity-expectation'],
      },
      feedback: {
        correct: 'Yes — 10 × ½ = 5 expected heads.',
        incorrect: 'Add each coin’s expected ½: 10 × ½.',
        hint: 'Find one coin’s expected contribution, then use linearity: add that same expectation once per coin.',
        computationHint: 'Per coin E = ½, so 10 coins give 10 × ½ = 5.',
      },
      randomize: (r) => {
        const coins = 2 * r.uniqueInt('lin-coins', 2, 6)
        const answer = coins / 2
        return {
          body: `You flip ${coins} fair coins.`,
          question: {
            correctAnswer: answer,
            explanation: `Each coin contributes E = ½, and expectation adds over the sum: ${coins} × ½ = ${answer}.`,
          },
          feedback: {
            correct: `Yes — ${coins} × ½ = ${answer} expected heads.`,
            incorrect: `Add each coin’s expected ½: ${coins} × ½.`,
            hint: 'Find one coin’s expected contribution, then use linearity: add that same expectation once per coin.',
            computationHint: `Per coin E = ½, so ${coins} coins give ${coins} × ½ = ${answer}.`,
          },
        }
      },
      concepts: ['linearity-expectation', 'expected-value'],
    },
    {
      id: 'expected-dice-sum',
      type: 'numeric-question',
      title: 'Expected Total of Dice',
      body: 'You roll 4 fair six-sided dice and add up the faces.',
      prompt: 'What is the expected sum?',
      question: {
        inputType: 'numeric',
        correctAnswer: 14,
        tolerance: 0.01,
        explanation:
          'One die averages (1+2+3+4+5+6)/6 = 3.5. The expected sum is the sum of expectations: 4 × 3.5 = 14.',
        misconceptionTags: ['linearity-expectation'],
      },
      feedback: {
        correct: 'Right — 4 × 3.5 = 14.',
        incorrect: 'Each die averages 3.5; add that expectation once per die.',
        hint: 'You don’t need the distribution of the sum. Find one die’s expected value, then add it once for each die.',
        computationHint: 'One die: E = 3.5. Four dice: 4 × 3.5 = 14.',
      },
      randomize: (r) => {
        const dice = 2 * r.uniqueInt('lin-dice', 1, 3)
        const answer = 3.5 * dice
        return {
          body: `You roll ${dice} fair six-sided dice and add up the faces.`,
          question: {
            correctAnswer: answer,
            explanation: `One die averages (1+2+3+4+5+6)/6 = 3.5. The expected sum is the sum of expectations: ${dice} × 3.5 = ${answer}.`,
          },
          feedback: {
            correct: `Right — ${dice} × 3.5 = ${answer}.`,
            incorrect: 'Each die averages 3.5; add that expectation once per die.',
            hint: 'You don’t need the distribution of the sum. Find one die’s expected value, then add it once for each die.',
            computationHint: `One die: E = 3.5. ${dice} dice: ${dice} × 3.5 = ${answer}.`,
          },
        }
      },
      concepts: ['linearity-expectation', 'expected-value'],
    },
    {
      id: 'expected-aces',
      type: 'fraction-question',
      title: 'Dependence Doesn’t Matter',
      body: 'You deal 5 cards from a shuffled 52-card deck. The draws are DEPENDENT — each card removed changes the next — but linearity doesn’t care.',
      prompt: 'What is the expected number of aces in your 5 cards? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '5/13',
        explanation:
          'Each single card is an ace with probability 4/52 = 1/13. Expectation adds over the 5 cards regardless of dependence: 5 × 1/13 = 5/13.',
        misconceptionTags: ['linearity-expectation'],
      },
      feedback: {
        correct: 'Exactly — 5 × 1/13 = 5/13, and the dependent draws never entered the calculation.',
        incorrect: 'Each card is an ace with probability 1/13; add that expectation 5 times.',
        hint: 'Treat each of the 5 cards on its own: what’s the chance it’s an ace? Linearity lets you add those expectations even though the draws are dependent.',
        computationHint: 'P(a given card is an ace) = 4/52 = 1/13, so E = 5 × 1/13 = 5/13.',
      },
      randomize: (r) => {
        const cards = r.uniqueInt('lin-cards', 2, 12)
        const p = expectedCount(cards, { n: 1, d: 13 })
        return {
          body: `You deal ${cards} cards from a shuffled 52-card deck. The draws are DEPENDENT — each card removed changes the next — but linearity doesn’t care.`,
          prompt: `What is the expected number of aces in your ${cards} cards? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Each single card is an ace with probability 4/52 = 1/13. Expectation adds over the ${cards} cards regardless of dependence: ${cards} × 1/13 = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Exactly — ${cards} × 1/13 = ${fracText(p)}, and the dependent draws never entered the calculation.`,
            incorrect: 'Each card is an ace with probability 1/13; add that expectation once per card.',
            hint: 'Treat each card on its own: what’s the chance it’s an ace? Linearity lets you add those expectations even though the draws are dependent.',
            computationHint: `P(a given card is an ace) = 4/52 = 1/13, so E = ${cards} × 1/13 = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['linearity-expectation', 'expected-value'],
    },
    {
      id: 'expected-sixes',
      type: 'fraction-question',
      title: 'Expected Sixes',
      body: 'You roll 4 fair six-sided dice.',
      prompt: 'What is the expected number of sixes? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '2/3',
        explanation:
          'Each die is a six with probability 1/6. By linearity, E = 4 × 1/6 = 4/6 = 2/3.',
        misconceptionTags: ['linearity-expectation'],
      },
      feedback: {
        correct: 'Yes — 4 × 1/6 = 2/3 expected sixes.',
        incorrect: 'Each die shows a six with probability 1/6; add that 4 times.',
        hint: 'What’s the chance a single die is a six? Add that expectation once per die.',
        computationHint: 'Per die E = 1/6, so 4 × 1/6 = 4/6 = 2/3.',
      },
      randomize: (r) => {
        const dice = r.uniqueInt('lin-sixes', 2, 5)
        const p = expectedCount(dice, { n: 1, d: 6 })
        return {
          body: `You roll ${dice} fair six-sided dice.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Each die is a six with probability 1/6. By linearity, E = ${dice} × 1/6 = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — ${dice} × 1/6 = ${fracText(p)} expected sixes.`,
            incorrect: 'Each die shows a six with probability 1/6; add that once per die.',
            hint: 'What’s the chance a single die is a six? Add that expectation once per die.',
            computationHint: `Per die E = 1/6, so ${dice} × 1/6 = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['linearity-expectation', 'expected-value'],
    },
    {
      id: 'dependence-mc',
      type: 'multiple-choice',
      title: 'When Does It Hold?',
      body: 'You used linearity on independent coins AND on dependent card draws.',
      prompt: 'For E[X + Y] = E[X] + E[Y] to hold, the parts X and Y must be…',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'nothing special — it always holds, independent or not',
          'independent of each other',
          'mutually exclusive',
          'equally likely',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Linearity of expectation needs no assumptions: E[X + Y] = E[X] + E[Y] for any random variables, however they’re related. (Multiplying expectations is what needs independence — adding never does.)',
        misconceptionTags: ['linearity-expectation'],
      },
      feedback: {
        correct: 'Right — linearity is unconditional; that’s what makes it so powerful.',
        incorrect: 'Think about the 5-card aces problem: the draws were dependent, yet linearity still worked.',
        choiceFeedback: {
          'independent of each other':
            'That’s the condition for MULTIPLYING expectations. Adding them needs no independence — recall the dependent card draws.',
        },
        hint: 'Recall the dependent card draws — did dependence break the calculation, or did adding the per-card expectations still work?',
        computationHint: 'E[X + Y] = E[X] + E[Y] holds for ALL random variables; only E[XY] = E[X]E[Y] needs independence.',
      },
      concepts: ['linearity-expectation'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned linearity of expectation: E[X + Y] = E[X] + E[Y], always. Break a complicated total into simple pieces, find each piece’s expectation, and add — dependence never matters. Next, indicator variables turn “count how many” into a clean sum of 0/1 expectations.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
