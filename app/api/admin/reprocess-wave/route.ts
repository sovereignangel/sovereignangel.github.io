/**
 * One-off admin endpoint to reprocess Wave.ai sessions that failed webhook delivery.
 * Protected by a simple secret token check.
 * DELETE THIS FILE after use.
 */
import { NextRequest, NextResponse } from 'next/server'
import { extractFromTranscript, classifyTranscriptType } from '@/lib/ai-extraction'
import { processTranscriptData, formatTranscriptSummary } from '@/lib/transcript-processing'
import { sendToInbox } from '@/lib/inbox/client'

export const runtime = 'nodejs'
export const maxDuration = 300

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

async function fetchWaveTranscript(sessionId: string): Promise<string | null> {
  const token = process.env.WAVE_API_TOKEN
  if (!token) return null

  const res = await fetch(`https://api.wave.co/v1/sessions/${sessionId}/transcript`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null

  const data = await res.json()
  let text = data.transcript || ''
  if ((!text || text.length < 100) && data.segments?.length > 0) {
    text = data.segments.map((s: { speaker: string; text: string }) => `${s.speaker}: ${s.text}`).join('\n')
  }
  return text.length >= 100 ? text : null
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.TRANSCRIPT_WEBHOOK_UID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionIds } = await request.json() as { sessionIds: string[] }
  const uid = process.env.TRANSCRIPT_WEBHOOK_UID!
  const db = await getAdminDb()

  // Get Telegram chat ID
  const userDoc = await db.collection('users').doc(uid).get()
  const chatId = userDoc.data()?.settings?.telegramChatId

  // Get session metadata from Wave
  const token = process.env.WAVE_API_TOKEN!
  const sessionsRes = await fetch('https://api.wave.co/v1/sessions?limit=10', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const sessionsData = await sessionsRes.json()
  const sessionMap = new Map(
    sessionsData.sessions.map((s: { id: string; title: string; duration_seconds: number }) => [s.id, s])
  )

  const results: Array<{ sessionId: string; title: string; status: string; counts?: Record<string, number> }> = []

  for (const sessionId of sessionIds) {
    const meta = sessionMap.get(sessionId) as { title: string; duration_seconds: number } | undefined
    const title = meta?.title || sessionId.slice(0, 8)

    try {
      const text = await fetchWaveTranscript(sessionId)
      if (!text) {
        results.push({ sessionId, title, status: 'skipped_no_transcript' })
        continue
      }

      const templateType = await classifyTranscriptType(text)
      const extracted = await extractFromTranscript(text, templateType)
      const result = await processTranscriptData(uid, text, templateType, extracted)

      if (chatId) {
        const durationMin = meta?.duration_seconds ? Math.round(meta.duration_seconds / 60) : 0
        const summary = formatTranscriptSummary(result, {
          source: `Wave (${durationMin} min, reprocessed)`,
          autoClassified: true,
        })
        await sendToInbox({
          source: 'lordas',
          kind: 'info',
          severity: 'info',
          title: `Wave reprocessed: ${title}`,
          body: summary,
          dedupe_key: `wave-reprocess:${sessionId}`,
        })
      }

      results.push({ sessionId, title, status: 'processed', counts: result.counts })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ sessionId, title, status: `error: ${msg.slice(0, 200)}` })
    }
  }

  return NextResponse.json({ results })
}
