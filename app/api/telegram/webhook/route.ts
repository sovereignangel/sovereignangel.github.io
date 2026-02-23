import { NextRequest, NextResponse } from 'next/server'
import { parseTelegramMessage, type TelegramUpdate } from '@/lib/telegram-parser'
import { parseJournalEntry, transcribeAndParseVoiceNote, parsePrediction, parseVentureIdea, generateVenturePRD, type ParsedJournalEntry } from '@/lib/ai-extraction'
import { computeReward } from '@/lib/reward'
import { DEFAULT_SETTINGS } from '@/lib/constants'

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

  // Skill Building
  const skillParts: string[] = []
  if (parsed.skill.deliberatePracticeMinutes != null) skillParts.push(`${parsed.skill.deliberatePracticeMinutes}m practice`)
  if (parsed.skill.newTechniqueApplied) skillParts.push('new technique')
  if (parsed.skill.automationCreated) skillParts.push('automation built')
  if (skillParts.length > 0) {
    lines.push('', `*Skill:* ${skillParts.join(' | ')}`)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGapsSection(log: Record<string, any>): string {
  const gaps: { symbol: string; hint: string }[] = []

  // GE — Energy
  const hasEnergy = (log.sleepHours > 0) ||
    (log.trainingTypes?.length > 0) ||
    (log.bodyFelt && log.bodyFelt !== 'neutral') ||
    (log.nervousSystemState && log.nervousSystemState !== 'regulated')
  if (!hasEnergy) gaps.push({ symbol: 'GE', hint: 'sleep hours, training, body state' })

  // GI — Intelligence
  const hasIntelligence =
    (log.problems?.some((p: { problem?: string }) => p.problem?.trim())) ||
    (log.problemSelected?.trim())
  if (!hasIntelligence) gaps.push({ symbol: 'GI', hint: 'problems spotted, problem selected' })

  // GVC — Output
  const hasOutput = (log.whatShipped?.trim()) || (log.focusHoursActual > 0)
  if (!hasOutput) gaps.push({ symbol: 'GVC', hint: 'focus hours, what you shipped' })

  // κ — Capture
  const hasCapture = (log.revenueAsksCount > 0) || (log.revenueThisSession > 0)
  if (!hasCapture) gaps.push({ symbol: 'κ', hint: 'revenue asks, money earned' })

  // GD — Discovery
  const hasDiscovery = (log.discoveryConversationsCount > 0) ||
    (log.externalSignalsReviewed > 0) || (log.insightsExtracted > 0)
  if (!hasDiscovery) gaps.push({ symbol: 'GD', hint: 'conversations, signals reviewed, insights' })

  // GN — Network
  const hasNetwork = (log.warmIntrosMade > 0) || (log.warmIntrosReceived > 0) ||
    (log.meetingsBooked > 0) || (log.publicPostsCount > 0) || (log.inboundInquiries > 0)
  if (!hasNetwork) gaps.push({ symbol: 'GN', hint: 'intros, meetings, posts, inbound' })

  // J — Judgment
  const hasJudgment = (log.psyCapHope > 0) || (log.psyCapEfficacy > 0) ||
    (log.psyCapResilience > 0) || (log.psyCapOptimism > 0)
  if (!hasJudgment) gaps.push({ symbol: 'J', hint: 'PsyCap (hope, efficacy, resilience, optimism)' })

  // Σ — Skill
  const hasSkill = (log.deliberatePracticeMinutes > 0) ||
    log.newTechniqueApplied || log.automationCreated
  if (!hasSkill) gaps.push({ symbol: 'Σ', hint: 'practice minutes, new technique, automation' })

  if (gaps.length === 0) {
    return '\n\n_All 8 components touched today._'
  }

  const lines = [`\n\n*Still at floor (${gaps.length}/8):*`]
  for (const g of gaps) {
    lines.push(`  ${g.symbol} — ${g.hint}`)
  }
  return lines.join('\n')
}

function appendJournalText(existing: string, newText: string): string {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return existing
    ? `${existing}\n\n--- ${timeStr} ---\n${newText}`
    : `--- ${timeStr} ---\n${newText}`
}

async function computeAndSaveReward(
  adminDb: FirebaseFirestore.Firestore,
  uid: string,
  today: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullLog: Record<string, any>
): Promise<{ score: number; delta: number | null }> {
  // Fetch user settings
  const userDoc = await adminDb.collection('users').doc(uid).get()
  const userData = userDoc.data()
  const settings = userData?.settings ?? DEFAULT_SETTINGS

  // Fetch recent logs (last 7 days) for GVC recency + delta
  const logsSnap = await adminDb.collection('users').doc(uid).collection('daily_logs')
    .orderBy('__name__', 'desc').limit(8).get()
  const recentLogs = logsSnap.docs
    .filter(d => d.id !== today)
    .map(d => ({ date: d.id, ...d.data() }))

  // Fetch active projects for optionality + fragmentation
  const projectsSnap = await adminDb.collection('users').doc(uid).collection('projects')
    .where('status', 'in', ['active', 'backup', 'optionality']).get()
  const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Compute reward
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reward = computeReward(fullLog as any, settings, { recentLogs: recentLogs as any[], projects: projects as any[] })

  // Compute delta from yesterday
  const yesterdayLog = recentLogs[0] // most recent non-today log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yesterdayScore = (yesterdayLog as any)?.rewardScore?.score
  const delta = yesterdayScore != null ? Math.round((reward.score - yesterdayScore) * 10) / 10 : null
  const rewardWithDelta = { ...reward, delta }

  // Save reward score back to log
  const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
  await logRef.set({ rewardScore: rewardWithDelta }, { merge: true })

  return { score: reward.score, delta }
}

async function handleJournal(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()
  const today = getTodayKey()

  // Send "parsing..." acknowledgment so user knows it's working
  await sendTelegramReply(chatId, '_Parsing journal..._')

  try {
    // AI parse the journal text
    const parsed = await parseJournalEntry(text)

    // Read existing log to append journal text (not overwrite)
    const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    const existingSnap = await logRef.get()
    const existingLog = existingSnap.data() || {}
    const newJournal = appendJournalText(existingLog.journalEntry || '', text)

    // Build daily log update from parsed data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logUpdate: Record<string, any> = {
      journalEntry: newJournal,
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
    // Skill Building
    if (parsed.skill.deliberatePracticeMinutes != null) logUpdate.deliberatePracticeMinutes = parsed.skill.deliberatePracticeMinutes
    if (parsed.skill.newTechniqueApplied != null) logUpdate.newTechniqueApplied = parsed.skill.newTechniqueApplied
    if (parsed.skill.automationCreated != null) logUpdate.automationCreated = parsed.skill.automationCreated
    // PsyCap
    if (parsed.psyCap.hope != null) logUpdate.psyCapHope = parsed.psyCap.hope
    if (parsed.psyCap.efficacy != null) logUpdate.psyCapEfficacy = parsed.psyCap.efficacy
    if (parsed.psyCap.resilience != null) logUpdate.psyCapResilience = parsed.psyCap.resilience
    if (parsed.psyCap.optimism != null) logUpdate.psyCapOptimism = parsed.psyCap.optimism
    // Cadence
    if (parsed.cadenceCompleted.length > 0) logUpdate.cadenceCompleted = parsed.cadenceCompleted

    // Save to daily log (merge to avoid overwriting existing fields)
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

    // Read back full merged log to detect gaps + compute reward
    const fullLogSnap = await logRef.get()
    const fullLog = fullLogSnap.data() || {}
    const gapsSection = buildGapsSection(fullLog)

    // Compute reward score server-side and save it
    const { score, delta } = await computeAndSaveReward(adminDb, uid, today, fullLog)
    const deltaStr = delta != null ? (delta >= 0 ? ` (+${delta})` : ` (${delta})`) : ''
    const scoreLine = `\n\n*g* = ${score.toFixed(1)}${deltaStr}`

    // Reply with summary + score + gaps
    await sendTelegramReply(chatId, buildJournalReply(parsed) + scoreLine + gapsSection)
  } catch (error) {
    console.error('Journal parsing error:', error)
    // Still save the raw text even if AI parsing fails (also append)
    const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    const existingSnap = await logRef.get()
    const existingJournal = existingSnap.data()?.journalEntry || ''
    const newJournal = appendJournalText(existingJournal, text)
    await logRef.set({ journalEntry: newJournal, updatedAt: new Date() }, { merge: true })
    await sendTelegramReply(chatId, `Journal text saved, but AI parsing failed.\n\n_${error instanceof Error ? error.message : 'Unknown error'}_`)
  }
}

async function handleJournalFromVoice(uid: string, transcript: string, parsed: ParsedJournalEntry, chatId: number) {
  const adminDb = await getAdminDb()
  const today = getTodayKey()

  try {
    // Read existing log to append journal text (not overwrite)
    const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    const existingSnap = await logRef.get()
    const existingLog = existingSnap.data() || {}
    const newJournal = appendJournalText(existingLog.journalEntry || '', transcript)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logUpdate: Record<string, any> = {
      journalEntry: newJournal,
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
    // Skill Building
    if (parsed.skill.deliberatePracticeMinutes != null) logUpdate.deliberatePracticeMinutes = parsed.skill.deliberatePracticeMinutes
    if (parsed.skill.newTechniqueApplied != null) logUpdate.newTechniqueApplied = parsed.skill.newTechniqueApplied
    if (parsed.skill.automationCreated != null) logUpdate.automationCreated = parsed.skill.automationCreated
    // PsyCap
    if (parsed.psyCap.hope != null) logUpdate.psyCapHope = parsed.psyCap.hope
    if (parsed.psyCap.efficacy != null) logUpdate.psyCapEfficacy = parsed.psyCap.efficacy
    if (parsed.psyCap.resilience != null) logUpdate.psyCapResilience = parsed.psyCap.resilience
    if (parsed.psyCap.optimism != null) logUpdate.psyCapOptimism = parsed.psyCap.optimism
    // Cadence
    if (parsed.cadenceCompleted.length > 0) logUpdate.cadenceCompleted = parsed.cadenceCompleted

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

    // Read back full merged log to detect gaps + compute reward
    const fullLogSnap = await logRef.get()
    const fullLog = fullLogSnap.data() || {}
    const gapsSection = buildGapsSection(fullLog)

    // Compute reward score server-side and save it
    const { score, delta } = await computeAndSaveReward(adminDb, uid, today, fullLog)
    const deltaStr = delta != null ? (delta >= 0 ? ` (+${delta})` : ` (${delta})`) : ''
    const scoreLine = `\n\n*g* = ${score.toFixed(1)}${deltaStr}`

    // Reply with transcript + structured summary + score + gaps
    const journalReply = buildJournalReply(parsed)
    const fullReply = `*Transcript:*\n_"${transcript}"_\n\n${journalReply}${scoreLine}${gapsSection}`
    await sendTelegramReply(chatId, fullReply)
  } catch (error) {
    console.error('Voice journal save error:', error)
    // Append even on failure
    const logRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    const existingSnap = await logRef.get()
    const existingJournal = existingSnap.data()?.journalEntry || ''
    const newJournal = appendJournalText(existingJournal, transcript)
    await logRef.set({ journalEntry: newJournal, updatedAt: new Date() }, { merge: true })
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

async function handleVenture(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  await sendTelegramReply(chatId, '_Analyzing venture idea..._')

  try {
    // Fetch user's active project names for context
    const projectsSnap = await adminDb.collection('users').doc(uid).collection('projects')
      .where('status', '==', 'active').get()
    const projectNames = projectsSnap.docs.map(d => d.data().name as string).filter(Boolean)

    // AI parse
    const parsed = await parseVentureIdea(text, projectNames)

    // Build venture spec object
    const spec = {
      name: parsed.name,
      oneLiner: parsed.oneLiner,
      problem: parsed.problem,
      targetCustomer: parsed.targetCustomer,
      solution: parsed.solution,
      category: parsed.category,
      thesisPillars: parsed.thesisPillars,
      revenueModel: parsed.revenueModel,
      pricingIdea: parsed.pricingIdea,
      marketSize: parsed.marketSize,
      techStack: parsed.techStack,
      mvpFeatures: parsed.mvpFeatures,
      apiIntegrations: parsed.apiIntegrations,
      existingAlternatives: parsed.existingAlternatives,
      unfairAdvantage: parsed.unfairAdvantage,
      killCriteria: parsed.killCriteria,
    }

    // Save venture as specced
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc()
    await ventureRef.set({
      rawInput: text,
      inputSource: 'telegram_text',
      spec,
      prd: null,
      build: {
        status: 'pending',
        repoUrl: null,
        previewUrl: null,
        repoName: null,
        buildLog: [],
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        filesGenerated: null,
      },
      stage: 'specced',
      iterations: [],
      linkedProjectId: null,
      notes: '',
      score: parsed.suggestedScore,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Auto-generate PRD
    await sendTelegramReply(chatId, '_Generating PRD..._')

    // Get existing project names to avoid collision
    const venturesSnap = await adminDb.collection('users').doc(uid).collection('ventures')
      .orderBy('createdAt', 'desc').get()
    const existingPrdNames = venturesSnap.docs
      .map(d => d.data().prd?.projectName)
      .filter(Boolean) as string[]

    const prd = await generateVenturePRD(spec, existingPrdNames)

    // Update venture with PRD, move to prd_draft
    await ventureRef.update({
      prd,
      stage: 'prd_draft',
      updatedAt: new Date(),
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const deepLink = baseUrl ? `${baseUrl}/thesis/ventures?id=${ventureRef.id}` : ''

    // Build reply
    const lines: string[] = [
      `*PRD drafted: ${parsed.name}*`,
      '',
      `_"${parsed.oneLiner}"_`,
      '',
      `*Problem:* ${parsed.problem}`,
      `*Customer:* ${parsed.targetCustomer}`,
      `*Revenue:* ${parsed.revenueModel} (${parsed.pricingIdea})`,
      `*Conviction:* ${parsed.suggestedScore}/100`,
      '',
      `*Features (${prd.features.length}):*`,
    ]

    prd.features.forEach(f => {
      lines.push(`  ${f.priority}: ${f.name}`)
    })

    if (deepLink) {
      lines.push('', `View full PRD: ${deepLink}`)
    }

    lines.push('', '_Reply /approve or send /feedback <text>_')

    await sendTelegramReply(chatId, lines.join('\n'))
  } catch (error) {
    console.error('Venture parsing error:', error)
    // Still save raw text even if AI parsing fails
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc()
    await ventureRef.set({
      rawInput: text,
      inputSource: 'telegram_text',
      spec: {
        name: 'Untitled Venture', oneLiner: text.slice(0, 120), problem: text,
        targetCustomer: '', solution: '', category: 'other', thesisPillars: [],
        revenueModel: '', pricingIdea: '', marketSize: '', techStack: [],
        mvpFeatures: [], apiIntegrations: [], existingAlternatives: [],
        unfairAdvantage: '', killCriteria: [],
      },
      prd: null,
      build: {
        status: 'pending', repoUrl: null, previewUrl: null, repoName: null,
        buildLog: [], startedAt: null, completedAt: null, errorMessage: null,
        filesGenerated: null,
      },
      stage: 'idea',
      iterations: [],
      linkedProjectId: null,
      notes: '',
      score: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await sendTelegramReply(chatId,
      `Venture idea saved, but AI spec generation failed.\n\n_${error instanceof Error ? error.message : 'Unknown error'}_`)
  }
}

async function handleApprove(uid: string, chatId: number) {
  const adminDb = await getAdminDb()

  try {
    // Find most recent venture with prd_draft stage (no orderBy to avoid composite index)
    const venturesSnap = await adminDb.collection('users').doc(uid).collection('ventures')
      .where('stage', '==', 'prd_draft')
      .get()

    if (venturesSnap.empty) {
      await sendTelegramReply(chatId, 'No PRD waiting for approval.\n\nUse /venture to spec one first.')
      return
    }

    // Sort by createdAt in JS
    const sortedDocs = venturesSnap.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toMillis?.() || 0
      const bTime = b.data().createdAt?.toMillis?.() || 0
      return bTime - aTime
    })

    const ventureDoc = sortedDocs[0]
    const venture = ventureDoc.data()

    await ventureDoc.ref.update({
      stage: 'prd_approved',
      updatedAt: new Date(),
    })

    await sendTelegramReply(chatId, `PRD approved for ${venture.spec.name}\n\nReply /build to start building.`)
  } catch (error) {
    console.error('Approve error:', error)
    await sendTelegramReply(chatId, `Approve failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function handleFeedback(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  if (!text.trim()) {
    await sendTelegramReply(chatId, 'Empty feedback. Usage: /feedback add Stripe integration')
    return
  }

  try {
    // Find most recent venture with prd_draft stage (no orderBy to avoid composite index)
    const venturesSnap = await adminDb.collection('users').doc(uid).collection('ventures')
      .where('stage', '==', 'prd_draft')
      .get()

    if (venturesSnap.empty) {
      await sendTelegramReply(chatId, 'No PRD draft to send feedback on.\n\nUse /venture to create one first.')
      return
    }

    // Sort by createdAt in JS
    const sortedDocs = venturesSnap.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toMillis?.() || 0
      const bTime = b.data().createdAt?.toMillis?.() || 0
      return bTime - aTime
    })

    const ventureDoc = sortedDocs[0]
    const venture = ventureDoc.data()
    const existingPrd = venture.prd
    const spec = venture.spec

    await sendTelegramReply(chatId, 'Regenerating PRD with feedback...')

    // Append feedback to history
    const feedbackHistory = [...(existingPrd?.feedbackHistory || []), text]

    // Get existing project names to avoid collision
    const allVenturesSnap = await adminDb.collection('users').doc(uid).collection('ventures').get()
    const existingPrdNames = allVenturesSnap.docs
      .filter(d => d.id !== ventureDoc.id)
      .map(d => d.data().prd?.projectName)
      .filter(Boolean) as string[]

    // Re-generate PRD with feedback
    const newPrd = await generateVenturePRD(spec, existingPrdNames, feedbackHistory)

    // Increment version
    newPrd.version = (existingPrd?.version || 0) + 1

    await ventureDoc.ref.update({
      prd: newPrd,
      updatedAt: new Date(),
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const deepLink = baseUrl ? `${baseUrl}/thesis/ventures?id=${ventureDoc.id}` : ''

    const lines: string[] = [
      `PRD updated: ${spec.name} (v${newPrd.version})`,
      '',
      `Features (${newPrd.features.length}):`,
    ]

    newPrd.features.forEach(f => {
      lines.push(`  ${f.priority}: ${f.name}`)
    })

    if (deepLink) {
      lines.push('', `View full PRD: ${deepLink}`)
    }

    lines.push('', 'Reply /approve or send more /feedback')

    await sendTelegramReply(chatId, lines.join('\n'))
  } catch (error) {
    console.error('PRD feedback error:', error)
    await sendTelegramReply(chatId, `Failed to regenerate PRD: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function handleIterate(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  if (!text.trim()) {
    await sendTelegramReply(chatId, 'Usage: `/iterate project-name add dark mode`\n\nFirst word is the project name, rest is the change request.')
    return
  }

  // Parse: first word = project name slug, rest = changes
  const parts = text.trim().split(/\s+/)
  const projectSlug = parts[0].toLowerCase()
  const changes = parts.slice(1).join(' ')

  if (!changes) {
    await sendTelegramReply(chatId, 'Missing change description. Usage: `/iterate project-name add dark mode`')
    return
  }

  // Find venture by matching prd.projectName or spec.name
  const venturesSnap = await adminDb.collection('users').doc(uid).collection('ventures')
    .where('stage', '==', 'deployed')
    .get()

  const matchedDoc = venturesSnap.docs.find(d => {
    const data = d.data()
    const prdName = data.prd?.projectName?.toLowerCase()
    const specName = data.spec?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    return prdName === projectSlug || specName === projectSlug ||
      data.spec?.name?.toLowerCase() === projectSlug
  })

  if (!matchedDoc) {
    await sendTelegramReply(chatId, `No deployed venture found matching "${projectSlug}".\n\nUse the project name from the PRD (kebab-case).`)
    return
  }

  const venture = matchedDoc.data()
  const ventureId = matchedDoc.id

  // Update stage to building, append to iterations
  const iterations = venture.iterations || []
  iterations.push({ request: changes, completedAt: null })

  await matchedDoc.ref.update({
    stage: 'building',
    iterations,
    'build.status': 'generating',
    'build.startedAt': new Date(),
    'build.errorMessage': null,
    updatedAt: new Date(),
  })

  await sendTelegramReply(chatId, `*Iterating on ${venture.spec.name}...*\n\n_"${changes}"_\n\nThis may take a few minutes.`)

  // Fire repository_dispatch for iterate
  const githubToken = process.env.GITHUB_TOKEN
  const githubOwner = process.env.GITHUB_OWNER || 'sovereignangel'
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ventures/build/callback`

  if (!githubToken) {
    await matchedDoc.ref.update({
      'build.status': 'failed',
      'build.errorMessage': 'GITHUB_TOKEN not configured',
      'build.completedAt': new Date(),
      stage: 'deployed', // revert
      updatedAt: new Date(),
    })
    await sendTelegramReply(chatId, 'Iterate failed: GITHUB_TOKEN not configured on server.')
    return
  }

  try {
    const dispatchRes = await fetch(`https://api.github.com/repos/${githubOwner}/venture-builder/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'iterate-venture',
        client_payload: {
          uid,
          ventureId,
          repoName: venture.build.repoName,
          changes,
          spec: venture.spec,
          prd: venture.prd,
          chatId,
          callbackUrl,
        },
      }),
    })

    if (!dispatchRes.ok) {
      const errText = await dispatchRes.text()
      throw new Error(`GitHub dispatch failed (${dispatchRes.status}): ${errText}`)
    }
  } catch (error) {
    console.error('Iterate dispatch error:', error)
    await matchedDoc.ref.update({
      'build.status': 'failed',
      'build.errorMessage': error instanceof Error ? error.message : 'Dispatch failed',
      'build.completedAt': new Date(),
      stage: 'deployed', // revert
      updatedAt: new Date(),
    })
    await sendTelegramReply(chatId,
      `Iterate dispatch failed for ${venture.spec.name}.\n\n_${error instanceof Error ? error.message : 'Unknown error'}_`)
  }
}

async function handleBuild(uid: string, chatId: number) {
  const adminDb = await getAdminDb()

  try {
  // Find most recent venture with approved PRD (no orderBy to avoid composite index)
  const venturesSnap = await adminDb.collection('users').doc(uid).collection('ventures')
    .where('stage', '==', 'prd_approved')
    .get()

  if (venturesSnap.empty) {
    await sendTelegramReply(chatId, 'No approved venture waiting to be built.\n\nUse /venture then /approve first.')
    return
  }

  // Sort by createdAt in JS to avoid composite index requirement
  const sortedDocs = venturesSnap.docs.sort((a, b) => {
    const aTime = a.data().createdAt?.toMillis?.() || 0
    const bTime = b.data().createdAt?.toMillis?.() || 0
    return bTime - aTime
  })

  const ventureDoc = sortedDocs[0]
  const venture = ventureDoc.data()
  const ventureId = ventureDoc.id
  const spec = venture.spec

  // Mark as building
  await ventureDoc.ref.update({
    stage: 'building',
    'build.status': 'generating',
    'build.startedAt': new Date(),
    updatedAt: new Date(),
  })

  await sendTelegramReply(chatId, `Build started for ${spec.name}\n\nGenerating codebase... This may take a few minutes.`)

  // Fire repository_dispatch to the builder repo (fire-and-forget)
  const githubToken = process.env.GITHUB_TOKEN
  const githubOwner = process.env.GITHUB_OWNER || 'sovereignangel'
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ventures/build/callback`

  if (!githubToken) {
    await ventureDoc.ref.update({
      'build.status': 'failed',
      'build.errorMessage': 'GITHUB_TOKEN not configured',
      'build.completedAt': new Date(),
      updatedAt: new Date(),
    })
    await sendTelegramReply(chatId, 'Build failed: GITHUB_TOKEN not configured on server.')
    return
  }

  const dispatchRes = await fetch(`https://api.github.com/repos/${githubOwner}/venture-builder/dispatches`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'build-venture',
      client_payload: {
        uid,
        ventureId,
        spec,
        prd: venture.prd,
        chatId,
        callbackUrl,
      },
    }),
  })

  if (!dispatchRes.ok) {
    const errText = await dispatchRes.text()
    throw new Error(`GitHub dispatch failed (${dispatchRes.status}): ${errText}`)
  }

  } catch (error) {
    console.error('Build error:', error)
    await sendTelegramReply(chatId, `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

        // Detect if user said "venture" at the start — route as venture
        const trimmedTranscript = transcript.trim().toLowerCase()
        if (trimmedTranscript.startsWith('venture')) {
          const ventureText = transcript.trim().slice('venture'.length).trim()
          if (ventureText) {
            await handleVenture(uid, ventureText, chatId)
            return NextResponse.json({ ok: true })
          }
        }

        // Detect if user said "approve" at the start — route as approve
        if (trimmedTranscript.startsWith('approve')) {
          await handleApprove(uid, chatId)
          return NextResponse.json({ ok: true })
        }

        // Detect if user said "signal" at the start — route as signal
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
        '',
        '*Venture Builder:*',
        '`/venture <text>` — Spec + auto-PRD a business idea',
        '`/approve` — Approve the most recent PRD draft',
        '`/feedback <text>` — Revise the PRD with feedback',
        '`/build` — Build the approved venture',
        '`/iterate <project> <changes>` — Iterate on deployed venture',
        '',
        '`/rss <url> #pillar` — Subscribe to RSS feed',
        '`/id` — Show your chat ID (for settings)',
        '',
        'Voice notes → auto-transcribed as journal',
        'Say "venture" to spec, "approve" to approve, "signal" to save as signal',
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

    // Handle venture command
    if (parsed.command === 'venture') {
      if (!parsed.text) {
        await sendTelegramReply(chatId, 'Empty venture. Usage: `/venture AI tool that auto-generates landing pages from a product description`')
        return NextResponse.json({ ok: true })
      }
      await handleVenture(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle approve command
    if (parsed.command === 'approve') {
      await handleApprove(uid, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle feedback command
    if (parsed.command === 'feedback') {
      await handleFeedback(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle iterate command
    if (parsed.command === 'iterate') {
      if (!parsed.text) {
        await sendTelegramReply(chatId, 'Usage: `/iterate project-name add dark mode`')
        return NextResponse.json({ ok: true })
      }
      await handleIterate(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle build command
    if (parsed.command === 'build') {
      await handleBuild(uid, chatId)
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
