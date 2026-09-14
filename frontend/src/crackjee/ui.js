// Design tokens for places CSS can't reach (chart colours, inline SVG). They mirror the
// custom properties in index.css; change both together.
export const INK = '#141B3D'
export const INK_2 = '#4A5373'
export const INK_3 = '#7F88A3'
export const PAGE = '#F4F6FA'
export const LINE = '#E2E6EF'
export const WHITE = '#FFFFFF'

export const PEN = '#2F45E0'
export const GOOD = '#1E9E5A'
export const BAD = '#E5484D'
export const MARKED = '#7B4FD8'
export const IDLE = '#D9DEE8'

export const PHYSICS = '#1C9BE8'
export const CHEM = '#EFA11B'
export const MATHS = '#D6409F'

export const SUBJECT_COLOR = { Physics: PHYSICS, Chemistry: CHEM, Mathematics: MATHS, PHY: PHYSICS, CHEM, MATH: MATHS }

export const fontBody = "'Schibsted Grotesk', 'Segoe UI', system-ui, sans-serif"

// Shared Recharts styling: quiet axes, no tick marks, hairline grid.
export const axisProps = { axisLine: false, tickLine: false, tick: { fill: INK_3, fontSize: 12, fontFamily: fontBody } }
export const gridProps = { stroke: LINE, strokeDasharray: '0', vertical: false }
export const tooltipProps = {
  contentStyle: { borderRadius: 10, border: `1px solid ${LINE}`, boxShadow: '0 8px 24px -12px rgba(20,27,61,.25)', fontFamily: fontBody, fontSize: 13 },
  labelStyle: { color: INK, fontWeight: 600 },
  cursor: { fill: 'rgba(47,69,224,0.06)' },
}

// Older names, kept so any code that still imports them keeps working.
export const PAPER = PAGE
export const PAPER_LINE = LINE
export const SLATE = INK_2
export const GRAPHITE = INK
export const AMBER = PEN
export const fontDisplay = fontBody
export const fontMono = fontBody
export const card = { background: WHITE, borderRadius: 18, padding: 24, border: `1px solid ${LINE}` }
export const label = { display: 'block', fontSize: 14, fontWeight: 600, color: INK, marginBottom: 7 }
export const input = { width: '100%', height: 48, padding: '0 14px', fontSize: 15.5, border: `1px solid ${'#CBD2E1'}`, borderRadius: 10, background: WHITE, color: INK, fontFamily: fontBody }
export const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 20px', background: PEN, color: WHITE, border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: fontBody }
export const ghostBtn = { ...primaryBtn, background: WHITE, color: INK, border: '1px solid #CBD2E1' }
export const inkBtn = { ...primaryBtn, background: INK }
export const hint = { fontSize: 13.5, marginTop: 6, color: INK_3 }
export const hintOk = { ...hint, color: GOOD }
export const hintErr = { ...hint, color: BAD }
