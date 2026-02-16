// @ts-nocheck
/**
 * Chess.com API ETL
 * Syncs daily chess progress: ratings, games, puzzles, accuracy
 * Runs at 6am daily via cron
 *
 * API Docs: https://www.chess.com/news/view/published-data-api
 * No auth required for public profiles
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ChessProgress {
  date: string
  rapid_rating?: number
  blitz_rating?: number
  bullet_rating?: number
  puzzle_rating?: number
  games_played_today: number
  puzzles_solved_today: number
  accuracy_pct?: number
  raw_data: any
}

/**
 * Sync chess progress for a given date
 */
export async function syncChessProgress(date: string): Promise<ChessProgress | null> {
  const startTime = Date.now()

  try {
    // Log sync attempt
    await supabase.from('sync_status').insert({
      date,
      source: 'chess',
      status: 'pending',
      started_at: new Date().toISOString()
    })

    const username = process.env.CHESS_COM_USERNAME!

    // Fetch current ratings (stats endpoint)
    const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`)
    if (!statsRes.ok) throw new Error(`Chess.com API error: ${statsRes.status}`)
    const stats = await statsRes.json()

    // Fetch games for the month
    const [year, month] = date.split('-')
    const gamesRes = await fetch(
      `https://api.chess.com/pub/player/${username}/games/${year}/${month}`
    )
    const gamesData = gamesRes.ok ? await gamesRes.json() : { games: [] }

    // Filter games for the specific date
    const targetDate = new Date(date)
    const gamesOnDate = (gamesData.games || []).filter((game: any) => {
      const gameDate = new Date(game.end_time * 1000)
      return gameDate.toISOString().split('T')[0] === date
    })

    // Calculate average accuracy for games on this date
    let totalAccuracy = 0
    let accuracyCount = 0
    for (const game of gamesOnDate) {
      if (game.accuracies?.white || game.accuracies?.black) {
        const userColor = game.white.username.toLowerCase() === username.toLowerCase() ? 'white' : 'black'
        const accuracy = game.accuracies?.[userColor]
        if (accuracy) {
          totalAccuracy += accuracy
          accuracyCount++
        }
      }
    }

    const progress: ChessProgress = {
      date,
      rapid_rating: stats.chess_rapid?.last?.rating,
      blitz_rating: stats.chess_blitz?.last?.rating,
      bullet_rating: stats.chess_bullet?.last?.rating,
      puzzle_rating: stats.tactics?.highest?.rating,
      games_played_today: gamesOnDate.length,
      puzzles_solved_today: 0, // Chess.com doesn't expose daily puzzle count via API
      accuracy_pct: accuracyCount > 0 ? totalAccuracy / accuracyCount : undefined,
      raw_data: {
        stats,
        games_on_date: gamesOnDate
      }
    }

    // Upsert to database
    const { error } = await supabase
      .from('chess_progress')
      .insert(progress)

    if (error) throw error

    // Log success
    await supabase.from('sync_status').insert({
      date,
      source: 'chess',
      status: 'success',
      records_synced: 1,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    console.log(`✅ Chess.com synced for ${date}: ${gamesOnDate.length} games played`)
    return progress

  } catch (error: any) {
    console.error(`❌ Chess.com sync failed for ${date}:`, error)

    // Log failure
    await supabase.from('sync_status').insert({
      date,
      source: 'chess',
      status: 'failed',
      error_message: error.message,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    return null
  }
}

/**
 * Backfill last N days of chess data
 */
export async function backfillChessData(days: number = 90) {
  const results = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const progress = await syncChessProgress(dateStr)
    results.push({ date: dateStr, success: !!progress })

    // Rate limit: Chess.com allows 300 requests/min, so wait 250ms
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  const successful = results.filter(r => r.success).length
  console.log(`Backfilled ${successful}/${days} days of chess data`)

  return results
}

/**
 * Get current rating snapshot (useful for dashboard)
 */
export async function getCurrentRatings() {
  const username = process.env.CHESS_COM_USERNAME!

  try {
    const res = await fetch(`https://api.chess.com/pub/player/${username}/stats`)
    if (!res.ok) throw new Error(`Chess.com API error: ${res.status}`)

    const stats = await res.json()

    return {
      rapid: stats.chess_rapid?.last?.rating,
      blitz: stats.chess_blitz?.last?.rating,
      bullet: stats.chess_bullet?.last?.rating,
      puzzle: stats.tactics?.highest?.rating
    }
  } catch (error) {
    console.error('Failed to fetch current ratings:', error)
    return null
  }
}
