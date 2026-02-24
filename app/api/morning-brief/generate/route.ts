/**
 * Morning Brief API
 *
 * GET  — Called by cron at 11am UTC (6am EST). Generates + sends brief for all configured users.
 * POST — Manual trigger. Accepts { uid } in body to generate for a specific user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateMorningBrief } from '@/lib/morning-brief'
import { formatMorningBrief } from '@/lib/morning-brief-formatter'
import { sendTelegramMessage } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 120

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

async function generateAndSend(uid: string, chatId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    const brief = await generateMorningBrief(uid)

    // Format and send via Telegram
    const formatted = formatMorningBrief(brief)
    const messageId = await sendTelegramMessage(chatId, formatted)

    // Save to daily_reports for dashboard access (include message_id for reply-based feedback)
    const db = await getAdminDb()
    await db.collection('users').doc(uid).collection('daily_reports').doc(brief.date).set({
      type: 'morning_brief',
      brief,
      formatted,
      generatedAt: new Date(),
      ...(messageId ? { telegramMessageId: messageId, telegramChatId: chatId } : {}),
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error(`[morning-brief] Failed for uid=${uid}:`, error)
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

      console.log(`[morning-brief] Generating for uid=${userDoc.id}`)
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
    console.error('[morning-brief] Cron job failed:', error)
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

    const brief = await generateMorningBrief(uid)
    const formatted = formatMorningBrief(brief)

    // Send via Telegram if chat ID available
    let messageId: number | null = null
    if (resolvedChatId) {
      messageId = await sendTelegramMessage(resolvedChatId, formatted)
    }

    // Save to daily_reports
    const db = await getAdminDb()
    await db.collection('users').doc(uid).collection('daily_reports').doc(brief.date).set({
      type: 'morning_brief',
      brief,
      formatted,
      generatedAt: new Date(),
      ...(messageId ? { telegramMessageId: messageId, telegramChatId: resolvedChatId } : {}),
    }, { merge: true })

    return NextResponse.json({ success: true, brief, formatted })
  } catch (error) {
    console.error('[morning-brief] Manual trigger failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
