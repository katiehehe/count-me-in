import type { Lesson, SampleOutcome } from './types'
import { atLeastOneProb, complement, fracText } from './probabilityMath'

function coinOutcomes(n: number): SampleOutcome[] {
  const res: SampleOutcome[] = []
  const total = 2 ** n
  for (let i = 0; i < total; i++) {
    let label = ''
    for (let b = n - 1; b >= 0; b--) label += (i >> b) & 1 ? 'H' : 'T'
    res.push({ id: label, label })
  }
  return res
}

function headCount(label: string): number {
  return label.split('').filter((c) => c === 'H').length
}

function diceOutcomes(): SampleOutcome[] {
  const res: SampleOutcome[] = []
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) res.push({ id: `${a}-${b}`, label: `${a},${b}` })
  return res
}

const coins3 = coinOutcomes(3)
const coins4 = coinOutcomes(4)
const coins4Complement = coins4.filter((o) => headCount(o.label) < 2).map((o) => o.id)
const dice = diceOutcomes()
const diceNoSix = dice.filter((o) => !o.id.split('-').includes('6')).map((o) => o.id)

export const complementRuleLesson: Lesson = {
  id: 'complement-rule',
  title: 'The Complement Rule',
  description:
    'P(A) = 1 − P(not A): when the event you want is awkward to count, count its easy opposite and subtract. The signature trigger is “at least one …”.',
  hook: 'Flip 3 coins. P(at least one heads)? Don’t count all 7 — count the 1 you don’t want.',
  estimatedMinutes: 11,
  prerequisites: ['conditional-probability'],
  concepts: ['complement-rule', 'probability'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Count the Opposite Instead',
      body: 'Every outcome either is in your event A or it isn’t — and “isn’t” is the complement, written “not A”.\n\nTogether they fill the whole sample space and never overlap, so their probabilities add to 1. That gives a shortcut: $P(A) = 1 - P(\\text{not }A)$.\n\nIt’s a lifesaver when A is a big, messy union but its opposite is one clean case — the classic tip-off is the phrase “at least one”.',
      prompt: '$P(A) = 1 - P(\\text{not }A)$. When A is hard to count directly, count “not A” and subtract.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'Flip 3 coins. Guess the probability of getting at least one heads — a fraction is fine.',
        answer: '7/8',
      },
    },
    {
      id: 'worked-coins',
      type: 'worked-example',
      title: 'Watch Me Flip the Problem',
      body: 'Flip a coin three times. Let me find the chance of getting at least one heads.',
      workedExampleConfig: {
        kind: 'sample-space',
        voice: 'nova',
        sampleSpace: {
          mode: 'complement',
          outcomes: coins3,
          complementIds: ['TTT'],
          eventLabel: 'at least one H',
        },
        script: [
          {
            say: 'Our job is the chance of getting at least one heads in three coin flips. Here are all eight equally likely results — every mix of heads and tails.',
            highlight: 'space',
          },
          {
            say: 'We want at least one heads. That is most of the board — seven of the eight — and writing them all out is a chore.',
            highlight: 'target',
          },
          {
            say: 'But look at the opposite. Only one outcome has no heads at all: tails, tails, tails. The complement is a single, easy case.',
            highlight: 'complement',
          },
          {
            say: 'So instead of counting seven, count that one and subtract: one minus one-eighth is seven-eighths. Same answer, far less work.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['complement-rule', 'probability'],
    },
    {
      id: 'worked-venn',
      type: 'worked-example',
      title: 'Why Subtracting Works',
      body: 'The reason is just areas: an event and its complement tile the whole space.',
      workedExampleConfig: {
        kind: 'venn',
        voice: 'nova',
        venn: {
          mode: 'complement',
          aLabel: 'A',
          resultLatex: 'P(A) = 1 - P(\\text{not } A)',
        },
        script: [
          {
            say: 'Let us see why subtracting works, using areas. Let event A be some region of all the possibilities — the dart landing inside this circle.',
            highlight: 'a',
          },
          {
            say: 'Everything else, the entire world outside A, is its complement: not A. There is no third option.',
            highlight: 'complement',
          },
          {
            say: 'A and not-A cover the whole space and never overlap, so their probabilities sum to one. Rearrange that, and P(A) is simply one minus P(not A) — measure whichever side is easier.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['complement-rule'],
    },
    {
      id: 'count-complement',
      type: 'numeric-question',
      title: 'Count the Easy Side',
      body: 'Flip a fair coin 3 times, giving 8 equally likely heads/tails sequences.',
      prompt: 'How many of those 8 sequences contain AT LEAST ONE heads?',
      question: {
        inputType: 'numeric',
        correctAnswer: 7,
        tolerance: 0,
        explanation:
          'Don’t list all the “at least one heads” cases. Only ONE sequence has no heads (TTT), so the other 8 − 1 = 7 must contain at least one heads.',
        misconceptionTags: ['complement-rule'],
      },
      feedback: {
        correct: 'Right — 8 total minus the single all-tails outcome leaves 7.',
        incorrect: 'Count the complement first: how many sequences have NO heads? Subtract that from 8.',
        hint: 'The opposite of “at least one heads” is “zero heads.” How many ways is that? Subtract from the total.',
        computationHint: 'Only TTT has no heads, so 8 − 1 = 7 have at least one.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('comp-n', 3, 5)
        const total = 2 ** n
        return {
          body: `Flip a fair coin ${n} times, giving ${total} equally likely heads/tails sequences.`,
          question: {
            correctAnswer: total - 1,
            explanation: `Only ONE sequence has no heads (all tails), so the other ${total} − 1 = ${total - 1} contain at least one heads — counting the complement is far easier.`,
          },
          feedback: {
            correct: `Right — ${total} total minus the single all-tails outcome leaves ${total - 1}.`,
            incorrect: 'Count the complement first: how many sequences have NO heads? Subtract that from the total.',
            hint: 'The opposite of “at least one heads” is “zero heads.” How many ways is that? Subtract from the total.',
            computationHint: `Only the all-tails sequence has no heads, so ${total} − 1 = ${total - 1}.`,
          },
        }
      },
      concepts: ['complement-rule'],
    },
    {
      id: 'worked-dice',
      type: 'worked-example',
      title: 'A Tidier Opposite',
      body: 'Roll two dice and ask for at least one six. The complement is the clean side.',
      workedExampleConfig: {
        kind: 'sample-space',
        voice: 'nova',
        sampleSpace: {
          mode: 'complement',
          outcomes: dice,
          complementIds: diceNoSix,
          eventLabel: 'at least one 6',
          columns: 6,
        },
        script: [
          {
            say: 'Now a harder one: the chance of at least one six when we roll two dice. Two dice give thirty-six equally likely pairs — here is the whole table.',
            highlight: 'space',
          },
          {
            say: 'At least one six means the last row or the last column. They cross at six-six, so counting them straight is fiddly — eleven scattered cells.',
            highlight: 'target',
          },
          {
            say: 'The complement is far easier to state: neither die is a six. That is a solid five-by-five block — twenty-five pairs.',
            highlight: 'complement',
          },
          {
            say: 'So at least one six is one minus twenty-five thirty-sixths — eleven thirty-sixths. The complement was one rule instead of a messy union.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['complement-rule', 'probability'],
    },
    {
      id: 'explore-complement',
      type: 'complement-select',
      title: 'Select the Complement',
      body: 'Here are all 16 outcomes of flipping 4 coins. We want “at least two heads” — but that’s 11 messy cases. Tap the smaller complement instead: every outcome with fewer than two heads (0 or 1 H).',
      complementSelectConfig: {
        outcomes: coins4,
        complementIds: coins4Complement,
        complementLabel: 'fewer than two heads (0 or 1 H)',
        eventLabel: 'at least two heads',
        columns: 4,
      },
      feedback: {
        correct:
          'Exactly — the complement “fewer than two heads” is just 5 outcomes (TTTT plus the four single-heads ones). So P(at least two heads) = 1 − 5/16 = 11/16, without ever listing all 11 winners.',
        incorrect: '',
        hint: 'Count the heads in each sequence. The complement is the ones with 0 heads or exactly 1 head.',
        computationHint: 'Complement = TTTT (0 heads) + HTTT, THTT, TTHT, TTTH (1 head) = 5 of 16, so the answer is 1 − 5/16 = 11/16.',
      },
      concepts: ['complement-rule'],
    },
    {
      id: 'coins-atleastone',
      type: 'fraction-question',
      title: 'At Least One Heads',
      body: 'You flip a fair coin 4 times.',
      prompt: 'What is the probability of getting at least one heads? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '15/16',
        explanation:
          'P(at least one H) = 1 − P(no heads). “No heads” is all tails, one outcome out of 16, so P = 1 − 1/16 = 15/16.',
        misconceptionTags: ['complement-rule'],
      },
      feedback: {
        correct: 'Yes — 1 − 1/16 = 15/16. The complement (all tails) was a single case.',
        incorrect: 'Use the complement: P(at least one H) = 1 − P(all tails), and P(all tails) = 1/16.',
        hint: 'Going for “at least one” directly is messy. Find P(no heads at all) first, then subtract from 1.',
        computationHint: 'P(all tails) = (1/2)⁴ = 1/16, so P(at least one H) = 1 − 1/16 = 15/16.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('comp-coin-n', 3, 5)
        const p = complement({ n: 1, d: 2 ** n })
        return {
          body: `You flip a fair coin ${n} times.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `P(at least one H) = 1 − P(no heads). “No heads” is all tails — one outcome out of ${2 ** n} — so P = 1 − 1/${2 ** n} = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — 1 − 1/${2 ** n} = ${fracText(p)}. The complement (all tails) was a single case.`,
            incorrect: `Use the complement: P(at least one H) = 1 − P(all tails), and P(all tails) = 1/${2 ** n}.`,
            hint: 'Going for “at least one” directly is messy. Find P(no heads at all) first, then subtract from 1.',
            computationHint: `P(all tails) = (1/2)^${n} = 1/${2 ** n}, so the answer is 1 − 1/${2 ** n} = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['complement-rule', 'probability'],
    },
    {
      id: 'dice-atleastone',
      type: 'fraction-question',
      title: 'At Least One Six',
      body: 'You roll 2 fair dice.',
      prompt: 'What is the probability of getting at least one six? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '11/36',
        explanation:
          'P(at least one six) = 1 − P(no six). Each die avoids six with probability 5/6, so P(no six) = (5/6)² = 25/36, and 1 − 25/36 = 11/36.',
        misconceptionTags: ['complement-rule'],
      },
      feedback: {
        correct: 'Exactly — 1 − 25/36 = 11/36. “No six on either die” was the clean case.',
        incorrect: 'Find P(no six) = (5/6)² first, then subtract from 1.',
        hint: 'The complement of “at least one six” is “no six on any die.” Compute that, then subtract from 1.',
        computationHint: 'P(no six) = (5/6)² = 25/36, so P(at least one six) = 1 − 25/36 = 11/36.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('comp-dice-n', 2, 3)
        const none = 5 ** n
        const total = 6 ** n
        const p = atLeastOneProb({ n: 5, d: 6 }, n)
        return {
          body: `You roll ${n} fair dice.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `P(at least one six) = 1 − P(no six). Each die avoids six with probability 5/6, so P(no six) = (5/6)^${n} = ${none}/${total}, and 1 − ${none}/${total} = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Exactly — 1 − ${none}/${total} = ${fracText(p)}. “No six on any die” was the clean case.`,
            incorrect: `Find P(no six) = (5/6)^${n} first, then subtract from 1.`,
            hint: 'The complement of “at least one six” is “no six on any die.” Compute that, then subtract from 1.',
            computationHint: `P(no six) = (5/6)^${n} = ${none}/${total}, so the answer is 1 − ${none}/${total} = ${fracText(p)}.`,
          },
        }
      },
      concepts: ['complement-rule', 'probability'],
    },
    {
      id: 'trigger',
      type: 'multiple-choice',
      title: 'When to Reach for It',
      body: 'You can always compute P(A) directly, but sometimes the complement is far easier.',
      prompt: 'Which question is the complement rule MOST built for?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'P(at least one six in 4 rolls of a die)',
          'P(exactly one six in 4 rolls of a die)',
          'P(the first roll is a six)',
          'P(rolling a six on a single die)',
        ],
        correctChoiceIndex: 0,
        explanation:
          '“At least one” spans many overlapping cases, but its complement — “no sixes at all” — is a single clean product. That mismatch is exactly when 1 − P(not A) saves the most work.',
        misconceptionTags: ['complement-rule'],
      },
      feedback: {
        correct: 'Right — “at least one …” is the signature trigger, because “none” is one tidy case.',
        incorrect: 'Look for the “at least one” phrasing, where counting directly means many cases but the complement is just one.',
        choiceFeedback: {
          'P(the first roll is a six)':
            'That’s already a single, simple event — no complement shortcut needed.',
          'P(rolling a six on a single die)': 'That’s immediate (1/6); the complement adds nothing here.',
          'P(exactly one six in 4 rolls of a die)':
            '“Exactly one” isn’t simplified by the complement — its opposite (“zero, two, three, or four”) is messier, not cleaner.',
        },
        hint: 'The rule shines when A is a big union of cases but “not A” collapses to one easy scenario. Which phrasing fits that?',
        computationHint: 'For “at least one six in 4 rolls,” not-A is “no sixes” = (5/6)⁴ — one clean product versus many overlapping cases.',
      },
      concepts: ['complement-rule'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned the complement rule: P(A) = 1 − P(not A). When the event you want is a sprawling “at least one …”, its opposite is usually one tidy case — count that and subtract. You saw it on coins, on a 6×6 dice grid, and as areas that tile the whole space.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
