import type { Lesson } from './types'
import type { Randomizer } from './randomize'

const combinedFace = (r: Randomizer) => r.sharedValue('combined-face', () => r.int(1, 6))
const combinedTrials = (r: Randomizer) => r.sharedValue('combined-trials', () => 12 * r.int(80, 120))

export const probabilityDistributionsLesson: Lesson = {
  id: 'probability-distributions',
  title: 'Probability & Distributions',
  description:
    'Simulate thousands of trials to see probability and distributions firsthand — watch random outcomes settle into predictable patterns.',
  hook: 'Roll a die 1000 times — what pattern appears?',
  estimatedMinutes: 10,
  prerequisites: ['independent-events'],
  concepts: ['probability', 'independent-events'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Let’s Just Roll',
      body: 'Before any formulas, let’s build intuition by doing. A random game is easiest to understand by repeating it many, many times and watching what happens on average.',
      prompt: 'Big idea: do something random thousands of times, and patterns appear.',
      nextButtonLabel: 'Roll some dice',
    },
    {
      id: 'sim-dice',
      type: 'simulation',
      title: 'Roll 1000 Dice',
      body: 'Here is a fair 6-sided die. Roll it 1000 times and look at how often each face comes up. Roll again a few times — each run looks a little different, but the bars always settle near an equal 1-in-6 share.',
      simulationConfig: {
        faces: [1, 2, 3, 4, 5, 6],
        rolls: 1000,
      },
      feedback: {
        correct:
          'Each face shows up roughly 1/6 of the time — about 167 out of 1000 rolls. The bars are never exactly equal, but over many rolls they even out. That 1/6 is the probability of each face.',
        incorrect: '',
        hint: 'A fair die gives every face an equal share, so the six probabilities are identical and must add up to 1 — that makes each face’s share 1 out of 6. Watch the bars hover around that share.',
        computationHint: '1 ÷ 6 ≈ 0.167, so over 1000 rolls each face lands about 0.167 × 1000 ≈ 167 times.',
      },
      concepts: ['probability'],
    },
    {
      id: 'sim-expected-count',
      type: 'numeric-question',
      title: 'How Many Do You Expect?',
      body: 'You saw that each face of a fair 6-sided die comes up about 1/6 of the time. So if you roll many times, you can predict roughly how many of each face to expect.',
      prompt: 'If you roll a fair 6-sided die 600 times, about how many 4s do you expect?',
      question: {
        inputType: 'numeric',
        correctAnswer: 100,
        tolerance: 0,
        explanation: 'Each face has probability 1/6, so 600 × 1/6 = 100 fours expected.',
        misconceptionTags: ['probability'],
      },
      feedback: {
        correct: 'Yes! 600 × 1/6 = 100. Expected count = number of trials × probability.',
        incorrect: 'Multiply the number of rolls by the probability of a 4: 600 × 1/6.',
        hint: 'One face is just one outcome out of six equally likely ones, so its probability is its share of the whole. The expected count applies that single-face share to every roll.',
        computationHint: '600 × 1/6 = 100 fours.',
      },
      randomize: (r) => {
        const expected = r.int(90, 130)
        const rolls = expected * 6
        const face = r.int(1, 6)
        return {
          prompt: `If you roll a fair 6-sided die ${rolls} times, about how many ${face}s do you expect?`,
          question: { correctAnswer: expected, explanation: `Each face has probability 1/6, so ${rolls} × 1/6 = ${expected} ${face}s expected.` },
          feedback: {
            correct: `Yes! ${rolls} × 1/6 = ${expected}. Expected count = number of trials × probability.`,
            incorrect: `Multiply the number of rolls by the probability of a ${face}: ${rolls} × 1/6.`,
            hint: 'One face is just one outcome out of six equally likely ones, so its probability is its share of the whole. The expected count applies that single-face share to every roll.',
            computationHint: `${rolls} × 1/6 = ${expected} ${face}s.`,
          },
        }
      },
      concepts: ['probability'],
    },
    {
      id: 'sim-combined',
      type: 'combined-experiment',
      title: 'Dice AND Coin Together',
      body: 'Now combine two independent events per trial: roll a die and flip a coin. We are hunting for trials that are BOTH a 4 AND Tails. From the Independent Events lesson, P(4 and Tails) = 1/6 × 1/2 = 1/12. Run many batches and watch how the hit counts scatter around the expected number.',
      combinedExperimentConfig: {
        trials: 1200,
        dieFaces: 6,
        targetFace: 4,
        coinLabels: ['Heads', 'Tails'],
        targetCoinIndex: 1,
      },
      feedback: {
        correct:
          'About 1 in 12 trials is “4 and Tails”, so over 1200 trials you expect roughly 1200 ÷ 12 = 100. Each batch bounces around, but the counts form a distribution centered on 100.',
        incorrect: '',
        hint: 'Two independent results both happening has a probability equal to the product of their separate shares, and the expected number of hits applies that combined share to every trial.',
        computationHint: '1/6 × 1/2 = 1/12, so 1200 × 1/12 = 100 hits.',
      },
      randomize: (r) => {
        const face = combinedFace(r)
        const trials = combinedTrials(r)
        const expected = trials / 12
        return {
          body: `Now combine two independent events per trial: roll a die and flip a coin. We are hunting for trials that are BOTH a ${face} AND Tails. From the Independent Events lesson, P(${face} and Tails) = 1/6 × 1/2 = 1/12. Run many batches and watch how the hit counts scatter around the expected number.`,
          combinedExperimentConfig: { trials, targetFace: face },
          feedback: {
            correct: `About 1 in 12 trials is “${face} and Tails”, so over ${trials} trials you expect roughly ${trials} ÷ 12 = ${expected}. Each batch bounces around, but the counts form a distribution centered on ${expected}.`,
            hint: 'Two independent results both happening has a probability equal to the product of their separate shares, and the expected number of hits applies that combined share to every trial.',
            computationHint: `1/6 × 1/2 = 1/12, so ${trials} × 1/12 = ${expected} hits.`,
          },
        }
      },
      concepts: ['probability', 'independent-events'],
    },
    {
      id: 'combined-count',
      type: 'numeric-question',
      title: 'Predict the Combined Count',
      body: 'Each trial rolls a die and flips a coin. A “win” is rolling a 4 AND flipping Tails, which happens with probability 1/6 × 1/2 = 1/12.',
      prompt: 'Over 1200 trials, about how many do you expect to be 4 AND Tails?',
      question: {
        inputType: 'numeric',
        correctAnswer: 100,
        tolerance: 0,
        explanation: 'P(4 and Tails) = 1/12, so 1200 × 1/12 = 100 expected wins.',
        misconceptionTags: ['probability', 'independent-events'],
      },
      feedback: {
        correct: 'Yes! 1200 ÷ 12 = 100 — expected count = trials × probability.',
        incorrect: 'P(4 and Tails) = 1/6 × 1/2 = 1/12. Then 1200 × 1/12.',
        hint: 'A win needs both independent results, so multiply their separate shares to get the win’s probability, then apply that share to all the trials.',
        computationHint: '1/6 × 1/2 = 1/12, so 1200 × 1/12 = 100 wins.',
      },
      randomize: (r) => {
        const face = combinedFace(r)
        const trials = combinedTrials(r)
        const expected = trials / 12
        return {
          body: `Each trial rolls a die and flips a coin. A “win” is rolling a ${face} AND flipping Tails, which happens with probability 1/6 × 1/2 = 1/12.`,
          prompt: `Over ${trials} trials, about how many do you expect to be ${face} AND Tails?`,
          question: { correctAnswer: expected, explanation: `P(${face} and Tails) = 1/12, so ${trials} × 1/12 = ${expected} expected wins.` },
          feedback: {
            correct: `Yes! ${trials} ÷ 12 = ${expected} — expected count = trials × probability.`,
            incorrect: `P(${face} and Tails) = 1/6 × 1/2 = 1/12. Then ${trials} × 1/12.`,
            hint: 'A win needs both independent results, so multiply their separate shares to get the win’s probability, then apply that share to all the trials.',
            computationHint: `1/6 × 1/2 = 1/12, so ${trials} × 1/12 = ${expected} wins.`,
          },
        }
      },
      concepts: ['probability', 'independent-events'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You saw probability in action: repeat a random trial many times and the outcomes settle into a predictable distribution. The fraction of trials with an outcome approaches its probability, and the count approaches trials × probability. Next, you’ll turn these payouts into a single number: expected value.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
