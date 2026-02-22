import { NextRequest, NextResponse } from 'next/server'
import { parseTelegramMessage, type TelegramUpdate } from '@/lib/telegram-parser'
import { parseJournalEntry, transcribeAndParseVoiceNote, parsePrediction, type ParsedJournalEntry } from '@/lib/ai-extraction'

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
  if (parsed.energy.nervousSystemState) energyLines.push(`  NS → ${parsed.energy.nervousSystemState.replace('_', ' ')}`)
  if (parsed.energy.bodyFelt) energyLines.push(`  Body → ${parsed.energy.bodyFelt}`)
  if (parsed.energy.trainingTypes.length > 0) energyLines.push(`  Training → ${parsed.energy.trainingTypes.join(', ')}`)
  if (parsed.energy.sleepHours != null) energyLines.push(`  Sleep → ${parsed.energy.sleepHours}h`)
  if (energyLines.length > 0) {
    lines.push('', '*Energy:*', ...energyLines)
  }

  // Output
  const outputLines: string[] = []
  if (parsed.output.focusHoursActual != null) outputLines.push(`  Focus → ${parsed.output.focusHoursActual}h`)
  if (parsed.output.whatShipped) outputLines.push(`  Shipped → "${parsed.output.whatShipped}"`)
  if (outputLines.length > 0) {
    lines.push('', '*Output:*', ...outputLines)
  }

  // Intelligence
  const intelLines: string[] = []
  if (parsed.intelligence.discoveryConversationsCount != null) intelLines.push(`  Conversations → ${parsed.intelligence.discoveryConversationsCount}`)
  if (parsed.intelligence.insightsExtracted != null) intelLines.push(`  Insights → ${parsed.intelligence.insightsExtracted}`)
  if (parsed.intelligence.problems.length > 0) intelLines.push(`  Problems → ${parsed.intelligence.problems.map(p => p.problem).join(', ')}`)
  if (parsed.intelligence.problemSelected) intelLines.push(`  Selected → ${parsed.intelligence.problemSelected}`)
  if (intelLines.length > 0) {
    lines.push('', '*Intelligence:*', ...intelLines)
  }

  // Network
  const netLines: string[] = []
  if (parsed.network.warmIntrosMade != null) netLines.push(`  Intros made → ${parsed.network.warmIntrosMade}`)
  if (parsed.network.warmIntrosReceived != null) netLines.push(`  Intros received → ${parsed.network.warmIntrosReceived}`)
  if (parsed.network.meetingsBooked != null) netLines.push(`  Meetings booked → ${parsed.network.meetingsBooked}`)
  if (netLines.length > 0) {
    lines.push('', '*Network:*', ...netLines)
  }

  // Revenue
  const revLines: string[] = []
  if (parsed.revenue.revenueAsksCount != null) revLines.push(`  Asks → ${parsed.revenue.revenueAsksCount}`)
  if (parsed.revenue.revenueThisSession != null) revLines.push(`  Revenue → $${parsed.revenue.revenueThisSession}`)
  if (parsed.revenue.revenueStreamType) revLines.push(`  Type → ${parsed.revenue.revenueStreamType}`)
  if (parsed.revenue.feedbackLoopClosed) revLines.push(`  Loop closed`)
  if (revLines.length > 0) {
    lines.push('', '*Revenue:*', ...revLines)
  }

  // PsyCap
  const psyParts: string[] = []
  if (parsed.psyCap.hope != null) psyParts.push(`Hope ${parsed.psyCap.hope}`)
  if (parsed.psyCap.efficacy != null) psyParts.push(`Eff ${parsed.psyCap.efficacy}`)
  if (parsed.psyCap.resilience != null) psyParts.push(`Res ${parsed.psyCap.resilience}`)
  if (parsed.psyCap.optimism != null) psyParts.push(`Opt ${parsed.psyCap.optimism}`)
  if (psyParts.length > 0) {
    lines.push('', `*PsyCap:* ${psyParts.join(' | ')}`)
  }

  // Cadence
  if (parsed.cadenceCompleted.length > 0) {
    lines.push('', `*Cadence:* ${parsed.cadenceCompleted.join(', ')}`)
  }

  // Contacts
  if (parsed.contacts.length > 0) {
    lines.push('', `*Contacts:* ${parsed.contacts.map(c => c.name).join(', ')}`)
  }

  // Notes
  if (parsed.notes.length > 0) {
    const actionNotes = parsed.notes.filter(n => n.actionRequired)
    const obsNotes = parsed.notes.filter(n => !n.actionRequired)
    if (actionNotes.length > 0) {
      lines.push('', '*Action Items:*')
      actionNotes.forEach(n => lines.push(`  → ${n.text}`))
    }
    if (obsNotes.length > 0) {
      lines.push('', '*Notes:*')
      obsNotes.forEach(n => lines.push(`  · ${n.text}`))
    }
  }

  // Decisions & Principles
  if (parsed.decisions.length > 0) {
    lines.push('', `+${parsed.decisions.length} decision${parsed.decisions.length > 1 ? 's' : ''}`)
  }
  if (parsed.principles.length > 0) {
    lines.push('', `+${parsed.principles.length} principle${parsed.principles.length > 1 ? 's' : ''}`)
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

  try {
    // AI parse the journal text
    const parsed = await parseJournalEntry(text)

    // Build daily log update from parsed data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logUpdate: Record<string, any> = {
      journalEntry: text,
      updatedAt: new Date(),
    }

    // Energy
    if (parsed.energy.nervousSystemState) logUpdate.nervousSystemState = parsed.energy.nervousSystemState
    if (parsed.energy.bodyFelt) logUpdate.bodyFelt = parsed.energy.bodyFelt
    if (parsed.energy.trainingTypes.length > 0) logUpdate.trainingTypes = parsed.energy.trainingTypes
    if (parsed.energy.sleepHours != null) logUpdate.sleepHours = parsed.energy.sleepHours
    // Output
    if (parsed.output.focusHoursActual != null) logUpdate.focusHoursActual = parsed.output.focusHoursActual
    if (parsed.output.whatShipped) logUpdate.whatShipped = parsed.output.whatShipped
    // Intelligence
    if (parsed.intelligence.discoveryConversationsCount != null) logUpdate.discoveryConversationsCount = parsed.intelligence.discoveryConversationsCount
    if (parsed.intelligence.insightsExtracted != null) logUpdate.insightsExtracted = parsed.intelligence.insightsExtracted
    if (parsed.intelligence.problemSelected) logUpdate.problemSelected = parsed.intelligence.problemSelected
    // Network
    if (parsed.network.warmIntrosMade != null) logUpdate.warmIntrosMade = parsed.network.warmIntrosMade
    if (parsed.network.warmIntrosReceived != null) logUpdate.warmIntrosReceived = parsed.network.warmIntrosReceived
    if (parsed.network.meetingsBooked != null) logUpdate.meetingsBooked = parsed.network.meetingsBooked
    // Revenue
    if (parsed.revenue.revenueAsksCount != null) logUpdate.revenueAsksCount = parsed.revenue.revenueAsksCount
    if (parsed.revenue.revenueThisSession != null) logUpdate.revenueThisSession = parsed.revenue.revenueThisSession
    if (parsed.revenue.revenueStreamType) logUpdate.revenueStreamType = parsed.revenue.revenueStreamType
    if (parsed.revenue.feedbackLoopClosed != null) logUpdate.feedbackLoopClosed = parsed.revenue.feedbackLoopClosed
    // PsyCap
    if (parsed.psyCap.hope != null) logUpdate.psyCapHope = parsed.psyCap.hope
    if (parsed.psyCap.efficacy != null) logUpdate.psyCapEfficacy = parsed.psyCap.efficacy
    if (parsed.psyCap.resilience != null) logUpdate.psyCapResilience = parsed.psyCap.resilience
    if (parsed.psyCap.optimism != null) logUpdate.psyCapOptimism = parsed.psyCap.optimism
    // Cadence
    if (parsed.cadenceCompleted.length > 0) logUpdate.cadenceCompleted = parsed.cadenceCompleted

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

    // Upsert contacts (create or update lastConversationDate)
    for (const c of parsed.contacts) {
      const contactsRef = adminDb.collection('users').doc(uid).collection('contacts')
      const existing = await contactsRef.where('name', '==', c.name).limit(1).get()
      if (existing.empty) {
        await contactsRef.doc().set({
          name: c.name,
          lastConversationDate: today,
          notes: c.context,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        const doc = existing.docs[0]
        const prevNotes = doc.data().notes || ''
        await doc.ref.update({
          lastConversationDate: today,
          notes: prevNotes ? `${prevNotes}\n${today}: ${c.context}` : `${today}: ${c.context}`,
          updatedAt: new Date(),
        })
      }
    }

    // Save notes as external signals (type: telegram, status: inbox)
    for (const n of parsed.notes) {
      const signalRef = adminDb.collection('users').doc(uid).collection('external_signals').doc()
      await signalRef.set({
        title: n.text.slice(0, 120),
        aiSummary: n.text,
        keyTakeaway: n.text,
        valueBullets: [],
        sourceUrl: '',
        sourceName: 'Journal note',
        source: 'telegram',
        relevanceScore: n.actionRequired ? 0.8 : 0.4,
        thesisPillars: [],
        status: 'inbox',
        readStatus: 'unread',
        publishedAt: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Reply with summary of all actions
    await sendTelegramReply(chatId, buildJournalReply(parsed))
  } catch (error) {
    console.error('Journal parsing error:', error)
    // Still save the raw text even if AI parsing fails
    const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    await logRef.set({ journalEntry: text, updatedAt: new Date() }, { merge: true })
    await sendTelegramReply(chatId, `Journal text saved, but AI parsing failed.\n\n_${error instanceof Error ? error.message : 'Unknown error'}_`)
  }
}

async function handleJournalFromVoice(uid: string, transcript: string, parsed: ParsedJournalEntry, chatId: number) {
  const adminDb = await getAdminDb()
  const today = getTodayKey()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logUpdate: Record<string, any> = {
      journalEntry: transcript,
      updatedAt: new Date(),
    }

    // Energy
    if (parsed.energy.nervousSystemState) logUpdate.nervousSystemState = parsed.energy.nervousSystemState
    if (parsed.energy.bodyFelt) logUpdate.bodyFelt = parsed.energy.bodyFelt
    if (parsed.energy.trainingTypes.length > 0) logUpdate.trainingTypes = parsed.energy.trainingTypes
    if (parsed.energy.sleepHours != null) logUpdate.sleepHours = parsed.energy.sleepHours
    // Output
    if (parsed.output.focusHoursActual != null) logUpdate.focusHoursActual = parsed.output.focusHoursActual
    if (parsed.output.whatShipped) logUpdate.whatShipped = parsed.output.whatShipped
    // Intelligence
    if (parsed.intelligence.discoveryConversationsCount != null) logUpdate.discoveryConversationsCount = parsed.intelligence.discoveryConversationsCount
    if (parsed.intelligence.insightsExtracted != null) logUpdate.insightsExtracted = parsed.intelligence.insightsExtracted
    if (parsed.intelligence.problemSelected) logUpdate.problemSelected = parsed.intelligence.problemSelected
    // Network
    if (parsed.network.warmIntrosMade != null) logUpdate.warmIntrosMade = parsed.network.warmIntrosMade
    if (parsed.network.warmIntrosReceived != null) logUpdate.warmIntrosReceived = parsed.network.warmIntrosReceived
    if (parsed.network.meetingsBooked != null) logUpdate.meetingsBooked = parsed.network.meetingsBooked
    // Revenue
    if (parsed.revenue.revenueAsksCount != null) logUpdate.revenueAsksCount = parsed.revenue.revenueAsksCount
    if (parsed.revenue.revenueThisSession != null) logUpdate.revenueThisSession = parsed.revenue.revenueThisSession
    if (parsed.revenue.revenueStreamType) logUpdate.revenueStreamType = parsed.revenue.revenueStreamType
    if (parsed.revenue.feedbackLoopClosed != null) logUpdate.feedbackLoopClosed = parsed.revenue.feedbackLoopClosed
    // PsyCap
    if (parsed.psyCap.hope != null) logUpdate.psyCapHope = parsed.psyCap.hope
    if (parsed.psyCap.efficacy != null) logUpdate.psyCapEfficacy = parsed.psyCap.efficacy
    if (parsed.psyCap.resilience != null) logUpdate.psyCapResilience = parsed.psyCap.resilience
    if (parsed.psyCap.optimism != null) logUpdate.psyCapOptimism = parsed.psyCap.optimism
    // Cadence
    if (parsed.cadenceCompleted.length > 0) logUpdate.cadenceCompleted = parsed.cadenceCompleted

    const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    await logRef.set(logUpdate, { merge: true })

    // Create decisions
    for (const d of parsed.decisions) {
      const reviewDate = new Date()
      reviewDate.setDate(reviewDate.getDate() + 90)
      const decisionRef = adminDb.collection('users').doc(uid).collection('decisions').doc()
      await decisionRef.set({
        title: d.title, hypothesis: d.hypothesis, options: [d.chosenOption],
        chosenOption: d.chosenOption, reasoning: d.reasoning, confidenceLevel: d.confidenceLevel,
        killCriteria: [], premortem: '', domain: d.domain,
        linkedProjectIds: [], linkedSignalIds: [], status: 'active',
        reviewDate: reviewDate.toISOString().split('T')[0], decidedAt: today,
        createdAt: new Date(), updatedAt: new Date(),
      })
    }

    // Create principles
    for (const p of parsed.principles) {
      const principleRef = adminDb.collection('users').doc(uid).collection('principles').doc()
      await principleRef.set({
        text: p.text, shortForm: p.shortForm, source: 'manual',
        sourceDescription: 'Extracted from Telegram voice journal', domain: p.domain,
        dateFirstApplied: today, linkedDecisionIds: [], lastReinforcedAt: today,
        reinforcementCount: 0, createdAt: new Date(), updatedAt: new Date(),
      })
    }

    // Upsert contacts
    for (const c of parsed.contacts) {
      const contactsRef = adminDb.collection('users').doc(uid).collection('contacts')
      const existing = await contactsRef.where('name', '==', c.name).limit(1).get()
      if (existing.empty) {
        await contactsRef.doc().set({
          name: c.name, lastConversationDate: today, notes: c.context,
          createdAt: new Date(), updatedAt: new Date(),
        })
      } else {
        const doc = existing.docs[0]
        const prevNotes = doc.data().notes || ''
        await doc.ref.update({
          lastConversationDate: today,
          notes: prevNotes ? `${prevNotes}\n${today}: ${c.context}` : `${today}: ${c.context}`,
          updatedAt: new Date(),
        })
      }
    }

    // Save notes as external signals
    for (const n of parsed.notes) {
      const signalRef = adminDb.collection('users').doc(uid).collection('external_signals').doc()
      await signalRef.set({
        title: n.text.slice(0, 120), aiSummary: n.text, keyTakeaway: n.text,
        valueBullets: [], sourceUrl: '', sourceName: 'Voice journal note',
        source: 'telegram', relevanceScore: n.actionRequired ? 0.8 : 0.4,
        thesisPillars: [], status: 'inbox', readStatus: 'unread',
        publishedAt: new Date().toISOString(), createdAt: new Date(), updatedAt: new Date(),
      })
    }

    // Reply with transcript + structured summary
    const journalReply = buildJournalReply(parsed)
    const fullReply = `*Transcript:*\n_"${transcript}"_\n\n${journalReply}`
    await sendTelegramReply(chatId, fullReply)
  } catch (error) {
    console.error('Voice journal save error:', error)
    const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    await logRef.set({ journalEntry: transcript, updatedAt: new Date() }, { merge: true })
    await sendTelegramReply(chatId, `*Transcript:*\n_"${transcript}"_\n\nJournal text saved, but structured parsing failed.\n\n_${error instanceof Error ? error.message : 'Unknown error'}_`)
  }
}

async function handleRss(uid: string, url: string, pillars: string[], chatId: number) {
  const adminDb = await getAdminDb()

  // Basic URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    await sendTelegramReply(chatId, 'Invalid URL. Must start with http:// or https://')
    return
  }

  // Extract a feed name from the URL hostname
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const name = hostname.split('.')[0]
    const feedName = name.charAt(0).toUpperCase() + name.slice(1)

    // Check for duplicates
    const existing = await adminDb.collection('users').doc(uid).collection('rss_feeds')
      .where('url', '==', url).limit(1).get()

    if (!existing.empty) {
      await sendTelegramReply(chatId, `Already subscribed to _${feedName}_`)
      return
    }

    // Save the feed
    const feedRef = adminDb.collection('users').doc(uid).collection('rss_feeds').doc()
    await feedRef.set({
      name: feedName,
      url,
      pillars: pillars.length > 0 ? pillars : ['markets'],
      active: true,
      createdAt: new Date(),
    })

    const pillarStr = pillars.length > 0 ? pillars.join(', ') : 'markets'
    await sendTelegramReply(chatId, `Subscribed to *${feedName}*\n  URL → ${url}\n  Pillars → ${pillarStr}`)
  } catch {
    await sendTelegramReply(chatId, 'Invalid URL format.')
  }
}

async function handlePredict(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  await sendTelegramReply(chatId, '_Analyzing prediction..._')

  try {
    // Fetch user's active project names for linking
    const projectsSnap = await adminDb.collection('users').doc(uid).collection('projects')
      .where('status', '==', 'active').get()
    const projectNames = projectsSnap.docs.map(d => d.data().name as string).filter(Boolean)

    // Parse with AI
    const parsed = await parsePrediction(text, projectNames)

    // Compute review date
    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() + parsed.timeHorizonDays)
    const reviewDateStr = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}-${String(reviewDate.getDate()).padStart(2, '0')}`

    // Save to Firestore
    const predictionRef = adminDb.collection('users').doc(uid).collection('predictions').doc()
    await predictionRef.set({
      prediction: parsed.prediction,
      reasoning: parsed.reasoning,
      domain: parsed.domain,
      confidenceLevel: parsed.confidenceLevel,
      timeHorizon: parsed.timeHorizonDays,
      reviewDate: reviewDateStr,
      linkedProjectNames: parsed.linkedProjectNames,
      linkedContactNames: parsed.linkedContactNames,
      antithesis: parsed.antithesis,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Format review date for display (e.g. "Mar 7")
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const reviewDisplay = `${monthNames[reviewDate.getMonth()]} ${reviewDate.getDate()}`

    // Build reply
    const lines: string[] = [
      '*Prediction logged*',
      '',
      `_"${parsed.prediction}"_`,
      `Confidence: ${parsed.confidenceLevel}% | Review: ${reviewDisplay}`,
      `Domain: ${parsed.domain}`,
    ]

    if (parsed.antithesis) {
      lines.push('', '*Antithesis:*', `_${parsed.antithesis}_`)
    }

    if (parsed.linkedContactNames.length > 0) {
      lines.push('', `Linked: ${parsed.linkedContactNames.join(', ')}`)
    }

    if (parsed.linkedProjectNames.length > 0) {
      lines.push(`Projects: ${parsed.linkedProjectNames.join(', ')}`)
    }

    await sendTelegramReply(chatId, lines.join('\n'))
  } catch (error) {
    console.error('Prediction parsing error:', error)
    // Still save raw prediction text even if AI parsing fails
    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() + 30)
    const reviewDateStr = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}-${String(reviewDate.getDate()).padStart(2, '0')}`

    const predictionRef = adminDb.collection('users').doc(uid).collection('predictions').doc()
    await predictionRef.set({
      prediction: text,
      reasoning: '',
      domain: 'personal',
      confidenceLevel: 60,
      timeHorizon: 30,
      reviewDate: reviewDateStr,
      linkedProjectNames: [],
      linkedContactNames: [],
      antithesis: '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await sendTelegramReply(chatId, `Prediction saved, but AI analysis failed.\n\n_${error instanceof Error ? error.message : 'Unknown error'}_`)
  }
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot not configured' }, { status: 500 })
  }

  try {
    const update: TelegramUpdate = await req.json()
    const message = update.message

    if (!message?.text && !message?.voice) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message!.chat.id

    // --- Voice message handling ---
    if (message!.voice) {
      const uid = await findUserByChatId(chatId)
      if (!uid) {
        await sendTelegramReply(chatId, 'Not linked. Add your chat ID in Thesis Engine > Settings > Telegram.\n\nUse `/id` to get your chat ID.')
        return NextResponse.json({ ok: true })
      }

      await sendTelegramReply(chatId, '_Transcribing voice note..._')

      try {
        // Download voice file from Telegram
        const fileInfoRes = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_id: message!.voice.file_id }),
          }
        )
        const fileInfo = await fileInfoRes.json()

        if (!fileInfo.ok || !fileInfo.result?.file_path) {
          await sendTelegramReply(chatId, 'Could not retrieve voice file from Telegram.')
          return NextResponse.json({ ok: true })
        }

        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.result.file_path}`
        const fileRes = await fetch(fileUrl)
        const arrayBuffer = await fileRes.arrayBuffer()
        const base64Audio = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = message!.voice.mime_type || 'audio/ogg'

        // Transcribe + parse with Gemini (one API call)
        const { transcript, parsed } = await transcribeAndParseVoiceNote(base64Audio, mimeType)

        // Detect if user said "signal" at the start — route as signal
        const trimmedTranscript = transcript.trim().toLowerCase()
        if (trimmedTranscript.startsWith('signal')) {
          const signalText = transcript.trim().slice('signal'.length).trim()
          if (signalText) {
            const adminDb = await getAdminDb()
            const signalRef = adminDb.collection('users').doc(uid).collection('external_signals').doc()
            await signalRef.set({
              title: signalText.slice(0, 120), aiSummary: signalText, keyTakeaway: signalText,
              valueBullets: [], sourceUrl: '',
              sourceName: `Telegram voice @${message!.from.username || message!.from.first_name}`,
              source: 'telegram', relevanceScore: 0.7, thesisPillars: [],
              status: 'inbox', readStatus: 'unread',
              publishedAt: new Date(message!.date * 1000).toISOString(),
              createdAt: new Date(), updatedAt: new Date(),
            })
            await sendTelegramReply(chatId, `*Transcribed:*\n_"${transcript.trim()}"_\n\nSignal saved.`)
            return NextResponse.json({ ok: true })
          }
        }

        // Default: treat voice note as journal entry
        await handleJournalFromVoice(uid, transcript.trim(), parsed, chatId)
        return NextResponse.json({ ok: true })
      } catch (error) {
        console.error('Voice transcription error:', error)
        await sendTelegramReply(chatId, `Voice transcription failed.\n\n_${error instanceof Error ? error.message : 'Unknown error'}_`)
        return NextResponse.json({ ok: true })
      }
    }

    // --- Text message handling (unchanged) ---
    if (!message!.text) {
      return NextResponse.json({ ok: true })
    }

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
        '`/predict <text>` — Log a prediction (AI-analyzed)',
        '`/rss <url> #pillar` — Subscribe to RSS feed',
        '`/id` — Show your chat ID (for settings)',
        '',
        'Voice notes → auto-transcribed as journal',
        'Say "signal" first to save as signal instead',
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

    // Handle RSS subscribe command
    if (parsed.command === 'rss') {
      if (!parsed.text) {
        await sendTelegramReply(chatId, 'Usage: `/rss https://example.com/feed.xml #ai`\n\nPillar tags: `#ai` `#markets` `#mind`')
        return NextResponse.json({ ok: true })
      }
      await handleRss(uid, parsed.text, parsed.pillars, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle predict command
    if (parsed.command === 'predict') {
      if (!parsed.text) {
        await sendTelegramReply(chatId, 'Empty prediction. Usage: `/predict Marcus will close within 2 weeks. 80% confident.`')
        return NextResponse.json({ ok: true })
      }
      await handlePredict(uid, parsed.text, chatId)
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
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 })
  }
}
