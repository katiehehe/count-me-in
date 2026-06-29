import type { Lesson } from './types'
import { choose, handshakes, latticePaths } from './probabilityMath'
import { factorial } from './randomize'

export const contestProblemsLesson: Lesson = {
  id: 'contest-problems',
  title: 'Contest-Style Problems',
  description:
    'A capstone of olympiad-flavored counting puzzles. The skill here is technique selection — recognizing which tool fits and combining them, on problems mixed on purpose.',
  hook: 'Right or up only — how many grid paths from one corner to the other?',
  estimatedMinutes: 13,
  prerequisites: ['putting-it-together'],
  concepts: [
    'contest-counting',
    'combinations',
    'complement-rule',
    'inclusion-exclusion',
    'counting-principle',
  ],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Pick the Right Tool',
      body: 'This is a capstone — no new rule, just sharper judgment.\n\nContest problems rarely tell you which tool to use. The skill is reading the structure: Is it a combination? Is the complement easier? Can you split into disjoint cases and add?\n\nThe questions below are mixed on purpose, so you have to DECIDE the approach each time — that interleaving is exactly what makes the techniques stick.',
      prompt:
        'Three questions to ask first: What am I counting? Is the complement easier? Can I split into cases?',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'On a grid you may step only right or up. How many paths go from the corner $(0,0)$ to $(3,2)$? Take a guess.',
        answer: 10,
        revealNote: 'C(5,2)',
      },
    },
    {
      id: 'worked-gridpaths',
      type: 'worked-example',
      title: 'Watch Me Count Grid Paths',
      body: 'A classic: count the right/up paths across a grid by recognizing their structure.',
      workedExampleConfig: {
        kind: 'gridpaths',
        voice: 'nova',
        gridPaths: { m: 3, n: 2, sample: ['R', 'R', 'U', 'R', 'U'] },
        script: [
          {
            say: 'Here is a grid. We want paths from the bottom-left corner to the top-right, stepping only right or up.',
            highlight: 'grid',
          },
          {
            say: 'Here is one such path. Trace it: right, right, up, right, up.',
            highlight: 'path',
          },
          {
            say: 'Now write down just the moves: R, R, U, R, U. Every path is some order of three R’s and two U’s.',
            highlight: 'string',
          },
          {
            say: 'So counting paths is counting arrangements of three R’s and two U’s — just choose which two of the five steps are the ups.',
            highlight: 'count',
          },
          {
            say: 'That is five choose two, which is ten. In general it is m-plus-n choose n. We recognized the structure, then reached for combinations.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['contest-counting', 'combinations'],
    },
    {
      id: 'explore-lattice',
      type: 'lattice-path',
      title: 'Trace the Paths',
      body: 'Your turn. Step right or up from the green corner to the red one, and find every distinct path.',
      latticePathConfig: { m: 2, n: 2 },
      feedback: {
        correct:
          'All 6 paths — each is an order of 2 R’s and 2 U’s, so $\\binom{4}{2} = 6$. A path IS a combination.',
        incorrect: '',
        hint: 'From a corner you can only go right or up. Each finished path is a sequence of R’s and U’s.',
        computationHint: 'There are $\\binom{2+2}{2} = \\binom{4}{2} = 6$ paths.',
      },
      concepts: ['contest-counting', 'combinations'],
    },
    {
      id: 'handshakes',
      type: 'numeric-question',
      title: 'Handshakes',
      body: 'A round-robin setup: everyone meets everyone once.',
      prompt: 'At a party, 8 people each shake hands once with every other person. How many handshakes happen?',
      question: {
        inputType: 'numeric',
        correctAnswer: 28,
        tolerance: 0,
        explanation: 'Each handshake is a pair of people, so count the pairs: $\\binom{8}{2} = 28$.',
        misconceptionTags: ['combinations'],
      },
      feedback: {
        correct: 'Yes — $\\binom{8}{2} = 28$.',
        incorrect: 'A handshake is an unordered pair — count pairs, not ordered picks.',
        hint: 'What are you really counting? Each handshake is one pair of people. Order within a pair doesn’t matter.',
        computationHint: '$\\binom{8}{2} = \\dfrac{8 \\cdot 7}{2} = 28$.',
      },
      randomize: (r) => {
        const nn = r.uniqueInt('hs-n', 6, 12)
        const answer = handshakes(nn)
        return {
          prompt: `At a party, ${nn} people each shake hands once with every other person. How many handshakes happen?`,
          question: {
            correctAnswer: answer,
            explanation: `Each handshake is a pair of people: $\\binom{${nn}}{2} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${nn}}{2} = ${answer}$.`,
            incorrect: 'A handshake is an unordered pair — count pairs, not ordered picks.',
            hint: 'What are you really counting? Each handshake is one pair of people. Order within a pair doesn’t matter.',
            computationHint: `$\\binom{${nn}}{2} = ${answer}$.`,
          },
        }
      },
      concepts: ['contest-counting', 'combinations'],
    },
    {
      id: 'complementary',
      type: 'numeric-question',
      title: 'At Least One Repeat',
      body: '“At least one” is a flag — the opposite is usually cleaner.',
      prompt: 'How many 4-digit numbers (1000–9999) have at least one repeated digit?',
      question: {
        inputType: 'numeric',
        correctAnswer: 4464,
        tolerance: 0,
        explanation:
          'Count the complement: 4-digit numbers with ALL distinct digits = $9 \\cdot 9 \\cdot 8 \\cdot 7 = 4536$. Subtract from the 9000 total: $9000 - 4536 = 4464$.',
        misconceptionTags: ['complement-rule'],
      },
      feedback: {
        correct: 'Yes — $9000 - 4536 = 4464$.',
        incorrect: 'Counting “at least one repeat” directly is messy. Count the all-distinct ones and subtract.',
        hint: 'Is the complement easier? The opposite of “at least one repeat” is “all digits distinct,” which is a clean product.',
        computationHint: 'All-distinct: $9 \\cdot 9 \\cdot 8 \\cdot 7 = 4536$; total $9000$; so $9000 - 4536 = 4464$.',
      },
      randomize: (r) => {
        const digits = r.uniqueInt('cmp-d', 3, 4)
        const total = 9 * 10 ** (digits - 1)
        let distinct = 9
        for (let i = 1; i < digits; i++) distinct *= 10 - i
        const answer = total - distinct
        return {
          prompt: `How many ${digits}-digit numbers have at least one repeated digit?`,
          question: {
            correctAnswer: answer,
            explanation: `Count the complement (all digits distinct) = ${distinct}, then subtract from the ${total} total: $${total} - ${distinct} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $${total} - ${distinct} = ${answer}$.`,
            incorrect: 'Count the all-distinct numbers and subtract from the total.',
            hint: 'Is the complement easier? The opposite of “at least one repeat” is “all digits distinct.”',
            computationHint: `All-distinct: ${distinct}; total ${total}; so $${total} - ${distinct} = ${answer}$.`,
          },
        }
      },
      concepts: ['contest-counting', 'complement-rule', 'counting-principle'],
    },
    {
      id: 'lattice-guided',
      type: 'numeric-question',
      title: 'Shortest Routes',
      body: 'Back to grids — same structure as the worked example.',
      prompt: 'A taxi drives on city blocks from (0,0) to (4,3), going only east or north. How many shortest routes are there?',
      question: {
        inputType: 'numeric',
        correctAnswer: 35,
        tolerance: 0,
        explanation: 'A route is 4 E’s and 3 N’s in some order: $\\binom{4+3}{3} = \\binom{7}{3} = 35$.',
        misconceptionTags: ['combinations'],
      },
      feedback: {
        correct: 'Yes — $\\binom{7}{3} = 35$.',
        incorrect: 'A shortest route is a sequence of E’s and N’s — count the arrangements.',
        hint: 'How many east steps and north steps must any shortest route have? Then it’s just arranging them.',
        computationHint: '$\\binom{4+3}{3} = \\binom{7}{3} = 35$.',
      },
      randomize: (r) => {
        const m = r.uniqueInt('lat-m', 3, 5)
        const n = r.uniqueInt('lat-n', 2, 4)
        const answer = latticePaths(m, n)
        return {
          prompt: `A taxi drives on city blocks from (0,0) to (${m},${n}), going only east or north. How many shortest routes are there?`,
          question: {
            correctAnswer: answer,
            explanation: `A route is ${m} E’s and ${n} N’s in some order: $\\binom{${m}+${n}}{${n}} = \\binom{${m + n}}{${n}} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${m + n}}{${n}} = ${answer}$.`,
            incorrect: 'A shortest route is a sequence of E’s and N’s — count the arrangements.',
            hint: 'How many east steps and north steps must any shortest route have? Then it’s just arranging them.',
            computationHint: `$\\binom{${m}+${n}}{${n}} = \\binom{${m + n}}{${n}} = ${answer}$.`,
          },
        }
      },
      concepts: ['contest-counting', 'combinations'],
    },
    {
      id: 'restriction',
      type: 'numeric-question',
      title: 'Not Next to Each Other',
      body: 'Counting with a restriction is often “total minus bad.”',
      prompt: '5 friends sit in a row. In how many arrangements are Alex and Sam NOT next to each other?',
      question: {
        inputType: 'numeric',
        correctAnswer: 72,
        tolerance: 0,
        explanation:
          'Total arrangements $5! = 120$. The “bad” ones glue Alex+Sam into a block: $2 \\cdot 4! = 48$. So $120 - 48 = 72$.',
        misconceptionTags: ['counting-principle', 'complement-rule'],
      },
      feedback: {
        correct: 'Yes — $120 - 48 = 72$.',
        incorrect: 'Count ALL arrangements, then subtract the ones where they ARE together.',
        hint: 'Directly avoiding adjacency is fiddly. Count everything, then subtract the “bad” arrangements where the two sit together (treat them as one block).',
        computationHint: 'Total $5! = 120$; together $2 \\cdot 4! = 48$; apart $= 120 - 48 = 72$.',
      },
      randomize: (r) => {
        const nn = r.uniqueInt('res-n', 4, 6)
        const answer = factorial(nn) - 2 * factorial(nn - 1)
        return {
          prompt: `${nn} friends sit in a row. In how many arrangements are Alex and Sam NOT next to each other?`,
          question: {
            correctAnswer: answer,
            explanation: `Total $${nn}! = ${factorial(nn)}$. The “bad” ones glue the pair into a block: $2 \\cdot ${nn - 1}! = ${2 * factorial(nn - 1)}$. So $${factorial(nn)} - ${2 * factorial(nn - 1)} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $${factorial(nn)} - ${2 * factorial(nn - 1)} = ${answer}$.`,
            incorrect: 'Count ALL arrangements, then subtract the ones where they ARE together.',
            hint: 'Count everything, then subtract the “bad” arrangements where the two sit together (treat them as one block).',
            computationHint: `Total $${nn}! = ${factorial(nn)}$; together $2 \\cdot ${nn - 1}! = ${2 * factorial(nn - 1)}$; apart $= ${answer}$.`,
          },
        }
      },
      concepts: ['contest-counting', 'counting-principle', 'complement-rule'],
    },
    {
      id: 'committee',
      type: 'numeric-question',
      title: 'At Least One Girl',
      body: 'Another “at least one” — the complement is a smaller committee count.',
      prompt: 'From 5 boys and 4 girls, how many 3-person committees include at least one girl?',
      question: {
        inputType: 'numeric',
        correctAnswer: 74,
        tolerance: 0,
        explanation:
          'All committees minus the all-boy ones: $\\binom{9}{3} - \\binom{5}{3} = 84 - 10 = 74$.',
        misconceptionTags: ['combinations', 'complement-rule'],
      },
      feedback: {
        correct: 'Yes — $84 - 10 = 74$.',
        incorrect: 'Total committees minus the ones with NO girls (all boys).',
        hint: '“At least one girl” is the complement of “no girls.” Count all committees, subtract the all-boy ones.',
        computationHint: '$\\binom{9}{3} - \\binom{5}{3} = 84 - 10 = 74$.',
      },
      randomize: (r) => {
        const boys = r.uniqueInt('com-b', 4, 6)
        const girls = r.uniqueInt('com-g', 3, 5)
        const tot = choose(boys + girls, 3)
        const allBoys = choose(boys, 3)
        const answer = tot - allBoys
        return {
          prompt: `From ${boys} boys and ${girls} girls, how many 3-person committees include at least one girl?`,
          question: {
            correctAnswer: answer,
            explanation: `All committees minus the all-boy ones: $\\binom{${boys + girls}}{3} - \\binom{${boys}}{3} = ${tot} - ${allBoys} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $${tot} - ${allBoys} = ${answer}$.`,
            incorrect: 'Total committees minus the ones with NO girls (all boys).',
            hint: '“At least one girl” is the complement of “no girls.” Count all committees, subtract the all-boy ones.',
            computationHint: `$\\binom{${boys + girls}}{3} - \\binom{${boys}}{3} = ${tot} - ${allBoys} = ${answer}$.`,
          },
        }
      },
      concepts: ['contest-counting', 'combinations', 'complement-rule'],
    },
    {
      id: 'pie-count',
      type: 'numeric-question',
      title: 'Divisible by 2 or 5',
      body: '“Or” with overlap calls for inclusion–exclusion.',
      prompt: 'How many integers from 1 to 100 are divisible by 2 or 5?',
      question: {
        inputType: 'numeric',
        correctAnswer: 60,
        tolerance: 0,
        explanation:
          'Inclusion–exclusion: $\\lfloor 100/2 \\rfloor + \\lfloor 100/5 \\rfloor - \\lfloor 100/10 \\rfloor = 50 + 20 - 10 = 60$.',
        misconceptionTags: ['inclusion-exclusion'],
      },
      feedback: {
        correct: 'Yes — $50 + 20 - 10 = 60$.',
        incorrect: 'Add the multiples of each, then subtract the multiples of both (the lcm).',
        hint: 'The two sets overlap (multiples of 10 are in both). Add each count, subtract the overlap once.',
        computationHint: '$\\lfloor 100/2 \\rfloor + \\lfloor 100/5 \\rfloor - \\lfloor 100/10 \\rfloor = 50 + 20 - 10 = 60$.',
      },
      randomize: (r) => {
        const N = [60, 80, 100][r.uniqueInt('pie-N', 0, 2)]
        const answer = Math.floor(N / 2) + Math.floor(N / 5) - Math.floor(N / 10)
        return {
          prompt: `How many integers from 1 to ${N} are divisible by 2 or 5?`,
          question: {
            correctAnswer: answer,
            explanation: `Inclusion–exclusion: $\\lfloor ${N}/2 \\rfloor + \\lfloor ${N}/5 \\rfloor - \\lfloor ${N}/10 \\rfloor = ${Math.floor(N / 2)} + ${Math.floor(N / 5)} - ${Math.floor(N / 10)} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — ${Math.floor(N / 2)} + ${Math.floor(N / 5)} - ${Math.floor(N / 10)} = ${answer}.`,
            incorrect: 'Add the multiples of each, then subtract the multiples of both (the lcm).',
            hint: 'The two sets overlap (multiples of 10 are in both). Add each count, subtract the overlap once.',
            computationHint: `$\\lfloor ${N}/2 \\rfloor + \\lfloor ${N}/5 \\rfloor - \\lfloor ${N}/10 \\rfloor = ${answer}$.`,
          },
        }
      },
      concepts: ['contest-counting', 'inclusion-exclusion'],
    },
    {
      id: 'which-tool',
      type: 'multiple-choice',
      title: 'Which Tool?',
      body: 'The hardest part of a contest problem is often just choosing the approach.',
      prompt: 'A problem asks: “how many 5-letter strings (from a 26-letter alphabet) use at least one vowel?” What is the cleanest approach?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Count the complement — strings with NO vowel — and subtract from the total',
          'Add up the cases of exactly 1, 2, 3, 4, and 5 vowels',
          'Multiply 5 by the number of vowels',
          'It can’t be counted with these tools',
        ],
        correctChoiceIndex: 0,
        explanation:
          '“At least one” is the classic complement trigger: total $26^5$ minus the no-vowel strings $21^5$ is two clean products, while summing the “exactly k vowels” cases is far messier.',
        misconceptionTags: ['contest-counting', 'complement-rule'],
      },
      feedback: {
        correct: 'Right — “at least one” ⇒ count the complement (no vowels) and subtract.',
        incorrect: 'Look for the phrase “at least one” — that’s the complement’s calling card.',
        choiceFeedback: {
          'Add up the cases of exactly 1, 2, 3, 4, and 5 vowels':
            'That works but is five messy overlapping cases — the complement does it in one subtraction.',
          'Multiply 5 by the number of vowels':
            'That doesn’t count strings correctly — positions aren’t independent of “at least one.”',
        },
        hint: 'Scan for trigger words. “At least one …” almost always means: total minus the “none” case.',
        computationHint: 'Total $26^5$ minus no-vowel $21^5$ gives the count — two clean products.',
      },
      concepts: ['contest-counting', 'complement-rule'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Capstone Complete!',
      body: 'You practiced the real contest skill: reading a problem’s structure and choosing the tool.\n\nGrid paths and handshakes are combinations; “at least one” calls for the complement; restrictions are total minus bad; “or” with overlap is inclusion–exclusion.\n\nMixing them is the point — when the next problem doesn’t announce its method, you’ll know which questions to ask.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
