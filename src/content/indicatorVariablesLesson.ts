import type { Lesson } from './types'
import { expectedCount, fracText } from './probabilityMath'

export const indicatorVariablesLesson: Lesson = {
  id: 'indicator-variables',
  title: 'Indicator Variables',
  description:
    'To count something, attach an indicator Xᵢ = 1 if event i happens else 0. Then count = ΣXᵢ and E[count] = ΣP(eventᵢ) — a sum of simple probabilities, even when the events are dependent.',
  hook: 'Expected number of people who get their own hat back? It’s exactly 1.',
  estimatedMinutes: 11,
  prerequisites: ['linearity-of-expectation'],
  concepts: ['indicator-variables', 'linearity-expectation', 'expected-value'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Turn Counting into Adding',
      body: 'Here’s a trick that cracks hard counting problems. For each thing you might count, define an INDICATOR: $X_i = 1$ if event $i$ happens, and $0$ if it doesn’t.\n\nThen the total count is just $X_1 + X_2 + \\cdots$ — adding the 0/1 marks.\n\nBecause $E[X_i] = P(\\text{event } i)$, linearity gives $E[\\text{count}] = \\sum P(\\text{event } i)$: the expected count is the sum of the individual probabilities.\n\nNo distribution, no casework — and it works even when the events are dependent.',
      prompt: '$\\text{count} = \\sum X_i$, so $E[\\text{count}] = \\sum E[X_i] = \\sum P(\\text{event}_i)$.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt: 'Flip 10 coins and count the heads. What’s the expected number? Guess first.',
        answer: 5,
      },
    },
    {
      id: 'worked-coins-indicator',
      type: 'worked-example',
      title: 'Watch Me Mark Each Coin',
      body: 'Back to 10 coins — this time I’ll turn each into a 0/1 indicator and add them.',
      workedExampleConfig: {
        kind: 'coins-sum',
        voice: 'nova',
        coinsSum: {
          coins: 10,
          mode: 'indicator',
          values: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
        },
        script: [
          {
            say: 'Our job is to count the heads in ten coin flips — using indicators. To each coin I attach a number: define X-i as one if coin i is heads, and zero if it is tails.',
            highlight: 'coins',
          },
          {
            say: 'Here is one flip. Under each coin I write its indicator — one for heads, zero for tails. Add those marks and you get the number of heads in this flip: six.',
            highlight: 'marks',
          },
          {
            say: 'That sum of indicators IS the head count. Now take expectations: each X-i is heads half the time, so its expected value is one half. By linearity the expected sum is ten one-halves, which is five. This flip happened to give six — but the long-run average is five.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['indicator-variables', 'linearity-expectation'],
    },
    {
      id: 'simulate-coins-indicator',
      type: 'coin-flip-sim',
      title: 'Watch the Indicators Add Up',
      body: 'Each flip below shows every coin’s indicator Xᵢ (1 or 0); their sum ΣXᵢ is that flip’s head count. The individual counts jump around, but their running average settles onto 5.',
      coinFlipSimConfig: { coins: 10, showIndicators: true },
      feedback: {
        correct:
          'Every flip, the 0/1 indicators add up to that flip’s head count — and averaged over many flips, that count converges to 5 = 10 × ½. Summing indicators is exactly how the count is built.',
        incorrect: '',
        hint: 'Read each coin as a 0 or 1 and add them: that ΣXᵢ is the heads for that flip. Average enough flips and it approaches 10 × ½ = 5.',
        computationHint: 'Each Xᵢ averages ½, so E[ΣXᵢ] = 10 × ½ = 5 — the value the running average converges to.',
      },
      concepts: ['indicator-variables'],
    },
    {
      id: 'expected-heads',
      type: 'numeric-question',
      title: 'Expected Heads, by Indicators',
      body: 'You flip 10 fair coins. Let Xᵢ = 1 if coin i is heads, else 0.',
      prompt: 'Using count = ΣXᵢ, what is the expected number of heads?',
      question: {
        inputType: 'numeric',
        correctAnswer: 5,
        tolerance: 0.01,
        explanation:
          'Each coin’s indicator has E[Xᵢ] = P(heads) = ½. Summing: E[count] = 10 × ½ = 5.',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Yes — 10 indicators, each averaging ½: 10 × ½ = 5.',
        incorrect: 'Add each coin’s P(heads) = ½, ten times.',
        hint: 'E[count] = Σ P(eventᵢ). Here every event is “this coin is heads,” with probability ½.',
        computationHint: 'E[Xᵢ] = ½, so E[count] = 10 × ½ = 5.',
      },
      randomize: (r) => {
        const coins = 2 * r.uniqueInt('ind-coins', 2, 6)
        const answer = coins / 2
        return {
          body: `You flip ${coins} fair coins. Let Xᵢ = 1 if coin i is heads, else 0.`,
          question: {
            correctAnswer: answer,
            explanation: `Each coin’s indicator has E[Xᵢ] = P(heads) = ½. Summing: E[count] = ${coins} × ½ = ${answer}.`,
          },
          feedback: {
            correct: `Yes — ${coins} indicators, each averaging ½: ${coins} × ½ = ${answer}.`,
            incorrect: 'Add each coin’s P(heads) = ½, once per coin.',
            hint: 'E[count] = Σ P(eventᵢ). Here every event is “this coin is heads,” with probability ½.',
            computationHint: `E[Xᵢ] = ½, so E[count] = ${coins} × ½ = ${answer}.`,
          },
        }
      },
      concepts: ['indicator-variables', 'expected-value'],
    },
    {
      id: 'hat-match',
      type: 'numeric-question',
      title: 'The Hat-Check Surprise',
      body: '5 people check identical-looking hats, and at the end the hats are handed back at random — one per person. These events are tangled together (one wrong hat forces another), so direct counting is a nightmare.',
      prompt: 'What is the expected number of people who get their OWN hat back?',
      question: {
        inputType: 'numeric',
        correctAnswer: 1,
        tolerance: 0.01,
        explanation:
          'Let Xᵢ = 1 if person i gets their own hat. Each person is equally likely to receive any of the 5 hats, so P = 1/5, and E[matches] = 5 × 1/5 = 1. Indicators dodge the dependence entirely.',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Exactly 1 — and notice it doesn’t depend on how many people there are!',
        incorrect: 'Give each person an indicator with P = 1/5, then add: 5 × 1/5.',
        hint: 'Don’t track the tangled arrangement. Per person: P(own hat) = 1/(number of people). Sum those probabilities.',
        computationHint: 'Each of the 5 people has P(own hat) = 1/5, so E = 5 × 1/5 = 1.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('ind-hat', 4, 10)
        return {
          body: `${n} people check identical-looking hats, and at the end the hats are handed back at random — one per person. These events are tangled together (one wrong hat forces another), so direct counting is a nightmare.`,
          question: {
            correctAnswer: 1,
            explanation: `Let Xᵢ = 1 if person i gets their own hat. Each person is equally likely to receive any of the ${n} hats, so P = 1/${n}, and E[matches] = ${n} × 1/${n} = 1. Indicators dodge the dependence entirely.`,
          },
          feedback: {
            correct: 'Exactly 1 — and notice it doesn’t depend on how many people there are!',
            incorrect: `Give each person an indicator with P = 1/${n}, then add: ${n} × 1/${n}.`,
            hint: 'Don’t track the tangled arrangement. Per person: P(own hat) = 1/(number of people). Sum those probabilities.',
            computationHint: `Each of the ${n} people has P(own hat) = 1/${n}, so E = ${n} × 1/${n} = 1.`,
          },
        }
      },
      concepts: ['indicator-variables'],
    },
    {
      id: 'expected-aces',
      type: 'fraction-question',
      title: 'Expected Aces',
      body: 'You deal 5 cards from a shuffled 52-card deck.',
      prompt: 'Let Xᵢ = 1 if the i-th card is an ace. What is the expected number of aces? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '5/13',
        explanation:
          'Each card is an ace with probability 4/52 = 1/13, so E[Xᵢ] = 1/13. Summing the 5 indicators: E = 5 × 1/13 = 5/13 (the dependence between draws never matters).',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Yes — 5 × 1/13 = 5/13.',
        incorrect: 'Each card is an ace with probability 1/13; add that indicator’s expectation 5 times.',
        hint: 'Give each dealt card an indicator with P(ace) = 1/13, then sum those probabilities.',
        computationHint: 'E[Xᵢ] = 4/52 = 1/13, so E = 5 × 1/13 = 5/13.',
      },
      randomize: (r) => {
        const cards = r.uniqueInt('ind-cards', 2, 12)
        const p = expectedCount(cards, { n: 1, d: 13 })
        return {
          body: `You deal ${cards} cards from a shuffled 52-card deck.`,
          prompt: `Let Xᵢ = 1 if the i-th card is an ace. What is the expected number of aces in your ${cards} cards? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Each card is an ace with probability 4/52 = 1/13, so E[Xᵢ] = 1/13. Summing the ${cards} indicators: E = ${cards} × 1/13 = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — ${cards} × 1/13 = ${fracText(p)}.`,
            incorrect: 'Each card is an ace with probability 1/13; add that indicator once per card.',
            hint: 'Give each dealt card an indicator with P(ace) = 1/13, then sum those probabilities.',
            computationHint: `E[Xᵢ] = 4/52 = 1/13, so E = ${cards} × 1/13 = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['indicator-variables', 'expected-value'],
    },
    {
      id: 'expected-sixes',
      type: 'fraction-question',
      title: 'Expected Sixes',
      body: 'You roll 4 fair six-sided dice. Let Xᵢ = 1 if die i shows a six.',
      prompt: 'What is the expected number of sixes? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '2/3',
        explanation: 'Each die is a six with probability 1/6, so E = 4 × 1/6 = 4/6 = 2/3.',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Yes — 4 × 1/6 = 2/3.',
        incorrect: 'Each die shows a six with probability 1/6; add that indicator 4 times.',
        hint: 'Per die, P(six) = 1/6. Sum that probability once per die.',
        computationHint: 'E = 4 × 1/6 = 4/6 = 2/3.',
      },
      randomize: (r) => {
        const dice = r.uniqueInt('ind-sixes', 2, 5)
        const p = expectedCount(dice, { n: 1, d: 6 })
        return {
          body: `You roll ${dice} fair six-sided dice. Let Xᵢ = 1 if die i shows a six.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Each die is a six with probability 1/6, so E = ${dice} × 1/6 = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — ${dice} × 1/6 = ${fracText(p)}.`,
            incorrect: 'Each die shows a six with probability 1/6; add that indicator once per die.',
            hint: 'Per die, P(six) = 1/6. Sum that probability once per die.',
            computationHint: `E = ${dice} × 1/6 = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['indicator-variables', 'expected-value'],
    },
    {
      id: 'method-mc',
      type: 'multiple-choice',
      title: 'The Indicator Method',
      body: 'You write a count as a sum of 0/1 indicators, one per event.',
      prompt: 'With count = X₁ + X₂ + … + Xₙ where each Xᵢ is 1 when event i happens, the expected count equals…',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'the sum of each event’s probability, P(E₁) + P(E₂) + … + P(Eₙ)',
          'the product of the probabilities, P(E₁) × … × P(Eₙ)',
          'the probability that all events happen at once',
          'always 1, no matter the events',
        ],
        correctChoiceIndex: 0,
        explanation:
          'E[Xᵢ] = P(eventᵢ), and linearity lets you add: E[count] = Σ E[Xᵢ] = Σ P(eventᵢ). No independence needed — that’s the whole power of the method.',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Right — E[count] = Σ P(eventᵢ), dependence and all.',
        incorrect: 'Each indicator contributes E[Xᵢ] = P(eventᵢ), and linearity adds them.',
        choiceFeedback: {
          'the product of the probabilities, P(E₁) × … × P(Eₙ)':
            'Multiplying is for joint probabilities of independent events — the indicator method ADDS expectations.',
          'always 1, no matter the events':
            'The hat problem happened to give 1; in general E[count] = Σ P(eventᵢ), which varies.',
        },
        hint: 'Each Xᵢ contributes E[Xᵢ] = P(eventᵢ). How does linearity combine those?',
        computationHint: 'E[ΣXᵢ] = Σ E[Xᵢ] = Σ P(eventᵢ) — addition, not multiplication.',
      },
      concepts: ['indicator-variables'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned the indicator method: write a count as a sum of 0/1 variables, then E[count] = Σ P(eventᵢ). It turned coins, cards, dice, and the tangled hat-check problem into simple sums of probabilities — dependence and all. That’s a powerful tool for the toughest counting questions ahead.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
