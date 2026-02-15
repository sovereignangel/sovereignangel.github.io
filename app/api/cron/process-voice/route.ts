/**
 * Voice Processing Cron Job
 * Scans Wave.ai Dropbox folder for new transcripts and processes them
 * Runs every hour to catch new voice inputs throughout the day
 *
 * Add to vercel.json:
 * {
 *   "path": "/api/cron/process-voice",
 *   "schedule": "0 * * * *"  // Every hour
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { scanAndProcessTranscripts } from '@/lib/voice/dropbox-watcher'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute max

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('🎙️  Voice processing cron job started')

    const results = await scanAndProcessTranscripts()

    const successCount = results.filter(r => r.processed).length
    const failedFiles = results.filter(r => !r.processed)

    return NextResponse.json({
      success: true,
      totalFiles: results.length,
      processed: successCount,
      failed: failedFiles.length,
      failures: failedFiles.map(f => ({
        file: f.name,
        error: f.error
      }))
    })

  } catch (error: any) {
    console.error('❌ Voice processing cron job failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Manual trigger endpoint
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('🔧 Manual voice processing triggered')

    const results = await scanAndProcessTranscripts()

    const successCount = results.filter(r => r.processed).length

    return NextResponse.json({
      success: true,
      totalFiles: results.length,
      processed: successCount,
      details: results
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
