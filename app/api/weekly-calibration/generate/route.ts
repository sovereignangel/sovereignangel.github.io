/**
 * Weekly Calibration Report API
 *
 * GET  — Called by cron every Sunday at 10pm UTC. Generates + sends report for all configured users.
 * POST — Manual trigger. Accepts { uid } in body to generate for a specific user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyCalibration } from '@/lib/weekly-calibration'
import { formatWeeklyCalibration } from '@/lib/weekly-calibration-formatter'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 120

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

async function generateAndSend(uid: string, chatId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const calibration = await generateWeeklyCalibration(uid)

    // Format and send via Telegram
    const formatted = formatWeeklyCalibration(calibration)
    await sendTelegramMessage(chatId, formatted)

    // Save to weekly_synthesis collection
    const db = await getAdminDb()
    await db.collection('users').doc(uid).collection('weekly_synthesis').doc(calibration.weekStart).set({
      type: 'calibration',
      calibration,
      formatted,
      generatedAt: new Date(),
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error(`[weekly-calibration] Failed for uid=${uid}:`, error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Cron-triggered: generate for all users with Telegram configured
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getAdminDb()

    // Find all users with telegramChatId configured
    const usersSnap = await db.collection('users').get()
    const results: Array<{ uid: string; success: boolean; error?: string }> = []

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data()
      const chatId = data?.settings?.telegramChatId
      if (!chatId) continue

      console.log(`[weekly-calibration] Generating for uid=${userDoc.id}`)
      const result = await generateAndSend(userDoc.id, chatId)
      results.push({ uid: userDoc.id, ...result })
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      generated: results.length,
      succeeded: successCount,
      results,
    })
  } catch (error) {
    console.error('[weekly-calibration] Cron job failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Manual trigger: generate for a specific user
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { uid, chatId } = await request.json()

    if (!uid) {
      return NextResponse.json({ error: 'uid required' }, { status: 400 })
    }

    // If chatId not provided, look it up
    let resolvedChatId = chatId
    if (!resolvedChatId) {
      const db = await getAdminDb()
      const userDoc = await db.collection('users').doc(uid).get()
      resolvedChatId = userDoc.data()?.settings?.telegramChatId
    }

    const calibration = await generateWeeklyCalibration(uid)
    const formatted = formatWeeklyCalibration(calibration)

    // Send via Telegram if chat ID available
    if (resolvedChatId) {
      await sendTelegramMessage(resolvedChatId, formatted)
    }

    // Save to weekly_synthesis
    const db = await getAdminDb()
    await db.collection('users').doc(uid).collection('weekly_synthesis').doc(calibration.weekStart).set({
      type: 'calibration',
      calibration,
      formatted,
      generatedAt: new Date(),
    }, { merge: true })

    return NextResponse.json({ success: true, calibration, formatted })
  } catch (error) {
    console.error('[weekly-calibration] Manual trigger failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
