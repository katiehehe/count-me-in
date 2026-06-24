import type { Lesson } from './types'
import { factorial } from './randomize'

// Distinct-colored beads for the review section. No emoji → rendered as real
// draggable spheres by ArrangementBoard.
const distinctBeads = [
  { id: 'ruby', label: 'Ruby', color: '#ef4444' },
  { id: 'sky', label: 'Sky', color: '#3b82f6' },
  { id: 'lime', label: 'Lime', color: '#22c55e' },
]

// Two identical red beads + one blue bead. Same `kind` = visually identical.
const repeatBeads = [
  { id: 'red-1', label: 'Red', color: '#ef4444', kind: 'red' },
  { id: 'red-2', label: 'Red', color: '#ef4444', kind: 'red' },
  { id: 'blue-1', label: 'Blue', color: '#3b82f6', kind: 'blue' },
]

// Two reds + two blues, identical within each color.
const twoTwoBeads = [
  { id: 'red-a', label: 'Red', color: '#ef4444', kind: 'red' },
  { id: 'red-b', label: 'Red', color: '#ef4444', kind: 'red' },
  { id: 'blue-a', label: 'Blue', color: '#3b82f6', kind: 'blue' },
  { id: 'blue-b', label: 'Blue', color: '#3b82f6', kind: 'blue' },
]

