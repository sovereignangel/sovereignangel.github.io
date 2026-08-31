/**
 * What day it is on /exec.
 *
 * The page is anchored to Palanga: kite windows, training slots, and calendar
 * events are all in Europe/Vilnius, so the day boundary is Vilnius midnight
 * too — not the server's UTC, and not whatever clock a laptop happens to be
 * set to. `todayLocal()` in the ironman plan already does exactly this; this
 * module is the client-side half, so both sides of the page turn over on the
 * same tick.
 */

import { TIMEZONE } from './windows'

/** Today in Palanga terms, YYYY-MM-DD. Safe on both server and client. */
export function execDateNow(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now)
}
