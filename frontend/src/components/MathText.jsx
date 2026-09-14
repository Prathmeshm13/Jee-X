import katex from 'katex'
import 'katex/dist/katex.min.css'

// Question content from the bank mixes plain text with $inline$ and
// $$block$$ LaTeX (e.g. "Let $S = \\sum_{r=1}^{10} ...$. Then ..."). This
// renders both, and preserves \n line breaks in the surrounding text.
const MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g

function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode })
  } catch {
    return tex
  }
}

function textWithLineBreaks(text, keyPrefix) {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <span key={`${keyPrefix}-${i}`}>
      {line}
      {i < lines.length - 1 && <br />}
    </span>
  ))
}

export default function MathText({ text, style }) {
  if (!text) return null

  const parts = []
  let last = 0
  let match
  MATH_RE.lastIndex = 0
  while ((match = MATH_RE.exec(text))) {
    if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) })
    if (match[1] !== undefined) parts.push({ type: 'block', content: match[1] })
    else parts.push({ type: 'inline', content: match[2] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })

  return (
    <span style={style}>
      {parts.map((p, i) =>
        p.type === 'text' ? (
          textWithLineBreaks(p.content, i)
        ) : (
          <span key={i} style={p.type === 'block' ? { display: 'block', margin: '8px 0' } : undefined}
            dangerouslySetInnerHTML={{ __html: renderMath(p.content, p.type === 'block') }} />
        )
      )}
    </span>
  )
}
