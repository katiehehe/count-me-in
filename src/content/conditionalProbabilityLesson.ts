import type { Lesson } from './types'
import { conditionalProb, fracText } from './probabilityMath'

export const conditionalProbabilityLesson: Lesson = {
  id: 'conditional-probability',
  title: 'Conditional Probability',
  description:
    'P(A | B): restrict the world to B, then ask how many of those outcomes are A. The mental move is “given B, B is the whole world now.”',
  hook: 'A die came up even. Now what’s the chance it beat 3?',
  estimatedMinutes: 11,
  prerequisites: ['dependent-events'],
  concepts: ['conditional-probability', 'probability'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Given B, B Is the Whole World',
      body: 'New information shrinks uncertainty. Once you’re TOLD an event B happened, every outcome outside B is impossible — so B becomes your entire sample space.\n\nConditional probability $P(A \\mid B)$ asks: inside that smaller world B, what fraction of outcomes are also A?\n\nEverything you know about counting still works; you just count inside B.',
      prompt: '$P(A \\mid B) = \\dfrac{|A \\cap B|}{|B|}$ — restrict to B, then count the A’s among what’s left.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'A die comes up even. Given just that, guess the probability it’s greater than 3 — a fraction is welcome.',
        answer: '2/3',
      },
    },
    {
      id: 'worked-sample-space',
      type: 'worked-example',
      title: 'Watch Me Condition',
      body: 'A fair die is rolled. I’m told the result is even — let me find the chance it’s greater than 3.',
      workedExampleConfig: {
        kind: 'sample-space',
        voice: 'nova',
        sampleSpace: {
          outcomes: [
            { id: 'd1', label: '1' },
            { id: 'd2', label: '2' },
            { id: 'd3', label: '3' },
            { id: 'd4', label: '4' },
            { id: 'd5', label: '5' },
            { id: 'd6', label: '6' },
          ],
          givenIds: ['d2', 'd4', 'd6'],
          favorableIds: ['d4', 'd6'],
        },
        script: [
          {
            say: 'Our job is a conditional probability: told the die came up even, how likely is it greater than three? Here is the whole sample space for one die — six equally likely outcomes, one through six.',
            highlight: 'space',
          },
          {
            say: 'Now I’m told the roll is even. That makes one, three, and five impossible — so they fade away. The even faces two, four, and six are the new world. There are three of them.',
            highlight: 'given',
          },
          {
            say: 'Inside that smaller world, which outcomes are greater than three? Just four and six — two of the three.',
            highlight: 'favorable',
          },
          {
            say: 'So the conditional probability is the favorable count over the restricted count: two out of three. Notice we never divided by six — once we conditioned, six left the picture.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['conditional-probability', 'probability'],
    },
    {
      id: 'worked-venn',
      type: 'worked-example',
      title: 'When Outcomes Are Regions',
      body: 'Outcomes aren’t always countable dots — sometimes they’re areas. The same move works.',
      workedExampleConfig: {
        kind: 'venn',
        voice: 'nova',
        venn: {
          aLabel: 'A',
          bLabel: 'B',
          resultLatex: 'P(A \\mid B) = \\dfrac{\\text{area}(A \\cap B)}{\\text{area}(B)}',
        },
        script: [
          {
            say: 'Now let us see conditioning as areas, not counts. Picture event A as a region — say, where a dart lands in the left zone.',
            highlight: 'a',
          },
          {
            say: 'And event B as an overlapping region on the right. Now I tell you the dart landed in B.',
            highlight: 'b',
          },
          {
            say: 'B is now the entire world, so only the slice of A that sits inside B can still count — the overlap, A and B together.',
            highlight: 'overlap',
          },
          {
            say: 'The conditional probability is that overlap’s area divided by B’s area. Counting dots or measuring regions, conditioning is the same: shrink the world to B, then measure A inside it.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['conditional-probability'],
    },
    {
      id: 'given-count',
      type: 'numeric-question',
      title: 'How Big Is the New World?',
      body: 'A fair 6-sided die (faces 1–6) is rolled and a friend peeks and tells you the result is EVEN.',
      prompt: 'Given that, how many equally likely outcomes are still possible?',
      question: {
        inputType: 'numeric',
        correctAnswer: 3,
        tolerance: 0,
        explanation:
          'Conditioning on “even” throws out 1, 3, and 5. Only {2, 4, 6} remain — 3 outcomes. That restricted set is the denominator |B| of every conditional probability here.',
        misconceptionTags: ['conditional-probability'],
      },
      feedback: {
        correct: 'Right — {2, 4, 6} is the new world, so |B| = 3.',
        incorrect: 'You’re told it’s even, so only the even faces are still possible.',
        hint: 'List just the outcomes that fit the given condition; the impossible ones drop out entirely.',
        computationHint: 'Even faces of a 6-sided die: 2, 4, 6 — that’s 3 outcomes.',
      },
      randomize: (r) => {
        const sides = [6, 8, 10, 12][r.uniqueInt('cond-n', 0, 3)]
        const evens = sides / 2
        return {
          body: `A fair ${sides}-sided die (faces 1–${sides}) is rolled and a friend peeks and tells you the result is EVEN.`,
          question: {
            correctAnswer: evens,
            explanation: `Conditioning on “even” keeps only the even faces of a ${sides}-sided die — there are ${evens} of them. That restricted set is the denominator |B| of every conditional probability here.`,
          },
          feedback: {
            correct: `Right — the ${evens} even faces are the new world, so |B| = ${evens}.`,
            incorrect: 'You’re told it’s even, so only the even faces are still possible.',
            hint: 'List just the outcomes that fit the given condition; the impossible ones drop out entirely.',
            computationHint: `Half of the ${sides} faces are even, so there are ${evens} outcomes.`,
          },
        }
      },
      concepts: ['conditional-probability'],
    },
    {
      id: 'explore-conditional',
      type: 'conditional-select',
      title: 'Restrict, Then Select',
      body: 'A card is drawn from these 12. You’re told it’s a heart — so the spades no longer count and dim away. Tap every heart that is also a face card (J, Q, K).',
      conditionalSelectConfig: {
        outcomes: [
          { id: 'h-a', label: 'A', emoji: '♥️' },
          { id: 's-2', label: '2', emoji: '♠️' },
          { id: 'h-7', label: '7', emoji: '♥️' },
          { id: 's-5', label: '5', emoji: '♠️' },
          { id: 'h-10', label: '10', emoji: '♥️' },
          { id: 's-8', label: '8', emoji: '♠️' },
          { id: 'h-j', label: 'J', emoji: '♥️' },
          { id: 's-j', label: 'J', emoji: '♠️' },
          { id: 'h-q', label: 'Q', emoji: '♥️' },
          { id: 's-q', label: 'Q', emoji: '♠️' },
          { id: 'h-k', label: 'K', emoji: '♥️' },
          { id: 's-k', label: 'K', emoji: '♠️' },
        ],
        givenIds: ['h-a', 'h-7', 'h-10', 'h-j', 'h-q', 'h-k'],
        favorableIds: ['h-j', 'h-q', 'h-k'],
        givenLabel: 'the card is a heart ♥️',
        favorableLabel: 'a face card (J, Q, K)',
      },
      feedback: {
        correct:
          'That’s it — once you condition on “heart,” the 6 spades vanish from the count. Among the 6 hearts, 3 are face cards, so P(face | heart) = 3/6 = 1/2. You divided by 6, not 12.',
        incorrect: '',
        hint: 'Ignore every dimmed spade — they’re outside the given world. Among the hearts, the face cards are the Jack, Queen, and King.',
        computationHint: '6 hearts remain; 3 of them (J, Q, K) are face cards, so the answer is 3/6 = 1/2.',
      },
      concepts: ['conditional-probability'],
    },
    {
      id: 'die-conditional',
      type: 'fraction-question',
      title: 'Even, Then Bigger',
      body: 'A fair 6-sided die is rolled and you are told the result is EVEN.',
      prompt: 'Given the roll is even, what is the probability it is greater than 3? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '2/3',
        explanation:
          '“Even” restricts the world to {2, 4, 6} — 3 outcomes. Of those, greater than 3 means {4, 6}, which is 2. So P = 2/3. (Not 2/6 — the 1, 3, 5 are gone.)',
        misconceptionTags: ['conditional-probability'],
      },
      feedback: {
        correct: 'Yes — 2 of the 3 even faces beat 3, so 2/3.',
        incorrect: 'Count only inside the even world {2, 4, 6}; don’t divide by all 6 faces.',
        hint: 'First write down the given set (the even faces). Then count how many of THOSE are greater than 3, and put that over the size of the given set.',
        computationHint: 'Even faces: {2, 4, 6} (3 of them). Greater than 3: {4, 6} (2). So 2/3.',
      },
      randomize: (r) => {
        const k = r.uniqueInt('cond-k', 2, 4)
        const evens = [2, 4, 6]
        const fav = evens.filter((e) => e > k)
        const p = conditionalProb(fav.length, evens.length)
        return {
          prompt: `Given the roll is even, what is the probability it is greater than ${k}? Enter your answer as a fraction.`,
          question: {
            correctAnswer: fracText(p),
            explanation: `“Even” restricts the world to {2, 4, 6} — 3 outcomes. Of those, greater than ${k} means {${fav.join(', ')}}, which is ${fav.length}. So P = ${fav.length}/3 = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Yes — ${fav.length} of the 3 even faces beat ${k}, so ${fracText(p)}.`,
            incorrect: 'Count only inside the even world {2, 4, 6}; don’t divide by all 6 faces.',
            hint: 'First write down the given set (the even faces). Then count how many of THOSE fit, and put that over the size of the given set.',
            computationHint: `Even faces: {2, 4, 6} (3 of them). Greater than ${k}: {${fav.join(', ')}} (${fav.length}). So ${fracText(p)}.`,
          },
        }
      },
      concepts: ['conditional-probability', 'probability'],
    },
    {
      id: 'card-conditional',
      type: 'fraction-question',
      title: 'Given a Heart',
      body: 'A single card is drawn from a standard 52-card deck. You’re told it is a HEART (all 13 hearts are equally likely).',
      prompt: 'Given that, what is the probability the card is a face card (J, Q, K)? Enter your answer as a fraction.',
      question: {
        inputType: 'fraction',
        correctAnswer: '3/13',
        explanation:
          'Conditioning on “heart” shrinks the world to the 13 hearts. Exactly 3 of them — the Jack, Queen, and King — are face cards, so P = 3/13.',
        misconceptionTags: ['conditional-probability'],
      },
      feedback: {
        correct: 'Right — 3 face cards among the 13 hearts: 3/13.',
        incorrect: 'The given world is just the 13 hearts, not all 52 cards.',
        hint: 'Once you know it’s a heart, only the 13 hearts matter. How many of those are face cards?',
        computationHint: 'Each suit has 13 cards; 3 of them (J, Q, K) are face cards, so 3/13.',
      },
      randomize: (r) => {
        const suits = ['a heart', 'a spade', 'a diamond', 'a club']
        const suit = suits[r.uniqueInt('cond-suit', 0, 3)]
        const p = conditionalProb(3, 13)
        return {
          body: `A single card is drawn from a standard 52-card deck. You’re told it is ${suit.toUpperCase()} (all 13 cards of that suit are equally likely).`,
          question: {
            correctAnswer: fracText(p),
            explanation: `Conditioning on the suit shrinks the world to the 13 cards of ${suit}. Exactly 3 of them — the Jack, Queen, and King — are face cards, so P = ${fracText(p)}.`,
          },
          feedback: {
            correct: `Right — 3 face cards among the 13 cards of ${suit}: ${fracText(p)}.`,
            incorrect: `The given world is just the 13 cards of ${suit}, not all 52.`,
            hint: 'Once the suit is known, only those 13 cards matter. How many of them are face cards?',
            computationHint: `Each suit has 13 cards; 3 of them (J, Q, K) are face cards, so ${fracText(p)}.`,
          },
        }
      },
      concepts: ['conditional-probability', 'probability'],
    },
    {
      id: 'formula',
      type: 'multiple-choice',
      title: 'The Conditional Rule',
      body: 'Events A and B come from the same sample space, and you’re told B happened.',
      prompt: 'P(A | B) equals:',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'outcomes in both A and B, divided by outcomes in B',
          'outcomes in A, divided by all outcomes',
          'outcomes in A, divided by outcomes in B',
          'outcomes in both A and B, divided by all outcomes',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Conditioning makes B the whole world, so the denominator is |B|. The numerator counts only outcomes that are in A AND in B — the ones still possible that are also A. So P(A | B) = |A ∩ B| / |B|.',
        misconceptionTags: ['conditional-probability'],
      },
      feedback: {
        correct: 'Exactly — |A ∩ B| / |B|: restrict to B, then count the A’s inside it.',
        incorrect: 'The denominator must be |B| (the given world), and the numerator only the A’s that are also in B.',
        choiceFeedback: {
          'outcomes in both A and B, divided by all outcomes':
            'That’s the plain P(A and B). Conditioning divides by |B|, not the full space — B is the new world.',
          'outcomes in A, divided by all outcomes':
            'That’s P(A) with no conditioning. Being told B shrinks the denominator to |B|.',
          'outcomes in A, divided by outcomes in B':
            'Close, but the numerator can only include outcomes still possible — those in A AND B, not parts of A outside B.',
        },
        hint: 'Two things change when you condition on B: what can the denominator be, and which A-outcomes are still possible?',
        computationHint: 'Denominator = |B| (the given world); numerator = |A ∩ B| (A-outcomes that are also in B).',
      },
      concepts: ['conditional-probability'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned to condition: being told B happened makes B the entire sample space, so P(A | B) = |A ∩ B| / |B|. Whether outcomes are dice faces, cards, or regions of area, the move is the same — shrink the world to B, then measure A inside it.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
