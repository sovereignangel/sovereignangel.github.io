/**
 * Pure formatting for the Performance page. No data lives here — every figure
 * these format arrives from Lordas.
 */

/** h:mm:ss for anything an hour or over, m:ss below it. */
export function clock(sec: number): string {
  const a = Math.abs(Math.round(sec))
  const h = Math.floor(a / 3600)
  const m = Math.floor((a % 3600) / 60)
  const s = a % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

/** A signed delta: '+3:12', '−0:45', or 'level'. */
export function signedClock(sec: number): string {
  const r = Math.round(sec)
  if (r === 0) return 'level'
  return `${r > 0 ? '+' : '−'}${clock(r)}`
}

export const monthDay = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export const fmtMin = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, '0')}` : `${Math.round(m)}m`

export const OK = 'var(--lordas-ok)'
export const WARN = 'var(--lordas-warn)'
export const CRIT = 'var(--lordas-crit)'
export const FAINT = 'var(--lordas-faint)'
export const MUTED = 'var(--lordas-muted)'
export const INK = 'var(--lordas-ink)'
export const ACCENT = 'var(--lordas-accent)'

/** Sport lines on the cream sheet: the page's own discipline colours. */
export const SPORT_INK: Record<string, string> = {
  swim: 'var(--iron-swim)',
  bike: 'var(--iron-bike)',
  run: 'var(--lordas-ok)',
  brick: 'var(--iron-brick)',
  strength: 'var(--lordas-muted)',
  core: 'var(--lordas-muted)',
  rest: 'var(--lordas-faint)',
}

/** Green inside 1.3x the winner, amber to 1.7x, red beyond. */
export function ratioColor(ratio: number | null): string {
  if (ratio == null) return FAINT
  return ratio < 1.3 ? OK : ratio < 1.7 ? WARN : CRIT
}

/**
 * Best to worst within a row, through amber, as a light wash. `t` is 0 for
 * the fastest and 1 for the slowest — a rank, not a magnitude.
 */
export function heat(t: number): string {
  const k = Math.max(0, Math.min(1, t))
  const mid = k < 0.5
    ? `color-mix(in srgb, var(--lordas-warn) ${Math.round(k * 200)}%, var(--lordas-ok))`
    : `color-mix(in srgb, var(--lordas-crit) ${Math.round((k - 0.5) * 200)}%, var(--lordas-warn))`
  return `color-mix(in srgb, ${mid} 17%, transparent)`
}
