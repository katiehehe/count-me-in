import type { Lesson } from './types'
import {
  complement,
  conditionalProb,
  drawSameProb,
  expectedCount,
  expectedGivenAtLeastOne,
  fracText,
  reduceFrac,
} from './probabilityMath'

export const puttingItTogetherLesson: Lesson = {
  id: 'putting-it-together',
  title: 'Putting It Together',
  description:
    'A capstone that mixes everything: dependent events, conditional probability, the complement rule, linearity of expectation, and indicator variables — on genuinely multi-step problems where the hard part is recognizing which tools to combine.',
  hook: 'Roll 4 dice. Given at least one six, how many sixes do you expect?',
  estimatedMinutes: 12,
  prerequisites: ['indicator-variables'],
  concepts: [
    'synthesis',
    'dependent-events',
    'conditional-probability',
    'complement-rule',
    'linearity-expectation',
    'indicator-variables',
  ],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Recognize, Then Combine',
      body: 'You now have five powerful tools: dependent events (the odds shift), conditional probability (restrict the world), the complement rule (count the easy opposite), linearity of expectation (add the parts), and indicator variables (count by summing 0/1s).\n\nReal problems rarely announce which to use — the skill is spotting that a question is secretly two or three of these stacked together.\n\nLet’s combine them.',
      prompt: 'The hard part isn’t the arithmetic — it’s recognizing which tools a problem needs.',
      nextButtonLabel: 'Show me a combined one',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'Roll 4 dice; you’re told at least one is a six. Guess the expected number of sixes — a round number is fine.',
        answer: '864/671',
        revealNote: 'about 1.29',
      },
    },
    {
      id: 'worked-combined',
      type: 'worked-example',
      title: 'Watch Me Combine Three Tools',
      body: 'Roll 4 fair dice. Given that AT LEAST ONE is a six, what is the expected number of sixes? This needs three ideas at once.',
      workedExampleConfig: {
        kind: 'steps',
        voice: 'nova',
        steps: {
          lines: [
            { latex: 'E[N] = 4 \\times \\tfrac{1}{6} = \\tfrac{2}{3}', caption: 'linearity / indicators' },
            {
              latex: 'P(N \\ge 1) = 1 - \\left(\\tfrac{5}{6}\\right)^{4} = \\tfrac{671}{1296}',
              caption: 'complement rule',
            },
            {
              latex: 'E[N \\mid N \\ge 1] = \\dfrac{E[N]}{P(N \\ge 1)}',
              caption: 'condition: N = 0 adds nothing',
            },
            {
              latex: '= \\dfrac{2/3}{671/1296} = \\tfrac{864}{671} \\approx 1.29',
              caption: 'divide',
            },
          ],
        },
        script: [
          {
            say: 'Here is a problem that needs three tools at once. We roll four fair dice, and we are told at least one of them is a six. Our job: given that, find the expected number of sixes. Let us build it up in three steps.',
          },
          {
            say: 'First, the expected number of sixes with no conditions. Make each die an indicator — one if it shows a six — and add: by linearity that is four times one-sixth, which is two-thirds.',
            highlight: 'step-0',
          },
          {
            say: 'Next, the chance of the condition: at least one six. Counting that directly is messy, so use the complement — one minus the chance of no sixes, five-sixths to the fourth. That is six hundred seventy-one over twelve ninety-six.',
            highlight: 'step-1',
          },
          {
            say: 'Now condition. We want the average sixes only among the rolls that had at least one. Since rolls with zero sixes contribute nothing to the total, the conditional expectation is the overall expected sixes divided by the probability of the condition.',
            highlight: 'step-2',
          },
          {
            say: 'Divide two-thirds by six hundred seventy-one over twelve ninety-six, and you get eight hundred sixty-four over six hundred seventy-one — about one point two nine. Three tools, one answer.',
            highlight: 'step-3',
          },
        ],
      },
      concepts: ['synthesis', 'linearity-expectation', 'complement-rule', 'conditional-probability'],
    },
    {
      id: 'given-face-king',
      type: 'fraction-question',
      title: 'Warm-Up: Condition',
      body: 'A single card is drawn from a 52-card deck and you’re told it is a FACE card (one of the 12 Jacks, Queens, and Kings).',
      prompt: 'Given that, what is the probability it is a King? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/3',
        explanation:
          'Conditioning restricts the world to the 12 face cards. 4 of them are Kings, so P = 4/12 = 1/3.',
        misconceptionTags: ['conditional-probability'],
      },
      feedback: {
        correct: 'Yes — 4 Kings among 12 face cards: 1/3.',
        incorrect: 'The world is now just the 12 face cards; how many are Kings?',
        hint: 'Restrict to the given set (the 12 face cards), then count the favorable ones.',
        computationHint: '4 Kings / 12 face cards = 1/3.',
      },
      randomize: (r) => {
        const rank = ['King', 'Queen', 'Jack'][r.uniqueInt('syn-rank', 0, 2)]
        const p = conditionalProb(4, 12)
        return {
          prompt: `Given that, what is the probability it is a ${rank}? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Conditioning restricts the world to the 12 face cards. 4 of them are ${rank}s, so P = 4/12 = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — 4 ${rank}s among 12 face cards: ${fracText(p)}.`,
            incorrect: `The world is now just the 12 face cards; how many are ${rank}s?`,
            hint: 'Restrict to the given set (the 12 face cards), then count the favorable ones.',
            computationHint: `4 ${rank}s / 12 face cards = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['conditional-probability'],
    },
    {
      id: 'expected-aces',
      type: 'fraction-question',
      title: 'Indicators + Dependence',
      body: 'You deal 5 cards from a shuffled 52-card deck. The draws are dependent, but the indicator method ignores that.',
      prompt: 'What is the expected number of aces? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '5/13',
        explanation:
          'Let Xᵢ = 1 if card i is an ace; P = 4/52 = 1/13 each. Summing the 5 indicators: E = 5 × 1/13 = 5/13, dependence notwithstanding.',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Yes — 5 × 1/13 = 5/13.',
        incorrect: 'Give each dealt card an ace-indicator with P = 1/13, then sum.',
        hint: 'Sum the per-card probabilities: each card is an ace with probability 1/13.',
        computationHint: 'E = 5 × 1/13 = 5/13.',
      },
      randomize: (r) => {
        const cards = r.uniqueInt('syn-cards', 2, 12)
        const p = expectedCount(cards, { n: 1, d: 13 })
        return {
          body: `You deal ${cards} cards from a shuffled 52-card deck. The draws are dependent, but the indicator method ignores that.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Let Xᵢ = 1 if card i is an ace; P = 4/52 = 1/13 each. Summing the ${cards} indicators: E = ${cards} × 1/13 = ${fracText(p)}, dependence notwithstanding.`,
          },
          feedback: {
            correct: `Yes — ${cards} × 1/13 = ${fracText(p)}.`,
            incorrect: 'Give each dealt card an ace-indicator with P = 1/13, then sum.',
            hint: 'Sum the per-card probabilities: each card is an ace with probability 1/13.',
            computationHint: `E = ${cards} × 1/13 = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['indicator-variables', 'dependent-events'],
    },
    {
      id: 'hat-matches',
      type: 'numeric-question',
      title: 'The Hat-Check, Again',
      body: '6 people check identical hats and get them back in a random order. The events are tangled, but indicators cut through it.',
      prompt: 'What is the expected number of people who get their OWN hat?',
      question: {
        inputType: 'numeric',
        correctAnswer: 1,
        tolerance: 0.01,
        explanation:
          'Xᵢ = 1 if person i gets their own hat, with P = 1/6 each. E = 6 × 1/6 = 1 — and it’s always 1, for any number of people.',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Exactly 1 — independent of the group size.',
        incorrect: 'Each person matches with probability 1/6; sum those: 6 × 1/6.',
        hint: 'Per person, P(own hat) = 1/(number of people). Add those probabilities.',
        computationHint: '6 × 1/6 = 1.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('syn-hat', 4, 10)
        return {
          body: `${n} people check identical hats and get them back in a random order. The events are tangled, but indicators cut through it.`,
          question: {
            correctAnswer: 1,
            explanation: `Xᵢ = 1 if person i gets their own hat, with P = 1/${n} each. E = ${n} × 1/${n} = 1 — and it’s always 1, for any number of people.`,
          },
          feedback: {
            correct: 'Exactly 1 — independent of the group size.',
            incorrect: `Each person matches with probability 1/${n}; sum those: ${n} × 1/${n}.`,
            hint: 'Per person, P(own hat) = 1/(number of people). Add those probabilities.',
            computationHint: `${n} × 1/${n} = 1.`,
          },
        }
      },
      concepts: ['indicator-variables'],
    },
    {
      id: 'atleast-one-ace',
      type: 'fraction-question',
      title: 'Complement + Dependence',
      body: 'You deal a 2-card hand from a 52-card deck (no replacement, so the draws are dependent).',
      prompt: 'What is the probability of getting at least one ace? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '33/221',
        explanation:
          'Count the complement: P(no ace) = (48/52)(47/51) = 188/221 (dependent draws). So P(at least one ace) = 1 − 188/221 = 33/221.',
        misconceptionTags: ['complement-rule'],
      },
      feedback: {
        correct: 'Yes — 1 − 188/221 = 33/221.',
        incorrect: 'Find P(no ace) with two dependent draws, then subtract from 1.',
        hint: 'Going for “at least one” directly is messy. Compute P(no ace across both dependent draws), then take the complement.',
        computationHint: 'P(no ace) = (48/52)(47/51) = 188/221, so P(≥1 ace) = 1 − 188/221 = 33/221.',
      },
      randomize: (r) => {
        const rank = ['ace', 'king', 'queen'][r.uniqueInt('syn-ace', 0, 2)]
        const none = drawSameProb(48, 52, 2)
        const p = complement(none)
        return {
          prompt: `What is the probability of getting at least one ${rank}? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Count the complement: P(no ${rank}) = (48/52)(47/51) = ${fracText(none)} (dependent draws). So P(at least one ${rank}) = 1 − ${fracText(none)} = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — 1 − ${fracText(none)} = ${fracText(p)}.`,
            incorrect: `Find P(no ${rank}) with two dependent draws, then subtract from 1.`,
            hint: 'Going for “at least one” directly is messy. Compute P(none across both dependent draws), then take the complement.',
            computationHint: `P(no ${rank}) = (48/52)(47/51) = ${fracText(none)}, so P(≥1) = 1 − ${fracText(none)} = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['complement-rule', 'dependent-events'],
    },
    {
      id: 'both-six-given',
      type: 'fraction-question',
      title: 'Conditional + Complement',
      body: 'You roll 2 fair dice and someone tells you at least one of them is a six.',
      prompt: 'Given that, what is the probability that BOTH dice are sixes? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/11',
        explanation:
          'P(both six) = 1/36. P(at least one six) = 1 − (5/6)² = 11/36 (complement). Conditioning: (1/36) ÷ (11/36) = 1/11.',
        misconceptionTags: ['conditional-probability'],
      },
      feedback: {
        correct: 'Yes — (1/36) ÷ (11/36) = 1/11.',
        incorrect: 'Divide P(both six) by P(at least one six); get the latter via the complement.',
        hint: 'Restrict to the world where at least one six happened (use the complement for its probability), then ask what fraction of that is “both sixes.”',
        computationHint: 'P(both) = 1/36, P(≥1 six) = 11/36, so the conditional is (1/36)/(11/36) = 1/11.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('syn-bothsix', 2, 3)
        const denom = 6 ** n - 5 ** n
        const p = reduceFrac(1, denom)
        const allPhrase = n === 2 ? 'BOTH dice are' : `ALL ${n} dice are`
        return {
          body: `You roll ${n} fair dice and someone tells you at least one of them is a six.`,
          prompt: `Given that, what is the probability that ${allPhrase} sixes? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `P(all six) = 1/${6 ** n}. P(at least one six) = 1 − (5/6)^${n} = ${denom}/${6 ** n} (complement). Conditioning: (1/${6 ** n}) ÷ (${denom}/${6 ** n}) = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — the conditional works out to ${fracText(p)}.`,
            incorrect: 'Divide P(all six) by P(at least one six); get the latter via the complement.',
            hint: 'Restrict to the world where at least one six happened (use the complement for its probability), then ask what fraction of that is “all sixes.”',
            computationHint: `P(all six) = 1/${6 ** n}, P(≥1 six) = ${denom}/${6 ** n}, so the conditional is ${fracText(p)}.`,
          },
        }
      },
      concepts: ['conditional-probability', 'complement-rule'],
    },
    {
      id: 'expected-sixes-given',
      type: 'fraction-question',
      title: 'All Three at Once',
      body: 'The worked example’s sibling. You roll 2 fair dice and are told at least one is a six.',
      prompt: 'Given that, what is the expected number of sixes? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '12/11',
        explanation:
          'E[N] = 2 × 1/6 = 1/3 (linearity). P(N ≥ 1) = 1 − (5/6)² = 11/36 (complement). Since N = 0 adds nothing, E[N | N ≥ 1] = (1/3) ÷ (11/36) = 12/11.',
        misconceptionTags: ['synthesis'],
      },
      feedback: {
        correct: 'Yes — (1/3) ÷ (11/36) = 12/11. Linearity, complement, and conditioning together.',
        incorrect: 'Compute E[N] by linearity, P(N ≥ 1) by the complement, then divide.',
        hint: 'Find the unconditional expected sixes (linearity), the chance of the condition (complement), then divide the first by the second (conditioning).',
        computationHint: 'E[N] = 2 × 1/6 = 1/3; P(≥1) = 11/36; E[N | N≥1] = (1/3)/(11/36) = 12/11.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('syn-given', 2, 3)
        const p = expectedGivenAtLeastOne(n, { n: 1, d: 6 })
        const denom = 6 ** n - 5 ** n
        return {
          body: `The worked example’s sibling. You roll ${n} fair dice and are told at least one is a six.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `E[N] = ${n} × 1/6 (linearity). P(N ≥ 1) = 1 − (5/6)^${n} = ${denom}/${6 ** n} (complement). Since N = 0 adds nothing, E[N | N ≥ 1] = E[N] ÷ P(N ≥ 1) = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — it works out to ${fracText(p)}. Linearity, complement, and conditioning together.`,
            incorrect: 'Compute E[N] by linearity, P(N ≥ 1) by the complement, then divide.',
            hint: 'Find the unconditional expected sixes (linearity), the chance of the condition (complement), then divide the first by the second (conditioning).',
            computationHint: `E[N] = ${n} × 1/6; P(≥1) = ${denom}/${6 ** n}; divide to get ${fracText(p)}.`,
          },
        }
      },
      concepts: ['synthesis', 'linearity-expectation', 'complement-rule', 'conditional-probability'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Capstone Complete!',
      body: 'You combined all five tools — dependent events, conditional probability, the complement rule, linearity of expectation, and indicator variables — on problems that needed two or three at once. That recognition (which tools, in what order) is exactly what the hardest contest probability questions test. Keep practicing the mixed set to stay sharp.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
