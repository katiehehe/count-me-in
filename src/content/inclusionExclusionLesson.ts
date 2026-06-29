import type { Lesson } from './types'
import { fracText, reduceFrac, unionThree, unionTwo } from './probabilityMath'

const deckOptions = [
  { q: 'a heart or a king', a: 13, b: 4, both: 1 },
  { q: 'a heart or a face card', a: 13, b: 12, both: 3 },
  { q: 'a spade or a queen', a: 13, b: 4, both: 1 },
  { q: 'red or a face card', a: 26, b: 12, both: 6 },
]

export const inclusionExclusionLesson: Lesson = {
  id: 'inclusion-exclusion',
  title: 'Inclusion–Exclusion',
  description:
    'When groups overlap you can’t just add them — the overlap gets counted twice. Add the parts, subtract the overlaps, add back the center.',
  hook: '18 play soccer, 15 play basketball, 7 play both — how many play at least one?',
  estimatedMinutes: 12,
  prerequisites: ['binomial-theorem'],
  concepts: ['inclusion-exclusion'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Don’t Double-Count',
      body: 'When two groups overlap, you can’t just add their sizes — you’d count the overlap twice.\n\nInclusion–exclusion fixes that: add the two sizes, then subtract the overlap once.\n\n$$|A \\cup B| = |A| + |B| - |A \\cap B|$$\n\nIf the two events can’t overlap (disjoint), then $|A \\cap B| = 0$ and this is exactly the addition rule from before. Inclusion–exclusion is the addition rule for groups that overlap.',
      prompt: 'Overlap counted twice ⇒ subtract it once: $|A \\cup B| = |A| + |B| - |A \\cap B|$.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'In a class, 18 students play soccer and 15 play basketball, and 7 play both. How many play at least one of the two sports? Take a guess.',
        answer: 26,
      },
    },
    {
      id: 'worked-two',
      type: 'worked-example',
      title: 'Watch Me Count the Union',
      body: 'A class plays soccer, basketball, or both. Let me count how many play at least one.',
      workedExampleConfig: {
        kind: 'venn',
        voice: 'nova',
        venn: { mode: 'pie', aLabel: 'Soccer', bLabel: 'Basketball', a: 18, b: 15, both: 7 },
        script: [
          { say: 'Eighteen students play soccer — here is the soccer circle.', highlight: 'a' },
          {
            say: 'Fifteen play basketball. The circles overlap because some students play both.',
            highlight: 'b',
          },
          {
            say: 'If we simply add eighteen and fifteen, we get thirty-three. But the seven who play both were counted once in each circle — counted twice.',
            highlight: 'double',
          },
          {
            say: 'So we subtract those seven once. Thirty-three minus seven is twenty-six.',
            highlight: 'subtract',
          },
          {
            say: 'Twenty-six students play at least one sport. That is inclusion–exclusion: add the two, then subtract the overlap.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['inclusion-exclusion'],
    },
    {
      id: 'explore-union',
      type: 'venn-regions',
      title: 'Build the Union Yourself',
      body: 'In a café, 12 people ordered coffee and 9 ordered tea, with 4 ordering both.\n\nAdd each set, watch the overlap get double-counted, then subtract it once.',
      vennRegionsConfig: { a: 12, b: 9, both: 4, aLabel: 'Coffee', bLabel: 'Tea' },
      feedback: {
        correct:
          'You added both sets, saw the 4 in the overlap counted twice, and subtracted once: $12 + 9 - 4 = 17$ ordered at least one drink.',
        incorrect: '',
        hint: 'Add coffee, add tea — the running total now counts the 4 “both” people twice. Subtract that overlap once.',
        computationHint: '$12 + 9 - 4 = 17$.',
      },
      concepts: ['inclusion-exclusion'],
    },
    {
      id: 'worked-three',
      type: 'worked-example',
      title: 'Three Sets',
      body: 'With three groups the same idea applies — there are just more overlaps to fix.',
      workedExampleConfig: {
        kind: 'steps',
        voice: 'nova',
        steps: {
          lines: [
            { latex: '40 + 35 + 30 = 105', caption: 'add the three singles' },
            { latex: '105 - 12 - 10 - 8 = 75', caption: 'subtract the pairwise overlaps' },
            { latex: '75 + 4 = 79', caption: 'add back the triple overlap' },
            { latex: '|P \\cup B \\cup T| = 79', caption: 'students who like at least one' },
          ],
        },
        script: [
          {
            say: 'A survey: forty students like pizza, thirty-five like burgers, thirty like tacos. First add the three singles — forty plus thirty-five plus thirty is one hundred five.',
            highlight: 'step-0',
          },
          {
            say: 'But each pairwise overlap got double-counted, so subtract all three: minus twelve, minus ten, minus eight, leaving seventy-five.',
            highlight: 'step-1',
          },
          {
            say: 'The four who like all three were subtracted one time too many, so add them back: seventy-five plus four is seventy-nine.',
            highlight: 'step-2',
          },
          {
            say: 'So seventy-nine students like at least one. Add singles, subtract pairs, add back the center.',
            highlight: 'step-3',
          },
        ],
      },
      concepts: ['inclusion-exclusion'],
    },
    {
      id: 'union-two',
      type: 'numeric-question',
      title: 'At Least One',
      body: 'A school club: 20 students take Art and 14 take Music, with 6 taking both.',
      prompt: 'How many students take at least one of Art or Music?',
      question: {
        inputType: 'numeric',
        correctAnswer: 28,
        tolerance: 0,
        explanation: 'Inclusion–exclusion: $20 + 14 - 6 = 28$ (subtract the 6 counted in both).',
        misconceptionTags: ['inclusion-exclusion'],
      },
      feedback: {
        correct: 'Yes — $20 + 14 - 6 = 28$.',
        incorrect: 'Add the two groups, then subtract the ones counted in both.',
        hint: 'Adding both totals counts the “both” students twice — remove that overlap once.',
        computationHint: '$|A \\cup B| = 20 + 14 - 6 = 28$.',
      },
      randomize: (r) => {
        const a = r.uniqueInt('ie-a', 14, 22)
        const b = r.uniqueInt('ie-b', 12, 18)
        const both = r.uniqueInt('ie-both', 4, 8)
        const answer = unionTwo(a, b, both)
        return {
          body: `A school club: ${a} students take Art and ${b} take Music, with ${both} taking both.`,
          question: {
            correctAnswer: answer,
            explanation: `Inclusion–exclusion: $${a} + ${b} - ${both} = ${answer}$ (subtract the ${both} counted in both).`,
          },
          feedback: {
            correct: `Yes — $${a} + ${b} - ${both} = ${answer}$.`,
            incorrect: 'Add the two groups, then subtract the ones counted in both.',
            hint: 'Adding both totals counts the “both” students twice — remove that overlap once.',
            computationHint: `$|A \\cup B| = ${a} + ${b} - ${both} = ${answer}$.`,
          },
        }
      },
      concepts: ['inclusion-exclusion'],
    },
    {
      id: 'find-overlap',
      type: 'numeric-question',
      title: 'Solve for the Overlap',
      body: 'In a survey, 22 people like tea and 18 like coffee, and 30 like at least one of the two.',
      prompt: 'How many like BOTH tea and coffee?',
      question: {
        inputType: 'numeric',
        correctAnswer: 10,
        tolerance: 0,
        explanation: 'Rearrange: $|A \\cap B| = |A| + |B| - |A \\cup B| = 22 + 18 - 30 = 10$.',
        misconceptionTags: ['inclusion-exclusion'],
      },
      feedback: {
        correct: 'Yes — $22 + 18 - 30 = 10$ like both.',
        incorrect: 'Rearrange the union formula to solve for the overlap.',
        hint: 'You know |A|, |B|, and |A ∪ B|. The union formula has one unknown — the overlap. Solve for it.',
        computationHint: '$|A \\cap B| = |A| + |B| - |A \\cup B| = 22 + 18 - 30 = 10$.',
      },
      randomize: (r) => {
        const a = r.uniqueInt('fo-a', 16, 24)
        const b = r.uniqueInt('fo-b', 14, 20)
        const both = r.uniqueInt('fo-both', 4, 9)
        const union = unionTwo(a, b, both)
        return {
          body: `In a survey, ${a} people like tea and ${b} like coffee, and ${union} like at least one of the two.`,
          question: {
            correctAnswer: both,
            explanation: `Rearrange: $|A \\cap B| = |A| + |B| - |A \\cup B| = ${a} + ${b} - ${union} = ${both}$.`,
          },
          feedback: {
            correct: `Yes — $${a} + ${b} - ${union} = ${both}$ like both.`,
            incorrect: 'Rearrange the union formula to solve for the overlap.',
            hint: 'You know |A|, |B|, and |A ∪ B|. The union formula has one unknown — the overlap. Solve for it.',
            computationHint: `$|A \\cap B| = ${a} + ${b} - ${union} = ${both}$.`,
          },
        }
      },
      concepts: ['inclusion-exclusion'],
    },
    {
      id: 'neither',
      type: 'numeric-question',
      title: 'How Many Neither?',
      body: 'A class of 30 students: 18 play soccer, 15 play basketball, and 7 play both.',
      prompt: 'How many students play NEITHER sport?',
      question: {
        inputType: 'numeric',
        correctAnswer: 4,
        tolerance: 0,
        explanation:
          'First the union: $18 + 15 - 7 = 26$ play at least one. Then “neither” is the complement: $30 - 26 = 4$.',
        misconceptionTags: ['inclusion-exclusion', 'complement-rule'],
      },
      feedback: {
        correct: 'Yes — union is 26, so neither is $30 - 26 = 4$.',
        incorrect: 'Find the union first, then subtract it from the total (that’s “neither”).',
        hint: '“Neither” is the complement of “at least one.” Compute the union, then take total minus union.',
        computationHint: 'Union $= 18 + 15 - 7 = 26$; neither $= 30 - 26 = 4$.',
      },
      randomize: (r) => {
        const a = r.uniqueInt('n-a', 14, 20)
        const b = r.uniqueInt('n-b', 12, 18)
        const both = r.uniqueInt('n-both', 4, 8)
        const union = unionTwo(a, b, both)
        const total = union + r.uniqueInt('n-extra', 3, 10)
        const answer = total - union
        return {
          body: `A class of ${total} students: ${a} play soccer, ${b} play basketball, and ${both} play both.`,
          question: {
            correctAnswer: answer,
            explanation: `First the union: $${a} + ${b} - ${both} = ${union}$ play at least one. Then “neither” is the complement: $${total} - ${union} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — union is ${union}, so neither is $${total} - ${union} = ${answer}$.`,
            incorrect: 'Find the union first, then subtract it from the total (that’s “neither”).',
            hint: '“Neither” is the complement of “at least one.” Compute the union, then take total minus union.',
            computationHint: `Union $= ${a} + ${b} - ${both} = ${union}$; neither $= ${total} - ${union} = ${answer}$.`,
          },
        }
      },
      concepts: ['inclusion-exclusion', 'complement-rule'],
    },
    {
      id: 'prob-union',
      type: 'fraction-question',
      title: 'The Probability Form',
      body: 'Inclusion–exclusion works for probabilities too: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.',
      prompt: 'From a 52-card deck, what is the probability the card is a heart or a king? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '4/13',
        explanation:
          'There are $13 + 4 - 1 = 16$ such cards (the king of hearts is counted once), so $P = 16/52 = 4/13$.',
        misconceptionTags: ['inclusion-exclusion'],
      },
      feedback: {
        correct: 'Yes — $16/52 = 4/13$.',
        incorrect: 'Count hearts plus kings, subtract the king of hearts (counted twice), then divide by 52.',
        hint: 'How many cards are a heart OR a king? Use inclusion–exclusion on the counts, then divide by 52.',
        computationHint: '$P = (13 + 4 - 1)/52 = 16/52 = 4/13$.',
      },
      randomize: (r) => {
        const opt = deckOptions[r.uniqueInt('pu-opt', 0, deckOptions.length - 1)]
        const num = unionTwo(opt.a, opt.b, opt.both)
        const p = reduceFrac(num, 52)
        return {
          prompt: `From a 52-card deck, what is the probability the card is ${opt.q}? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `There are $${opt.a} + ${opt.b} - ${opt.both} = ${num}$ such cards, so $P = ${num}/52 = ${fracText(p)}$.`,
          },
          feedback: {
            correct: `Yes — $${num}/52 = ${fracText(p)}$.`,
            incorrect: 'Count the two groups, subtract the overlap (counted twice), then divide by 52.',
            hint: 'Count how many cards fit OR by inclusion–exclusion on the counts, then divide by 52.',
            computationHint: `$P = (${opt.a} + ${opt.b} - ${opt.both})/52 = ${num}/52 = ${fracText(p)}$.`,
          },
        }
      },
      concepts: ['inclusion-exclusion'],
    },
    {
      id: 'union-three',
      type: 'numeric-question',
      title: 'Three Overlapping Sets',
      body: 'A survey of 3 apps: 40 use Photos, 35 use Music, 30 use Maps. Pairwise, 12 use Photos & Music, 10 use Photos & Maps, 8 use Music & Maps. 4 use all three.',
      prompt: 'How many people use at least one of the three apps?',
      question: {
        inputType: 'numeric',
        correctAnswer: 79,
        tolerance: 0,
        explanation:
          'Add singles, subtract pairs, add back the center: $40+35+30 - 12-10-8 + 4 = 79$.',
        misconceptionTags: ['inclusion-exclusion'],
      },
      feedback: {
        correct: 'Yes — $105 - 30 + 4 = 79$.',
        incorrect: 'Add the three singles, subtract the three pairwise overlaps, then add back the triple overlap.',
        hint: 'Follow the ± pattern: + singles − pairs + center.',
        computationHint: '$40+35+30 - 12-10-8 + 4 = 79$.',
      },
      randomize: (r) => {
        const a = r.uniqueInt('u3-a', 36, 44)
        const b = r.uniqueInt('u3-b', 30, 38)
        const c = r.uniqueInt('u3-c', 26, 34)
        const ab = r.uniqueInt('u3-ab', 10, 14)
        const ac = r.uniqueInt('u3-ac', 8, 12)
        const bc = r.uniqueInt('u3-bc', 6, 10)
        const abc = r.uniqueInt('u3-abc', 3, 5)
        const answer = unionThree(a, b, c, ab, ac, bc, abc)
        return {
          body: `A survey of 3 apps: ${a} use Photos, ${b} use Music, ${c} use Maps. Pairwise, ${ab} use Photos & Music, ${ac} use Photos & Maps, ${bc} use Music & Maps. ${abc} use all three.`,
          question: {
            correctAnswer: answer,
            explanation: `Add singles, subtract pairs, add back the center: $${a}+${b}+${c} - ${ab}-${ac}-${bc} + ${abc} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $${a}+${b}+${c} - ${ab}-${ac}-${bc} + ${abc} = ${answer}$.`,
            incorrect: 'Add the three singles, subtract the three pairwise overlaps, then add back the triple overlap.',
            hint: 'Follow the ± pattern: + singles − pairs + center.',
            computationHint: `$${a}+${b}+${c} - ${ab}-${ac}-${bc} + ${abc} = ${answer}$.`,
          },
        }
      },
      concepts: ['inclusion-exclusion'],
    },
    {
      id: 'bridge-mc',
      type: 'multiple-choice',
      title: 'When Is There No Overlap?',
      body: 'Adding $|A| + |B|$ over-counts only when the two groups share members.',
      prompt: 'When is $|A \\cup B|$ exactly $|A| + |B|$, with nothing to subtract?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'When A and B are disjoint — they can’t both happen, so $|A \\cap B| = 0$',
          'Always — the overlap never matters',
          'Only when A and B are the same size',
          'Never — you must always subtract something',
        ],
        correctChoiceIndex: 0,
        explanation:
          'If A and B are mutually exclusive, $|A \\cap B| = 0$, so $|A \\cup B| = |A| + |B|$. That’s the addition rule — the special case of inclusion–exclusion with no overlap.',
        misconceptionTags: ['inclusion-exclusion', 'mutually-exclusive'],
      },
      feedback: {
        correct: 'Right — disjoint sets have no overlap, so inclusion–exclusion becomes the plain addition rule.',
        incorrect: 'Think about when the overlap $|A \\cap B|$ is zero.',
        choiceFeedback: {
          'Always — the overlap never matters':
            'If the groups share members, adding double-counts them — you must subtract the overlap.',
          'Never — you must always subtract something':
            'When the groups are disjoint, the overlap is 0, so there’s nothing to subtract.',
        },
        hint: 'The subtraction is $|A \\cap B|$. When is that exactly zero?',
        computationHint: 'Disjoint ⇒ $|A \\cap B| = 0$ ⇒ $|A \\cup B| = |A| + |B|$ (the addition rule).',
      },
      concepts: ['inclusion-exclusion', 'mutually-exclusive'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned inclusion–exclusion: $|A \\cup B| = |A| + |B| - |A \\cap B|$, and for three sets, add singles, subtract pairwise overlaps, add back the center.\n\nIt’s the addition rule once events can overlap — and it pairs with the complement to count “neither” as total minus the union.\n\nThe same formula works for probabilities: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
