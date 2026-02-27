/**
 * Build Watchdog Cron
 *
 * Detects stale builds (status: 'generating' for > 10 minutes) and:
 * 1. Marks them as failed in Firestore
 * 2. Sends a Telegram notification to the user
 *
 * Runs every 5 minutes via vercel.json cron.
 * Catches cases where the external builder crashes without calling the callback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 30

const STALE_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { adminDb } = await import('@/lib/firebase-admin')
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 })
    }

    // Find all users (in practice there's one, but this is future-proof)
    const usersSnap = await adminDb.collection('users').get()
    let staleBuildCount = 0

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      const chatId = userDoc.data()?.settings?.telegramChatId

      // Find ventures stuck in 'building' stage
      const venturesSnap = await adminDb
        .collection('users').doc(uid).collection('ventures')
        .where('stage', '==', 'building')
        .get()

      for (const ventureDoc of venturesSnap.docs) {
        const venture = ventureDoc.data()
        const startedAt = venture.build?.startedAt

        // Check if build started more than threshold ago
        let startedMs: number | null = null
        if (startedAt?.toDate) {
          startedMs = startedAt.toDate().getTime()
        } else if (startedAt instanceof Date) {
          startedMs = startedAt.getTime()
        } else if (typeof startedAt === 'string') {
          startedMs = new Date(startedAt).getTime()
        }

        if (!startedMs || Date.now() - startedMs < STALE_THRESHOLD_MS) continue

        // This build is stale — mark as failed
        const ventureName = venture.spec?.name || 'venture'
        const vNum = venture.ventureNumber ? `#${venture.ventureNumber} ` : ''

        await ventureDoc.ref.update({
          'build.status': 'failed',
          'build.errorMessage': 'Build timed out (no callback received after 10 minutes)',
          'build.completedAt': new Date(),
          updatedAt: new Date(),
        })

        staleBuildCount++

        // Notify via Telegram
        if (chatId) {
          await sendTelegramMessage(chatId, [
            `${vNum}${ventureName} build timed out`,
            '',
            'The builder did not report back within 10 minutes.',
            'Check GitHub Actions for errors.',
            '',
            'Use /build to retry or /cbuild for Claude-powered build',
          ].join('\n'))
        }
      }
    }

    return NextResponse.json({
      success: true,
      staleBuildsFound: staleBuildCount,
    })
  } catch (error) {
    console.error('Build watchdog error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
