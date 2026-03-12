/**
 * One-off script to manually process Wave.ai sessions that failed webhook delivery.
 * Usage: npx tsx scripts/reprocess-wave-sessions.ts
 */
// Env vars loaded via: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/reprocess-wave-sessions.ts
const WAVE_API_TOKEN = process.env.WAVE_API_TOKEN!
const UID = process.env.TRANSCRIPT_WEBHOOK_UID!

const SESSION_IDS = [
  '9e72da69-0ca6-443c-ab01-b8da0aee5003',
  'c3cc34fb-284d-4b6c-b81f-eee76b34fc9d',
  '844ac211-2b70-43e5-8bb4-b4e3ef34ac32',
]

async function fetchTranscript(sessionId: string): Promise<string | null> {
  const res = await fetch(`https://api.wave.co/v1/sessions/${sessionId}/transcript`, {
    headers: { Authorization: `Bearer ${WAVE_API_TOKEN}` },
  })
  if (!res.ok) {
    console.error(`  Failed to fetch ${sessionId}: ${res.status}`)
    return null
  }
  const data = await res.json()
  let text = data.transcript || ''
  if ((!text || text.length < 100) && data.segments?.length > 0) {
    text = data.segments.map((s: { speaker: string; text: string }) => `${s.speaker}: ${s.text}`).join('\n')
  }
  return text.length >= 100 ? text : null
}

async function main() {
  // Dynamic imports to use project's own modules with path aliases resolved by tsx
  const { classifyTranscriptType, extractFromTranscript } = await import('../lib/ai-extraction')
  const { processTranscriptData, formatTranscriptSummary } = await import('../lib/transcript-processing')
  const { sendTelegramMessage } = await import('../lib/telegram')
  const { adminDb } = await import('../lib/firebase-admin')

  // Get Telegram chat ID
  const userDoc = await adminDb.collection('users').doc(UID).get()
  const chatId = userDoc.data()?.settings?.telegramChatId

  // Get session metadata
  const sessionsRes = await fetch('https://api.wave.co/v1/sessions?limit=10', {
    headers: { Authorization: `Bearer ${WAVE_API_TOKEN}` },
  })
  const sessionsData = await sessionsRes.json()
  const sessionMap = new Map(
    sessionsData.sessions.map((s: { id: string; title: string; duration_seconds: number }) => [s.id, s])
  )

  for (const sessionId of SESSION_IDS) {
    const meta = sessionMap.get(sessionId) as { title: string; duration_seconds: number } | undefined
    const title = meta?.title || sessionId.slice(0, 8)
    console.log(`\nProcessing: ${title}`)

    const text = await fetchTranscript(sessionId)
    if (!text) {
      console.log('  Skipped (transcript not ready or too short)')
      continue
    }
    console.log(`  Transcript: ${text.length} chars`)

    const templateType = await classifyTranscriptType(text)
    console.log(`  Classified as: ${templateType}`)

    const extracted = await extractFromTranscript(text, templateType)
    console.log(`  Extracted: ${extracted.keyTakeaways.length} takeaways, ${extracted.actionItems.length} actions`)

    const result = await processTranscriptData(UID, text, templateType, extracted)
    console.log(`  Saved: conversation=${result.conversationId}`)
    console.log(`  Counts:`, result.counts)

    if (chatId) {
      const durationMin = meta?.duration_seconds ? Math.round(meta.duration_seconds / 60) : 0
      const summary = formatTranscriptSummary(result, {
        source: `Wave (${durationMin} min, manual reprocess)`,
        autoClassified: true,
      })
      await sendTelegramMessage(chatId, summary)
      console.log('  Telegram notification sent')
    }
  }

  console.log('\nDone!')
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
