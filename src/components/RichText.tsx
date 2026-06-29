import { Fragment } from 'react'
import { Math as Tex } from './Math'
import { type RichSeg, splitParagraphs, tokenizeMath } from './richTextParse'

/**
 * Lesson prose convention (used by every lesson's body/prompt/explanation text):
 *
 *  - Paragraphs are separated by a BLANK line (`\n\n`); a single `\n` is a line break.
 *  - Inline math is wrapped in `$...$`; block (centered) math in `$$...$$`.
 *    `\( \)` and `\[ \]` are also accepted as inline/block math.
 *  - A lone or currency `$` is left alone — `$5`, `win $5 or $10` render as plain text
 *    (pandoc-style heuristic in `richText.ts`). Bad/odd delimiters fall back to plain
 *    text and never throw.
 *  - SPOKEN narration fields (worked-example `say`) stay PLAIN TEXT — never wrap them in
 *    `$...$`, so TTS never reads "dollar" or "backslash". Only DISPLAYED prose uses this.
 */

interface RichTextProps {
  children: string
  className?: string
  /** Inline mode: one line, no paragraph splitting (for buttons, labels, feedback). */
  inline?: boolean
}

function renderText(value: string, key: number) {
  const lines = value.split('\n')
  return (
    <Fragment key={key}>
      {lines.map((line, j) => (
        <Fragment key={j}>
          {j > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </Fragment>
  )
}

function renderSegs(segs: RichSeg[]) {
  return segs.map((seg, i) => {
    if (seg.type === 'math') {
      return seg.display ? (
        <Tex key={i} display className="my-2 block overflow-x-auto">
          {seg.value}
        </Tex>
      ) : (
        <Tex key={i}>{seg.value}</Tex>
      )
    }
    return renderText(seg.value, i)
  })
}

/**
 * Renders lesson prose: short grouped paragraphs with proper spacing, and inline/block
 * math via KaTeX. See the convention comment above. Backward-compatible — plain strings
 * with no `$` render exactly as a single paragraph.
 */
export function RichText({ children, className = '', inline = false }: RichTextProps) {
  if (inline) {
    return <span className={className}>{renderSegs(tokenizeMath(children))}</span>
  }
  const paragraphs = splitParagraphs(children)
  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((para, i) => (
        <div key={i} className="leading-relaxed">
          {renderSegs(tokenizeMath(para))}
        </div>
      ))}
    </div>
  )
}
