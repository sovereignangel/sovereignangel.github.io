/**
 * How old a feed is, said the way a person would say it.
 *
 * Freshness is a claim about the *sync*, not about the newest reading. A watch
 * that stopped uploading two days ago still has a "latest reading" — it just
 * happens to be two days old, which on a training dashboard is
 * indistinguishable from two rest days unless the page says so.
 */

export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'never'

export interface Freshness {
  level: FreshnessLevel
  /** "14 minutes ago", "6 hours ago", "2 days ago" */
  label: string
  ageMinutes: number | null
  iso: string | null
}

const AGING_AFTER_H = 12
const STALE_AFTER_H = 24

export function freshnessOf(iso: string | null | undefined, now: Date = new Date()): Freshness {
  if (!iso) return { level: 'never', label: 'never synced', ageMinutes: null, iso: null }

  const then = new Date(iso)
  if (isNaN(then.getTime())) return { level: 'never', label: 'never synced', ageMinutes: null, iso: null }

  const mins = Math.max(0, Math.round((now.getTime() - then.getTime()) / 60000))
  const hours = mins / 60

  const level: FreshnessLevel =
    hours >= STALE_AFTER_H ? 'stale' : hours >= AGING_AFTER_H ? 'aging' : 'fresh'

  return { level, label: `${relative(mins)} ago`, ageMinutes: mins, iso }
}

function relative(mins: number): string {
  if (mins < 1) return 'moments'
  if (mins < 60) return `${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

/** Palanga-local clock time, for the "as of" stamp in a header. */
export function stampOf(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Vilnius',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}
