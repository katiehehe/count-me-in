import type { Lesson } from './types'
import { sum, type Randomizer } from './randomize'

const bagDraw = (r: Randomizer): number[] =>
  r.sharedValue('ev-bag', () => {
    let vals = [2, 4, 9]
    for (let i = 0; i < 80; i++) {
      const candidate = [r.int(1, 9), r.int(1, 9), r.int(1, 9)]
      const total = sum(candidate)
      if (new Set(candidate).size === 3 && total % 3 === 0 && !candidate.includes(total / 3)) {
        vals = candidate
        break
      }
    }
    return vals
  })

export const expectedValueLesson: Lesson = {
  id: 'expected-value',
  title: 'Expected Value',
  description:
    'Turn a random payout into a single number: multiply each outcome by its probability, add them up, and decide whether a game is worth playing.',
  hook: 'A game costs $3 and pays the value of a die roll. Should you play?',
  estimatedMinutes: 11,
  prerequisites: ['probability-distributions'],
  concepts: ['expected-value'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'What Is Expected Value?',
      body: 'EXPECTED VALUE is the average outcome you would get by repeating a game many, many times. To compute it, multiply each possible payout by its probability, then add those products together. A normal average weights every value equally; expected value weights each value by how likely it is.',
      prompt: 'Expected value = the long-run average payout per play.',
      nextButtonLabel: 'Let’s build it up',
    },
    {
      id: 'average-simple',
      type: 'numeric-question',
      title: 'Just an Average',
      body: 'Start simple. A bag holds 3 equally likely slips worth $2, $4, and $9. You draw one at random. With equal chances, the expected value is just the ordinary average of the payouts.',
      prompt: 'What is the average value of a single draw, in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 5,
        tolerance: 0.01,
        explanation: '(2 + 4 + 9) ÷ 3 = 15 ÷ 3 = 5. The expected draw is worth $5.',
        misconceptionTags: ['expected-value'],
      },
      feedback: {
        correct: 'Yes! 15 ÷ 3 = $5 on average.',
        incorrect: 'Add the three payouts, then divide by 3.',
        hint: 'Each slip is equally likely, so no payout carries more weight than another — the expected value is just the plain average: pool every payout and split it evenly across the slips.',
        computationHint: '2 + 4 + 9 = 15, then 15 ÷ 3 = 5.',
      },
      randomize: (r) => {
        const vals = bagDraw(r)
        const total = sum(vals)
        const avg = total / 3
        return {
          body: `Start simple. A bag holds 3 equally likely slips worth $${vals[0]}, $${vals[1]}, and $${vals[2]}. You draw one at random. With equal chances, the expected value is just the ordinary average of the payouts.`,
          question: { correctAnswer: avg, explanation: `(${vals.join(' + ')}) ÷ 3 = ${total} ÷ 3 = ${avg}. The expected draw is worth $${avg}.` },
          feedback: {
            correct: `Yes! ${total} ÷ 3 = $${avg} on average.`,
            incorrect: 'Add the three payouts, then divide by 3.',
            hint: 'Each slip is equally likely, so no payout carries more weight than another — the expected value is just the plain average: pool every payout and split it evenly across the slips.',
            computationHint: `${vals.join(' + ')} = ${total}, then ${total} ÷ 3 = ${avg}.`,
          },
        }
      },
      concepts: ['expected-value'],
    },
    {
      id: 'meaning',
      type: 'multiple-choice',
      title: 'What It Means',
      body: 'You found that drawing one of $2, $4, $9 (equally likely) averages $5. Any single draw is $2, $4, or $9 — never exactly $5.',
      prompt: 'What does the expected value of $5 actually tell you?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'The average payout per draw over many, many draws',
          'The amount you win every single time',
          'The largest possible payout',
          'The most likely single payout',
        ],
        correctChoiceIndex: 0,
        explanation: 'Expected value is the long-run average, not any guaranteed single result.',
        misconceptionTags: ['expected-value-meaning'],
      },
      feedback: {
        correct: 'Right — it is the long-run average over many repetitions.',
        incorrect: 'Expected value is about the average across many plays, not one play.',
        choiceFeedback: {
          'The amount you win every single time': 'No single draw is $5 — it is the average across many draws.',
          'The largest possible payout': 'That would be $9. Expected value is an average, not a maximum.',
          'The most likely single payout': 'All three are equally likely here; $5 is their average.',
        },
        hint: 'Expected value describes the pattern across many repetitions, not the result of any one draw — picture stacking up thousands of draws and asking what each is worth on average.',
        computationHint: '2 × 1/3 + 4 × 1/3 + 9 × 1/3 = $5 — the figure each draw averages to over the long run, even though no single draw equals it.',
      },
      randomize: (r) => {
        const vals = bagDraw(r)
        const avg = sum(vals) / 3
        const max = Math.max(...vals)
        return {
          body: `You found that drawing one of $${vals[0]}, $${vals[1]}, $${vals[2]} (equally likely) averages $${avg}. Any single draw is $${vals[0]}, $${vals[1]}, or $${vals[2]} — never exactly $${avg}.`,
          prompt: `What does the expected value of $${avg} actually tell you?`,
          feedback: {
            choiceFeedback: {
              'The amount you win every single time': `No single draw is $${avg} — it is the average across many draws.`,
              'The largest possible payout': `That would be $${max}. Expected value is an average, not a maximum.`,
              'The most likely single payout': `All three are equally likely here; $${avg} is their average.`,
            },
            hint: 'Expected value describes the pattern across many repetitions, not the result of any one draw — picture stacking up thousands of draws and asking what each is worth on average.',
            computationHint: `${vals[0]} × 1/3 + ${vals[1]} × 1/3 + ${vals[2]} × 1/3 = $${avg} — the figure each draw averages to over the long run, even though no single draw equals it.`,
          },
        }
      },
      concepts: ['expected-value'],
    },
    {
      id: 'weighted-prize',
      type: 'numeric-question',
      title: 'Unequal Chances',
      body: 'A regular average treats every outcome as equally important. But since some outcomes are more likely than others, the average should be pulled heavier toward those more-likely outcomes — so we weight each payout by its probability. A raffle ticket wins $10 with probability 1/5, and wins $0 the rest of the time.',
      prompt: 'What is the expected payout of the ticket, in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 2,
        tolerance: 0.01,
        explanation: '10 × 1/5 + 0 × 4/5 = 2 + 0 = $2 expected.',
        misconceptionTags: ['expected-value'],
      },
      feedback: {
        correct: 'Yes! 10 × 1/5 = $2 expected payout.',
        incorrect: 'Multiply the $10 prize by its probability 1/5; the $0 outcome adds nothing.',
        hint: 'A payout only counts toward the average as often as it actually happens, so scale the prize down by its chance of winning — the $0 outcome contributes nothing to the weighted sum.',
        computationHint: '10 × 1/5 + 0 × 4/5 = 2 + 0 = $2.',
      },
      randomize: (r) => {
        const { prize, k, ev } = r.unique(
          'ev-weighted',
          () => {
            const denom = r.int(3, 6)
            const value = r.int(2, 5)
            return { prize: denom * value, k: denom, ev: value }
          },
          (v) => String(v.ev),
        )
        return {
          body: `A regular average treats every outcome as equally important. But since some outcomes are more likely than others, the average should be pulled heavier toward those more-likely outcomes — so we weight each payout by its probability. A raffle ticket wins $${prize} with probability 1/${k}, and wins $0 the rest of the time.`,
          question: { correctAnswer: ev, explanation: `${prize} × 1/${k} + 0 × ${k - 1}/${k} = ${ev} + 0 = $${ev} expected.` },
          feedback: {
            correct: `Yes! ${prize} × 1/${k} = $${ev} expected payout.`,
            incorrect: `Multiply the $${prize} prize by its probability 1/${k}; the $0 outcome adds nothing.`,
            hint: 'A payout only counts toward the average as often as it actually happens, so scale the prize down by its chance of winning — the $0 outcome contributes nothing to the weighted sum.',
            computationHint: `${prize} × 1/${k} + 0 × ${k - 1}/${k} = ${ev} + 0 = $${ev}.`,
          },
        }
      },
      concepts: ['expected-value'],
    },
    {
      id: 'game-6-third',
      type: 'numeric-question',
      title: 'Weighted Payout',
      body: 'A game pays $6 with probability 1/3 and $0 otherwise. Weight each payout by its probability.',
      prompt: 'What is the expected payout of this game, in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 2,
        tolerance: 0.01,
        explanation: '6 × 1/3 + 0 × 2/3 = $2.',
        misconceptionTags: ['expected-value'],
      },
      feedback: {
        correct: 'Right — 6 × 1/3 = $2.',
        incorrect: 'Multiply the $6 prize by its probability 1/3 (you only win it a third of the time).',
        hint: 'You collect the prize only a fraction of the time, so weight it by how often you actually win — the $0 losing outcome drops out of the weighted average entirely.',
        computationHint: '6 × 1/3 + 0 × 2/3 = $2.',
      },
      randomize: (r) => {
        const { prize, k, ev } = r.unique(
          'ev-weighted',
          () => {
            const denom = r.int(3, 6)
            const value = r.int(2, 5)
            return { prize: denom * value, k: denom, ev: value }
          },
          (v) => String(v.ev),
        )
        return {
          body: `A game pays $${prize} with probability 1/${k} and $0 otherwise. Weight each payout by its probability.`,
          question: { correctAnswer: ev, explanation: `${prize} × 1/${k} + 0 × ${k - 1}/${k} = $${ev}.` },
          feedback: {
            correct: `Right — ${prize} × 1/${k} = $${ev}.`,
            incorrect: `Multiply the $${prize} prize by its probability 1/${k} (you only win it 1 in ${k} of the time).`,
            hint: 'You collect the prize only a fraction of the time, so weight it by how often you actually win — the $0 losing outcome drops out of the weighted average entirely.',
            computationHint: `${prize} × 1/${k} + 0 × ${k - 1}/${k} = $${ev}.`,
          },
        }
      },
      concepts: ['expected-value'],
    },
    {
      id: 'die-ev',
      type: 'numeric-question',
      title: 'Rolling for Dollars',
      body: 'A fair die has faces 1–6, each with probability 1/6. A game pays you, in dollars, whatever the die shows. The expected payout is the average of all six equally likely payouts.',
      prompt: 'What is the expected payout of this game, in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 3.5,
        tolerance: 0.01,
        explanation: '(1+2+3+4+5+6) ÷ 6 = 21 ÷ 6 = 3.5.',
        misconceptionTags: ['expected-value'],
      },
      feedback: {
        correct: 'Correct! 21 ÷ 6 = $3.50 on average per roll.',
        incorrect: 'Sum 1 through 6 (that is 21), then divide by 6.',
        hint: 'Every face is equally likely, so each carries the same weight — the expected payout is simply the plain average across all six possible values.',
        computationHint: '1 + 2 + 3 + 4 + 5 + 6 = 21, then 21 ÷ 6 = 3.5.',
      },
      concepts: ['expected-value'],
    },
    {
      id: 'ten-sided-die',
      type: 'numeric-question',
      title: 'Would You Rather: d6 or d10?',
      body: 'You just found that a fair 6-sided die (faces $1–$6) has an expected payout of $3.50. Now picture a fair 10-sided die with faces $1–$10, each equally likely. In both games you win the dollar amount the die lands on.',
      prompt: 'What is the expected payout of the 10-sided die game, in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 5.5,
        tolerance: 0.01,
        explanation: '(1 + 2 + … + 10) ÷ 10 = 55 ÷ 10 = $5.50, which beats the d6’s $3.50.',
        misconceptionTags: ['expected-value'],
      },
      feedback: {
        correct:
          'Exactly — $5.50. Since $5.50 > $3.50, you’d rather roll the 10-sided die: its expected (average) outcome is higher, so it pays more in the long run.',
        incorrect: 'Add 1 through 10 (that is 55), then divide by 10.',
        hint: 'The ten faces are equally likely, so weight them evenly and average them — the same plain average as the d6, just spread across ten values instead of six.',
        computationHint: '1 + 2 + … + 10 = 55, then 55 ÷ 10 = 5.5.',
      },
      concepts: ['expected-value'],
    },
    {
      id: 'worth-it',
      type: 'multiple-choice',
      title: 'Should You Play?',
      body: 'A carnival game costs $3 to play. It pays you the value of one fair die roll in dollars, which you found has an expected payout of $3.50.',
      prompt: 'With an expected payout of $3.50 and a $3 cost, is the game worth playing in the long run?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Yes — expected payout ($3.50) is more than the $3 cost',
          'No — you lose money on average',
          'It is exactly break-even',
          'There is no way to tell',
        ],
        correctChoiceIndex: 0,
        explanation: 'Expected net = $3.50 − $3 = +$0.50 per play, so it is worth it long-run.',
        misconceptionTags: ['expected-value-decision'],
      },
      feedback: {
        correct: 'Right — expected net gain is $3.50 − $3 = +$0.50 per play.',
        incorrect: 'Compare the expected payout ($3.50) with the cost ($3).',
        choiceFeedback: {
          'No — you lose money on average': 'Actually $3.50 > $3, so you gain $0.50 per play on average.',
          'It is exactly break-even': 'Break-even would need an expected payout of exactly $3.',
        },
        hint: 'A game pays off in the long run when what you expect to collect on average outweighs what it costs to play — so compare the expected payout against the ticket price.',
        computationHint: '$3.50 expected payout − $3 cost = +$0.50 net per play, so it is worth playing.',
      },
      concepts: ['expected-value'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You discovered expected value: multiply each payout by its probability and add. It is the long-run average that tells you whether a game is worth playing.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
