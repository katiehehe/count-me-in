import type { Lesson } from './types'
import { weightedValue } from './probabilityMath'

/** Expected winnings of a single-prize game: payoff `prize` w.p. 1/k, else $0. */
const winnings = (prize: number, k: number): number => {
  const ev = weightedValue([prize, 0], [{ n: 1, d: k }, { n: k - 1, d: k }])
  return ev.n / ev.d
}

export const expectedValueApplicationsLesson: Lesson = {
  id: 'expected-value-applications',
  title: 'Expected Value Applications',
  description:
    'Put expected value to work: weigh payoffs against costs, compare options, price a fair bet, and decide whether a game is worth playing.',
  hook: 'A $3 raffle ticket pays $100 on a 1-in-50 shot. Should you buy it?',
  estimatedMinutes: 12,
  prerequisites: ['counting-probability-applications'],
  concepts: ['decision-ev', 'expected-value', 'linearity-expectation', 'indicator-variables'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Deciding with Expected Value',
      body: 'You already know EXPECTED VALUE: weight each outcome by its probability and add it up — $E = \\sum (\\text{value} \\times \\text{prob})$.\n\nThat one number is the long-run AVERAGE per play, which makes it the perfect tool for deciding whether a bet, a game, or a risk is worth taking.\n\nThe move is always the same: find the expected value of what you GET, then compare it to what it COSTS.\n\n$$E[\\text{net}] = E[\\text{payoff}] - \\text{cost}$$\n\nLet the sign of that difference make the call — positive means play, negative means walk away.',
      prompt:
        'Decision rule: a game is worth it in the long run exactly when its expected payoff beats the cost, i.e. when the net expected value $E[\\text{net}]$ is positive.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'A raffle ticket wins $100 with probability 1/50, and nothing otherwise. Before worrying about the price, guess the expected winnings per ticket, in dollars.',
        answer: 2,
      },
    },
    {
      id: 'worked-raffle',
      type: 'worked-example',
      title: 'Watch Me Decide',
      body: 'Let me work the raffle out loud — expected winnings first, then compare to the cost.',
      workedExampleConfig: {
        kind: 'steps',
        voice: 'nova',
        steps: {
          lines: [
            {
              latex: '\\$100 \\text{ w.p. } \\tfrac{1}{50}, \\quad \\$0 \\text{ w.p. } \\tfrac{49}{50}',
              caption: 'the two payoffs and their chances',
            },
            {
              latex: 'E[\\text{win}] = 100 \\cdot \\tfrac{1}{50} + 0 \\cdot \\tfrac{49}{50} = \\$2',
              caption: 'weight each payoff by its probability',
            },
            {
              latex: 'E[\\text{net}] = \\$2 - \\$3 = -\\$1',
              caption: 'subtract the $3 ticket cost',
            },
            {
              latex: '-\\$1 < 0 \\;\\Rightarrow\\; \\text{skip it}',
              caption: 'a negative average means a long-run loss',
            },
          ],
        },
        script: [
          {
            say: 'A raffle ticket costs three dollars. It pays one hundred dollars if you win, which happens with probability one in fifty, and nothing the other forty-nine times out of fifty.',
            highlight: 'step-0',
          },
          {
            say: 'Expected winnings weight each payoff by its chance. One hundred dollars times one fiftieth is two dollars; the zero payoff adds nothing. So on average a ticket gives back two dollars.',
            highlight: 'step-1',
          },
          {
            say: 'But the ticket costs three dollars. Net expected value is what you get minus what you pay: two dollars minus three dollars is negative one dollar per ticket.',
            highlight: 'step-2',
          },
          {
            say: 'Negative one dollar means that, averaged over many tickets, you lose a dollar each time, so the decision is to skip it. Notice the break-even price would be two dollars: pay more than that and the raffle is working against you.',
            highlight: 'step-3',
          },
        ],
      },
      concepts: ['decision-ev', 'expected-value'],
    },
    {
      id: 'simulate',
      type: 'expected-value-sim',
      title: 'Why It Is the Long-Run Average',
      body: 'Every decision in this lesson rests on one fact: the expected value is the AVERAGE payoff per play once you play many times. Here is a simple game — you win the dollar value shown on a fair 6-sided die, so its expected value is (1 + 2 + 3 + 4 + 5 + 6) ÷ 6 = $3.50. Roll a few times and the running average jumps around; auto-roll it hundreds of times and the line settles right onto $3.50.',
      expectedValueSimConfig: { sides: 6 },
      feedback: {
        correct:
          'That is the law of large numbers: one roll is unpredictable, but average enough of them and the result locks onto the expected value of $3.50. That long-run average is exactly the number you weigh against a cost when you decide.',
        incorrect: '',
        hint: 'Each face 1–6 is equally likely, so the balance point sits dead center. Keep rolling and watch the blue line hug the dashed line.',
        computationHint:
          '(1 + 2 + 3 + 4 + 5 + 6) ÷ 6 = 21 ÷ 6 = 3.5, the value the running average converges to. Shortcut: (lowest + highest) ÷ 2 = (1 + 6) ÷ 2 = 3.5.',
      },
      concepts: ['expected-value'],
    },
    {
      id: 'expected-winnings',
      type: 'numeric-question',
      title: 'Expected Winnings',
      body: 'A raffle pays $100 with probability 1/50 and $0 the rest of the time.',
      prompt: 'What are the expected winnings per ticket, in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 2,
        tolerance: 0.01,
        explanation:
          'Weight the payoff by its probability: 100 × 1/50 + 0 = $2. That weighted average is the expected winnings.',
        misconceptionTags: ['expected-value'],
      },
      feedback: {
        correct: 'Yes — 100 × 1/50 = $2 in expected winnings.',
        incorrect: 'Multiply the $100 prize by its chance 1/50; the $0 outcome adds nothing.',
        hint: 'Winnings only count as often as they actually happen, so scale the prize by its probability — the losing $0 outcome contributes nothing to the average.',
        computationHint: '100 × 1/50 + 0 × 49/50 = $2.',
      },
      randomize: (r) => {
        const { prize, k } = r.unique(
          'eva-win',
          () => {
            const k = r.pick([20, 25, 50])
            return { prize: k * r.int(2, 4), k }
          },
          (x) => `${x.prize}/${x.k}`,
        )
        const ans = winnings(prize, k)
        return {
          body: `A raffle pays $${prize} with probability 1/${k} and $0 the rest of the time.`,
          question: {
            correctAnswer: ans,
            explanation: `Weight the payoff by its probability: ${prize} × 1/${k} + 0 = $${ans}. That weighted average is the expected winnings.`,
          },
          feedback: {
            correct: `Yes — ${prize} × 1/${k} = $${ans} in expected winnings.`,
            incorrect: `Multiply the $${prize} prize by its chance 1/${k}; the $0 outcome adds nothing.`,
            hint: 'Winnings only count as often as they actually happen, so scale the prize by its probability — the losing $0 outcome contributes nothing to the average.',
            computationHint: `${prize} × 1/${k} + 0 × ${k - 1}/${k} = $${ans}.`,
          },
        }
      },
      concepts: ['expected-value', 'decision-ev'],
    },
    {
      id: 'fair-price',
      type: 'numeric-question',
      title: 'A Fair Price',
      body: 'A raffle pays $120 with probability 1/30 and nothing otherwise.',
      prompt: 'What one-time ticket price makes this raffle FAIR (break-even), in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 4,
        tolerance: 0.01,
        explanation:
          'A fair price equals the expected winnings: 120 × 1/30 = $4. Pay more than $4 and the raffle has an edge on you.',
        misconceptionTags: ['decision-ev'],
      },
      feedback: {
        correct: 'Right — a fair price is the expected winnings, $4.',
        incorrect: 'Find the expected winnings first: 120 × 1/30.',
        hint: 'A price is fair when, on average, you get back exactly what you pay — so the break-even price is just the expected winnings.',
        computationHint: 'Expected winnings = 120 × 1/30 = $4, and that is the fair price.',
      },
      randomize: (r) => {
        const { prize, k } = r.unique(
          'eva-fair',
          () => {
            const k = r.pick([10, 20, 30])
            return { prize: k * r.int(3, 5), k }
          },
          (x) => `${x.prize}/${x.k}`,
        )
        const ans = winnings(prize, k)
        return {
          body: `A raffle pays $${prize} with probability 1/${k} and nothing otherwise.`,
          question: {
            correctAnswer: ans,
            explanation: `A fair price equals the expected winnings: ${prize} × 1/${k} = $${ans}. Pay more than $${ans} and the raffle has an edge on you.`,
          },
          feedback: {
            correct: `Right — a fair price is the expected winnings, $${ans}.`,
            incorrect: `Find the expected winnings first: ${prize} × 1/${k}.`,
            hint: 'A price is fair when, on average, you get back exactly what you pay — so the break-even price is just the expected winnings.',
            computationHint: `Expected winnings = ${prize} × 1/${k} = $${ans}, and that is the fair price.`,
          },
        }
      },
      concepts: ['decision-ev', 'expected-value'],
    },
    {
      id: 'compare-options',
      type: 'multiple-choice',
      title: 'Pick the Better Game',
      body: 'Both games cost the same to play. Game A pays $10 with probability 1/2; Game B pays $12 with probability 1/3.',
      prompt: 'Which game has the higher expected value — the better long-run choice?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Game A — $5 expected',
          'Game B — $4 expected',
          'They are equal',
          'It cannot be decided',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Game A has the higher expected value ($5 vs $4), so it is the better long-run choice. The decision rule is simply: pick the higher EV.',
        misconceptionTags: ['decision-ev'],
      },
      feedback: {
        correct: 'Right — Game A averages $5 per play versus $4 for Game B.',
        incorrect: 'Compute each EV (payoff × probability) and pick the larger one.',
        choiceFeedback: {
          'Game B — $4 expected': 'Game B averages 12 × 1/3 = $4, which is less than Game A’s $5.',
          'They are equal': 'They differ: Game A is 10 × 1/2 = $5, Game B is 12 × 1/3 = $4.',
          'It cannot be decided': 'You can decide — compare the two expected values directly.',
        },
        hint: 'Turn each game into a single number by weighting its payoff by its probability, then take the bigger one.',
        computationHint: 'Game A: 10 × 1/2 = $5. Game B: 12 × 1/3 = $4. Since $5 > $4, choose A.',
      },
      randomize: (r) => {
        const a = r.int(4, 7)
        let b = r.int(3, 7)
        while (b === a) b = r.int(3, 7)
        const payA = 2 * a
        const payB = 3 * b
        const hi = Math.max(a, b)
        const aWins = a > b
        const choiceA = `Game A — $${a} expected`
        const choiceB = `Game B — $${b} expected`
        const winner = aWins ? 'A' : 'B'
        return {
          body: `Both games cost the same to play. Game A pays $${payA} with probability 1/2; Game B pays $${payB} with probability 1/3.`,
          question: {
            choices: [choiceA, choiceB, 'They are equal', 'It cannot be decided'],
            correctChoiceIndex: aWins ? 0 : 1,
            explanation: `Game ${winner} has the higher expected value ($${hi} vs $${Math.min(a, b)}), so it is the better long-run choice. The decision rule is simply: pick the higher EV.`,
          },
          feedback: {
            correct: `Right — Game ${winner} wins with an expected $${hi} per play.`,
            incorrect: 'Compute each EV (payoff × probability) and pick the larger one.',
            choiceFeedback: {
              [aWins ? choiceB : choiceA]: `That game averages $${Math.min(a, b)}, which is less than $${hi}.`,
              'They are equal': `They differ: Game A is ${payA} × 1/2 = $${a}, Game B is ${payB} × 1/3 = $${b}.`,
              'It cannot be decided': 'You can decide — compare the two expected values directly.',
            },
            hint: 'Turn each game into a single number by weighting its payoff by its probability, then take the bigger one.',
            computationHint: `Game A: ${payA} × 1/2 = $${a}. Game B: ${payB} × 1/3 = $${b}. Pick the higher one.`,
          },
        }
      },
      concepts: ['decision-ev', 'expected-value'],
    },
    {
      id: 'repeated-total',
      type: 'numeric-question',
      title: 'Many Plays',
      body: 'A game has expected winnings of $2 per play. You decide to play it 25 times.',
      prompt: 'By linearity, what total winnings do you expect over all 25 plays, in dollars?',
      question: {
        inputType: 'numeric',
        correctAnswer: 50,
        tolerance: 0.01,
        explanation:
          'Expected totals add, so expected total = plays × per-play average = 25 × $2 = $50.',
        misconceptionTags: ['linearity-expectation'],
      },
      feedback: {
        correct: 'Yes — 25 × $2 = $50 expected in total.',
        incorrect: 'Multiply the per-play expectation ($2) by the number of plays (25).',
        hint: 'Expected values add across plays, so the expected total is just the per-play expectation repeated once for every play.',
        computationHint: '25 × 2 = $50.',
      },
      randomize: (r) => {
        const perPlay = r.int(2, 5)
        const plays = r.pick([20, 25, 30, 40])
        const ans = perPlay * plays
        return {
          body: `A game has expected winnings of $${perPlay} per play. You decide to play it ${plays} times.`,
          prompt: `By linearity, what total winnings do you expect over all ${plays} plays, in dollars?`,
          question: {
            correctAnswer: ans,
            explanation: `Expected totals add, so expected total = plays × per-play average = ${plays} × $${perPlay} = $${ans}.`,
          },
          feedback: {
            correct: `Yes — ${plays} × $${perPlay} = $${ans} expected in total.`,
            incorrect: `Multiply the per-play expectation ($${perPlay}) by the number of plays (${plays}).`,
            hint: 'Expected values add across plays, so the expected total is just the per-play expectation repeated once for every play.',
            computationHint: `${plays} × ${perPlay} = $${ans}.`,
          },
        }
      },
      concepts: ['linearity-expectation', 'decision-ev'],
    },
    {
      id: 'expected-count',
      type: 'numeric-question',
      title: 'How Many Wins?',
      body: 'A claw machine grabs a prize on each try with probability 1/4, independently. You take 12 tries.',
      prompt: 'What is the expected NUMBER of prizes you win?',
      question: {
        inputType: 'numeric',
        correctAnswer: 3,
        tolerance: 0.01,
        explanation:
          'Add one indicator per try: E = 12 × 1/4 = 3. Expected counts add, even though the tries are independent.',
        misconceptionTags: ['indicator-variables'],
      },
      feedback: {
        correct: 'Right — 12 × 1/4 = 3 prizes on average.',
        incorrect: 'Multiply the number of tries (12) by the per-try chance 1/4.',
        hint: 'Give each try a 0/1 indicator that is 1 when it wins. The expected count is the sum of those probabilities — one chance per try.',
        computationHint: '12 × 1/4 = 3.',
      },
      randomize: (r) => {
        const denom = r.pick([3, 4, 5, 6])
        const ans = r.int(2, 4)
        const tries = denom * ans
        return {
          body: `A claw machine grabs a prize on each try with probability 1/${denom}, independently. You take ${tries} tries.`,
          question: {
            correctAnswer: ans,
            explanation: `Add one indicator per try: E = ${tries} × 1/${denom} = ${ans}. Expected counts add, even though the tries are independent.`,
          },
          feedback: {
            correct: `Right — ${tries} × 1/${denom} = ${ans} prizes on average.`,
            incorrect: `Multiply the number of tries (${tries}) by the per-try chance 1/${denom}.`,
            hint: 'Give each try a 0/1 indicator that is 1 when it wins. The expected count is the sum of those probabilities — one chance per try.',
            computationHint: `${tries} × 1/${denom} = ${ans}.`,
          },
        }
      },
      concepts: ['indicator-variables', 'linearity-expectation'],
    },
    {
      id: 'decision-rule',
      type: 'multiple-choice',
      title: 'When Is a Game Worth It?',
      body: 'You can pay a fixed cost to play a game, and you have computed its expected payoff.',
      prompt: 'In general, when is a game worth playing in the long run?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'When the expected payoff is greater than the cost to play',
          'When the top prize is greater than the cost',
          'When you can win more than you pay at least once',
          'Whenever there is any chance to win',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Play when the expected payoff exceeds the cost — that is, when the net expected value (expected payoff − cost) is positive. The long-run average per play is what decides it.',
        misconceptionTags: ['decision-ev'],
      },
      feedback: {
        correct: 'Exactly — a positive net expected value means you come out ahead on average.',
        incorrect: 'Compare the EXPECTED payoff (not a best case) against the cost.',
        choiceFeedback: {
          'When the top prize is greater than the cost':
            'A top prize can be huge yet rare. Weight it by its probability and compare the EXPECTED payoff to the cost.',
          'When you can win more than you pay at least once':
            'A single lucky outcome does not make a game worth it — the long-run AVERAGE does.',
          'Whenever there is any chance to win':
            'Most losing games still let you win sometimes. Compare the expected payoff to the cost.',
        },
        hint: 'The expected value is the long-run average per play, so a game pays off only when that average beats what it costs.',
        computationHint: 'Worth it exactly when expected payoff − cost > 0 (a positive net expected value).',
      },
      concepts: ['decision-ev'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You turned expected value into a decision rule: compute the expected payoff, compare it to the cost, and act on the sign of the net. You compared options by EV, found fair prices, and used linearity to add expected winnings over many plays. That number is the long-run average per play — the whole point of expectation, and the finish line of the course.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
