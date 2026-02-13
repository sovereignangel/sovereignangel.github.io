/**
 * Date utility functions for consistent date handling across the application.
 * All dates are in YYYY-MM-DD format unless otherwise specified.
 */

/**
 * Converts a Date object to YYYY-MM-DD string format.
 * This is the canonical date format used throughout the application.
 */
export function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Returns today's date in YYYY-MM-DD format.
 */
export function todayString(): string {
  return localDateString(new Date())
}

/**
 * Returns yesterday's date in YYYY-MM-DD format.
 */
export function yesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDateString(d)
}

/**
 * Returns the start of the week (Monday) for a given date in YYYY-MM-DD format.
 * Defaults to current week if no date provided.
 */
export function weekStartDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return localDateString(d)
}

/**
 * Formats a date string as short display format (e.g., "Jan 15").
 */
export function dateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Formats a date string as full display format (e.g., "January 15, 2026").
 */
export function dateFull(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/**
 * Returns short day of week for a date string (e.g., "Mon", "Tue").
 * Adds T12:00:00 to avoid timezone issues.
 */
export function dayOfWeekShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

/**
 * Returns an array of the last 7 days in YYYY-MM-DD format, from oldest to newest.
 * Includes today as the last element.
 */
export function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(localDateString(d))
  }
  return days
}
