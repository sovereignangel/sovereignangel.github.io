// @ts-nocheck
/**
 * Master ETL Sync Function
 * Orchestrates all daily data syncs
 * Called by cron job twice daily (5am + 12pm UTC)
 *
 * Uses dynamic imports to avoid Supabase client initialization at build time.
 */

export interface SyncResult {
  date: string
  results: {
    garmin: boolean
    calendar: boolean
    chess: boolean
    stripe: boolean
    github: boolean
  }
  duration_ms: number
  errors: string[]
}

/**
 * Sync all data sources for yesterday's date
 * Runs at 6am, so we sync data from yesterday (which is now complete)
 */
export async function syncAllData(date?: string): Promise<SyncResult> {
  const startTime = Date.now()

  // Default to yesterday if no date provided
  if (!date) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    date = yesterday.toISOString().split('T')[0]
  }

  console.log(`\n🚀 Starting daily sync for ${date}...\n`)

  const results = {
    garmin: false,
    calendar: false,
    chess: false,
    stripe: false,
    github: false
  }

  const errors: string[] = []

  // Dynamic imports to avoid Supabase client init at build time
  const [
    { syncGarminMetrics },
    { syncCalendarTime },
    { syncChessProgress },
    { syncRevenueMetrics },
    { syncGitHubActivity },
  ] = await Promise.all([
    import('./garmin'),
    import('./calendar'),
    import('./chess'),
    import('./stripe'),
    import('./github'),
  ])

  // Run all syncs in parallel for speed
  const syncPromises = [
    syncGarminMetrics(date)
      .then(result => {
        results.garmin = !!result
        if (!result) errors.push('Garmin sync failed')
      })
      .catch(err => {
        results.garmin = false
        errors.push(`Garmin: ${err.message}`)
      }),

    syncCalendarTime(date)
      .then(result => {
        results.calendar = !!result
        if (!result) errors.push('Calendar sync failed')
      })
      .catch(err => {
        results.calendar = false
        errors.push(`Calendar: ${err.message}`)
      }),

    syncChessProgress(date)
      .then(result => {
        results.chess = !!result
        if (!result) errors.push('Chess sync failed')
      })
      .catch(err => {
        results.chess = false
        errors.push(`Chess: ${err.message}`)
      }),

    syncRevenueMetrics(date)
      .then(result => {
        results.stripe = !!result
        if (!result) errors.push('Stripe sync failed')
      })
      .catch(err => {
        results.stripe = false
        errors.push(`Stripe: ${err.message}`)
      }),

    syncGitHubActivity(date)
      .then(result => {
        results.github = !!result
        if (!result) errors.push('GitHub sync failed')
      })
      .catch(err => {
        results.github = false
        errors.push(`GitHub: ${err.message}`)
      })
  ]

  await Promise.all(syncPromises)

  const duration = Date.now() - startTime
  const successCount = Object.values(results).filter(Boolean).length

  console.log(`\n✨ Sync complete: ${successCount}/5 sources succeeded in ${duration}ms`)

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`)
    errors.forEach(err => console.log(`   - ${err}`))
  }

  return {
    date,
    results,
    duration_ms: duration,
    errors
  }
}

/**
 * Backfill all data sources for last N days
 * Use this for initial setup or to fill gaps
 */
export async function backfillAllData(days: number = 30) {
  console.log(`\n🔄 Backfilling ${days} days of data...\n`)

  const allResults: SyncResult[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i - 1) // Start from yesterday
    const dateStr = date.toISOString().split('T')[0]

    console.log(`\nDay ${i + 1}/${days}: ${dateStr}`)

    const result = await syncAllData(dateStr)
    allResults.push(result)

    // Rate limit: wait 2 seconds between days to avoid API throttling
    if (i < days - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Summary statistics
  const totalSuccessful = allResults.reduce((sum, r) => {
    return sum + Object.values(r.results).filter(Boolean).length
  }, 0)

  const totalPossible = days * 5
  const successRate = ((totalSuccessful / totalPossible) * 100).toFixed(1)

  console.log(`\n📊 Backfill Summary:`)
  console.log(`   Total syncs: ${totalSuccessful}/${totalPossible} (${successRate}%)`)
  console.log(`   Garmin: ${allResults.filter(r => r.results.garmin).length}/${days}`)
  console.log(`   Calendar: ${allResults.filter(r => r.results.calendar).length}/${days}`)
  console.log(`   Chess: ${allResults.filter(r => r.results.chess).length}/${days}`)
  console.log(`   Stripe: ${allResults.filter(r => r.results.stripe).length}/${days}`)
  console.log(`   GitHub: ${allResults.filter(r => r.results.github).length}/${days}`)

  return allResults
}
