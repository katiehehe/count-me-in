import { describe, expect, it } from 'vitest'
import { splitParagraphs, tokenizeMath } from './richTextParse'

describe('splitParagraphs', () => {
  it('splits on blank lines, trims, and drops empties', () => {
    expect(splitParagraphs('one\n\ntwo')).toEqual(['one', 'two'])
    expect(splitParagraphs('a\n\n\n\nb')).toEqual(['a', 'b'])
    expect(splitParagraphs('  solo  ')).toEqual(['solo'])
    expect(splitParagraphs('keep\nthis\nline')).toEqual(['keep\nthis\nline'])
  })
})

describe('tokenizeMath', () => {
  it('segments inline math', () => {
    expect(tokenizeMath('x $a+b$ y')).toEqual([
      { type: 'text', value: 'x ' },
      { type: 'math', value: 'a+b', display: false },
      { type: 'text', value: ' y' },
    ])
  })

  it('segments block math', () => {
    expect(tokenizeMath('$$E=mc^2$$')).toEqual([{ type: 'math', value: 'E=mc^2', display: true }])
  })

  it('accepts \\( \\) and \\[ \\] delimiters', () => {
    expect(tokenizeMath('see \\(a^2\\) and \\[b^2\\]')).toEqual([
      { type: 'text', value: 'see ' },
      { type: 'math', value: 'a^2', display: false },
      { type: 'text', value: ' and ' },
      { type: 'math', value: 'b^2', display: true },
    ])
  })

  it('leaves currency and lone dollars as plain text', () => {
    expect(tokenizeMath('$2, $4, and $9')).toEqual([{ type: 'text', value: '$2, $4, and $9' }])
    expect(tokenizeMath('win $5 or $10')).toEqual([{ type: 'text', value: 'win $5 or $10' }])
    expect(tokenizeMath('costs $5')).toEqual([{ type: 'text', value: 'costs $5' }])
  })

  it('falls back to plain text on an unmatched delimiter (never throws)', () => {
    expect(tokenizeMath('a $b+c')).toEqual([{ type: 'text', value: 'a $b+c' }])
    expect(() => tokenizeMath('$$')).not.toThrow()
  })

  it('renders real math even when it ends in a digit', () => {
    expect(tokenizeMath('count is $\\binom{5}{2}=10$ ways')).toEqual([
      { type: 'text', value: 'count is ' },
      { type: 'math', value: '\\binom{5}{2}=10', display: false },
      { type: 'text', value: ' ways' },
    ])
  })
})
