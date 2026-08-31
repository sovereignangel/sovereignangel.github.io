/**
 * Tantra cycle arithmetic, shared between /tantra and /exec.
 *
 * The practice timeline lives in Firestore (TantraConfig.cycles); the content
 * of each version lives in app/tantra/page.tsx. Everything here is the pure
 * date maths in between, extracted so the two pages can never disagree about
 * which day of which cycle today is.
 */

import type { TantraCycle } from '../types/tantra'

export const CYCLE_DAYS = 40

/** Day 1 for the versions that predate the in-app version button. */
export const LEGACY_STARTS: Record<string, string> = {
  V1: '2026-04-21',
  V2: '2026-05-14',
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

/** Consecutive days ending today — or yesterday, if today is not yet checked. */
export function computeStreak(checkinDates: ReadonlySet<string>): number {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const d = new Date()
  if (!checkinDates.has(fmt(d))) d.setDate(d.getDate() - 1)
  let streak = 0
  for (let i = 0; i < 1000; i++) {
    if (!checkinDates.has(fmt(d))) break
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function countCompleted(
  startDate: string,
  length: number,
  checkinDates: ReadonlySet<string>
): number {
  let done = 0
  for (let i = 0; i < length; i++) {
    if (checkinDates.has(addDays(startDate, i))) done += 1
  }
  return done
}

export interface ActiveCycle {
  versionId: string
  startDate: string
  length: number
  /** 1-based, clamped to the cycle length. */
  day: number
  completed: number
  /** Days since the very first cycle began — the practice, not the version. */
  daysPracticing: number
}

/**
 * Resolve the live cycle from the stored timeline. The last entry is always
 * the active one; a missing or empty timeline falls back to the legacy V1
 * start so the page reads something sane before the config has been written.
 */
export function activeCycle(
  cycles: TantraCycle[] | undefined,
  today: string,
  checkinDates: ReadonlySet<string>
): ActiveCycle {
  const list = cycles && cycles.length > 0 ? cycles : []
  const last = list[list.length - 1]
  const startDate = last?.startDate || LEGACY_STARTS.V1
  const length = last?.cycleLengthDays || CYCLE_DAYS
  const practiceStart = list[0]?.startDate || startDate

  return {
    versionId: last?.versionId || 'V1',
    startDate,
    length,
    day: Math.max(0, Math.min(length, daysBetween(startDate, today) + 1)),
    completed: countCompleted(startDate, length, checkinDates),
    daysPracticing: Math.max(0, daysBetween(practiceStart, today) + 1),
  }
}
