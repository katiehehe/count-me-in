import type { Lesson } from './types'
import { choose, starsAndBars } from './probabilityMath'

export const starsAndBarsLesson: Lesson = {
  id: 'stars-and-bars',
  title: 'Stars and Bars',
  description:
    'Distribute identical items into bins by lining up stars and dropping bars between them — a bijection that turns counting distributions into one combination.',
  hook: '5 identical candies, 3 kids — how many ways to share them out?',
  estimatedMinutes: 12,
  prerequisites: ['combinations-vs-permutations'],
  concepts: ['stars-and-bars', 'combinations'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Stars, Then Bars',
      body: 'How many ways can you split $n$ identical items into $k$ labeled bins? A picture cracks it.\n\nLine the $n$ items up as STARS, then drop $k-1$ BARS among them. The bars cut the stars into $k$ groups — and the group sizes ARE a solution to $x_1 + x_2 + \\cdots + x_k = n$.\n\nEvery arrangement of the $n + k - 1$ symbols gives exactly one distribution, so the count is just “choose which $k-1$ positions are bars”:\n\n$$\\binom{n+k-1}{k-1}$$',
      prompt: '$n$ stars and $k-1$ bars in a row — choose the bar positions: $\\binom{n+k-1}{k-1}$.',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'You have 5 identical candies to give to 3 kids, and a kid is allowed to get 0. How many ways are there? Take a guess.',
        answer: 21,
        revealNote: 'C(7,2)',
      },
    },
    {
      id: 'worked-stars-bars',
      type: 'worked-example',
      title: 'Watch Me Place the Bars',
      body: 'Let me share 5 candies among 3 kids using stars and bars.',
      workedExampleConfig: {
        kind: 'stars-bars',
        voice: 'nova',
        starsBars: { n: 5, k: 3, groups: [2, 1, 2] },
        script: [
          { say: 'We have five identical candies. Line them up as five stars.', highlight: 'stars' },
          {
            say: 'Now drop two bars among them to split the candies between three kids. Here is one way: two stars, a bar, one star, a bar, two stars.',
            highlight: 'bars',
          },
          {
            say: 'Read off the group sizes: two, one, two. Kid one gets two, kid two gets one, kid three gets two — and two plus one plus two is five.',
            highlight: 'solution',
          },
          {
            say: 'Here is the key idea: ANY arrangement of five stars and two bars is a valid sharing. So we are really just arranging seven symbols and choosing which two of them are bars.',
            highlight: 'count',
          },
          {
            say: 'That is seven choose two, which is twenty-one. In general the answer is n-plus-k-minus-one, choose k-minus-one.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['stars-and-bars', 'combinations'],
    },
    {
      id: 'explore-drag',
      type: 'stars-bars-drag',
      title: 'Drag the Bars',
      body: 'Your turn. Drag the 2 bars among the 5 stars so the three kids get $(2, 2, 1)$.\n\nWatch the tuple update as you move them.',
      starsBarsDragConfig: { n: 5, k: 3, target: [2, 2, 1], itemLabel: 'candies', binLabel: 'kids' },
      feedback: {
        correct:
          'Nice — bars in those gaps encode $(2,2,1)$. Every placement of the 2 bars among the 5 stars is one of the $\\binom{7}{2} = 21$ distributions.',
        incorrect: '',
        hint: 'The numbers between the bars are the group sizes. To get $(2,2,1)$, leave 2 stars, then a bar, then 2 stars, then a bar, then 1 star.',
        computationHint: 'Bars after the 2nd and 4th stars give groups 2, 2, 1.',
      },
      concepts: ['stars-and-bars'],
    },
    {
      id: 'solutions-count',
      type: 'numeric-question',
      title: 'Count the Solutions',
      body: 'Counting distributions is the same as counting equation solutions.',
      prompt: 'How many non-negative integer solutions are there to $x_1 + x_2 + x_3 = 5$ (each $x_i \\ge 0$)?',
      question: {
        inputType: 'numeric',
        correctAnswer: 21,
        tolerance: 0,
        explanation: 'Stars and bars: 5 stars and 2 bars, so $\\binom{5+3-1}{3-1} = \\binom{7}{2} = 21$.',
        misconceptionTags: ['stars-and-bars'],
      },
      feedback: {
        correct: 'Yes — $\\binom{7}{2} = 21$.',
        incorrect: 'Use $\\binom{n+k-1}{k-1}$ with $n = 5$ stars and $k = 3$ bins.',
        hint: 'Each solution is a way to drop $k-1$ bars among $n$ stars. Count the bar placements.',
        computationHint: '$\\binom{5+3-1}{3-1} = \\binom{7}{2} = 21$.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('sb-n', 4, 8)
        const answer = starsAndBars(n, 3)
        return {
          prompt: `How many non-negative integer solutions are there to $x_1 + x_2 + x_3 = ${n}$ (each $x_i \\ge 0$)?`,
          question: {
            correctAnswer: answer,
            explanation: `Stars and bars: ${n} stars and 2 bars, so $\\binom{${n}+3-1}{3-1} = \\binom{${n + 2}}{2} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${n + 2}}{2} = ${answer}$.`,
            incorrect: 'Use $\\binom{n+k-1}{k-1}$ with these $n$ stars and $k = 3$ bins.',
            hint: 'Each solution is a way to drop $k-1$ bars among $n$ stars. Count the bar placements.',
            computationHint: `$\\binom{${n}+3-1}{3-1} = \\binom{${n + 2}}{2} = ${answer}$.`,
          },
        }
      },
      concepts: ['stars-and-bars'],
    },
    {
      id: 'distribute',
      type: 'numeric-question',
      title: 'Distribute the Candies',
      body: 'A jar of identical candies is shared among friends; anyone may get none.',
      prompt: 'In how many ways can 6 identical candies be distributed among 4 kids?',
      question: {
        inputType: 'numeric',
        correctAnswer: 84,
        tolerance: 0,
        explanation: '6 stars, 3 bars: $\\binom{6+4-1}{4-1} = \\binom{9}{3} = 84$.',
        misconceptionTags: ['stars-and-bars'],
      },
      feedback: {
        correct: 'Yes — $\\binom{9}{3} = 84$.',
        incorrect: 'Use $\\binom{n+k-1}{k-1}$ with $n = 6$ candies and $k = 4$ kids.',
        hint: 'Candies are the stars; the dividers between kids are the bars. How many bars for $k$ kids?',
        computationHint: '$\\binom{6+4-1}{4-1} = \\binom{9}{3} = 84$.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('sb-d-n', 5, 9)
        const k = r.uniqueInt('sb-d-k', 3, 4)
        const answer = starsAndBars(n, k)
        return {
          body: 'A jar of identical candies is shared among friends; anyone may get none.',
          prompt: `In how many ways can ${n} identical candies be distributed among ${k} kids?`,
          question: {
            correctAnswer: answer,
            explanation: `${n} stars, ${k - 1} bars: $\\binom{${n}+${k}-1}{${k}-1} = \\binom{${n + k - 1}}{${k - 1}} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${n + k - 1}}{${k - 1}} = ${answer}$.`,
            incorrect: `Use $\\binom{n+k-1}{k-1}$ with ${n} candies and ${k} kids.`,
            hint: 'Candies are the stars; the dividers between kids are the bars. How many bars for $k$ kids?',
            computationHint: `$\\binom{${n}+${k}-1}{${k}-1} = \\binom{${n + k - 1}}{${k - 1}} = ${answer}$.`,
          },
        }
      },
      concepts: ['stars-and-bars'],
    },
    {
      id: 'comb-rep',
      type: 'numeric-question',
      title: 'Combinations With Repetition',
      body: 'Choosing items when repeats are allowed (and order doesn’t matter) is the same problem.',
      prompt: 'An ice-cream shop has 4 flavors. How many ways can you pick 3 scoops if repeats are allowed and order doesn’t matter?',
      question: {
        inputType: 'numeric',
        correctAnswer: 20,
        tolerance: 0,
        explanation:
          'Each flavor is a bin and each scoop is a star: $\\binom{3+4-1}{3} = \\binom{6}{3} = 20$. This is “combinations with repetition.”',
        misconceptionTags: ['stars-and-bars', 'combinations'],
      },
      feedback: {
        correct: 'Yes — $\\binom{6}{3} = 20$.',
        incorrect: 'Treat each flavor as a bin and each scoop as a star: $\\binom{n+k-1}{n}$.',
        hint: 'How many of each flavor you pick is a distribution of $n$ scoops into $k$ flavor-bins.',
        computationHint: '$\\binom{3+4-1}{3} = \\binom{6}{3} = 20$.',
      },
      randomize: (r) => {
        const k = r.uniqueInt('sb-cr-k', 3, 4)
        const n = r.uniqueInt('sb-cr-n', 3, 5)
        const answer = starsAndBars(n, k)
        return {
          prompt: `An ice-cream shop has ${k} flavors. How many ways can you pick ${n} scoops if repeats are allowed and order doesn’t matter?`,
          question: {
            correctAnswer: answer,
            explanation: `Each flavor is a bin and each scoop is a star: $\\binom{${n}+${k}-1}{${n}} = \\binom{${n + k - 1}}{${n}} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${n + k - 1}}{${n}} = ${answer}$.`,
            incorrect: 'Treat each flavor as a bin and each scoop as a star: $\\binom{n+k-1}{n}$.',
            hint: 'How many of each flavor you pick is a distribution of $n$ scoops into $k$ flavor-bins.',
            computationHint: `$\\binom{${n}+${k}-1}{${n}} = \\binom{${n + k - 1}}{${n}} = ${answer}$.`,
          },
        }
      },
      concepts: ['stars-and-bars', 'combinations'],
    },
    {
      id: 'positive',
      type: 'numeric-question',
      title: 'When Everyone Gets Some',
      body: 'Sometimes each bin must get at least one. Give everyone one first, then share the rest.',
      prompt: 'How many POSITIVE integer solutions are there to $x_1 + x_2 + x_3 = 8$ (each $x_i \\ge 1$)?',
      question: {
        inputType: 'numeric',
        correctAnswer: 21,
        tolerance: 0,
        explanation:
          'Hand each variable a 1 first (using 3), then distribute the remaining 5 freely: $\\binom{8-1}{3-1} = \\binom{7}{2} = 21$.',
        misconceptionTags: ['stars-and-bars'],
      },
      feedback: {
        correct: 'Yes — $\\binom{7}{2} = 21$.',
        incorrect: 'Give each variable 1 first, then it’s an ordinary stars-and-bars on what remains.',
        hint: 'Subtract a 1 from each variable up front. The “at least 1” problem becomes a “0 allowed” problem with a smaller total.',
        computationHint: 'Positive solutions: $\\binom{n-1}{k-1} = \\binom{8-1}{3-1} = \\binom{7}{2} = 21$.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('sb-p-n', 6, 10)
        const answer = choose(n - 1, 2)
        return {
          prompt: `How many POSITIVE integer solutions are there to $x_1 + x_2 + x_3 = ${n}$ (each $x_i \\ge 1$)?`,
          question: {
            correctAnswer: answer,
            explanation: `Hand each variable a 1 first (using 3), then distribute the remaining ${n - 3} freely: $\\binom{${n}-1}{3-1} = \\binom{${n - 1}}{2} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${n - 1}}{2} = ${answer}$.`,
            incorrect: 'Give each variable 1 first, then it’s an ordinary stars-and-bars on what remains.',
            hint: 'Subtract a 1 from each variable up front. The “at least 1” problem becomes a “0 allowed” problem with a smaller total.',
            computationHint: `Positive solutions: $\\binom{n-1}{k-1} = \\binom{${n - 1}}{2} = ${answer}$.`,
          },
        }
      },
      concepts: ['stars-and-bars'],
    },
    {
      id: 'bridge-mc',
      type: 'multiple-choice',
      title: 'Why a Combination?',
      body: 'Stars and bars connects two earlier ideas.',
      prompt: 'Why does the count come out to $\\binom{n+k-1}{k-1}$?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'You arrange $n$ identical stars and $k-1$ identical bars, which is the same as choosing which $k-1$ positions are bars',
          'You multiply $n \\times k$',
          'You add $n + k$',
          'It is $n!$ orderings',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Arranging $n$ identical stars and $k-1$ identical bars is a multiset arrangement (the “divide out repeats” idea), and it equals choosing which $k-1$ of the $n+k-1$ positions hold the bars — a combination.',
        misconceptionTags: ['stars-and-bars', 'combinations'],
      },
      feedback: {
        correct: 'Right — it’s choosing the bar positions, a combination (and the same as a multiset arrangement of stars and bars).',
        incorrect: 'Think about arranging the $n$ stars and $k-1$ bars and picking where the bars go.',
        choiceFeedback: {
          'You multiply $n \\times k$':
            'Multiplying would count ordered, independent choices — but the stars are identical and order within them doesn’t matter.',
          'It is $n!$ orderings':
            'The stars are identical, so their $n!$ orderings all look the same — that’s exactly why it’s a combination, not a factorial.',
        },
        hint: 'Both the “identical objects” lesson and the “combinations” lesson are hiding here. Which operation picks the bar positions?',
        computationHint: 'Choosing which $k-1$ of $n+k-1$ positions are bars is $\\binom{n+k-1}{k-1}$.',
      },
      concepts: ['stars-and-bars', 'combinations', 'multiset-permutation'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You learned stars and bars: to put $n$ identical items into $k$ bins, lay down $n$ stars and $k-1$ bars and choose the bar positions — $\\binom{n+k-1}{k-1}$.\n\nIt’s the same “divide out repeats” idea as arranging identical objects, and the count is just a combination — combinations WITH repetition.\n\nThat turns “how many ways to distribute” and “how many non-negative solutions” into a one-formula answer.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
