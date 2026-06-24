import type { Lesson } from './types'
import { descendingProduct, factorial, fallingProduct, fallingValue } from './randomize'

const teamOf3 = [
  { id: 'ana', label: 'Ana', emoji: '🧑', color: '#2d5894' },
  { id: 'ben', label: 'Ben', emoji: '🧑', color: '#c2410c' },
  { id: 'cara', label: 'Cara', emoji: '🧑', color: '#15803d' },
]

export const combinationsVsPermutationsLesson: Lesson = {
  id: 'combinations-vs-permutations',
  title: 'Combinations vs Permutations',
  description: 'When does order matter? Learn to choose subsets without overcounting.',
  hook: 'Picking a 3-person committee from 10 — does the order you pick them matter?',
  estimatedMinutes: 13,
  prerequisites: ['identical-objects'],
  concepts: ['combinations', 'permutation', 'counting-principle'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Order Matters — Or Does It?',
      body: 'Two situations sound similar but count differently. Awarding Gold, Silver, and Bronze to 3 of 5 runners depends on the ORDER (who gets which medal). Picking a 3-person committee from 5 does NOT — a committee is just a group, no order.',
      prompt: 'Permutations count ordered selections; combinations count unordered ones. Let’s see the difference.',
      nextButtonLabel: 'Show me',
    },
    {
      id: 'identify-order',
      type: 'multiple-choice',
      title: 'Does Order Matter?',
      body: 'A club has 8 members. They will choose 3 of them to be President, Vice-President, and Treasurer — three different titled roles.',
      prompt: 'When choosing 3 of 8 members for three DIFFERENT roles (President, VP, Treasurer), does the order of selection matter?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Yes — different roles means order matters (a permutation)',
          'No — it is just a group of 3 (a combination)',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Different titled roles make the assignments distinct, so order matters — this is a permutation.',
        misconceptionTags: ['order-confusion'],
      },
      feedback: {
        correct: 'Right! Distinct roles ⇒ order matters ⇒ permutation.',
        incorrect: 'Since the three roles are different, swapping who is President vs Treasurer is a new outcome.',
        choiceFeedback: {
          'No — it is just a group of 3 (a combination)':
            'If the three roles were identical it would be a combination — but President, VP, and Treasurer are different.',
        },
        hint: 'Picture actually swapping two of the chosen people between roles. If that produces a genuinely different outcome, order matters and it is a permutation; if it is still the same group, it is a combination.',
        computationHint: 'Swap President and Treasurer: those two people now hold different titles, so it counts as a new outcome — order matters, making this a permutation.',
      },
      concepts: ['permutation', 'combinations'],
    },
    {
      id: 'permutation-count',
      type: 'numeric-question',
      title: 'Ordered Selection (nPr)',
      body: 'For an ordered selection of k from n, multiply the choices: n × (n−1) × … for k stages. You are awarding Gold, Silver, and Bronze medals to 3 of 5 runners — the order (which medal) matters.',
      prompt: 'How many ways can 3 of 5 runners receive Gold, Silver, and Bronze?',
      question: {
        inputType: 'numeric',
        correctAnswer: 60,
        tolerance: 0,
        explanation: '5 × 4 × 3 = 60 ordered ways (this is 5P3).',
        misconceptionTags: ['nPr'],
      },
      feedback: {
        correct: 'Yes! 5 × 4 × 3 = 60. That is 5P3, an ordered selection.',
        incorrect: 'Three medals, in order: 5 choices for Gold, 4 left for Silver, 3 for Bronze.',
        hint: 'Order matters here, so it is a permutation: award the medals one at a time, and each medal you give out shrinks the pool of remaining runners. Multiply the choices available at each stage.',
        computationHint: '5 choices for Gold × 4 for Silver × 3 for Bronze = 60.',
      },
      concepts: ['permutation', 'counting-principle'],
    },
    {
      id: 'condense-teams',
      type: 'condensing',
      title: 'Spot the Overcounting',
      body: 'Take one team — Ana, Ben, and Cara. As an ORDERED selection (like medals) these 3 people produce 3! = 6 different arrangements. But as a TEAM, order does not matter, so all 6 are the same team. Draw the arrows to see every ordering point to that one team.',
      condensingConfig: {
        items: teamOf3,
        groupLabel: 'team',
      },
      feedback: {
        correct:
          'All 6 orderings collapse into 1 team. So the 60 ordered selections counted every team 3! = 6 times — divide by 6 to fix it.',
        incorrect: '',
        hint: 'Because a team has no order, every rearrangement of the same 3 people is really one and the same team. Map each ordering back to the single team it forms.',
        computationHint: 'The 3 people can be ordered in 3! = 6 ways, and all 6 of those orderings point to the same 1 team.',
      },
      concepts: ['combinations', 'permutation'],
    },
    {
      id: 'overcount-idea',
      type: 'numeric-question',
      title: 'From Ordered to Unordered',
      body: 'You just saw that the same 3 runners can be ordered in 3! = 6 ways, and all 6 are the same team. So among the 60 ordered selections, each unordered team is repeated.',
      prompt: 'Each unordered team of 3 was counted how many times among the 60 ordered selections? Enter the number.',
      question: {
        inputType: 'numeric',
        correctAnswer: 6,
        tolerance: 0,
        explanation: '3 chosen people can be ordered in 3! = 6 ways, so each team was counted 6 times.',
        misconceptionTags: ['divide-by-k-factorial'],
      },
      feedback: {
        correct: 'Exactly — 3! = 6 orderings of the same 3 people, so divide by 6.',
        incorrect: 'How many ways can you order 3 chosen people? That is 3! = 3 × 2 × 1.',
        hint: 'Order does not matter for a team, so count how many ordered versions of one fixed group of 3 exist — that is how many ordered selections all describe the very same team.',
        computationHint: 'Arrange 3 chosen people: 3! = 3 × 2 × 1 = 6, so each team was counted 6 times.',
      },
      concepts: ['combinations', 'permutation'],
    },
    {
      id: 'combination-count',
      type: 'numeric-question',
      title: 'Unordered Selection (nCr)',
      body: 'To count unordered selections, take the ordered count and divide by k! (the orderings of the chosen group). Picking a team of 3 from 5 runners: ordered count is 5 × 4 × 3 = 60, and each team repeats 3! = 6 times.',
      prompt: 'How many different teams of 3 can be chosen from 5 runners (order does not matter)?',
      question: {
        inputType: 'numeric',
        correctAnswer: 10,
        tolerance: 0,
        explanation: '5C3 = (5 × 4 × 3) ÷ 3! = 60 ÷ 6 = 10 teams.',
        misconceptionTags: ['nCr'],
      },
      feedback: {
        correct: 'Yes! 60 ÷ 6 = 10 teams. That is 5C3.',
        incorrect: 'Divide the 60 ordered selections by 3! = 6 repeats.',
        hint: 'Order does not matter, so start from the ordered count and strip out the duplicates: divide by the number of ways each chosen group of 3 could be arranged (k!).',
        computationHint: '(5 × 4 × 3) ÷ 3! = 60 ÷ 6 = 10 teams.',
      },
      concepts: ['combinations'],
    },
    {
      id: 'committee-ten',
      type: 'numeric-question',
      title: 'The Committee',
      body: 'General rule: nCr = (n × (n−1) × … for k terms) ÷ k!. You want to choose a 3-person committee from 10 people, and the committee has no ordering.',
      prompt: 'How many 3-person committees can be formed from 10 people?',
      question: {
        inputType: 'numeric',
        correctAnswer: 120,
        tolerance: 0,
        explanation: '10C3 = (10 × 9 × 8) ÷ 6 = 720 ÷ 6 = 120 committees.',
        misconceptionTags: ['nCr'],
      },
      feedback: {
        correct: 'Excellent! 720 ÷ 6 = 120 committees.',
        incorrect: 'Top: 10 × 9 × 8 = 720. Bottom: 3! = 6. Then divide.',
        hint: 'A committee has no order, so it is a combination: build the ordered count of 3 from the group, then divide out the 3! ways each committee could have been arranged.',
        computationHint: '(10 × 9 × 8) ÷ 3! = 720 ÷ 6 = 120 committees.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('committee-n', 8, 12)
        const top = fallingValue(n, 3)
        const value = top / 6
        return {
          body: `General rule: nCr = (n × (n−1) × … for k terms) ÷ k!. You want to choose a 3-person committee from ${n} people, and the committee has no ordering.`,
          prompt: `How many 3-person committees can be formed from ${n} people?`,
          question: { correctAnswer: value, explanation: `${n}C3 = (${fallingProduct(n, 3)}) ÷ 6 = ${top} ÷ 6 = ${value} committees.` },
          feedback: {
            correct: `Excellent! ${top} ÷ 6 = ${value} committees.`,
            incorrect: `Top: ${fallingProduct(n, 3)} = ${top}. Bottom: 3! = 6. Then divide.`,
            hint: 'A committee has no order, so it is a combination: build the ordered count of 3 from the group, then divide out the 3! ways each committee could have been arranged.',
            computationHint: `(${fallingProduct(n, 3)}) ÷ 3! = ${top} ÷ 6 = ${value} committees.`,
          },
        }
      },
      concepts: ['combinations', 'counting-principle'],
    },
    {
      id: 'pizza-toppings',
      type: 'multiple-choice',
      title: 'Which Is a Combination?',
      body: 'A combination is an unordered selection; a permutation is ordered.',
      prompt: 'Which situation is a COMBINATION (order does not matter)?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Choosing 2 pizza toppings out of 6',
          'Awarding 1st and 2nd place to 6 racers',
          'Arranging 6 books on a shelf',
          'Picking a 4-digit PIN',
        ],
        correctChoiceIndex: 0,
        explanation: 'Two toppings form an unordered set — pepperoni+mushroom is the same as mushroom+pepperoni.',
        misconceptionTags: ['order-confusion'],
      },
      feedback: {
        correct: 'Right — two toppings are an unordered set, so it is a combination.',
        incorrect: 'Look for the case where swapping the two picks gives the SAME result.',
        hint: 'A combination is unordered: test each option by reordering the picks and see which one ends up identical. The case unchanged by reordering is the combination.',
        computationHint: 'Pepperoni + mushroom is the same as mushroom + pepperoni, so choosing 2 toppings out of 6 is the unordered case — the combination.',
      },
      concepts: ['combinations'],
    },
    {
      id: 'books-5c2',
      type: 'numeric-question',
      title: 'Two Books',
      body: 'You will grab 2 books to take from a shelf of 5. Order does not matter — you just end up with 2 books.',
      prompt: 'How many ways can you choose 2 books from a shelf of 5 (order does not matter)?',
      question: {
        inputType: 'numeric',
        correctAnswer: 10,
        tolerance: 0,
        explanation: '5C2 = (5 × 4) ÷ 2! = 20 ÷ 2 = 10.',
        misconceptionTags: ['nCr'],
      },
      feedback: {
        correct: 'Yes — 20 ÷ 2 = 10.',
        incorrect: 'Ordered count is 5 × 4 = 20; divide by 2! = 2. (20 would forget to divide.)',
        hint: 'Grabbing 2 books is unordered, so it is a combination: take the ordered count of 2 from the shelf, then divide by the 2! orderings of each chosen pair.',
        computationHint: '(5 × 4) ÷ 2! = 20 ÷ 2 = 10.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('choose2-n', 5, 9)
        const top = fallingValue(n, 2)
        const value = top / 2
        return {
          body: `You will grab 2 books to take from a shelf of ${n}. Order does not matter — you just end up with 2 books.`,
          prompt: `How many ways can you choose 2 books from a shelf of ${n} (order does not matter)?`,
          question: { correctAnswer: value, explanation: `${n}C2 = (${fallingProduct(n, 2)}) ÷ 2! = ${top} ÷ 2 = ${value}.` },
          feedback: {
            correct: `Yes — ${top} ÷ 2 = ${value}.`,
            incorrect: `Ordered count is ${fallingProduct(n, 2)} = ${top}; divide by 2! = 2. (${top} would forget to divide.)`,
            hint: 'Grabbing 2 books is unordered, so it is a combination: take the ordered count of 2 from the shelf, then divide by the 2! orderings of each chosen pair.',
            computationHint: `(${fallingProduct(n, 2)}) ÷ 2! = ${top} ÷ 2 = ${value}.`,
          },
        }
      },
      concepts: ['combinations'],
    },
    {
      id: 'lottery-2of6',
      type: 'numeric-question',
      title: 'Pick Two',
      body: 'A mini-raffle draws 2 winning numbers out of 6, and the order they are drawn does not matter.',
      prompt: 'How many different pairs of 2 numbers can be drawn from 6?',
      question: {
        inputType: 'numeric',
        correctAnswer: 15,
        tolerance: 0,
        explanation: '6C2 = (6 × 5) ÷ 2! = 30 ÷ 2 = 15.',
        misconceptionTags: ['nCr'],
      },
      feedback: {
        correct: 'Yes! 30 ÷ 2 = 15 pairs.',
        incorrect: 'Ordered count is 6 × 5 = 30; divide by 2! = 2.',
        hint: 'The draw order does not matter, so it is a combination: form the ordered count of 2 from the pool, then divide by the 2! ways each pair could have been drawn.',
        computationHint: '(6 × 5) ÷ 2! = 30 ÷ 2 = 15 pairs.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('choose2-n', 5, 9)
        const top = fallingValue(n, 2)
        const value = top / 2
        return {
          body: `A mini-raffle draws 2 winning numbers out of ${n}, and the order they are drawn does not matter.`,
          prompt: `How many different pairs of 2 numbers can be drawn from ${n}?`,
          question: { correctAnswer: value, explanation: `${n}C2 = (${fallingProduct(n, 2)}) ÷ 2! = ${top} ÷ 2 = ${value}.` },
          feedback: {
            correct: `Yes! ${top} ÷ 2 = ${value} pairs.`,
            incorrect: `Ordered count is ${fallingProduct(n, 2)} = ${top}; divide by 2! = 2.`,
            hint: 'The draw order does not matter, so it is a combination: form the ordered count of 2 from the pool, then divide by the 2! ways each pair could have been drawn.',
            computationHint: `(${fallingProduct(n, 2)}) ÷ 2! = ${top} ÷ 2 = ${value} pairs.`,
          },
        }
      },
      concepts: ['combinations'],
    },
    {
      id: 'lineup-4',
      type: 'numeric-question',
      title: 'Lining Up',
      body: 'Lining 4 people up in a row is an ordered arrangement — each position is different, so this is a permutation, not a combination.',
      prompt: 'How many ways can 4 people line up in a row (order matters)?',
      question: {
        inputType: 'numeric',
        correctAnswer: 24,
        tolerance: 0,
        explanation: '4! = 4 × 3 × 2 × 1 = 24 orderings.',
        misconceptionTags: ['permutation'],
      },
      feedback: {
        correct: 'Right — lining up is ordered, so 4! = 24.',
        incorrect: 'Lining up = ordered = 4! = 4 × 3 × 2 × 1.',
        hint: 'Each spot in the row is a distinct position, so order matters — this is a permutation that uses everyone. Multiply the shrinking number of choices for each spot in the line.',
        computationHint: '4! = 4 × 3 × 2 × 1 = 24 orderings.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('lineup-n', 4, 6)
        const value = factorial(n)
        return {
          body: `Lining ${n} people up in a row is an ordered arrangement — each position is different, so this is a permutation, not a combination.`,
          prompt: `How many ways can ${n} people line up in a row (order matters)?`,
          question: { correctAnswer: value, explanation: `${n}! = ${descendingProduct(n)} = ${value} orderings.` },
          feedback: {
            correct: `Right — lining up is ordered, so ${n}! = ${value}.`,
            incorrect: `Lining up = ordered = ${n}! = ${descendingProduct(n)}.`,
            hint: 'Each spot in the row is a distinct position, so order matters — this is a permutation that uses everyone. Multiply the shrinking number of choices for each spot in the line.',
            computationHint: `${n}! = ${descendingProduct(n)} = ${value} orderings.`,
          },
        }
      },
      concepts: ['permutation'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned to tell permutations (order matters) from combinations (order does not), and to convert between them by dividing out the k! orderings of the chosen group.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
