import katex from 'katex'

interface MathProps {
  children: string
  /** Render as a centered display block instead of inline. */
  display?: boolean
  className?: string
}

/** Renders a LaTeX string with KaTeX. Bad input renders in place (never throws). */
export function Math({ children, display = false, className = '' }: MathProps) {
  const html = katex.renderToString(children, {
    displayMode: display,
    throwOnError: false,
    output: 'html',
  })
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
