/**
 * Pure parser for lesson prose (see RichText.tsx for the rendering + the authoring
 * convention). Kept separate from the component so it can be unit-tested and so the
 * component file only exports components (React Fast Refresh friendly). Named distinctly
 * from RichText.tsx to avoid a case-insensitive-filesystem module collision.
 */

export type RichSeg =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; display: boolean }

const isSpace = (c: string | undefined) => c === ' ' || c === '\t' || c === '\n'
const isDigit = (c: string | undefined) => c !== undefined && c >= '0' && c <= '9'

/** Splits prose into paragraphs on blank lines (two or more newlines). */
export function splitParagraphs(input: string): string[] {
  return input
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Segments a string into plain-text and math runs. Inline math is `$...$` (or `\(...\)`),
 * block math is `$$...$$` (or `\[...\]`). Never throws: any unmatched delimiter, or a
 * currency / lone `$` (pandoc-style: `$` only opens when not followed by a space, and the
 * closing `$` is not preceded by a space nor followed by a digit), is emitted as literal text.
 */
export function tokenizeMath(input: string): RichSeg[] {
  const segs: RichSeg[] = []
  let text = ''
  const flush = () => {
    if (text) {
      segs.push({ type: 'text', value: text })
      text = ''
    }
  }
  let i = 0
  const n = input.length
  while (i < n) {
    if (input.startsWith('$$', i)) {
      const end = input.indexOf('$$', i + 2)
      if (end !== -1) {
        flush()
        segs.push({ type: 'math', value: input.slice(i + 2, end).trim(), display: true })
        i = end + 2
        continue
      }
    }
    if (input.startsWith('\\[', i)) {
      const end = input.indexOf('\\]', i + 2)
      if (end !== -1) {
        flush()
        segs.push({ type: 'math', value: input.slice(i + 2, end).trim(), display: true })
        i = end + 2
        continue
      }
    }
    if (input.startsWith('\\(', i)) {
      const end = input.indexOf('\\)', i + 2)
      if (end !== -1) {
        flush()
        segs.push({ type: 'math', value: input.slice(i + 2, end).trim(), display: false })
        i = end + 2
        continue
      }
    }
    if (input[i] === '$' && input[i + 1] !== '$' && input[i + 1] !== undefined && !isSpace(input[i + 1])) {
      let j = i + 1
      while (j < n) {
        if (input[j] === '$' && !isSpace(input[j - 1]) && !isDigit(input[j + 1])) break
        j++
      }
      if (j < n && input[j] === '$') {
        flush()
        segs.push({ type: 'math', value: input.slice(i + 1, j).trim(), display: false })
        i = j + 1
        continue
      }
    }
    text += input[i]
    i++
  }
  flush()
  return segs
}
