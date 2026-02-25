// @ts-nocheck
/**
 * Google Calendar API ETL
 * Syncs color-coded time allocation from calendar events
 * Maps calendar colors to activity categories
 * Runs at 6am daily via cron
 */

import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CalendarTime {
  date: string
  deep_work_min: number
  meetings_min: number
  learning_min: number
  fitness_min: number
  social_min: number
  recovery_min: number
  raw_events: any[]
}

/**
 * Color mapping (Google Calendar color IDs)
 * Customize these based on your calendar setup
 */
const COLOR_MAPPING: Record<string, keyof Omit<CalendarTime, 'date' | 'raw_events'>> = {
  '11': 'deep_work_min',      // Red: coding, research, writing
  '9': 'meetings_min',         // Blue: calls, meetings
  '10': 'learning_min',        // Green: courses, reading
  '5': 'fitness_min',          // Yellow: workouts, training
  '3': 'social_min',           // Purple: dates, networking
  '8': 'recovery_min',         // Gray: rest, leisure
}

/**
 * Sync yesterday's calendar events and calculate time allocation
 */
export async function syncCalendarTime(date: string): Promise<CalendarTime | null> {
  const startTime = Date.now()

  try {
    // Log sync attempt
    await supabase.from('sync_status').insert({
      date,
      source: 'calendar',
      status: 'pending',
      started_at: new Date().toISOString()
    })

    // Initialize Google Calendar API
    const calendar = await initGoogleCalendar()

    // Fetch events for the date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items || []

    // Calculate time allocation by color
    const timeAllocation: CalendarTime = {
      date,
      deep_work_min: 0,
      meetings_min: 0,
      learning_min: 0,
      fitness_min: 0,
      social_min: 0,
      recovery_min: 0,
      raw_events: events
    }

    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue

      const start = new Date(event.start.dateTime)
      const end = new Date(event.end.dateTime)
      const durationMin = Math.round((end.getTime() - start.getTime()) / 1000 / 60)

      // Get color ID (defaults to '1' if not set)
      const colorId = event.colorId || '1'
      const category = COLOR_MAPPING[colorId]

      if (category) {
        timeAllocation[category] += durationMin
      } else {
        // Default to meetings if color not mapped
        timeAllocation.meetings_min += durationMin
      }
    }

    // Upsert to database
    const { error } = await supabase
      .from('calendar_time')
      .upsert(timeAllocation, { onConflict: 'date' })

    if (error) throw error

    // Log success
    await supabase.from('sync_status').insert({
      date,
      source: 'calendar',
      status: 'success',
      records_synced: events.length,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    console.log(`✅ Calendar synced for ${date}: ${events.length} events`)
    return timeAllocation

  } catch (error: any) {
    console.error(`❌ Calendar sync failed for ${date}:`, error)

    // Log failure
    await supabase.from('sync_status').insert({
      date,
      source: 'calendar',
      status: 'failed',
      error_message: error.message,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    return null
  }
}

/**
 * Initialize Google Calendar API client
 * Uses OAuth2 with refresh token
 */
async function initGoogleCalendar() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  return calendar
}

/**
 * Backfill last N days of calendar data
 */
export async function backfillCalendarData(days: number = 30) {
  const results = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const timeAllocation = await syncCalendarTime(dateStr)
    results.push({ date: dateStr, success: !!timeAllocation })

    // Rate limit: wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const successful = results.filter(r => r.success).length
  console.log(`Backfilled ${successful}/${days} days of calendar data`)

  return results
}

/**
 * Helper: Get OAuth URL for initial setup
 * User needs to visit this URL once to authorize the app
 */
export function getGoogleOAuthURL() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ]

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  })

  return url
}

/**
 * Helper: Exchange auth code for refresh token
 * Use this once after user authorizes via OAuth URL
 */
export async function exchangeCodeForToken(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { tokens } = await oauth2Client.getToken(code)

  if (process.env.NODE_ENV === 'development') {
    console.log('Add this to your .env.local:')
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
  }

  return tokens
}
