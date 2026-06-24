import type { Lesson } from './types'
import { joinTimes, product } from './randomize'

const shirts = [
  { id: 'shirt-red', label: 'Red shirt', emoji: '👕', color: '#ef4444' },
  { id: 'shirt-blue', label: 'Blue shirt', emoji: '👕', color: '#3b82f6' },
  { id: 'shirt-green', label: 'Green shirt', emoji: '👕', color: '#22c55e' },
]

const socks = [
  { id: 'socks-white', label: 'White socks', emoji: '🧦', color: '#64748b' },
  { id: 'socks-stripe', label: 'Striped socks', emoji: '🧦', color: '#a855f7' },
]

export const countingPrincipleLesson: Lesson = {
  id: 'counting-principle-lines',
  title: 'The Counting Principle',
  description:
    'Discover why you multiply: connect items between groups and watch the combinations add up.',
  hook: '3 shirts and 2 pairs of socks. How many different outfits can you make?',
  estimatedMinutes: 10,
  prerequisites: [],
  concepts: ['counting-principle'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Getting Dressed',
      body: 'You have 3 shirts and 2 pairs of socks. An "outfit" is one shirt paired with one pair of socks. You want to know how many different outfits you can put together.',
      prompt: 'Before counting: do you think there are more or fewer than 10 outfits?',
      nextButtonLabel: 'Let me pair them up',
    },
    {
      id: 'connect-outfits',
      type: 'connection',
      title: 'Make Every Outfit',
      body: 'Connect each of the 3 shirts to each of the 2 pairs of socks. Every line you draw is one outfit. Find all of them.',
      connectionConfig: {
        leftLabel: 'Shirts',
        rightLabel: 'Socks',
        leftItems: shirts,
        rightItems: socks,
        pairingLabel: 'outfit',
      },
      feedback: {
        correct:
          'Every shirt connects to all 2 sock choices: 3 shirts × 2 socks = 6 outfits. That is the counting principle.',
        incorrect: '',
        hint: 'Think of it in stages: pick a shirt first, then a sock. Every shirt can be worn with every sock, so the choices don’t add together — each shirt branches into a fresh set of sock options.',
        computationHint: 'Draw 2 lines from each shirt (one per sock). With 3 shirts that’s 3 groups of 2 lines: 3 × 2 = 6 outfits.',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'count-outfits',
      type: 'multiple-choice',
      title: 'Count the Outfits',
      body: 'You just paired 3 shirts with 2 pairs of socks, where an outfit is one shirt plus one pair of socks.',
      prompt: 'With 3 shirts and 2 pairs of socks, how many different outfits can you make?',
      question: {
        inputType: 'multiple-choice',
        choices: ['5', '6', '8', '9'],
        correctChoiceIndex: 1,
        explanation: 'Each of the 3 shirts pairs with 2 sock choices: 3 × 2 = 6 outfits.',
        misconceptionTags: ['add-instead-of-multiply'],
      },
      feedback: {
        correct: 'Right! 3 × 2 = 6. You multiply the choices at each stage.',
        incorrect: 'Each shirt can go with every pair of socks — so multiply, do not add.',
        choiceFeedback: {
          '5': 'That looks like 3 + 2. But each shirt pairs with BOTH socks, so multiply: 3 × 2.',
          '8': 'Check the count of lines you drew — there were 6, one per shirt-sock pair.',
          '9': 'That would be 3 × 3, but there are only 2 sock choices.',
        },
        hint: 'Each shirt branches into one line per sock, so you’re repeating a whole set of sock choices for every shirt. Repeated sets mean multiply, not add.',
        computationHint: '3 shirts × 2 socks = 6 outfits.',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'add-vs-multiply',
      type: 'multiple-choice',
      title: 'Add or Multiply?',
      body: 'You are building one outcome out of two independent stages — first pick a shirt, then pick socks.',
      prompt: 'When you build something in two independent stages, how do you find the total number of outcomes?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Multiply the number of choices at each stage',
          'Add the number of choices at each stage',
          'Subtract the smaller from the larger',
          'Take the larger of the two',
        ],
        correctChoiceIndex: 0,
        explanation: 'The counting principle: multiply the choices at each independent stage.',
        misconceptionTags: ['add-instead-of-multiply'],
      },
      feedback: {
        correct: 'Yes — multiply the choices at each stage.',
        incorrect: 'Each choice in the first stage pairs with every choice in the second stage, so multiply.',
        hint: 'Picture a tree: each first-stage choice splits into a full set of second-stage choices. That branching — one whole set repeated per earlier choice — is exactly what multiplication captures.',
        computationHint: 'For two independent stages with a and b choices, the total is a × b — e.g. 3 shirts × 2 socks = 6.',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'generalize-two',
      type: 'product-grid',
      title: 'A Bigger Wardrobe',
      body: 'Now build a bigger wardrobe: 4 shirts and 3 pairs of pants, where an outfit is one shirt with one pair of pants. Tap each shirt to pair it with all 3 pants and watch the grid of outfits fill in.',
      productGridConfig: {
        rowLabel: 'shirt',
        colLabel: 'pant',
        rows: 4,
        cols: 3,
        rowEmoji: '👕',
        colEmoji: '👖',
        pairingLabel: 'outfit',
      },
      feedback: {
        correct:
          'Every shirt pairs with all 3 pants: 4 shirts × 3 pants = 12 outfits. Each new shirt adds a whole row of 3, so the counts multiply.',
        incorrect: '',
        hint: 'Each shirt branches into a full row of pant choices, so you repeat the same 3 options for every shirt — repeated sets multiply.',
        computationHint: '4 shirts × 3 pants = 12 outfits (four rows of three).',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'coffee-order',
      type: 'numeric-question',
      title: 'Coffee Counter',
      body: 'A coffee shop lets you choose 1 of 4 cup sizes and 1 of 3 flavors. A drink is one size with one flavor.',
      prompt: 'How many different drinks can be ordered with 4 sizes and 3 flavors?',
      question: {
        inputType: 'numeric',
        correctAnswer: 12,
        tolerance: 0,
        explanation: '4 sizes × 3 flavors = 12 drinks.',
        misconceptionTags: ['counting-principle'],
      },
      feedback: {
        correct: 'Right! 4 × 3 = 12 drinks.',
        incorrect: 'Multiply the two stages: 4 sizes × 3 flavors (7 would be adding them).',
        hint: 'Each size can be matched with any flavor, so the flavor choices repeat in full for every size. When one stage repeats inside another, that’s a multiplication, not a sum.',
        computationHint: '4 sizes × 3 flavors = 12 drinks.',
      },
      randomize: (r) => {
        const [a, b] = r.factorPair('mult2', 2, 5)
        const total = a * b
        return {
          body: `A coffee shop lets you choose 1 of ${a} cup sizes and 1 of ${b} flavors. A drink is one size with one flavor.`,
          prompt: `How many different drinks can be ordered with ${a} sizes and ${b} flavors?`,
          question: { correctAnswer: total, explanation: `${a} sizes × ${b} flavors = ${total} drinks.` },
          feedback: {
            correct: `Right! ${a} × ${b} = ${total} drinks.`,
            incorrect: `Multiply the two stages: ${a} sizes × ${b} flavors (${a + b} would be adding them).`,
            hint: 'Each size can be matched with any flavor, so the flavor choices repeat in full for every size. When one stage repeats inside another, that’s a multiplication, not a sum.',
            computationHint: `${a} sizes × ${b} flavors = ${total} drinks.`,
          },
        }
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'tree-burger',
      type: 'tree',
      title: 'Branch It Out',
      body: 'Build a burger by choosing a bun, a patty, and a cheese — one of each. Tap “Branch out” to grow the tree. Each path from Start to a leaf is one unique burger, so the number of paths is the number of choices we have.',
      treeConfig: {
        pairingLabel: 'burger',
        stages: [
          {
            label: 'Bun',
            options: [
              { id: 'sesame', label: 'Sesame', emoji: '🍔', color: '#f59e0b' },
              { id: 'plain', label: 'Plain', emoji: '🍞', color: '#a16207' },
            ],
          },
          {
            label: 'Patty',
            options: [
              { id: 'beef', label: 'Beef', emoji: '🥩', color: '#b91c1c' },
              { id: 'veggie', label: 'Veggie', emoji: '🥬', color: '#16a34a' },
            ],
          },
          {
            label: 'Cheese',
            options: [
              { id: 'cheddar', label: 'Cheddar', emoji: '🧀', color: '#eab308' },
              { id: 'swiss', label: 'Swiss', emoji: '🧀', color: '#d6d3d1' },
            ],
          },
        ],
      },
      feedback: {
        correct:
          'Each path is one unique choice, so the number of paths is how many burgers we can build. There are 8 leaves at the end of the tree — 2 buns × 2 patties × 2 cheeses = 8 burgers.',
        incorrect: '',
        hint: 'Each stage multiplies the paths so far: every half-built burger reaching a station splits into a full fan of the next choices. Count leaves, not stations.',
        computationHint: '2 buns × 2 patties × 2 cheeses = 8 paths (the 8 leaves at the bottom).',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'burger-count',
      type: 'numeric-question',
      title: 'Count the Burgers',
      body: 'You just branched out a burger with 2 buns, 2 patties, and 2 cheeses, choosing one of each.',
      prompt: 'How many different burgers can you build from 2 buns, 2 patties, and 2 cheeses?',
      question: {
        inputType: 'numeric',
        correctAnswer: 8,
        tolerance: 0,
        explanation: '2 × 2 × 2 = 8 burgers — multiply the choices at all three stages.',
        misconceptionTags: ['counting-principle'],
      },
      feedback: {
        correct: 'Exactly! 2 × 2 × 2 = 8 burgers.',
        incorrect: 'Multiply all three stages: 2 × 2 × 2.',
        hint: 'Three independent stages chain together — every completed bun-and-patty pair branches again at the cheese stage. Keep multiplying as stages add on.',
        computationHint: '2 buns × 2 patties × 2 cheeses = 8 burgers.',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'generalize-three',
      type: 'numeric-question',
      title: 'Three Stages',
      body: 'A lunch combo is built from 2 sandwiches, 3 drinks, and 2 desserts, choosing exactly one of each.',
      prompt: 'How many different lunch combos can you build from 2 sandwiches, 3 drinks, and 2 desserts?',
      question: {
        inputType: 'numeric',
        correctAnswer: 12,
        tolerance: 0,
        explanation: '2 × 3 × 2 = 12 combos: multiply the choices at all three stages.',
        misconceptionTags: ['counting-principle'],
      },
      feedback: {
        correct: 'Exactly! 2 × 3 × 2 = 12 combos.',
        incorrect: 'Multiply all three stages together: 2 × 3 × 2.',
        hint: 'Add a stage and you just multiply once more — the running total branches again for every new choice. Build it up two stages at a time.',
        computationHint: 'First 2 × 3 = 6 sandwich-drink pairs, then each pairs with 2 desserts: 6 × 2 = 12 combos.',
      },
      randomize: (r) => {
        const [a, b, c] = r.factorTriple('mult3', 2, 4)
        const total = product([a, b, c])
        const expr = joinTimes([a, b, c])
        return {
          body: `A lunch combo is built from ${a} sandwiches, ${b} drinks, and ${c} desserts, choosing exactly one of each.`,
          prompt: `How many different lunch combos can you build from ${a} sandwiches, ${b} drinks, and ${c} desserts?`,
          question: { correctAnswer: total, explanation: `${expr} = ${total} combos: multiply the choices at all three stages.` },
          feedback: {
            correct: `Exactly! ${expr} = ${total} combos.`,
            incorrect: `Multiply all three stages together: ${expr}.`,
            hint: 'Add a stage and you just multiply once more — the running total branches again for every new choice. Build it up two stages at a time.',
            computationHint: `First ${a} × ${b} = ${a * b} sandwich-drink pairs, then each pairs with ${c} desserts: ${a * b} × ${c} = ${total} combos.`,
          },
        }
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'tshirt-three',
      type: 'numeric-question',
      title: 'Custom T-Shirt',
      body: 'A custom T-shirt is made by choosing 1 of 3 colors, 1 of 2 sizes, and 1 of 2 sleeve styles.',
      prompt: 'How many different T-shirts can be made from 3 colors, 2 sizes, and 2 sleeve styles?',
      question: {
        inputType: 'numeric',
        correctAnswer: 12,
        tolerance: 0,
        explanation: '3 × 2 × 2 = 12 different T-shirts.',
        misconceptionTags: ['counting-principle'],
      },
      feedback: {
        correct: 'Yes! 3 × 2 × 2 = 12 T-shirts.',
        incorrect: 'Multiply the three stages: 3 colors × 2 sizes × 2 styles.',
        hint: 'Color, size, and sleeve are three independent choices that chain in stages — each new attribute branches every shirt you’ve built so far.',
        computationHint: '3 colors × 2 sizes = 6, then × 2 styles = 12 T-shirts.',
      },
      randomize: (r) => {
        const [a, b, c] = r.factorTriple('mult3', 2, 4)
        const total = product([a, b, c])
        const expr = joinTimes([a, b, c])
        return {
          body: `A custom T-shirt is made by choosing 1 of ${a} colors, 1 of ${b} sizes, and 1 of ${c} sleeve styles.`,
          prompt: `How many different T-shirts can be made from ${a} colors, ${b} sizes, and ${c} sleeve styles?`,
          question: { correctAnswer: total, explanation: `${expr} = ${total} different T-shirts.` },
          feedback: {
            correct: `Yes! ${expr} = ${total} T-shirts.`,
            incorrect: `Multiply the three stages: ${a} colors × ${b} sizes × ${c} styles.`,
            hint: 'Color, size, and sleeve are three independent choices that chain in stages — each new attribute branches every shirt you’ve built so far.',
            computationHint: `${a} × ${b} = ${a * b}, then × ${c} = ${total} T-shirts.`,
          },
        }
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'diner-meals',
      type: 'product-grid',
      title: 'At the Diner',
      body: 'A diner offers 4 main dishes and 3 drinks, where a meal is one main with one drink. Tap each main to pair it with all 3 drinks and watch the meals add up.',
      productGridConfig: {
        rowLabel: 'main',
        colLabel: 'drink',
        rows: 4,
        cols: 3,
        rowEmoji: '🍽️',
        colEmoji: '🥤',
        pairingLabel: 'meal',
      },
      feedback: {
        correct:
          'Every main pairs with all 3 drinks: 4 mains × 3 drinks = 12 meals. Each new main adds another full row of drinks, so the counts multiply.',
        incorrect: '',
        hint: 'Each main can be paired with any drink, so the full set of drinks repeats for every main — repeated sets multiply.',
        computationHint: '4 mains × 3 drinks = 12 meals (four rows of three).',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'password',
      type: 'numeric-question',
      title: 'Letter + Digit',
      body: 'A simple code is 1 letter (26 options A–Z) followed by 1 digit (10 options 0–9).',
      prompt: 'How many such codes exist with 26 letter options and 10 digit options?',
      question: {
        inputType: 'numeric',
        correctAnswer: 260,
        tolerance: 0,
        explanation: '26 letters × 10 digits = 260 codes.',
        misconceptionTags: ['counting-principle'],
      },
      feedback: {
        correct: 'Yes! 26 × 10 = 260.',
        incorrect: 'Multiply the two stages: 26 × 10 (36 would be adding them).',
        hint: 'Two independent slots: every one of the 26 letters can be followed by any of the 10 digits, so the digit options repeat in full for each letter.',
        computationHint: '26 letters × 10 digits = 260 codes.',
      },
      concepts: ['counting-principle'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You discovered the fundamental counting principle: when a task has independent stages, multiply the number of choices at each stage to get the total number of outcomes.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
