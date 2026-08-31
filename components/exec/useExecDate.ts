'use client'

/**
 * Keep the page's idea of "today" honest across midnight.
 *
 * /exec is a dashboard, which means it gets left open. A page delivered at
 * 22:00 still says 22:00's date at 00:30 no matter how short the server's
 * revalidate window is — the HTML in the tab was rendered hours ago. So the
 * client watches the clock itself: it re-reads the Palanga date on a short
 * interval and whenever the tab comes back to the foreground, and the moment
 * that date stops matching the one the server rendered with, it takes over
 * and asks the server for the new day's content.
 *
 * Polling for the date rather than computing the exact millisecond of the
 * next midnight is deliberate — it costs nothing, and it cannot be wrong
 * about a DST transition, a suspended laptop, or a clock correction.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { execDateNow } from '@/lib/exec/today'

const CHECK_MS = 30_000
/** While client and server disagree, ask again at most this often. */
const REFRESH_THROTTLE_MS = 60_000

export function useExecDate(serverDate: string): string {
  const router = useRouter()
  const [date, setDate] = useState(serverDate)
  const lastRefresh = useRef(0)

  useEffect(() => {
    const check = () => {
      const now = execDateNow()
      // The client is authoritative for the date: the band and every check-off
      // move to the new day immediately, without waiting on the server.
      setDate((prev) => (prev === now ? prev : now))

      // The server-rendered halves — kite windows, the training day — still
      // have to catch up. Throttled, because a stale cache entry would
      // otherwise be re-requested on every tick.
      if (now !== serverDate && Date.now() - lastRefresh.current > REFRESH_THROTTLE_MS) {
        lastRefresh.current = Date.now()
        router.refresh()
      }
    }

    check()
    const id = setInterval(check, CHECK_MS)
    const onWake = () => { if (!document.hidden) check() }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [serverDate, router])

  return date
}
