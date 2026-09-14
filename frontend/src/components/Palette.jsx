// A row of question-palette squares. Each entry in `states` is one question:
// 'correct' | 'wrong' | 'skipped' | 'current' | 'idle' (not reached yet), or the
// exam states 'answered' | 'unanswered' | 'marked' | 'answeredMarked'.
const WORDS = {
  correct: 'correct',
  wrong: 'wrong',
  skipped: 'skipped',
  current: 'current',
  idle: 'not attempted',
  answered: 'answered',
  unanswered: 'not answered',
  marked: 'marked for review',
  answeredMarked: 'answered and marked',
}

function summarise(states) {
  const counts = {}
  states.forEach((s) => { counts[s] = (counts[s] || 0) + 1 })
  return Object.entries(counts).map(([s, n]) => `${n} ${WORDS[s] || s}`).join(', ')
}

export default function Palette({ states, size, label, reveal = false, decorative = false, className = '' }) {
  const classes = ['palette', size && `palette-${size}`, reveal && 'palette-reveal', className].filter(Boolean).join(' ')
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': label ? `${label}: ${summarise(states)}` : summarise(states) }
  return (
    <div className={classes} {...a11y}>
      {states.map((s, i) => (
        <span key={i} className="sq" data-s={s} style={{ '--i': i }} />
      ))}
    </div>
  )
}
