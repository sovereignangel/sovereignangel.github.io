/**
 * Google Calendar integration for auto-computing focus hours.
 * Events whose title starts with "F" (case-insensitive) are counted as focus time.
 */

interface CalendarEvent {
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

interface CalendarResponse {
  items?: CalendarEvent[]
  error?: { message: string; code: number }
}

export async function fetchFocusHours(accessToken: string, date: string): Promise<number> {
  const timeMin = `${date}T00:00:00Z`
  const timeMax = `${date}T23:59:59Z`

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    throw new Error(`Calendar API error: ${res.status}`)
  }

  const data: CalendarResponse = await res.json()
  if (data.error) {
    throw new Error(data.error.message)
  }

  const events = data.items || []
  let totalMinutes = 0

  for (const event of events) {
    const title = (event.summary || '').trim()
    if (!title.toUpperCase().startsWith('F')) continue

    const startTime = event.start?.dateTime
    const endTime = event.end?.dateTime
    if (!startTime || !endTime) continue

    const start = new Date(startTime)
    const end = new Date(endTime)
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60)
    if (minutes > 0) {
      totalMinutes += minutes
    }
  }

  // Round to nearest 0.5 hours
  const hours = totalMinutes / 60
  return Math.round(hours * 2) / 2
}
