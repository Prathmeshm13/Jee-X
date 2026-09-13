// Shared design tokens — mirrors the editorial JeeX system in index.css
// (ink / paper / amber, subject colors, Space Grotesk + Inter + JetBrains Mono)
// so every screen reads as one cohesive product rather than a generic template.
export const INK = '#10182B'
export const INK_2 = '#1B2540'
export const PAPER = '#F2EFE6'
export const PAPER_LINE = '#C9C2AE'
export const SLATE = '#3B4A6B'
export const AMBER = '#E8A33D'
export const GRAPHITE = '#1C2333'
export const WHITE = '#FFFFFF'

export const PHYSICS = '#5B8DEF'
export const CHEM = '#4FB286'
export const MATHS = '#B47EDE'

export const GOOD = '#2E7D4F'
export const BAD = '#B4402A'

export const fontDisplay = "'Space Grotesk', 'Helvetica Neue', sans-serif"
export const fontBody = "'Inter', 'Helvetica Neue', sans-serif"
export const fontMono = "'JetBrains Mono', 'Courier New', monospace"

export const card = {
  background: WHITE,
  borderRadius: 6,
  padding: '26px 24px',
  border: `1px solid ${PAPER_LINE}`,
}

export const label = { display: 'block', fontSize: 13, fontWeight: 600, color: GRAPHITE, marginBottom: 6 }

export const input = {
  width: '100%',
  padding: '11px 12px',
  fontSize: 14.5,
  border: `1px solid ${PAPER_LINE}`,
  borderRadius: 4,
  outline: 'none',
  fontFamily: fontBody,
  color: GRAPHITE,
  background: PAPER,
}

export const primaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '13px 22px',
  background: AMBER,
  color: INK,
  border: 'none',
  borderRadius: 4,
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  fontFamily: fontBody,
}

export const ghostBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 16px',
  background: 'transparent',
  color: GRAPHITE,
  border: `1px solid ${PAPER_LINE}`,
  borderRadius: 4,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: fontBody,
}

export const inkBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '13px 22px',
  background: INK,
  color: PAPER,
  border: 'none',
  borderRadius: 4,
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  fontFamily: fontBody,
}

export const hint = { fontSize: 12.5, marginTop: 6, color: SLATE }
export const hintOk = { ...hint, color: GOOD }
export const hintErr = { ...hint, color: BAD }
