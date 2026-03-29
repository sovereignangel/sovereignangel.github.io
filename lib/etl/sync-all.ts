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
    edgar: boolean
    arxiv: boolean
    twitter: boolean
  }
  duration_ms: number
  errors: string[]
}

/**
 * Sync all data sources for a given date.
 * Defaults to today (partial-day data from Garmin updates throughout the day).
 * Call with explicit date for backfills.
 */
export async function syncAllData(date?: string): Promise<SyncResult> {
  const startTime = Date.now()

  // Default to today — Garmin has partial-day data (steps, stress, body battery)
  if (!date) {
    date = new Date().toISOString().split('T')[0]
  }

  console.log(`\n🚀 Starting daily sync for ${date}...\n`)

  const results = {
    garmin: false,
    calendar: false,
    chess: false,
    stripe: false,
    github: false,
    edgar: false,
    arxiv: false,
    twitter: false,
  }

  const errors: string[] = []

  // Dynamic imports — some modules (chess, stripe, github) init Supabase at
  // module scope and will throw if SUPABASE_URL is not set. Wrap each import
  // so one failing module doesn't prevent the rest from running.
  async function safeImport<T>(path: string): Promise<T | null> {
    try {
      return await import(path) as T
    } catch (e: any) {
      errors.push(`Import ${path}: ${e.message}`)
      return null
    }
  }

  const [garminMod, calendarMod, chessMod, stripeMod, githubMod, edgarMod, arxivMod, twitterMod] = await Promise.all([
    safeImport<{ syncGarminMetrics: typeof import('./garmin').syncGarminMetrics }>('./garmin'),
    safeImport<{ syncCalendarTime: typeof import('./calendar').syncCalendarTime }>('./calendar'),
    safeImport<{ syncChessProgress: typeof import('./chess').syncChessProgress }>('./chess'),
    safeImport<{ syncRevenueMetrics: typeof import('./stripe').syncRevenueMetrics }>('./stripe'),
    safeImport<{ syncGitHubActivity: typeof import('./github').syncGitHubActivity }>('./github'),
    safeImport<{ syncEdgarFilings: typeof import('./edgar').syncEdgarFilings }>('./edgar'),
    safeImport<{ syncArxivPapers: typeof import('./arxiv').syncArxivPapers }>('./arxiv'),
    safeImport<{ syncTwitterLists: typeof import('./twitter').syncTwitterLists }>('./twitter'),
  ])

  // Signal sources need a uid to write to Firestore
  const uid = process.env.FIREBASE_UID

  // Helper to run a sync if its module loaded successfully
  function runSync<T>(
    mod: { [k: string]: any } | null,
    fnName: string,
    key: keyof typeof results,
    ...args: any[]
  ): Promise<void> | null {
    if (!mod || !mod[fnName]) return null
    return mod[fnName](...args)
      .then((result: any) => {
        results[key] = typeof result === 'number' ? result > 0 : !!result
        if (!results[key]) errors.push(`${key} sync returned no data`)
      })
      .catch((err: any) => {
        results[key] = false
        errors.push(`${key}: ${err.message}`)
      })
  }

  // Run all syncs in parallel for speed
  const syncPromises = [
    runSync(garminMod, 'syncGarminMetrics', 'garmin', date),
    runSync(calendarMod, 'syncCalendarTime', 'calendar', date),
    runSync(chessMod, 'syncChessProgress', 'chess', date),
    runSync(stripeMod, 'syncRevenueMetrics', 'stripe', date),
    runSync(githubMod, 'syncGitHubActivity', 'github', date),
    // Signal sources (require FIREBASE_UID)
    ...(uid ? [
      runSync(edgarMod, 'syncEdgarFilings', 'edgar', uid),
      runSync(arxivMod, 'syncArxivPapers', 'arxiv', uid),
      runSync(twitterMod, 'syncTwitterLists', 'twitter', uid),
    ] : []),
  ].filter(Boolean) as Promise<void>[]

  if (!uid) {
    errors.push('FIREBASE_UID not set — skipping signal sources (EDGAR, ArXiv, Twitter)')
  }

  await Promise.all(syncPromises)

  const duration = Date.now() - startTime
  const successCount = Object.values(results).filter(Boolean).length
  const totalSources = uid ? 8 : 5

  console.log(`\n✨ Sync complete: ${successCount}/${totalSources} sources succeeded in ${duration}ms`)

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
    date.setDate(date.getDate() - i) // Start from today
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

  const totalPossible = days * 8
  const successRate = ((totalSuccessful / totalPossible) * 100).toFixed(1)

  console.log(`\n📊 Backfill Summary:`)
  console.log(`   Total syncs: ${totalSuccessful}/${totalPossible} (${successRate}%)`)
  console.log(`   Garmin: ${allResults.filter(r => r.results.garmin).length}/${days}`)
  console.log(`   Calendar: ${allResults.filter(r => r.results.calendar).length}/${days}`)
  console.log(`   Chess: ${allResults.filter(r => r.results.chess).length}/${days}`)
  console.log(`   Stripe: ${allResults.filter(r => r.results.stripe).length}/${days}`)
  console.log(`   GitHub: ${allResults.filter(r => r.results.github).length}/${days}`)
  console.log(`   EDGAR: ${allResults.filter(r => r.results.edgar).length}/${days}`)
  console.log(`   ArXiv: ${allResults.filter(r => r.results.arxiv).length}/${days}`)
  console.log(`   Twitter: ${allResults.filter(r => r.results.twitter).length}/${days}`)

  return allResults
}