export const identicalObjectsLesson: Lesson = {
  id: 'identical-objects',
  title: 'Arranging Identical Objects',
  description:
    'String beads on a bracelet and discover what changes when some of them look exactly the same.',
  hook: 'Two red beads and one blue bead — how many bracelets actually look different?',
  estimatedMinutes: 13,
  prerequisites: ['arranging-distinct-objects'],
  concepts: ['permutation', 'identical-objects', 'multiset-permutation', 'factorial'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Beads on a String',
      body: 'You are threading colored beads onto a string to make a pattern. In the last lesson every object was distinct. Now some beads will be exactly the same color — and that changes how we count.',
      prompt: 'Does swapping two beads of the same color create a new pattern?',
      nextButtonLabel: 'Let me arrange some beads',
    },
    {
      id: 'explore-distinct',
      type: 'arrangement',
      title: 'Warm-Up: All Different',
      body: 'First a quick review. These three beads are all different colors. Rearrange them to recall how permutations of distinct objects work.',
      prompt: 'Drag beads between slots to find different patterns.',
      arrangementConfig: {
        items: distinctBeads,
        targetCount: 6,
        goalCount: 4,
      },
      feedback: {
        correct: 'Just like before: 3 distinct beads make 3! = 6 different patterns.',
        incorrect: 'Keep going — there are more orderings to find.',
        hint: 'Be systematic so you never miss or repeat a pattern: fix which bead sits in the first slot, run through the orderings of the remaining two, then change the first slot.',
        computationHint: '3 distinct beads → 3! = 3 × 2 × 1 = 6 different patterns.',
      },
      concepts: ['permutation', 'distinct-objects'],
    },
    {
      id: 'count-distinct',
      type: 'numeric-question',
      title: 'How Many So Far?',
      body: 'You have three beads, each a different color.',
      prompt: 'How many different patterns can 3 distinct beads make?',
      question: {
        inputType: 'numeric',
        correctAnswer: 6,
        tolerance: 0,
        explanation: '3! = 3 × 2 × 1 = 6 distinct patterns.',
      },
      feedback: {
        correct: 'Right — 3! = 6. Now let us make two beads identical.',
        incorrect: 'Remember 3! from the last lesson: 3 × 2 × 1.',
        hint: 'Every bead is a different color, so nothing repeats — this is a plain permutation of distinct objects. Multiply the number of choices available for each slot in turn.',
        computationHint: '3! = 3 × 2 × 1 = 6.',
      },
      concepts: ['permutation', 'factorial'],
    },
    {
      id: 'explore-identical',
      type: 'arrangement',
      title: 'Now Two Look the Same',
      body: 'Swap one bead out: now you have two RED beads and one BLUE bead. Try rearranging. Watch the counter — swapping the two reds with each other does NOT make a new pattern, because they look identical.',
      prompt: 'Drag the beads around. How many patterns actually look different?',
      arrangementConfig: {
        items: repeatBeads,
        targetCount: 3,
        goalCount: 3,
        keyByKind: true,
      },
      feedback: {
        correct:
          'Only 3 patterns look different! Swapping the two red beads with each other makes an EXACT copy you have already seen — so each look got counted twice, once for each of the 2! = 2 ways to order the identical reds.',
        incorrect: 'There are 3 distinct-looking patterns. Where can the single blue bead go?',
        hint: 'The two reds are interchangeable, so a pattern is completely determined by where the single blue bead sits. Count the distinct spots the blue can take.',
        computationHint: 'The blue bead can sit in slot 1, 2, or 3 → 3 distinct patterns (equivalently 3! ÷ 2! = 6 ÷ 2 = 3).',
      },
      concepts: ['identical-objects', 'permutation'],
    },
    {
      id: 'count-identical',
      type: 'multiple-choice',
      title: 'Why Not Six?',
      body: 'You have two identical red beads and one blue bead.',
      prompt: 'With two identical red beads and one blue bead, how many patterns look different?',
      question: {
        inputType: 'multiple-choice',
        choices: ['2', '3', '6', '12'],
        correctChoiceIndex: 1,
        explanation:
          'Each distinct-looking pattern was counted twice (once for each way to order the two identical reds), so 6 ÷ 2 = 3.',
        misconceptionTags: ['overcount-identical'],
      },
      feedback: {
        correct: 'Exactly! 6 ÷ 2 = 3. We divided out the duplicate orderings of the identical reds.',
        incorrect: 'Not quite — think about how many times each look got counted.',
        choiceFeedback: {
          '6': 'That counts swapping the two identical reds as a new pattern — but they look exactly the same.',
          '2': 'Close, but the blue bead has 3 possible positions, not 2.',
          '12': 'That is more than even the distinct case (6). Identical beads reduce the count.',
        },
        hint: 'Treat the beads as if all distinct first, then notice that swapping the two identical reds produces a pattern you already counted — so each look gets counted once for every ordering of those reds. Divide that overcount out.',
        computationHint: '3! ÷ 2! = 6 ÷ 2 = 3.',
      },
      concepts: ['identical-objects', 'multiset-permutation'],
    },
    {
      id: 'formula',
      type: 'intro',
      title: 'The Pattern: Divide Out Repeats',
      body: 'Here is the key idea. Pretend everything is distinct — that gives n! orderings. But rearranging a group of identical items just produces EXACT COPIES of arrangements you already counted, so each true pattern was counted once for every way to rearrange those identical items. A group of k identical items can be rearranged in k! ways, so you overcount by EXACTLY k!. To fix it, divide by k! for each identical group. For two reds and one blue: 3! ÷ (2! × 1!) = 6 ÷ 2 = 3.',
      prompt: 'General rule: total = n! ÷ (a! × b! × …), where a, b, … are the sizes of each identical group — because each group of k identical items overcounts by exactly k!.',
      nextButtonLabel: 'Try a bigger one',
    },
    {
      id: 'five-beads',
      type: 'numeric-question',
      title: 'Five Beads',
      body: 'You thread 5 beads: 3 red and 2 blue. All reds look identical, and both blues look identical.',
      prompt: 'How many different patterns are there with 3 identical red and 2 identical blue beads?',
      question: {
        inputType: 'numeric',
        correctAnswer: 10,
        tolerance: 0,
        explanation: '5! ÷ (3! × 2!) = 120 ÷ (6 × 2) = 120 ÷ 12 = 10.',
        misconceptionTags: ['multiset'],
      },
      feedback: {
        correct: 'Yes! 5! ÷ (3! × 2!) = 120 ÷ 12 = 10.',
        incorrect: 'Start with 5! = 120, then divide by 3! for the reds and 2! for the blues.',
        hint: 'Pretend all the beads are distinct, then divide out the swaps that change nothing — the identical reds among themselves and the identical blues among themselves, each group contributing its own factorial.',
        computationHint: '5! ÷ (3! × 2!) = 120 ÷ (6 × 2) = 120 ÷ 12 = 10.',
      },
      randomize: (r) => {
        const [red, blue] = r.factorPair('multiset2', 2, 4)
        const n = red + blue
        const denom = factorial(red) * factorial(blue)
        const value = factorial(n) / denom
        return {
          body: `You thread ${n} beads: ${red} red and ${blue} blue. All reds look identical, and all blues look identical.`,
          prompt: `How many different patterns are there with ${red} identical red and ${blue} identical blue beads?`,
          question: {
            correctAnswer: value,
            explanation: `${n}! ÷ (${red}! × ${blue}!) = ${factorial(n)} ÷ (${factorial(red)} × ${factorial(blue)}) = ${factorial(n)} ÷ ${denom} = ${value}.`,
          },
          feedback: {
            correct: `Yes! ${n}! ÷ (${red}! × ${blue}!) = ${factorial(n)} ÷ ${denom} = ${value}.`,
            incorrect: `Start with ${n}! = ${factorial(n)}, then divide by ${red}! for the reds and ${blue}! for the blues.`,
            hint: 'Pretend all the beads are distinct, then divide out the swaps that change nothing — the identical reds among themselves and the identical blues among themselves, each group contributing its own factorial.',
            computationHint: `${n}! ÷ (${red}! × ${blue}!) = ${factorial(n)} ÷ (${factorial(red)} × ${factorial(blue)}) = ${factorial(n)} ÷ ${denom} = ${value}.`,
          },
        }
      },
      concepts: ['multiset-permutation', 'factorial'],
    },
    {
      id: 'three-three',
      type: 'numeric-question',
      title: 'Three and Three',
      body: 'You thread 6 beads: 3 identical green and 3 identical yellow.',
      prompt: 'How many different patterns are there with 3 identical green and 3 identical yellow beads?',
      question: {
        inputType: 'numeric',
        correctAnswer: 20,
        tolerance: 0,
        explanation: '6! ÷ (3! × 3!) = 720 ÷ (6 × 6) = 720 ÷ 36 = 20.',
        misconceptionTags: ['multiset'],
      },
      feedback: {
        correct: 'Yes! 6! ÷ (3! × 3!) = 720 ÷ 36 = 20.',
        incorrect: 'Start with 6! = 720, then divide by 3! for the greens and 3! for the yellows.',
        hint: 'Treat all six beads as distinct first, then cancel the rearrangements of the identical greens and the identical yellows, since shuffling within a color just remakes the same pattern.',
        computationHint: '6! ÷ (3! × 3!) = 720 ÷ (6 × 6) = 720 ÷ 36 = 20.',
      },
      randomize: (r) => {
        const [green, yellow] = r.factorPair('multiset2', 2, 4)
        const n = green + yellow
        const denom = factorial(green) * factorial(yellow)
        const value = factorial(n) / denom
        return {
          body: `You thread ${n} beads: ${green} identical green and ${yellow} identical yellow.`,
          prompt: `How many different patterns are there with ${green} identical green and ${yellow} identical yellow beads?`,
          question: {
            correctAnswer: value,
            explanation: `${n}! ÷ (${green}! × ${yellow}!) = ${factorial(n)} ÷ (${factorial(green)} × ${factorial(yellow)}) = ${factorial(n)} ÷ ${denom} = ${value}.`,
          },
          feedback: {
            correct: `Yes! ${n}! ÷ (${green}! × ${yellow}!) = ${factorial(n)} ÷ ${denom} = ${value}.`,
            incorrect: `Start with ${n}! = ${factorial(n)}, then divide by ${green}! for the greens and ${yellow}! for the yellows.`,
            hint: 'Treat all the beads as distinct first, then cancel the rearrangements of the identical greens and the identical yellows, since shuffling within a color just remakes the same pattern.',
            computationHint: `${n}! ÷ (${green}! × ${yellow}!) = ${factorial(n)} ÷ (${factorial(green)} × ${factorial(yellow)}) = ${factorial(n)} ÷ ${denom} = ${value}.`,
          },
        }
      },
      concepts: ['multiset-permutation', 'factorial'],
    },
    {
      id: 'banana',
      type: 'numeric-question',
      title: 'Spell BANANA',
      body: 'The word BANANA has 6 letters: three A’s, two N’s, and one B.',
      prompt: 'How many distinct ways can you arrange the letters of BANANA?',
      question: {
        inputType: 'numeric',
        correctAnswer: 60,
        tolerance: 0,
        explanation: '6! ÷ (3! × 2! × 1!) = 720 ÷ (6 × 2 × 1) = 720 ÷ 12 = 60.',
        misconceptionTags: ['multiset'],
      },
      feedback: {
        correct: '60! You divided 6! by 3! (the A’s) and 2! (the N’s).',
        incorrect: 'Count the repeats first: three A’s, two N’s, one B. Then 6! ÷ (3! × 2! × 1!).',
        hint: 'Count how many times each letter repeats first — three A’s, two N’s, one B. Arrange all six as if distinct, then divide out the identical letters, because rearranging the A’s among themselves or the N’s among themselves never changes the word.',
        computationHint: '6! ÷ (3! × 2! × 1!) = 720 ÷ (6 × 2 × 1) = 720 ÷ 12 = 60.',
      },
      concepts: ['multiset-permutation', 'factorial'],
    },
    {
      id: 'level-word',
      type: 'numeric-question',
      title: 'Spell LEVEL',
      body: 'The word LEVEL has 5 letters: two L’s, two E’s, and one V. Repeated letters are identical.',
      prompt: 'How many distinct ways can you arrange the letters of LEVEL?',
      question: {
        inputType: 'numeric',
        correctAnswer: 30,
        tolerance: 0,
        explanation: '5! ÷ (2! × 2! × 1!) = 120 ÷ 4 = 30.',
        misconceptionTags: ['multiset'],
      },
      feedback: {
        correct: 'Yes! 120 ÷ (2 × 2) = 30.',
        incorrect: 'Two L’s and two E’s: 5! ÷ (2! × 2!).',
        hint: 'Find the repeats first — two L’s, two E’s, one V. Arrange all five letters as if distinct, then divide out each repeated group, since swapping the two L’s or the two E’s leaves the word unchanged.',
        computationHint: '5! ÷ (2! × 2! × 1!) = 120 ÷ (2 × 2) = 120 ÷ 4 = 30.',
      },
      concepts: ['multiset-permutation', 'factorial'],
    },
    {
      id: 'explore-two-two',
      type: 'arrangement',
      title: 'Two Reds, Two Blues',
      body: 'Now thread 4 beads: 2 red and 2 blue, identical within each color. Drag them around and find every pattern that truly looks different. If all 4 were distinct there would be 4! = 24 orderings — but swapping the two reds (2! ways) and swapping the two blues (2! ways) only makes copies.',
      prompt: 'Drag the beads to discover all the distinct-looking patterns.',
      arrangementConfig: {
        items: twoTwoBeads,
        targetCount: 6,
        goalCount: 6,
        keyByKind: true,
      },
      feedback: {
        correct:
          'Exactly 6 distinct patterns! We overcounted 4! = 24 by 2! for the reds and 2! for the blues: 24 ÷ (2! × 2!) = 24 ÷ 4 = 6.',
        incorrect: 'There are 6 distinct-looking patterns. Try moving the blues to new positions.',
        hint: 'Because the reds are interchangeable and so are the blues, a pattern is fixed once you decide which slots the reds take. Equivalently, count all 4! orderings and divide out the within-color swaps that look identical.',
        computationHint: '4! ÷ (2! × 2!) = 24 ÷ (2 × 2) = 24 ÷ 4 = 6.',
      },
      concepts: ['identical-objects', 'multiset-permutation'],
    },
    {
      id: 'four-beads-mc',
      type: 'numeric-question',
      title: 'Two and Two: The Count',
      body: 'You have 2 identical red beads and 2 identical blue beads.',
      prompt: 'How many distinct patterns can 2 identical red and 2 identical blue beads make?',
      question: {
        inputType: 'numeric',
        correctAnswer: 6,
        tolerance: 0,
        explanation: '4! ÷ (2! × 2!) = 24 ÷ 4 = 6.',
        misconceptionTags: ['multiset'],
      },
      feedback: {
        correct: 'Right — 24 ÷ (2! × 2!) = 6, matching the patterns you dragged.',
        incorrect: 'Start with 4! = 24, then divide by 2! for the reds and 2! for the blues: 24 ÷ 4.',
        hint: 'Start from every ordering of four distinct beads, then remove the duplicates created by swapping the identical reds and the identical blues within their own colors.',
        computationHint: '4! ÷ (2! × 2!) = 24 ÷ 4 = 6.',
      },
      concepts: ['multiset-permutation'],
    },
    {
      id: 'divide-rule',
      type: 'multiple-choice',
      title: 'The Rule',
      body: 'When some objects are identical, the plain n! count is too big.',
      prompt: 'When some objects are identical, what do we do to the n! count?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Divide by the factorial of each identical group',
          'Multiply by the number of repeats',
          'Add the repeats together',
          'Nothing — it stays n!',
        ],
        correctChoiceIndex: 0,
        explanation: 'Identical items create duplicate orderings, so we divide them out with factorials.',
        misconceptionTags: ['identical-objects'],
      },
      feedback: {
        correct: 'Exactly — divide by the factorial of each identical group.',
        incorrect: 'Identical swaps were counted but look the same, so we remove them by dividing.',
        hint: 'Identical items make some of the n! orderings look exactly alike. To keep only the distinct-looking ones you remove those duplicate orderings, rather than add or multiply.',
        computationHint: 'For two identical reds and one blue, that means 3! ÷ 2! = 6 ÷ 2 = 3.',
      },
      concepts: ['identical-objects'],
    },
    {
      id: 'which-divides',
      type: 'multiple-choice',
      title: 'Spot the Repeats',
      body: 'Each option below describes arranging a set of items.',
      prompt: 'Which situation needs you to divide out repeats?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Arranging the letters of LEVEL',
          'Lining up 5 different runners',
          'Seating 3 distinct guests',
          'Ordering 4 unique books',
        ],
        correctChoiceIndex: 0,
        explanation: 'LEVEL repeats L (×2) and E (×2), so we divide. The others are all distinct.',
        misconceptionTags: ['identical-objects'],
      },
      feedback: {
        correct: 'Right — LEVEL has repeated letters, so divide out the repeats.',
        incorrect: 'Look for repeated letters or repeated identical items.',
        hint: 'You only divide out repeats when the same item shows up more than once. Scan each option for duplicated, identical items versus a collection where everything is distinct.',
        computationHint: 'LEVEL repeats L (×2) and E (×2), so it needs 5! ÷ (2! × 2!); the all-distinct options stay a plain n!.',
      },
      concepts: ['identical-objects'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned that identical objects create duplicate arrangements — and that dividing n! by the factorials of each repeated group counts only the patterns that truly look different.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
