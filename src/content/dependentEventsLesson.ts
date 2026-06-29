import type { Lesson } from './types'
import { drawSameProb, fracText, multiplyFracs } from './probabilityMath'

export const dependentEventsLesson: Lesson = {
  id: 'dependent-events',
  title: 'Dependent Events',
  description:
    'When one event changes the odds of another: drawing without replacement and the conditional “and” rule.',
  hook: 'Draw 2 cards without putting the first back — what changes?',
  estimatedMinutes: 11,
  prerequisites: ['independent-events'],
  concepts: ['dependent-events', 'independent-events', 'probability'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'When One Event Changes Another',
      body: 'Some events are linked: when the first happens, it changes the odds of the next.\n\nDark clouds make wet ground more likely; an hour of studying lifts your exam odds; pulling a card and NOT putting it back changes what you can draw next. These are DEPENDENT events.\n\nIndependent events multiplied $P(A)$ by $P(B)$; dependent events use the CONDITIONAL second probability — the chance of B once A has already happened.',
      prompt: '$P(A \\text{ and } B) = P(A) \\cdot P(B \\mid A)$ — the second factor shifts because the first event already happened.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'A jar holds 4 red and 2 blue marbles. Draw two without replacement — guess the probability both are red. A fraction is fine.',
        answer: '2/5',
      },
    },
    {
      id: 'worked-draw',
      type: 'worked-example',
      title: 'Watch Me Count One',
      body: 'Let me find the chance of drawing two reds in a row — without putting the first back.',
      workedExampleConfig: {
        kind: 'draw',
        voice: 'nova',
        draw: { red: 4, blue: 2 },
        script: [
          {
            say: 'Our job is to find the probability of drawing two reds in a row, without putting the first back. Here is a bag with four red marbles and two blue — six in all — and we draw two, one after another, keeping the first.',
            highlight: 'jar',
          },
          {
            say: 'On the first draw, four of the six marbles are red, so the chance of red is four out of six.',
            highlight: 'draw1',
          },
          {
            say: 'Now the bag has changed: we kept that red one out, so only three reds remain among five marbles. The second draw is three out of five — the first draw shifted the odds.',
            highlight: 'draw2',
          },
          {
            say: 'Because the second draw depends on the first, we chain them: four-sixths times the conditional three-fifths gives two-fifths.',
            highlight: 'product',
          },
        ],
      },
      concepts: ['dependent-events', 'probability'],
    },
    {
      id: 'pair-dependent',
      type: 'dependence-pairing',
      title: 'Pair the Dependent Events',
      body: 'Two events are DEPENDENT when the first changes the odds of the second. Below are six events. Tap two cards to pair the ones where the first clearly affects the second — and leave the independent pair apart.',
      dependencePairingConfig: {
        cards: [
          { id: 'study', label: 'You study hard all week', emoji: '📚' },
          { id: 'grade', label: 'You ace the exam', emoji: '💯' },
          { id: 'rain', label: 'It rains hard overnight', emoji: '🌧️' },
          { id: 'mud', label: 'The trail is muddy at dawn', emoji: '🥾' },
          { id: 'coin', label: 'A coin lands Heads', emoji: '🪙' },
          { id: 'die', label: 'A die lands on 5', emoji: '🎲' },
        ],
        dependentPairs: [
          ['study', 'grade'],
          ['rain', 'mud'],
        ],
      },
      feedback: {
        correct:
          'Exactly! Studying lifts your exam odds, and overnight rain makes a muddy trail more likely — both dependent. The coin and die never affect each other, so they stay independent. Dependence is precisely when one event shifts another’s probability.',
        incorrect: '',
        hint: 'Ask: if the first event happens, does the second become more or less likely? If yes, they are dependent; if the odds are untouched, they are independent.',
        computationHint: 'Pair study with the exam result and rain with the muddy trail; leave the coin and die apart — neither changes the other.',
      },
      concepts: ['dependent-events', 'independent-events'],
    },
    {
      id: 'changed-odds',
      type: 'multiple-choice',
      title: 'Did the Odds Change?',
      body: 'You draw a card from a deck, keep it, then draw a second card.',
      prompt: 'After you keep the first card, are the probabilities for the second draw the same as for the first?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'No — one card is gone, so the second draw’s odds shifted (dependent)',
          'Yes — each draw is independent of the others',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Keeping the first card changes what is left, so the second draw’s probabilities depend on the first — these events are dependent.',
        misconceptionTags: ['dependent-events'],
      },
      feedback: {
        correct: 'Right — without replacement, the first draw changes the deck, so the second is dependent.',
        incorrect: 'Think about whether the deck is the same for the second draw after a card is removed.',
        choiceFeedback: {
          'Yes — each draw is independent of the others':
            'It would be independent only if you put the first card back. Keeping it changes the deck.',
        },
        hint: 'Independence means the first result leaves the second’s odds untouched. Ask whether removing a card changes what the second draw can be.',
        computationHint: 'Start with 52 cards; after keeping one, only 51 remain — different totals mean the draws are dependent.',
      },
      concepts: ['dependent-events', 'independent-events'],
    },
    {
      id: 'reds-left',
      type: 'numeric-question',
      title: 'After One Draw',
      body: 'A jar has 4 red and 2 blue marbles. You draw one marble, see it is RED, and keep it out.',
      prompt: 'How many red marbles are left in the jar now?',
      question: {
        inputType: 'numeric',
        correctAnswer: 3,
        tolerance: 0,
        explanation: 'Removing one red leaves 4 − 1 = 3 reds (out of 5 marbles). The jar literally changed — that is why the next draw’s odds differ.',
        misconceptionTags: ['dependent-events'],
      },
      feedback: {
        correct: 'Right — 3 reds remain out of 5 marbles. The sample shrank.',
        incorrect: 'You took one red OUT and kept it, so there is one fewer red than before.',
        hint: 'Without replacement, the drawn marble does not return. Track how the red count changes once one red is removed.',
        computationHint: '4 reds − 1 drawn = 3 reds left (out of 5 marbles).',
      },
      randomize: (r) => {
        const red = r.uniqueInt('dep-red', 4, 7)
        const blue = r.uniqueInt('dep-blue', 2, 4)
        return {
          body: `A jar has ${red} red and ${blue} blue marbles. You draw one marble, see it is RED, and keep it out.`,
          question: {
            correctAnswer: red - 1,
            explanation: `Removing one red leaves ${red} − 1 = ${red - 1} reds (out of ${red + blue - 1} marbles). The jar changed — that is why the next draw’s odds differ.`,
          },
          feedback: {
            correct: `Right — ${red - 1} reds remain out of ${red + blue - 1} marbles. The sample shrank.`,
            incorrect: 'You took one red OUT and kept it, so there is one fewer red than before.',
            hint: 'Without replacement, the drawn marble does not return. Track how the red count changes once one red is removed.',
            computationHint: `${red} reds − 1 drawn = ${red - 1} reds left (out of ${red + blue - 1} marbles).`,
          },
        }
      },
      concepts: ['dependent-events'],
    },
    {
      id: 'both-red',
      type: 'fraction-question',
      title: 'Both Red',
      body: 'A jar holds 4 red and 2 blue marbles (6 total). You draw two, keeping the first out of the jar.',
      prompt: 'What is the probability that BOTH marbles are red? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '2/5',
        explanation:
          'The first draw is red 4 of 6 times; keeping that red leaves 3 reds among 5, so the second draw is rarer. Chaining the first chance with that smaller conditional chance gives 2/5.',
        misconceptionTags: ['dependent-events'],
      },
      feedback: {
        correct: 'Yes — the shrinking jar makes both-red 2/5.',
        incorrect: 'Remember the jar changes after the first draw: there are fewer reds AND fewer marbles for the second.',
        hint: 'The two draws are dependent. Find the chance the first is red, then the chance the second is red GIVEN the first red was kept out, and chain them.',
        computationHint: 'First draw red: 4/6. After keeping it, second draw red: 3/5. Together they give 2/5.',
      },
      randomize: (r) => {
        const red = r.uniqueInt('dep-red', 3, 6)
        const blue = r.uniqueInt('dep-blue', 2, 4)
        const total = red + blue
        const p = drawSameProb(red, total, 2)
        return {
          body: `A jar holds ${red} red and ${blue} blue marbles (${total} total). You draw two, keeping the first out of the jar.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `The first draw is red ${red} of ${total} times; keeping that red leaves ${red - 1} reds among ${total - 1}, so the second draw is rarer. Chaining the first chance with that smaller conditional chance gives ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — the shrinking jar makes both-red ${fracText(p)}.`,
            incorrect: 'Remember the jar changes after the first draw: there are fewer reds AND fewer marbles for the second.',
            hint: 'The two draws are dependent. Find the chance the first is red, then the chance the second is red GIVEN the first red was kept out, and chain them.',
            computationHint: `First draw red: ${red}/${total}. After keeping it, second draw red: ${red - 1}/${total - 1}. Together they give ${fracText(p)}.`,
          },
        }
      },
      concepts: ['dependent-events', 'probability'],
    },
    {
      id: 'and-rule',
      type: 'fraction-question',
      title: 'Rain, Then Mud',
      body: 'On a stormy coast, P(it rains tonight) = 1/2. And IF it rains, the trail is muddy by morning with probability 4/5. Rain makes mud more likely — these are dependent.',
      prompt: 'What is P(rain AND a muddy trail)? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '2/5',
        explanation:
          'P(A and B) = P(A) · P(B given A). The muddy-trail chance is the CONDITIONAL one (after rain), so chaining it with the rain chance gives 2/5.',
        misconceptionTags: ['dependent-events'],
      },
      feedback: {
        correct: 'Exactly — chain the rain chance with the conditional mud chance: 2/5.',
        incorrect: 'Use P(A and B) = P(A) · P(B given A) — the second probability is the one that already assumes A happened.',
        hint: 'These events are dependent, so the second factor is the CONDITIONAL probability (given the first happened), not its standalone chance. Chain the first probability with that conditional one.',
        computationHint: 'P(rain) = 1/2 and P(muddy given rain) = 4/5, so P(rain and muddy) = 2/5.',
      },
      randomize: (r) => {
        const a = r.uniqueInt('dep-a', 2, 4)
        const bn = r.uniqueInt('dep-bn', 2, 4)
        const bd = bn + r.uniqueInt('dep-bd', 1, 2)
        const p = multiplyFracs([
          { n: 1, d: a },
          { n: bn, d: bd },
        ])
        return {
          body: `On a stormy coast, P(it rains tonight) = 1/${a}. And IF it rains, the trail is muddy by morning with probability ${bn}/${bd}. Rain makes mud more likely — these are dependent.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `P(A and B) = P(A) · P(B given A). Chaining the rain chance with the conditional muddy chance gives ${fracText(p)}.`,
          },
          feedback: {
            correct: `Exactly — chaining the two gives ${fracText(p)}.`,
            incorrect: 'Use P(A and B) = P(A) · P(B given A) — the second probability already assumes the first happened.',
            hint: 'These events are dependent, so the second factor is the CONDITIONAL probability given the first. Chain the first probability with that conditional one.',
            computationHint: `P(rain) = 1/${a} and P(muddy given rain) = ${bn}/${bd}, so P(rain and muddy) = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['dependent-events'],
    },
    {
      id: 'and-formula',
      type: 'multiple-choice',
      title: 'The Dependent “And” Rule',
      body: 'Consider two events A and B where B’s odds depend on whether A happened.',
      prompt: 'For dependent events, P(A and B) equals:',
      question: {
        inputType: 'multiple-choice',
        choices: ['P(A) · P(B given A)', 'P(A) · P(B)', 'P(A) + P(B)', 'P(B) − P(A)'],
        correctChoiceIndex: 0,
        explanation: 'When events are dependent, the second factor must be the conditional probability P(B given A).',
        misconceptionTags: ['dependent-events'],
      },
      feedback: {
        correct: 'Yes — the second factor is conditional: P(A) · P(B given A).',
        incorrect: 'Independent events use P(A) · P(B); dependent events replace P(B) with the conditional P(B given A).',
        choiceFeedback: {
          'P(A) · P(B)':
            'That is the INDEPENDENT rule. When A changes B’s odds, use the conditional P(B given A).',
        },
        hint: 'Both independent and dependent “and” multiply two probabilities — the difference is whether the second one is the plain P(B) or the conditional P(B given A).',
        computationHint: 'P(A and B) = P(A) · P(B given A); only when A doesn’t affect B does P(B given A) collapse back to P(B).',
      },
      concepts: ['dependent-events'],
    },
    {
      id: 'which-dependent',
      type: 'multiple-choice',
      title: 'Spot the Dependence',
      body: 'Each option describes a pair of events.',
      prompt: 'Which pair of events is DEPENDENT (one changes the other’s odds)?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Drawing 2 cards from a deck without replacement',
          'Flipping a coin twice',
          'Rolling two separate dice',
          'Spinning a spinner twice',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Without replacement, the first card removed changes the second draw’s odds. The others reset fully each time, so they are independent.',
        misconceptionTags: ['dependent-events', 'independent-events'],
      },
      feedback: {
        correct: 'Right — without replacement links the two draws, making them dependent.',
        incorrect: 'Look for the case where the first outcome changes what is possible for the second.',
        choiceFeedback: {
          'Flipping a coin twice':
            'The coin resets every flip, so the second flip’s odds are unchanged — independent.',
        },
        hint: 'Dependence shows up when the first event uses something up or changes the setup. Find the option where the second event faces a changed situation.',
        computationHint:
          'Removing a card (no replacement) changes the deck for the next draw; coins, dice, and spinners reset each time, so only the card draw is dependent.',
      },
      concepts: ['dependent-events', 'independent-events'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned that dependent events are linked: the first outcome changes the second’s probability. Instead of P(A) · P(B), you chain P(A) with the CONDITIONAL P(B given A) — exactly what happens when you draw without replacement.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
