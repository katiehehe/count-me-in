import type { Lesson } from './types'
import { binomialTermCoeff, choose } from './probabilityMath'

export const binomialTheoremLesson: Lesson = {
  id: 'binomial-theorem',
  title: 'The Binomial Theorem',
  description:
    'The algebra and Pascal’s triangle behind the coin formula: expand (a+b)^n by choosing a or b from each factor, and the coefficients turn out to be combinations.',
  hook: 'Why is the coefficient of a²b in (a+b)³ exactly 3? Count it.',
  estimatedMinutes: 12,
  prerequisites: ['addition-rule'],
  concepts: ['binomial-theorem', 'combinations'],
  steps: [
    {
      id: 'intro',
      type: 'intro',
      title: 'Expanding Is Just Counting',
      body: 'Multiplying out $(a+b)^n$ looks scary — but it is really just counting.\n\nWritten out, $(a+b)^n = \\underbrace{(a+b)(a+b)\\cdots(a+b)}_{n}$. To build one term of the answer, you take either the $a$ or the $b$ from each factor.\n\nSo the coefficient of $a^k b^{\\,n-k}$ is the number of ways to choose which $k$ of the $n$ factors contribute the $a$ — and that is $\\binom{n}{k}$. Combinations ARE the expansion coefficients.',
      prompt:
        'The coefficients are combinations:\n\n$$(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k}\\, a^k b^{\\,n-k}$$',
      nextButtonLabel: 'Show me how first',
    },
    {
      id: 'prequestion',
      type: 'prequestion',
      title: 'Take a Guess First',
      prequestionConfig: {
        prompt:
          'Expand $(a+b)^3$ by choosing $a$ or $b$ from each of the 3 factors. Of the 8 products, how many work out to $a^2 b$? Take a guess.',
        answer: 3,
      },
    },
    {
      id: 'worked-expand',
      type: 'worked-example',
      title: 'Watch Me Expand by Choosing',
      body: 'Let me expand $(a+b)^3$ — not by FOIL, but by choosing from each factor and counting.',
      workedExampleConfig: {
        kind: 'expand',
        voice: 'nova',
        expand: { n: 3 },
        script: [
          {
            say: 'A binomial cubed is just three identical factors multiplied: a-plus-b, times a-plus-b, times a-plus-b.',
            highlight: 'factors',
          },
          {
            say: 'To build one term, take either the a or the b from each factor. Three factors, two choices each, gives two times two times two — eight products in all.',
            highlight: 'products',
          },
          {
            say: 'Now group the like terms. One product is all a’s. Three have two a’s and one b. Three have one a and two b’s. One is all b’s. The counts are one, three, three, one.',
            highlight: 'group',
          },
          {
            say: 'So a-plus-b cubed is a-cubed, plus three a-squared b, plus three a b-squared, plus b-cubed. Those coefficients — one, three, three, one — are exactly three-choose-zero through three-choose-three.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['binomial-theorem', 'combinations'],
    },
    {
      id: 'choose-the-bs',
      type: 'sequence-build',
      title: 'Choose the b’s',
      body: 'Here are the 4 factors of $(a+b)^4$. Each one gives you an $a$ or a $b$.\n\nPick which 2 factors contribute a $b$ — then find every distinct way, so every $a^2 b^2$ term shows up.',
      sequenceBuildConfig: { slots: 4, heads: 2, onLabel: 'b', offLabel: 'a', unit: 'b’s' },
      feedback: {
        correct:
          'All 6 — that’s $\\binom{4}{2} = 6$. The coefficient of $a^2 b^2$ in $(a+b)^4$ is exactly the number of ways to choose which 2 factors give the $b$.',
        incorrect: '',
        hint: 'Hold one b fixed and move the other across the remaining factors, then move the first — that reaches them all without repeats.',
        computationHint: 'There are $\\binom{4}{2} = 6$ ways to choose which 2 of the 4 factors give a b.',
      },
      concepts: ['binomial-theorem', 'combinations'],
    },
    {
      id: 'worked-pascal',
      type: 'worked-example',
      title: 'Pascal’s Triangle',
      body: 'Those coefficients line up in a famous pattern. Let me build Pascal’s triangle.',
      workedExampleConfig: {
        kind: 'pascal',
        voice: 'nova',
        pascal: { rows: 4 },
        script: [
          { say: 'Pascal’s triangle starts with a single one at the top — that is row zero.', highlight: 'row-0' },
          { say: 'Row one is one, one.', highlight: 'row-1' },
          { say: 'Row two is one, two, one.', highlight: 'row-2' },
          {
            say: 'Row three is one, three, three, one — the very coefficients we just found for a-plus-b cubed.',
            highlight: 'row-3',
          },
          { say: 'Row four is one, four, six, four, one.', highlight: 'row-4' },
          {
            say: 'Here is the magic: every entry is the sum of the two just above it. The six in row four is three plus three from row three. That is Pascal’s rule.',
            highlight: 'rule',
          },
          {
            say: 'And row n is exactly the list of coefficients of a-plus-b to the n — n-choose-zero through n-choose-n.',
            highlight: 'result',
          },
        ],
      },
      concepts: ['binomial-theorem'],
    },
    {
      id: 'pascal-fill',
      type: 'numeric-question',
      title: 'Pascal’s Rule',
      body: 'In Pascal’s triangle, every entry is the sum of the two directly above it.',
      prompt: 'Two side-by-side entries in one row are 4 and 6. What is the entry just below them?',
      question: {
        inputType: 'numeric',
        correctAnswer: 10,
        tolerance: 0,
        explanation: 'Pascal’s rule adds the two above: $4 + 6 = 10$.',
        misconceptionTags: ['binomial-theorem'],
      },
      feedback: {
        correct: 'Yes — $4 + 6 = 10$.',
        incorrect: 'Add the two entries directly above the cell.',
        hint: 'Each cell is built from the two entries diagonally above it — combine them.',
        computationHint: '$4 + 6 = 10$.',
      },
      randomize: (r) => {
        const row = r.uniqueInt('pascal-r', 4, 7)
        const col = r.uniqueInt('pascal-c', 1, row - 1)
        const left = choose(row - 1, col - 1)
        const right = choose(row - 1, col)
        const answer = left + right
        return {
          prompt: `Two side-by-side entries in one row are ${left} and ${right}. What is the entry just below them?`,
          question: {
            correctAnswer: answer,
            explanation: `Pascal’s rule adds the two above: $${left} + ${right} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $${left} + ${right} = ${answer}$.`,
            incorrect: 'Add the two entries directly above the cell.',
            hint: 'Each cell is built from the two entries diagonally above it — combine them.',
            computationHint: `$${left} + ${right} = ${answer}$.`,
          },
        }
      },
      concepts: ['binomial-theorem'],
    },
    {
      id: 'coeff-term',
      type: 'numeric-question',
      title: 'Read Off a Coefficient',
      body: 'No expanding needed — the coefficient is a combination.',
      prompt: 'In the expansion of $(a+b)^5$, what is the coefficient of $a^2 b^3$?',
      question: {
        inputType: 'numeric',
        correctAnswer: 10,
        tolerance: 0,
        explanation:
          'Choose which 3 of the 5 factors give the $b$: $\\binom{5}{3} = 10$ (the same as $\\binom{5}{2}$).',
        misconceptionTags: ['binomial-theorem', 'combinations'],
      },
      feedback: {
        correct: 'Yes — $\\binom{5}{3} = 10$.',
        incorrect: 'The coefficient of $a^{n-k}b^k$ is $\\binom{n}{k}$ — choose which factors give the $b$.',
        hint: 'Count the ways to pick which factors contribute the $b$ (the exponent on $b$). That count is a combination.',
        computationHint: '$\\binom{5}{3} = \\dfrac{5\\cdot 4}{2} = 10$.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('bt-n', 4, 7)
        const bExp = r.uniqueInt('bt-k', 1, n - 1)
        const aExp = n - bExp
        const answer = choose(n, bExp)
        return {
          prompt: `In the expansion of $(a+b)^${n}$, what is the coefficient of $a^${aExp} b^${bExp}$?`,
          question: {
            correctAnswer: answer,
            explanation: `Choose which ${bExp} of the ${n} factors give the $b$: $\\binom{${n}}{${bExp}} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${n}}{${bExp}} = ${answer}$.`,
            incorrect: 'The coefficient of $a^{n-k}b^k$ is $\\binom{n}{k}$ — choose which factors give the $b$.',
            hint: 'Count the ways to pick which factors contribute the $b$ (the exponent on $b$). That count is a combination.',
            computationHint: `$\\binom{${n}}{${bExp}} = ${answer}$.`,
          },
        }
      },
      concepts: ['binomial-theorem', 'combinations'],
    },
    {
      id: 'coeff-constants',
      type: 'numeric-question',
      title: 'With a Constant',
      body: 'Same idea when one term is a number — the constant gets raised to a power too.',
      prompt: 'In the expansion of $(2 + x)^5$, what is the coefficient of $x^3$?',
      question: {
        inputType: 'numeric',
        correctAnswer: 40,
        tolerance: 0,
        explanation:
          'The $x^3$ term is $\\binom{5}{3}\\,2^{2}x^3$, so the coefficient is $\\binom{5}{3}\\cdot 2^2 = 10\\cdot 4 = 40$.',
        misconceptionTags: ['binomial-theorem'],
      },
      feedback: {
        correct: 'Yes — $\\binom{5}{3}\\cdot 2^2 = 40$.',
        incorrect: 'Use $\\binom{n}{k}$ for the count, then raise the constant to the leftover power.',
        hint: 'The term with $x^3$ takes $x$ from 3 factors and the 2 from the other $5-3=2$ factors — so the 2 is squared.',
        computationHint: '$\\binom{5}{3}\\cdot 2^{2} = 10 \\cdot 4 = 40$.',
      },
      randomize: (r) => {
        const a = r.uniqueInt('bc-a', 2, 3)
        const n = r.uniqueInt('bc-n', 4, 6)
        const k = r.uniqueInt('bc-k', 1, n - 1)
        const answer = binomialTermCoeff(n, k, a, 1)
        return {
          prompt: `In the expansion of $(${a} + x)^${n}$, what is the coefficient of $x^${k}$?`,
          question: {
            correctAnswer: answer,
            explanation: `The $x^${k}$ term is $\\binom{${n}}{${k}}\\,${a}^{${n - k}}x^${k}$, so the coefficient is $\\binom{${n}}{${k}}\\cdot ${a}^${n - k} = ${choose(n, k)}\\cdot ${a ** (n - k)} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $\\binom{${n}}{${k}}\\cdot ${a}^${n - k} = ${answer}$.`,
            incorrect: 'Use $\\binom{n}{k}$ for the count, then raise the constant to the leftover power.',
            hint: `The $x^${k}$ term takes $x$ from ${k} factors and the ${a} from the other ${n - k} — so the ${a} is raised to the ${n - k}.`,
            computationHint: `$\\binom{${n}}{${k}}\\cdot ${a}^${n - k} = ${choose(n, k)} \\cdot ${a ** (n - k)} = ${answer}$.`,
          },
        }
      },
      concepts: ['binomial-theorem'],
    },
    {
      id: 'row-sum',
      type: 'numeric-question',
      title: 'Add a Whole Row',
      body: 'Here’s a slick trick that falls right out of the theorem.',
      prompt: 'Add up every entry in row 5 of Pascal’s triangle: $\\binom{5}{0} + \\binom{5}{1} + \\dots + \\binom{5}{5}$. What is the total?',
      question: {
        inputType: 'numeric',
        correctAnswer: 32,
        tolerance: 0,
        explanation: 'Set $a = b = 1$ in the binomial theorem: $\\sum_k \\binom{5}{k} = (1+1)^5 = 2^5 = 32$.',
        misconceptionTags: ['binomial-theorem'],
      },
      feedback: {
        correct: 'Yes — $2^5 = 32$.',
        incorrect: 'Plug $a = b = 1$ into $(a+b)^5$.',
        hint: 'The binomial theorem holds for ANY $a$ and $b$. What happens if both are 1?',
        computationHint: '$(1+1)^5 = 2^5 = 32$.',
      },
      randomize: (r) => {
        const n = r.uniqueInt('rs-n', 4, 8)
        const answer = 2 ** n
        return {
          prompt: `Add up every entry in row ${n} of Pascal’s triangle: $\\binom{${n}}{0} + \\binom{${n}}{1} + \\dots + \\binom{${n}}{${n}}$. What is the total?`,
          question: {
            correctAnswer: answer,
            explanation: `Set $a = b = 1$ in the binomial theorem: $\\sum_k \\binom{${n}}{k} = (1+1)^${n} = 2^${n} = ${answer}$.`,
          },
          feedback: {
            correct: `Yes — $2^${n} = ${answer}$.`,
            incorrect: `Plug $a = b = 1$ into $(a+b)^${n}$.`,
            hint: 'The binomial theorem holds for ANY $a$ and $b$. What happens if both are 1?',
            computationHint: `$(1+1)^${n} = 2^${n} = ${answer}$.`,
          },
        }
      },
      concepts: ['binomial-theorem'],
    },
    {
      id: 'coin-bridge',
      type: 'multiple-choice',
      title: 'Back to the Coin',
      body: 'Recall the weighted coin: heads with probability $p$, tails with $q = 1 - p$, flipped $n$ times. You summed $\\binom{n}{k} p^k q^{\\,n-k}$ over all $k$.',
      prompt: 'How does the binomial theorem connect to that coin formula?',
      question: {
        inputType: 'multiple-choice',
        choices: [
          'Expanding $(p+q)^n$ gives exactly those terms, and since $p+q=1$ they sum to 1',
          'They are unrelated — one is algebra, the other probability',
          'Only when $p = q = \\tfrac12$',
          'Only for $n = 2$',
        ],
        correctChoiceIndex: 0,
        explanation:
          'Expanding $(p+q)^n = \\sum_k \\binom{n}{k} p^k q^{\\,n-k}$ — each term is $P(k\\text{ heads})$. Because $p+q=1$, the whole expansion is $1^n = 1$, so all the probabilities add to 1.',
        misconceptionTags: ['binomial-theorem', 'binomial-coin'],
      },
      feedback: {
        correct: 'Exactly — the coin probabilities ARE the terms of $(p+q)^n$, and they sum to $1^n = 1$.',
        incorrect: 'Think about expanding $(p+q)^n$ with the binomial theorem.',
        choiceFeedback: {
          'They are unrelated — one is algebra, the other probability':
            'They are the same expansion: set $a = p$, $b = q$ and each term $\\binom{n}{k}p^k q^{n-k}$ is a coin probability.',
          'Only when $p = q = \\tfrac12$':
            'It works for any $p$: the theorem holds for all $a, b$, so it holds for $a=p$, $b=q$ whatever their values.',
        },
        hint: 'The coin terms $\\binom{n}{k}p^k q^{n-k}$ look exactly like the terms of one particular expansion. Which one?',
        computationHint: 'Set $a = p$ and $b = q$ in $(a+b)^n$; since $p+q=1$, the sum of all terms is $1^n = 1$.',
      },
      concepts: ['binomial-theorem', 'binomial-coin'],
    },
    {
      id: 'completion',
      type: 'completion',
      title: 'Lesson Complete!',
      body: 'You proved the binomial theorem by counting: $(a+b)^n = \\sum_k \\binom{n}{k} a^k b^{\\,n-k}$, because each coefficient counts which factors supply the $a$.\n\nPascal’s triangle stacks those coefficients, each entry the sum of the two above it.\n\nSet $a = p$ and $b = q = 1-p$, and the same expansion gives every coin probability — and since $p + q = 1$, they add to 1.',
      nextButtonLabel: 'Back to course',
    },
  ],
}
