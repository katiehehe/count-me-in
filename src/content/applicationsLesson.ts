import type { Lesson } from './types'
import { binomialProb, choose, complement, fracText, hyperProb } from './probabilityMath'

const HAND = {
  total: choose(52, 5),
  aces: choose(4, 2),
  rest: choose(48, 3),
}
const HAND_FAV = HAND.aces * HAND.rest

export const applicationsLesson: Lesson = {
  id: 'counting-probability-applications',
  title: 'Counting + Probability Applications',
  description:
    'The workhorse move in applied probability: count the favorable outcomes and the total with combinatorics, then divide to get the probability.',
  hook: 'Deal 5 cards. What’s the chance of exactly 2 aces?',
  estimatedMinutes: 13,
  prerequisites: ['contest-problems'],
  concepts: [
    'applied-probability',
    'combinations',
    'counting-principle',
    'complement-rule',
    'binomial-coin',
  ],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Favorable Over Total',
      body: 'Most everyday probability questions reduce to one move: when outcomes are equally likely,\n\n$$P(\\text{event}) = \\frac{\\#\\text{ favorable outcomes}}{\\#\\text{ total outcomes}}.$$\n\nThe work is COUNTING both numbers with the tools you already know — the counting principle, combinations, the complement, and so on. Count the top, count the bottom, divide.',
      prompt: 'Count the favorable, count the total (with combinations), then divide.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'You’re dealt 5 cards from a standard deck. Guess the probability of getting exactly 2 aces — a percent is fine.',
        answer: '4%',
        revealNote: 'about 1 in 25',
      },
    },
    {
      id: 'worked-cards',
      type: 'worked-example',
      title: 'Watch Me Count Favorable ÷ Total',
      body: 'Let me find the probability of exactly 2 aces in a 5-card hand.',
      workedExampleConfig: {
        kind: 'steps',
        voice: 'nova',
        steps: {
          lines: [
            { latex: `\\text{total hands} = \\binom{52}{5} = ${HAND.total}`, caption: 'count the total' },
            {
              latex: `\\text{favorable} = \\binom{4}{2}\\binom{48}{3} = ${HAND.aces} \\cdot ${HAND.rest} = ${HAND_FAV}`,
              caption: 'count the favorable (2 aces × 3 non-aces)',
            },
            {
              latex: `P = \\dfrac{${HAND_FAV}}{${HAND.total}}`,
              caption: 'favorable ÷ total',
            },
            { latex: `P \\approx 0.040 \\text{ (about 4\\%)}`, caption: 'a little under 1 in 25' },
          ],
        },
        script: [
          {
            say: 'First the total: the number of 5-card hands is fifty-two choose five — about 2.6 million.',
            highlight: 'step-0',
          },
          {
            say: 'Now the favorable hands. We need exactly two aces, so choose two of the four aces, AND three of the forty-eight non-aces, and multiply: four-choose-two times forty-eight-choose-three is one hundred three thousand, seven hundred seventy-six.',
            highlight: 'step-1',
          },
          {
            say: 'The probability is favorable over total: one hundred three thousand over two point six million.',
            highlight: 'step-2',
          },
          {
            say: 'That works out to about four percent — a little under one in twenty-five. Count the top, count the bottom, divide.',
            highlight: 'step-3',
          },
        ],
      },
      concepts: ['applied-probability', 'combinations', 'counting-principle'],
    },
    {
      id: 'explore-hyper',
      type: 'hyper-build',
      title: 'Build the Favorable Count',
      body: 'A bag holds 3 red and 2 blue marbles; you draw 2.\n\nUse −/+ to set how many drawn are red, and watch the favorable count and probability update. Aim for 2 red.',
      hyperBuildConfig: { total: 5, special: 3, draw: 2, target: 2, specialLabel: 'red', otherLabel: 'blue' },
      feedback: {
        correct:
          'Both red: $\\binom{3}{2}\\binom{2}{0} = 3$ favorable out of $\\binom{5}{2} = 10$, so $P = \\tfrac{3}{10}$.',
        incorrect: '',
        hint: 'Favorable = choose the reds you want × choose the rest from the blues. Total = choose 2 of all 5.',
        computationHint: 'For 2 red: $\\binom{3}{2}\\binom{2}{0} = 3$, over $\\binom{5}{2} = 10$, so $\\tfrac{3}{10}$.',
      },
      concepts: ['applied-probability', 'combinations'],
    },
    {
      id: 'marbles-prob',
      type: 'fraction-question',
      title: 'Exactly One Red',
      body: 'Same bag: 3 red and 2 blue marbles, draw 2.',
      prompt: 'What is the probability of drawing exactly 1 red? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '3/5',
        explanation:
          'Favorable: $\\binom{3}{1}\\binom{2}{1} = 6$; total $\\binom{5}{2} = 10$; so $P = \\tfrac{6}{10} = \\tfrac{3}{5}$.',
        misconceptionTags: ['applied-probability', 'combinations'],
      },
      feedback: {
        correct: 'Yes — $\\tfrac{6}{10} = \\tfrac{3}{5}$.',
        incorrect: 'Choose 1 of 3 reds and 1 of 2 blues for the favorable count, over $\\binom{5}{2}$.',
        hint: 'Favorable = (ways to pick 1 red) × (ways to pick 1 blue). Total = choose 2 of 5.',
        computationHint: '$\\binom{3}{1}\\binom{2}{1} = 6$ over $\\binom{5}{2} = 10$ → $\\tfrac{3}{5}$.',
      },
      randomize: (r) => {
        const red = r.uniqueInt('mp-red', 2, 4)
        const blue = r.uniqueInt('mp-blue', 2, 3)
        const p = hyperProb(red + blue, red, 2, 1)
        return {
          body: `Same bag: ${red} red and ${blue} blue marbles, draw 2.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Favorable: $\\binom{${red}}{1}\\binom{${blue}}{1} = ${red * blue}$; total $\\binom{${red + blue}}{2} = ${choose(red + blue, 2)}$; so $P = ${fracText(p)}$.`,
          },
          feedback: {
            correct: `Yes — $P = ${fracText(p)}$.`,
            incorrect: `Choose 1 of ${red} reds and 1 of ${blue} blues, over $\\binom{${red + blue}}{2}$.`,
            hint: 'Favorable = (ways to pick 1 red) × (ways to pick 1 blue). Total = choose 2 of all.',
            computationHint: `$\\binom{${red}}{1}\\binom{${blue}}{1} = ${red * blue}$ over $\\binom{${red + blue}}{2} = ${choose(red + blue, 2)}$ → $${fracText(p)}$.`,
          },
        }
      },
      concepts: ['applied-probability', 'combinations'],
    },
    {
      id: 'committee-prob',
      type: 'fraction-question',
      title: 'All-Women Committee',
      body: 'A 3-person committee is chosen at random from 4 men and 3 women.',
      prompt: 'What is the probability the committee is all women? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '1/35',
        explanation:
          'Favorable: $\\binom{3}{3} = 1$ all-women committee; total $\\binom{7}{3} = 35$; so $P = \\tfrac{1}{35}$.',
        misconceptionTags: ['applied-probability', 'combinations'],
      },
      feedback: {
        correct: 'Yes — $\\tfrac{1}{35}$.',
        incorrect: 'Favorable = committees using only the women; total = all 3-person committees.',
        hint: 'How many all-women committees are there? Divide by the total number of 3-person committees.',
        computationHint: '$\\binom{3}{3} = 1$ over $\\binom{7}{3} = 35$ → $\\tfrac{1}{35}$.',
      },
      randomize: (r) => {
        const women = r.uniqueInt('cp-w', 3, 4)
        const men = r.uniqueInt('cp-m', 3, 5)
        const p = hyperProb(women + men, women, women, women)
        return {
          body: `A ${women}-person committee is chosen at random from ${men} men and ${women} women.`,
          prompt: 'What is the probability the committee is all women? Enter your answer as a fraction.',
          question: {
            correctAnswer: fracText(p),
            explanation: `Favorable: $\\binom{${women}}{${women}} = 1$ all-women committee; total $\\binom{${women + men}}{${women}} = ${choose(women + men, women)}$; so $P = ${fracText(p)}$.`,
          },
          feedback: {
            correct: `Yes — $${fracText(p)}$.`,
            incorrect: 'Favorable = committees using only the women; total = all committees of that size.',
            hint: 'How many all-women committees are there? Divide by the total number of committees.',
            computationHint: `$\\binom{${women}}{${women}} = 1$ over $\\binom{${women + men}}{${women}} = ${choose(women + men, women)}$ → $${fracText(p)}$.`,
          },
        }
      },
      concepts: ['applied-probability', 'combinations'],
    },
    {
      id: 'defective',
      type: 'fraction-question',
      title: 'A Clean Sample',
      body: 'A box of 8 phone chargers has 2 defective ones. A tester grabs 3 at random.',
      prompt: 'What is the probability that none of the 3 is defective? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '5/14',
        explanation:
          'Favorable: pick all 3 from the 6 good ones, $\\binom{6}{3} = 20$; total $\\binom{8}{3} = 56$; so $P = \\tfrac{20}{56} = \\tfrac{5}{14}$.',
        misconceptionTags: ['applied-probability', 'combinations'],
      },
      feedback: {
        correct: 'Yes — $\\tfrac{20}{56} = \\tfrac{5}{14}$.',
        incorrect: 'Favorable = choosing all 3 from the good ones; total = choosing any 3.',
        hint: '“None defective” means all 3 come from the good parts. Count those, over all ways to grab 3.',
        computationHint: '$\\binom{6}{3} = 20$ over $\\binom{8}{3} = 56$ → $\\tfrac{5}{14}$.',
      },
      randomize: (r) => {
        const N = r.uniqueInt('df-n', 8, 12)
        const def = r.uniqueInt('df-d', 2, 3)
        const p = hyperProb(N, def, 3, 0)
        return {
          body: `A box of ${N} phone chargers has ${def} defective ones. A tester grabs 3 at random.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Favorable: all 3 from the ${N - def} good ones, $\\binom{${N - def}}{3} = ${choose(N - def, 3)}$; total $\\binom{${N}}{3} = ${choose(N, 3)}$; so $P = ${fracText(p)}$.`,
          },
          feedback: {
            correct: `Yes — $${fracText(p)}$.`,
            incorrect: 'Favorable = choosing all 3 from the good ones; total = choosing any 3.',
            hint: '“None defective” means all 3 come from the good parts. Count those, over all ways to grab 3.',
            computationHint: `$\\binom{${N - def}}{3} = ${choose(N - def, 3)}$ over $\\binom{${N}}{3} = ${choose(N, 3)}$ → $${fracText(p)}$.`,
          },
        }
      },
      concepts: ['applied-probability', 'combinations'],
    },
    {
      id: 'at-least-one',
      type: 'fraction-question',
      title: 'At Least One Ace',
      body: 'You’re dealt a 2-card hand. “At least one” is a flag for the complement.',
      prompt: 'What is the probability of at least one ace in a 2-card hand? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '33/221',
        explanation:
          'Complement: P(no ace) $= \\dfrac{\\binom{48}{2}}{\\binom{52}{2}} = \\dfrac{1128}{1326} = \\tfrac{188}{221}$, so P(at least one) $= 1 - \\tfrac{188}{221} = \\tfrac{33}{221}$.',
        misconceptionTags: ['applied-probability', 'complement-rule'],
      },
      feedback: {
        correct: 'Yes — $1 - \\tfrac{188}{221} = \\tfrac{33}{221}$.',
        incorrect: 'Find P(no ace) by choosing both cards from the 48 non-aces, then subtract from 1.',
        hint: '“At least one” → take 1 minus P(no aces). Count the no-ace hands over all hands.',
        computationHint: 'P(no ace) $= \\binom{48}{2}/\\binom{52}{2} = \\tfrac{188}{221}$; so $1 - \\tfrac{188}{221} = \\tfrac{33}{221}$.',
      },
      randomize: (r) => {
        const h = r.uniqueInt('alo-h', 2, 3)
        const none = hyperProb(52, 4, h, 0)
        const p = complement(none)
        return {
          prompt: `What is the probability of at least one ace in a ${h}-card hand? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Complement: P(no ace) $= \\dfrac{\\binom{48}{${h}}}{\\binom{52}{${h}}} = ${fracText(none)}$, so P(at least one) $= 1 - ${fracText(none)} = ${fracText(p)}$.`,
          },
          feedback: {
            correct: `Yes — $1 - ${fracText(none)} = ${fracText(p)}$.`,
            incorrect: `Find P(no ace) by choosing all ${h} cards from the 48 non-aces, then subtract from 1.`,
            hint: '“At least one” → take 1 minus P(no aces). Count the no-ace hands over all hands.',
            computationHint: `P(no ace) $= \\binom{48}{${h}}/\\binom{52}{${h}} = ${fracText(none)}$; so $1 - ${fracText(none)} = ${fracText(p)}$.`,
          },
        }
      },
      concepts: ['applied-probability', 'complement-rule'],
    },
    {
      id: 'binomial-app',
      type: 'fraction-question',
      title: 'Repeated Trials',
      body: 'When the same trial repeats with replacement, reach for the binomial. A player makes each free throw with probability $\\tfrac{2}{3}$.',
      prompt: 'In 3 free throws, what is the probability of making exactly 2? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '4/9',
        explanation:
          'Binomial: $\\binom{3}{2}\\left(\\tfrac{2}{3}\\right)^2\\left(\\tfrac{1}{3}\\right) = 3 \\cdot \\tfrac{4}{9} \\cdot \\tfrac{1}{3} = \\tfrac{4}{9}$.',
        misconceptionTags: ['applied-probability', 'binomial-coin'],
      },
      feedback: {
        correct: 'Yes — $\\tfrac{4}{9}$.',
        incorrect: 'Use the binomial: $\\binom{3}{2}p^2(1-p)$ with $p = \\tfrac{2}{3}$.',
        hint: 'Same trial, repeated, with a fixed success chance → binomial. Choose which 2 of 3 are makes, times the probability of one such sequence.',
        computationHint: '$\\binom{3}{2}(2/3)^2(1/3) = 3 \\cdot \\tfrac{4}{9} \\cdot \\tfrac{1}{3} = \\tfrac{4}{9}$.',
      },
      randomize: (r) => {
        const pn = r.uniqueInt('ba-p', 1, 2)
        const prob = { n: pn, d: 3 }
        const p = binomialProb(3, 2, prob)
        return {
          body: `When the same trial repeats with replacement, reach for the binomial. A player makes each free throw with probability $\\tfrac{${pn}}{3}$.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Binomial: $\\binom{3}{2}\\left(\\tfrac{${pn}}{3}\\right)^2\\left(\\tfrac{${3 - pn}}{3}\\right) = ${fracText(p)}$.`,
          },
          feedback: {
            correct: `Yes — $${fracText(p)}$.`,
            incorrect: `Use the binomial: $\\binom{3}{2}p^2(1-p)$ with $p = \\tfrac{${pn}}{3}$.`,
            hint: 'Same trial, repeated, with a fixed success chance → binomial. Choose which 2 of 3 are makes, times one sequence’s probability.',
            computationHint: `$\\binom{3}{2}(${pn}/3)^2(${3 - pn}/3) = ${fracText(p)}$.`,
          },
        }
      },
      concepts: ['applied-probability', 'binomial-coin'],
    },
    {
      id: 'method-mc',
      type: 'multiple-choice',
      title: 'The Workhorse Move',
      body: 'You want a probability and the outcomes are equally likely.',
      prompt: 'What is the right setup?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Count the favorable outcomes and the total outcomes (each with combinatorics), then divide',
          'Just count the favorable outcomes',
          'Add the favorable and total counts',
          'Multiply the favorable count by the total count',
        ],
        correctChoiceIndex: 0,
        explanation:
          'With equally likely outcomes, $P = \\dfrac{\\#\\text{ favorable}}{\\#\\text{ total}}$. The skill is counting BOTH with the right tool — combinations, the complement, the binomial, and so on.',
        misconceptionTags: ['applied-probability'],
      },
      feedback: {
        correct: 'Right — favorable ÷ total, with each count done carefully.',
        incorrect: 'A probability is a ratio: favorable over total.',
        choiceFeedback: {
          'Just count the favorable outcomes':
            'A count isn’t a probability — you must divide by the total number of outcomes.',
          'Add the favorable and total counts': 'Probability is a ratio, not a sum.',
        },
        hint: 'A probability is always between 0 and 1 — which operation on the two counts gives that?',
        computationHint: '$P = \\dfrac{\\#\\text{ favorable}}{\\#\\text{ total}}$ — divide, after counting each part.',
      },
      concepts: ['applied-probability', 'combinations'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You put the whole course to work: $P = \\dfrac{\\#\\text{ favorable}}{\\#\\text{ total}}$, counting each part with combinations, the counting principle, the complement, or the binomial.\n\nCard hands, committees, defective batches, and “at least one” questions all yield to the same move.\n\nFind the favorable, find the total, divide — then reduce.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
