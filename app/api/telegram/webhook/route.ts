import { NextRequest, NextResponse } from 'next/server'
import { parseTelegramMessage, type TelegramUpdate } from '@/lib/telegram-parser'
import { parseJournalEntry, type ParsedJournalEntry } from '@/lib/ai-extraction'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegramReply(chatId: number, text: string) {
  if (!BOT_TOKEN) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

async function findUserByChatId(chatId: number): Promise<string | null> {
  const adminDb = await getAdminDb()
  const usersRef = adminDb.collection('users')
  const snap = await usersRef.where('settings.telegramChatId', '==', String(chatId)).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].id
}

function getTodayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildJournalReply(parsed: ParsedJournalEntry): string {
  const lines: string[] = ['*Journal saved*']

  // Energy
  const energyLines: string[] = []
  if (parsed.energy.nervousSystemState) energyLines.push(`  NS State → ${parsed.energy.nervousSystemState.replace('_', ' ')}`)
  if (parsed.energy.bodyFelt) energyLines.push(`  Body → ${parsed.energy.bodyFelt}`)
  if (parsed.energy.trainingTypes.length > 0) energyLines.push(`  Training → ${parsed.energy.trainingTypes.join(', ')}`)
  if (parsed.energy.sleepHours != null) energyLines.push(`  Sleep → ${parsed.energy.sleepHours} hrs`)
  if (energyLines.length > 0) {
    lines.push('', '*Energy:*', ...energyLines)
  }

  // Output
  const outputLines: string[] = []
  if (parsed.output.focusHoursActual != null) outputLines.push(`  Focus → ${parsed.output.focusHoursActual} hrs`)
  if (parsed.output.whatShipped) outputLines.push(`  Shipped → "${parsed.output.whatShipped}"`)
  if (outputLines.length > 0) {
    lines.push('', '*Output:*', ...outputLines)
  }

  // PsyCap
  const psyParts: string[] = []
  if (parsed.psyCap.hope != null) psyParts.push(`Hope ${parsed.psyCap.hope}`)
  if (parsed.psyCap.efficacy != null) psyParts.push(`Efficacy ${parsed.psyCap.efficacy}`)
  if (parsed.psyCap.resilience != null) psyParts.push(`Resilience ${parsed.psyCap.resilience}`)
  if (parsed.psyCap.optimism != null) psyParts.push(`Optimism ${parsed.psyCap.optimism}`)
  if (psyParts.length > 0) {
    lines.push('', `*PsyCap:* ${psyParts.join(' | ')}`)
  }

  // Cadence
  if (parsed.cadenceCompleted.length > 0) {
    lines.push('', `*Cadence:* ${parsed.cadenceCompleted.join(', ')}`)
  }

  // Decisions & Principles
  if (parsed.decisions.length > 0) {
    lines.push('', `+${parsed.decisions.length} decision${parsed.decisions.length > 1 ? 's' : ''} created`)
  }
  if (parsed.principles.length > 0) {
    lines.push('', `+${parsed.principles.length} principle${parsed.principles.length > 1 ? 's' : ''} extracted`)
  }

  // If nothing was parsed beyond raw text
  if (lines.length === 1) {
    lines.push('', '_No structured data extracted. Journal text saved._')
  }

  return lines.join('\n')
}

