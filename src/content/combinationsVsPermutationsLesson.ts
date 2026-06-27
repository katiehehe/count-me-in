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
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'worked-choose',
      type: 'worked-example',
      title: 'Watch Me Count One',
      body: 'Let me show why order changes the count — choosing 2 of 3 friends: Ana, Ben, Cara.',
      workedExampleConfig: {
        kind: 'tree',
        voice: 'nova',
        tree: {
          orderedLabel: 'Order matters',
          groupedLabel: 'Just a team',
          ordered: ['AB', 'BA', 'AC', 'CA', 'BC', 'CB'],
          grouped: ['AB', 'AC', 'BC'],
          divideBy: 2,
        },
        script: [
          {
            say: 'Our job is to count how many different two-person teams we can choose from Ana, Ben, and Cara — and to see why order changes the count.',
            highlight: 'ordered',
          },
          {
            say: 'If order matters — a first pick then a second — there are six ordered ways: A then B counts apart from B then A.',
            highlight: 'ordered',
          },
          {
            say: 'But a team has no order, so A-and-B is the same team as B-and-A. Each team got counted twice, once for each of the two orders.',
            highlight: 'grouped',
          },
          {
            say: 'So we divide the six ordered ways by two: six divided by two equals three different teams.',
            highlight: 'product',
          },
        ],
      },
      concepts: ['combinations', 'permutation'],
    },
    {
      id: 'condense-identical',
      type: 'multiset-condense',
      title: 'Same Order, Different Count',
      body: 'Here is the key idea behind combinations, shown with 4 cards: 2 red and 2 blue, numbered 1–4. Step through it yourself: first generate the 24 numbered orderings, then drop the numbers, then draw the arrows that condense the matching ones. Watch how each pattern ends up counted 2! × 2! = 4 times.',
      multisetCondenseConfig: {
        groups: [
          { label: 'Red', color: '#dc2626', count: 2 },
          { label: 'Blue', color: '#2563eb', count: 2 },
        ],
      },
      feedback: {
        correct:
          'Each distinct red/blue pattern came from 2! × 2! = 4 numbered orderings, so 24 ÷ 4 = 6 truly different arrangements. Ignoring order means dividing out those repeats — exactly what combinations do.',
        incorrect: '',
        hint: 'Swapping the two reds (or the two blues) does not change how a row looks once the numbers are gone, so each look gets counted several times.',
        computationHint: '24 ÷ (2! × 2!) = 24 ÷ 4 = 6 distinct arrangements.',
      },
      concepts: ['combinations', 'permutation'],
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
      type: 'factorial-discovery',
      title: 'Ordered Selection (nPr)',
      body: 'You are awarding Gold, Silver, and Bronze medals to 3 of 5 runners — order (which medal) matters. Fill one box per medal: how many runners could take Gold, then how many are left for Silver, then for Bronze.',
      factorialConfig: {
        itemLabel: 'runner',
        count: 5,
        slots: 3,
      },
      feedback: {
        correct:
          '5 × 4 × 3 = 60 ordered ways — that is 5P3. Each medal you award leaves one fewer runner for the next.',
        incorrect: '',
        hint: 'Order matters, so award the medals one at a time: each medal you give out shrinks the pool of remaining runners. Multiply the choices at each stage.',
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
      body: 'Picking 3 of 5 runners in order gives 60 ordered selections. Any single team of 3 can be lined up in several different orders.',
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
      body: 'You are choosing a team of 3 from 5 runners, where the order you pick them does not matter.',
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
      body: 'You want to choose a 3-person committee from 10 people, where the order you pick them does not matter.',
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
          body: `You want to choose a 3-person committee from ${n} people, where the order you pick them does not matter.`,
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
      body: 'Each situation below selects some items; in some the order matters and in some it does not.',
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
      body: 'You line 4 people up in a row, where each position is different and order matters.',
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
          body: `You line ${n} people up in a row, where each position is different and order matters.`,
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
