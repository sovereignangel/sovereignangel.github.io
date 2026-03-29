/**
 * Backfill Garmin metrics directly (no server needed).
 * Usage: node --env-file=.env.local scripts/backfill-garmin.mjs [days=7]
 */

// Register path aliases for @/ imports
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// We need tsx or ts-node to run TS files, so use the compiled API route instead
const DAYS = parseInt(process.argv[2] || '7', 10)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
const CRON_SECRET = process.env.CRON_SECRET

if (!CRON_SECRET) {
  console.error('Missing CRON_SECRET. Run with: node --env-file=.env.local scripts/backfill-garmin.mjs')
  process.exit(1)
}

console.log(`Backfilling ${DAYS} days against ${BASE_URL}...\n`)

for (let i = 0; i < DAYS; i++) {
  const d = new Date()
  d.setDate(d.getDate() - i)
  const date = d.toISOString().split('T')[0]

  try {
    const res = await fetch(`${BASE_URL}/api/cron/sync-daily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date }),
    })

    if (res.ok) {
      const data = await res.json()
      const garmin = data.results?.garmin ? '✅' : '❌'
      const count = Object.values(data.results || {}).filter(Boolean).length
      console.log(`${date}: Garmin ${garmin} (${count} sources)`)
    } else {
      const text = await res.text()
      console.log(`${date}: HTTP ${res.status} — ${text.slice(0, 200)}`)
    }
  } catch (err) {
    console.log(`${date}: ${err.message}`)
  }

  if (i < DAYS - 1) await new Promise(r => setTimeout(r, 2000))
}

console.log('\nDone.')
