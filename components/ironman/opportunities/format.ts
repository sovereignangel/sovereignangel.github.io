/**
 * Presentation helpers for the Opportunities boards — clocks, paces, dates.
 * Pure formatting only; every figure they format comes from Lordas.
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

/** h:mm, for a figure that is a range rather than a result. */
export function clockShort(sec: number): string {
  const a = Math.abs(Math.round(sec))
  return `${Math.floor(a / 3600)}:${String(Math.floor((a % 3600) / 60)).padStart(2, '0')}`
}

const at = (iso: string) => new Date(iso + 'T12:00:00')

/** "14 Mar" */
export const dayMonth = (iso: string) => at(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

/** "Sat, Mar 14" */
export const weekdayDate = (iso: string) =>
  at(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

/** "Sat, Mar 14, 2027" */
export const fullDate = (iso: string) =>
  at(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/** "Mar 14 27" */
export const shortDate = (iso: string) => `${dayMonth(iso)} ${iso.slice(2, 4)}`

export const year = (iso: string) => iso.slice(0, 4)

/** Minutes per mile, from a time over a distance in km. */
export function pacePerMile(sec: number, km: number): string {
  const perMile = sec / (km / 1.609344)
  const m = Math.floor(perMile / 60)
  const s = Math.round(perMile % 60)
  return s === 60 ? `${m + 1}:00` : `${m}:${String(s).padStart(2, '0')}`
}

/** Minutes per 100m, from a time over a distance in metres. */
export function pacePer100(sec: number, m: number): string {
  const per100 = sec / (m / 100)
  const mm = Math.floor(per100 / 60)
  const ss = Math.round(per100 % 60)
  return ss === 60 ? `${mm + 1}:00` : `${mm}:${String(ss).padStart(2, '0')}`
}

export function ordinal(n: number): string {
  const v = n % 100
  const suf = v >= 11 && v <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'
  return `${n.toLocaleString('en-US')}${suf}`
}

/** "Stretch 5:45" is one string in the data and two things on screen. */
export function splitRung(label: string): [string, string] {
  const i = label.lastIndexOf(' ')
  return i === -1 ? [label, ''] : [label.slice(0, i), label.slice(i + 1)]
}

/** Days from one ISO date to another. */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86400000)

/** Ascending or descending compare, with nulls sinking whichever way. */
export function compareNullable(a: string | number | null, b: string | number | null, dir: 'asc' | 'desc'): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  const c = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
  return dir === 'asc' ? c : -c
}

/** A colour at a fraction of its strength, for washes and edges on CSS variables. */
export const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`