async function handleJournal(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()
  const today = getTodayKey()

  // Send "parsing..." acknowledgment so user knows it's working
  await sendTelegramReply(chatId, '_Parsing journal..._')

  // AI parse the journal text
  const parsed = await parseJournalEntry(text)

  // Build daily log update from parsed data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logUpdate: Record<string, any> = {
    journalEntry: text,
    updatedAt: new Date(),
  }

  if (parsed.energy.nervousSystemState) logUpdate.nervousSystemState = parsed.energy.nervousSystemState
  if (parsed.energy.bodyFelt) logUpdate.bodyFelt = parsed.energy.bodyFelt
  if (parsed.energy.trainingTypes.length > 0) logUpdate.trainingTypes = parsed.energy.trainingTypes
  if (parsed.energy.sleepHours != null) logUpdate.sleepHours = parsed.energy.sleepHours
  if (parsed.output.focusHoursActual != null) logUpdate.focusHoursActual = parsed.output.focusHoursActual
  if (parsed.output.whatShipped) logUpdate.whatShipped = parsed.output.whatShipped
  if (parsed.psyCap.hope != null) logUpdate.psyCapHope = parsed.psyCap.hope
  if (parsed.psyCap.efficacy != null) logUpdate.psyCapEfficacy = parsed.psyCap.efficacy
  if (parsed.psyCap.resilience != null) logUpdate.psyCapResilience = parsed.psyCap.resilience
  if (parsed.psyCap.optimism != null) logUpdate.psyCapOptimism = parsed.psyCap.optimism

  // Save to daily log (merge to avoid overwriting existing fields)
  const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
  await logRef.set(logUpdate, { merge: true })

  // Create decisions
  for (const d of parsed.decisions) {
    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() + 90)
    const decisionRef = adminDb.collection('users').doc(uid).collection('decisions').doc()
    await decisionRef.set({
      title: d.title,
      hypothesis: d.hypothesis,
      options: [d.chosenOption],
      chosenOption: d.chosenOption,
      reasoning: d.reasoning,
      confidenceLevel: d.confidenceLevel,
      killCriteria: [],
      premortem: '',
      domain: d.domain,
      linkedProjectIds: [],
      linkedSignalIds: [],
      status: 'active',
      reviewDate: reviewDate.toISOString().split('T')[0],
      decidedAt: today,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Create principles
  for (const p of parsed.principles) {
    const principleRef = adminDb.collection('users').doc(uid).collection('principles').doc()
    await principleRef.set({
      text: p.text,
      shortForm: p.shortForm,
      source: 'manual',
      sourceDescription: 'Extracted from Telegram journal',
      domain: p.domain,
      dateFirstApplied: today,
      linkedDecisionIds: [],
      lastReinforcedAt: today,
      reinforcementCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Reply with summary of all actions
  await sendTelegramReply(chatId, buildJournalReply(parsed))
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot not configured' }, { status: 500 })
  }

  try {
    const update: TelegramUpdate = await req.json()
    const message = update.message

    if (!message?.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id

    // /start command — show help
    if (message.text.startsWith('/start')) {
      await sendTelegramReply(chatId, [
        '*Thesis Engine Signal Bot*',
        '',
        'Commands:',
        '`/signal <text>` — Create external signal',
        '`/signal #ai <text>` — Signal with pillar',
        '`/note <text>` — Quick note',
        '`/journal <text>` — Journal entry (AI-parsed)',
        '`/id` — Show your chat ID (for settings)',
        '',
        'Pillar tags: `#ai` `#markets` `#mind`',
      ].join('\n'))
      return NextResponse.json({ ok: true })
    }

    // /id command — return chat ID for settings config
    if (message.text.startsWith('/id')) {
      await sendTelegramReply(chatId, `Your chat ID: \`${chatId}\`\n\nEnter this in Thesis Engine > Settings > Telegram.`)
      return NextResponse.json({ ok: true })
    }

    // Look up user by chat ID
    const uid = await findUserByChatId(chatId)
    if (!uid) {
      await sendTelegramReply(chatId, 'Not linked. Add your chat ID in Thesis Engine > Settings > Telegram.\n\nUse `/id` to get your chat ID.')
      return NextResponse.json({ ok: true })
    }

    // Parse the message
    const parsed = parseTelegramMessage(message.text)

    // Handle journal command
    if (parsed.command === 'journal') {
      if (!parsed.text) {
        await sendTelegramReply(chatId, 'Empty journal. Usage: `/journal Trained strength today, slept 7 hours, shipped the landing page`')
        return NextResponse.json({ ok: true })
      }
      await handleJournal(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    if (!parsed.text) {
      await sendTelegramReply(chatId, 'Empty signal. Usage: `/signal Your observation here`')
      return NextResponse.json({ ok: true })
    }

    // Save as external signal
    const adminDb = await getAdminDb()
    const signalData = {
      title: parsed.text.slice(0, 120),
      aiSummary: parsed.text,
      keyTakeaway: parsed.text,
      valueBullets: [],
      sourceUrl: '',
      sourceName: `Telegram @${message.from.username || message.from.first_name}`,
      source: 'telegram',
      relevanceScore: parsed.command === 'note' ? 0.3 : 0.7,
      thesisPillars: parsed.pillars,
      status: 'inbox',
      readStatus: 'unread',
      publishedAt: new Date(message.date * 1000).toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const signalRef = adminDb.collection('users').doc(uid).collection('external_signals').doc()
    await signalRef.set(signalData)

    const pillarStr = parsed.pillars.length > 0 ? ` [${parsed.pillars.join(', ')}]` : ''
    await sendTelegramReply(chatId, `Signal saved${pillarStr}\n_"${parsed.text.slice(0, 80)}${parsed.text.length > 80 ? '...' : ''}"_`)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
