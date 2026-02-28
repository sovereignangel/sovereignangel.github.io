import { NextRequest, NextResponse } from 'next/server'
import { parseTelegramMessage, type TelegramUpdate } from '@/lib/telegram-parser'
import { parseJournalEntry, transcribeAndParseVoiceNote, parsePrediction, parseVentureIdea, generateVenturePRD, generateVentureMemo, type ParsedJournalEntry } from '@/lib/ai-extraction'
import type { VentureSpec } from '@/lib/types'
import { computeReward } from '@/lib/reward'
import { DEFAULT_SETTINGS } from '@/lib/constants'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegramReply(chatId: number, text: string) {
  if (!BOT_TOKEN) return
  // Send without parse_mode first (plain text is reliable)
  // Markdown parse_mode silently drops messages if formatting is invalid
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  if (!res.ok) {
    console.error('Telegram sendMessage failed:', await res.text())
  }
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

async function getNextVentureNumber(adminDb: FirebaseFirestore.Firestore, uid: string): Promise<number> {
  const snap = await adminDb.collection('users').doc(uid).collection('ventures').get()
  let maxNum = 0
  snap.docs.forEach(d => {
    const num = d.data().ventureNumber
    if (typeof num === 'number' && num > maxNum) maxNum = num
  })
  return maxNum + 1
}

async function findVentureByNumberOrStage(
  adminDb: FirebaseFirestore.Firestore,
  uid: string,
  ventureNumber: number | null,
  stage: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  if (ventureNumber) {
    // Look up by number
    const snap = await adminDb.collection('users').doc(uid).collection('ventures')
      .where('ventureNumber', '==', ventureNumber)
      .limit(1)
      .get()
    if (snap.empty) return null
    return snap.docs[0]
  }
  // Fall back to most recent with matching stage
  const snap = await adminDb.collection('users').doc(uid).collection('ventures')
    .where('stage', '==', stage)
    .get()
  if (snap.empty) return null
  const sorted = snap.docs.sort((a, b) => {
    const aTime = a.data().createdAt?.toMillis?.() || 0
    const bTime = b.data().createdAt?.toMillis?.() || 0
    return bTime - aTime
  })
  return sorted[0]
}

// Parse an optional leading number from command text: "3 add dark mode" → { num: 3, rest: "add dark mode" }
function parseVentureNumber(text: string): { num: number | null; rest: string } {
  const match = text.match(/^(\d+)\s+(.+)$/)
  if (match) return { num: parseInt(match[1], 10), rest: match[2] }
  // Also handle just a number with no text (for /approve 3, /build 3)
  const numOnly = text.match(/^(\d+)\s*$/)
  if (numOnly) return { num: parseInt(numOnly[1], 10), rest: '' }
  return { num: null, rest: text }
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

  // Decisions, Principles, Beliefs
  if (parsed.decisions.length > 0) {
    lines.push('', `+${parsed.decisions.length} decision${parsed.decisions.length > 1 ? 's' : ''}`)
  }
  if (parsed.principles.length > 0) {
    lines.push('', `+${parsed.principles.length} principle${parsed.principles.length > 1 ? 's' : ''}`)
  }
  if (parsed.beliefs.length > 0) {
    lines.push('', `+${parsed.beliefs.length} belief${parsed.beliefs.length > 1 ? 's' : ''} (stress testing...)`)
  }

  // If nothing was parsed beyond raw text
  if (lines.length === 1) {
    lines.push('', '_No structured data extracted. Journal text saved._')
  }

  return lines.join('\n')
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFrameworkCoaching(
  parsed: ParsedJournalEntry,
  existingBeliefs: Array<{ statement: string; status: string; linkedDecisionIds?: string[]; sourceJournalDate: string }>,
  existingDecisions: Array<{ title: string; status: string; reviewDate?: string; outcomeScore?: number; learnings?: string }>
): string {
  const todayStr = getTodayKey()
  const prompts: string[] = []

  // --- OBSERVE -> BELIEVE gap ---
  if (parsed.intelligence.insightsExtracted && parsed.intelligence.insightsExtracted > 0 && parsed.beliefs.length === 0) {
    prompts.push(`You noted ${parsed.intelligence.insightsExtracted} insights but formed no testable beliefs. Sharpen one into: "I believe that [X] because [Y]"`)
  }

  // --- BELIEVE completeness ---
  for (const b of parsed.beliefs) {
    if (b.evidenceFor.length === 0) {
      prompts.push(`BELIEVE "${b.statement.slice(0, 50)}..." — what's your evidence?`)
    }
    if (b.evidenceAgainst.length === 0) {
      prompts.push(`STRESS TEST "${b.statement.slice(0, 50)}..." — what's the strongest counter-argument?`)
    }
  }

  // --- BELIEVE -> DECIDE gap (stale beliefs) ---
  const staleBeliefs = existingBeliefs.filter(b =>
    b.status === 'active' && (!b.linkedDecisionIds || b.linkedDecisionIds.length === 0) &&
    daysSince(b.sourceJournalDate) > 14
  )
  if (staleBeliefs.length > 0) {
    prompts.push(`${staleBeliefs.length} belief${staleBeliefs.length > 1 ? 's' : ''} held >14 days with no action. Act, update, or kill: "${staleBeliefs[0].statement.slice(0, 40)}..."`)
  }

  // --- DECIDE completeness ---
  for (const d of parsed.decisions) {
    prompts.push(`DECIDE "${d.title}" — what belief drives this? What would make you stop?`)
  }

  // --- OUTCOME gap (pending reviews) ---
  const pendingReview = existingDecisions.filter(d =>
    d.status === 'active' && d.reviewDate && d.reviewDate <= todayStr
  )
  if (pendingReview.length > 0) {
    prompts.push(`${pendingReview.length} decision${pendingReview.length > 1 ? 's' : ''} past review date. Score the outcome: "${pendingReview[0].title.slice(0, 40)}..."`)
  }

  // --- OUTCOME -> CODIFY gap ---
  const unclosed = existingDecisions.filter(d => d.outcomeScore != null && !d.learnings)
  if (unclosed.length > 0) {
    prompts.push(`You scored "${unclosed[0].title.slice(0, 40)}..." but didn't extract a principle. What's the rule for next time?`)
  }

  if (prompts.length === 0) return '\n\n_All loops closed. Machine running clean._'
  return '\n\n*The Machine:*\n' + prompts.slice(0, 3).map(q => `-> _${q}_`).join('\n')
}

function appendJournalText(existing: string, newText: string): string {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return existing
    ? `${existing}\n\n--- ${timeStr} ---\n${newText}`
    : `--- ${timeStr} ---\n${newText}`
}

// ---------------------------------------------------------------------------
// Brief feedback helpers
// ---------------------------------------------------------------------------

async function saveBriefFeedback(uid: string, feedbackText: string, chatId: number) {
  const adminDb = await getAdminDb()
  const todayKey = new Date().toISOString().split('T')[0]

  // Find the most recent daily_report with a morning brief (check last 3 days)
  let reportDate = todayKey
  let reportRef = adminDb.collection('users').doc(uid).collection('daily_reports').doc(todayKey)
  let reportSnap = await reportRef.get()

  if (!reportSnap.exists) {
    // Check yesterday
    const d = new Date(); d.setDate(d.getDate() - 1)
    reportDate = d.toISOString().split('T')[0]
    reportRef = adminDb.collection('users').doc(uid).collection('daily_reports').doc(reportDate)
    reportSnap = await reportRef.get()
  }

  const existingFeedback = reportSnap.exists ? (reportSnap.data()?.briefFeedback || []) : []
  existingFeedback.push({ text: feedbackText, createdAt: new Date().toISOString() })

  await reportRef.set({ briefFeedback: existingFeedback, updatedAt: new Date() }, { merge: true })
  await sendTelegramReply(chatId, `Brief feedback saved. This will shape future briefs.`)
}

async function handleBriefReplyFeedback(uid: string, text: string, replyToMessageId: number, chatId: number): Promise<boolean> {
  const adminDb = await getAdminDb()

  // Check last 7 days of daily_reports for a matching telegramMessageId
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  const reportsCollection = adminDb.collection('users').doc(uid).collection('daily_reports')
  const snaps = await Promise.all(dates.map(dk => reportsCollection.doc(dk).get()))

  for (const snap of snaps) {
    if (!snap.exists) continue
    const data = snap.data()!
    if (data.telegramMessageId === replyToMessageId) {
      const existingFeedback = data.briefFeedback || []
      existingFeedback.push({ text, createdAt: new Date().toISOString() })
      await snap.ref.set({ briefFeedback: existingFeedback, updatedAt: new Date() }, { merge: true })
      await sendTelegramReply(chatId, `Brief feedback saved. This will shape future briefs.`)
      return true
    }
  }

  return false // Not a reply to a morning brief
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
  // Compute date keys directly to avoid needing a Firestore index
  const recentDateKeys: string[] = []
  for (let i = 1; i <= 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    recentDateKeys.push(d.toISOString().split('T')[0])
  }
  const logsCollection = adminDb.collection('users').doc(uid).collection('daily_logs')
  const recentSnaps = await Promise.all(recentDateKeys.map(dk => logsCollection.doc(dk).get()))
  const recentLogs = recentSnaps
    .filter(s => s.exists)
    .map(s => ({ date: s.id, ...s.data()! }))

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

    // Create beliefs + trigger antithesis in background
    for (const b of parsed.beliefs) {
      const attentionDate = new Date()
      attentionDate.setDate(attentionDate.getDate() + 21)
      const beliefRef = adminDb.collection('users').doc(uid).collection('beliefs').doc()
      await beliefRef.set({
        statement: b.statement,
        confidence: b.confidence,
        domain: b.domain,
        evidenceFor: b.evidenceFor,
        evidenceAgainst: b.evidenceAgainst,
        status: 'active',
        linkedDecisionIds: [],
        linkedPrincipleIds: [],
        sourceJournalDate: today,
        attentionDate: attentionDate.toISOString().split('T')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Fetch existing beliefs + decisions for framework coaching
    const [beliefsSnap, decisionsSnap] = await Promise.all([
      adminDb.collection('users').doc(uid).collection('beliefs').where('status', '==', 'active').get(),
      adminDb.collection('users').doc(uid).collection('decisions').where('status', '==', 'active').get(),
    ])
    const existingBeliefs = beliefsSnap.docs.map(d => d.data() as { statement: string; status: string; linkedDecisionIds?: string[]; sourceJournalDate: string })
    const existingDecisions = decisionsSnap.docs.map(d => d.data() as { title: string; status: string; reviewDate?: string; outcomeScore?: number; learnings?: string })

    // Read back full merged log to compute reward
    const fullLogSnap = await logRef.get()
    const fullLog = fullLogSnap.data() || {}
    const coachingSection = buildFrameworkCoaching(parsed, existingBeliefs, existingDecisions)

    // Compute reward score server-side and save it
    const { score, delta } = await computeAndSaveReward(adminDb, uid, today, fullLog)
    const deltaStr = delta != null ? (delta >= 0 ? ` (+${delta})` : ` (${delta})`) : ''
    const scoreLine = `\n\n*g* = ${score.toFixed(1)}${deltaStr}`

    // Reply with summary + score + coaching
    await sendTelegramReply(chatId, buildJournalReply(parsed) + scoreLine + coachingSection)
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

    // Create beliefs + trigger antithesis in background
    for (const b of parsed.beliefs) {
      const attentionDate = new Date()
      attentionDate.setDate(attentionDate.getDate() + 21)
      const beliefRef = adminDb.collection('users').doc(uid).collection('beliefs').doc()
      await beliefRef.set({
        statement: b.statement, confidence: b.confidence, domain: b.domain,
        evidenceFor: b.evidenceFor, evidenceAgainst: b.evidenceAgainst,
        status: 'active', linkedDecisionIds: [], linkedPrincipleIds: [],
        sourceJournalDate: today, attentionDate: attentionDate.toISOString().split('T')[0],
        createdAt: new Date(), updatedAt: new Date(),
      })
    }

    // Fetch existing beliefs + decisions for framework coaching
    const [beliefsSnap, decisionsSnap] = await Promise.all([
      adminDb.collection('users').doc(uid).collection('beliefs').where('status', '==', 'active').get(),
      adminDb.collection('users').doc(uid).collection('decisions').where('status', '==', 'active').get(),
    ])
    const existingBeliefs = beliefsSnap.docs.map(d => d.data() as { statement: string; status: string; linkedDecisionIds?: string[]; sourceJournalDate: string })
    const existingDecisions = decisionsSnap.docs.map(d => d.data() as { title: string; status: string; reviewDate?: string; outcomeScore?: number; learnings?: string })

    // Read back full merged log to compute reward
    const fullLogSnap = await logRef.get()
    const fullLog = fullLogSnap.data() || {}
    const coachingSection = buildFrameworkCoaching(parsed, existingBeliefs, existingDecisions)

    // Compute reward score server-side and save it
    const { score, delta } = await computeAndSaveReward(adminDb, uid, today, fullLog)
    const deltaStr = delta != null ? (delta >= 0 ? ` (+${delta})` : ` (${delta})`) : ''
    const scoreLine = `\n\n*g* = ${score.toFixed(1)}${deltaStr}`

    // Reply with transcript + structured summary + score + coaching
    const journalReply = buildJournalReply(parsed)
    const fullReply = `*Transcript:*\n_"${transcript}"_\n\n${journalReply}${scoreLine}${coachingSection}`
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

  // URL validation with SSRF protection
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      await sendTelegramReply(chatId, 'Invalid URL. Must start with http:// or https://')
      return
    }
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' ||
        host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('172.') ||
        host === '169.254.169.254' || host.endsWith('.internal') || host.endsWith('.local')) {
      await sendTelegramReply(chatId, 'Invalid URL. Private/internal addresses are not allowed.')
      return
    }
  } catch {
    await sendTelegramReply(chatId, 'Invalid URL format.')
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

  // Track whether spec was already saved to avoid creating duplicates on PRD failure
  let ventureRef: FirebaseFirestore.DocumentReference | null = null
  let ventureNumber: number | null = null
  let spec: VentureSpec | null = null

  try {
    // Fetch user's active project names for context
    const projectsSnap = await adminDb.collection('users').doc(uid).collection('projects')
      .where('status', '==', 'active').get()
    const projectNames = projectsSnap.docs.map(d => d.data().name as string).filter(Boolean)

    // AI parse
    const parsed = await parseVentureIdea(text, projectNames)

    // Build venture spec object
    spec = {
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

    // Auto-assign venture number
    ventureNumber = await getNextVentureNumber(adminDb, uid)

    // Save venture as specced
    ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc()
    await ventureRef.set({
      rawInput: text,
      inputSource: 'telegram_text',
      spec,
      prd: null,
      ventureNumber,
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
      `#${ventureNumber} PRD drafted: ${parsed.name}`,
      '',
      `"${parsed.oneLiner}"`,
      '',
      `Problem: ${parsed.problem}`,
      `Customer: ${parsed.targetCustomer}`,
      `Revenue: ${parsed.revenueModel} (${parsed.pricingIdea})`,
      `Conviction: ${parsed.suggestedScore}/100`,
      '',
      `Features (${prd.features.length}):`,
    ]

    prd.features.forEach(f => {
      lines.push(`  ${f.priority}: ${f.name}`)
    })

    if (deepLink) {
      lines.push('', `View full PRD: ${deepLink}`)
    }

    lines.push('', `Reply /build ${ventureNumber} or /feedback ${ventureNumber} <text>`)

    await sendTelegramReply(chatId, lines.join('\n'))
  } catch (error) {
    console.error('Venture parsing error:', error)

    if (ventureRef && spec) {
      // Spec was saved but PRD generation failed — don't create a duplicate
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      await sendTelegramReply(chatId,
        `Build failed for ${spec.name}\n\n${errMsg}\n\nSpec is saved. You can retry from the dashboard.`)
    } else {
      // Spec parsing itself failed — save raw text as fallback
      const fallbackNumber = await getNextVentureNumber(adminDb, uid)
      const fallbackRef = adminDb.collection('users').doc(uid).collection('ventures').doc()
      await fallbackRef.set({
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
        ventureNumber: fallbackNumber,
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
}

// /approve removed — /build works directly from prd_draft

async function handleFeedback(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  if (!text.trim()) {
    await sendTelegramReply(chatId, 'Usage: /feedback <text> or /feedback <number> <text>')
    return
  }

  try {
    const { num, rest: feedbackText } = parseVentureNumber(text.trim())

    if (!feedbackText) {
      await sendTelegramReply(chatId, 'Missing feedback text. Usage: /feedback 3 add Stripe integration')
      return
    }

    // When a number is given, find by number (any stage). Otherwise find most recent prd_draft.
    const ventureDoc = num
      ? await findVentureByNumberOrStage(adminDb, uid, num, 'prd_draft')
      : await findVentureByNumberOrStage(adminDb, uid, null, 'prd_draft')

    if (!ventureDoc) {
      await sendTelegramReply(chatId, num
        ? `Venture #${num} not found.`
        : 'No venture to send feedback on.\n\nUse /venture to create one first.')
      return
    }

    const venture = ventureDoc.data()
    const vNum = venture.ventureNumber ? `#${venture.ventureNumber} ` : ''
    const existingPrd = venture.prd
    const spec = venture.spec

    const isNewPrd = !existingPrd
    await sendTelegramReply(chatId, isNewPrd
      ? `${vNum}Generating PRD with your feedback...`
      : `${vNum}Regenerating PRD with feedback...`)

    // Append feedback to history
    const feedbackHistory = [...(existingPrd?.feedbackHistory || []), feedbackText]

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

    // Update venture — also set stage to prd_draft if it wasn't already
    const updateData: Record<string, unknown> = {
      prd: newPrd,
      updatedAt: new Date(),
    }
    if (venture.stage === 'idea' || venture.stage === 'specced' || venture.stage === 'validated') {
      updateData.stage = 'prd_draft'
    }
    await ventureDoc.ref.update(updateData)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const deepLink = baseUrl ? `${baseUrl}/thesis/ventures?id=${ventureDoc.id}` : ''
    const ventureNum = venture.ventureNumber || ''

    const lines: string[] = [
      `${vNum}${isNewPrd ? 'PRD generated' : 'PRD updated'}: ${spec.name} (v${newPrd.version})`,
      '',
      `Features (${newPrd.features.length}):`,
    ]

    newPrd.features.forEach(f => {
      lines.push(`  ${f.priority}: ${f.name}`)
    })

    if (deepLink) {
      lines.push('', `View full PRD: ${deepLink}`)
    }

    lines.push('', `Reply /build ${ventureNum} or /feedback ${ventureNum} <more changes>`)

    await sendTelegramReply(chatId, lines.join('\n'))
  } catch (error) {
    console.error('PRD feedback error:', error)
    await sendTelegramReply(chatId, `Failed to regenerate PRD: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function handleMemo(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  try {
    const { num } = parseVentureNumber(text.trim())

    // Find venture by number, or most recent with a spec (any stage past idea)
    let ventureDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null
    if (num) {
      const snap = await adminDb.collection('users').doc(uid).collection('ventures')
        .where('ventureNumber', '==', num).limit(1).get()
      if (!snap.empty) ventureDoc = snap.docs[0]
    } else {
      // Find most recent venture that has a spec (not idea stage)
      const snap = await adminDb.collection('users').doc(uid).collection('ventures')
        .orderBy('createdAt', 'desc').limit(20).get()
      const eligible = snap.docs.filter(d => d.data().stage !== 'idea')
      if (eligible.length > 0) ventureDoc = eligible[0]
    }

    if (!ventureDoc) {
      await sendTelegramReply(chatId, num
        ? `Venture #${num} not found.`
        : 'No ventures to generate a memo for.\n\nUse /venture to create one first.')
      return
    }

    const venture = ventureDoc.data()
    const vNum = venture.ventureNumber ? `#${venture.ventureNumber} ` : ''
    const spec = venture.spec
    const prd = venture.prd || null

    if (venture.stage === 'idea') {
      await sendTelegramReply(chatId, `${vNum}${spec.name} is still in "idea" stage. Spec it first with /venture.`)
      return
    }

    await sendTelegramReply(chatId, `${vNum}Generating pitch memo for ${spec.name}...`)

    // Build feedback history from existing memo
    const existingMemo = venture.memo
    const feedbackHistory = existingMemo?.feedbackHistory || []

    const memo = await generateVentureMemo(spec, prd, feedbackHistory.length > 0 ? feedbackHistory : undefined)
    memo.version = (existingMemo?.version || 0) + 1

    // Save memo to venture
    await ventureDoc.ref.update({
      memo,
      updatedAt: new Date(),
    })

    // Save public copy for shareable URL
    const memoId = ventureDoc.id
    await adminDb.collection('public_memos').doc(memoId).set({
      memo,
      ventureName: spec.name,
      oneLiner: spec.oneLiner,
      category: spec.category,
      thesisPillars: spec.thesisPillars,
      uid,
      ventureId: memoId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://loricorpuz.com'
    const memoUrl = `${baseUrl}/memo/${memoId}`

    const lines: string[] = [
      `${vNum}Pitch memo generated: ${spec.name}`,
      '',
      `"${memo.companyPurpose}"`,
      '',
    ]

    // Key metrics summary
    if (memo.keyMetrics.length > 0) {
      memo.keyMetrics.slice(0, 4).forEach(m => {
        lines.push(`  ${m.label}: ${m.value}`)
      })
      lines.push('')
    }

    lines.push(`View full memo: ${memoUrl}`)
    lines.push('')
    lines.push(`Reply /memo ${venture.ventureNumber || ''} to regenerate`)

    await sendTelegramReply(chatId, lines.join('\n'))
  } catch (error) {
    console.error('Memo generation error:', error)
    await sendTelegramReply(chatId, `Memo generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const STAGE_ROLLBACK: Record<string, string> = {
  specced: 'idea',
  prd_draft: 'specced',
  building: 'prd_draft',
  deployed: 'prd_draft',
}

async function handleReset(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  try {
    const { num } = parseVentureNumber(text.trim())

    // Find by number (any stage), or fall back to most recent "building" venture
    let ventureDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null
    if (num) {
      const snap = await adminDb.collection('users').doc(uid).collection('ventures')
        .where('ventureNumber', '==', num).limit(1).get()
      if (!snap.empty) ventureDoc = snap.docs[0]
    } else {
      ventureDoc = await findVentureByNumberOrStage(adminDb, uid, null, 'building')
    }

    if (!ventureDoc) {
      await sendTelegramReply(chatId, num
        ? `Venture #${num} not found.`
        : 'No venture in building stage to reset.')
      return
    }

    const venture = ventureDoc.data()
    const vNum = venture.ventureNumber ? `#${venture.ventureNumber} ` : ''
    const currentStage = venture.stage as string
    const previousStage = STAGE_ROLLBACK[currentStage]

    if (!previousStage) {
      await sendTelegramReply(chatId, `${vNum}${venture.spec.name} is in "${currentStage}" — cannot reset further.`)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      stage: previousStage,
      updatedAt: new Date(),
    }

    // Clear build state when rolling back from building
    if (currentStage === 'building') {
      updateData['build.status'] = 'pending'
      updateData['build.startedAt'] = null
      updateData['build.completedAt'] = null
      updateData['build.errorMessage'] = null
    }

    await ventureDoc.ref.update(updateData)

    await sendTelegramReply(chatId,
      `${vNum}${venture.spec.name} reset: ${currentStage} → ${previousStage}`)
  } catch (error) {
    console.error('Reset error:', error)
    await sendTelegramReply(chatId, `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ─── Claude Build Handlers ────────────────────────────────────────────────────

async function handleClaudeBuild(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  try {
    // Parse: optional venture number + optional skill names (comma-separated after "with")
    const withMatch = text.match(/^(.*?)(?:\s+with\s+(.+))?$/)
    const numPart = withMatch?.[1]?.trim() || ''
    const skillsPart = withMatch?.[2]?.trim() || ''

    const { num } = parseVentureNumber(numPart)
    const skillNames = skillsPart
      ? skillsPart.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const ventureDoc = await findVentureByNumberOrStage(adminDb, uid, num, 'prd_draft')

    if (!ventureDoc) {
      await sendTelegramReply(chatId, num
        ? `Venture #${num} not found.`
        : 'No venture with a PRD ready to build.\n\nUse /venture to spec one first.')
      return
    }

    const venture = ventureDoc.data()
    const ventureId = ventureDoc.id
    const spec = venture.spec
    const vNum = venture.ventureNumber ? `#${venture.ventureNumber} ` : ''

    if (!venture.prd) {
      await sendTelegramReply(chatId, `${vNum}${spec.name} has no PRD yet.\n\nUse /feedback ${venture.ventureNumber || ''} <text> to generate one.`)
      return
    }

    if (venture.stage === 'building') {
      await sendTelegramReply(chatId, `${vNum}${spec.name} is already building. Use /reset ${venture.ventureNumber || ''} to unstick.`)
      return
    }

    if (venture.stage === 'deployed') {
      await sendTelegramReply(chatId, `${vNum}${spec.name} is already deployed. Use /iterate to modify it.`)
      return
    }

    // Mark as building
    await ventureDoc.ref.update({
      stage: 'building',
      'build.status': 'generating',
      'build.startedAt': new Date(),
      'build.errorMessage': null,
      'build.buildLog': ['Claude build started'],
      updatedAt: new Date(),
    })

    const skillsLabel = skillNames.length > 0 ? `\nSkills: ${skillNames.join(', ')}` : '\nSkills: base-nextjs, clean-design (defaults)'
    await sendTelegramReply(chatId, `${vNum}Claude build started for ${spec.name}${skillsLabel}\n\nGenerating codebase... This may take 2-5 minutes.`)

    // Dispatch to /api/ventures/claude-build (has maxDuration=300).
    // We fire-and-forget so the webhook returns immediately.
    // The claude-build endpoint handles Telegram notifications on completion.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    const internalSecret = process.env.INTERNAL_API_SECRET

    if (!baseUrl || !internalSecret) {
      await sendTelegramReply(chatId, 'Build config error: NEXT_PUBLIC_BASE_URL or INTERNAL_API_SECRET not set.')
      await ventureDoc.ref.update({
        stage: 'prd_draft',
        'build.status': 'failed',
        'build.errorMessage': 'Server misconfigured: missing BASE_URL or INTERNAL_API_SECRET',
        'build.completedAt': new Date(),
        updatedAt: new Date(),
      })
      return
    }

    // Fire the build request — don't await the response
    fetch(`${baseUrl}/api/ventures/claude-build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalSecret}`,
      },
      body: JSON.stringify({
        ventureId,
        uid,
        skillNames: skillNames.length > 0 ? skillNames : undefined,
        chatId: String(chatId),
      }),
    }).catch(err => {
      console.error('Failed to dispatch claude-build:', err)
    })
  } catch (error) {
    console.error('Claude build error:', error)
    await sendTelegramReply(chatId, `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function handleClaudeIterate(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  if (!text.trim()) {
    await sendTelegramReply(chatId, 'Usage: /iterate project-name add dark mode\n\nOptional skills: /iterate project-name add dark mode with armstrong-brand')
    return
  }

  // Parse: first word = project slug, rest = changes (optionally "with skills")
  const withMatch = text.match(/^(.+?)(?:\s+with\s+(\S+(?:,\S+)*))?$/)
  const mainPart = withMatch?.[1]?.trim() || text.trim()
  const skillsPart = withMatch?.[2]?.trim() || ''

  const parts = mainPart.split(/\s+/)
  const projectSlug = parts[0].toLowerCase()
  const changes = parts.slice(1).join(' ')
  const skillNames = skillsPart ? skillsPart.split(',').map(s => s.trim()).filter(Boolean) : []

  if (!changes) {
    await sendTelegramReply(chatId, 'Missing change description.\n\nUsage: /iterate project-name add dark mode')
    return
  }

  // Find venture
  const venturesSnap = await adminDb.collection('users').doc(uid).collection('ventures')
    .where('stage', '==', 'deployed').get()

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
  const vNum = venture.ventureNumber ? `#${venture.ventureNumber} ` : ''

  // Update state
  const iterations = venture.iterations || []
  iterations.push({ request: changes, completedAt: null })
  await matchedDoc.ref.update({
    stage: 'building',
    iterations,
    'build.status': 'generating',
    'build.startedAt': new Date(),
    'build.errorMessage': null,
    'build.buildLog': ['Claude iterate started'],
    updatedAt: new Date(),
  })

  await sendTelegramReply(chatId, `${vNum}Iterating on ${venture.spec.name}...\n\n"${changes}"\n\nThis may take 2-5 minutes.`)

  // Dispatch to /api/ventures/claude-build (has maxDuration=300).
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  const internalSecret = process.env.INTERNAL_API_SECRET

  if (!baseUrl || !internalSecret) {
    await sendTelegramReply(chatId, 'Build config error: NEXT_PUBLIC_BASE_URL or INTERNAL_API_SECRET not set.')
    await matchedDoc.ref.update({
      stage: 'deployed',
      'build.status': 'failed',
      'build.errorMessage': 'Server misconfigured: missing BASE_URL or INTERNAL_API_SECRET',
      'build.completedAt': new Date(),
      updatedAt: new Date(),
    })
    return
  }

  // Fire the iterate request — don't await the response
  fetch(`${baseUrl}/api/ventures/claude-build`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${internalSecret}`,
    },
    body: JSON.stringify({
      ventureId,
      uid,
      iterate: true,
      changes,
      skillNames: skillNames.length > 0 ? skillNames : undefined,
      chatId: String(chatId),
    }),
  }).catch(err => {
    console.error('Failed to dispatch claude-build iterate:', err)
  })
}

async function handleSkill(uid: string, text: string, chatId: number) {
  const adminDb = await getAdminDb()

  if (!text.trim()) {
    await sendTelegramReply(chatId, [
      'Builder Skills — composable prompt blocks for Claude builds',
      '',
      'Commands:',
      '  /skill list — List all skills',
      '  /skill create <name> | <prompt> — Create a custom skill',
      '  /skill default <name> — Toggle skill as default',
      '  /skill delete <name> — Delete a custom skill',
      '  /skill info <name> — Show skill details',
      '',
      'Use in builds:',
      '  /build 3 with armstrong-brand,stripe-payments',
    ].join('\n'))
    return
  }

  const parts = text.trim().split(/\s+/)
  const subcommand = parts[0].toLowerCase()

  if (subcommand === 'list') {
    // List all skills (user + defaults)
    const snap = await adminDb.collection('users').doc(uid).collection('builder_skills')
      .orderBy('name', 'asc').get()
    const userSkills = snap.docs.map(d => d.data())

    const { DEFAULT_SKILLS } = await import('@/lib/claude-builder/default-skills')
    const userNames = new Set(userSkills.map(s => s.name))
    const builtins = DEFAULT_SKILLS.filter(s => !userNames.has(s.name))

    const lines: string[] = ['Builder Skills:']
    const allSkills = [...userSkills, ...builtins.map(s => ({ ...s, builtin: true }))]

    for (const s of allSkills) {
      const defaultTag = s.isDefault ? ' [default]' : ''
      const builtinTag = 'builtin' in s ? ' (built-in)' : ''
      lines.push(`  ${s.name} — ${s.description || s.label}${defaultTag}${builtinTag}`)
    }

    lines.push('', `${allSkills.length} skills available`)
    await sendTelegramReply(chatId, lines.join('\n'))
    return
  }

  if (subcommand === 'create') {
    // Parse: /skill create <name> | <system prompt>
    const rest = parts.slice(1).join(' ')
    const pipeIndex = rest.indexOf('|')

    if (pipeIndex === -1) {
      await sendTelegramReply(chatId, 'Usage: /skill create my-brand | ## Design System\nUse dark theme with blue accents...')
      return
    }

    const name = rest.slice(0, pipeIndex).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
    const systemPrompt = rest.slice(pipeIndex + 1).trim()

    if (!name || !systemPrompt) {
      await sendTelegramReply(chatId, 'Both name and prompt are required.\n\nUsage: /skill create my-brand | ## Design\nDark theme...')
      return
    }

    const ref = adminDb.collection('users').doc(uid).collection('builder_skills').doc()
    await ref.set({
      name,
      label: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      category: 'custom',
      description: systemPrompt.slice(0, 80),
      systemPrompt,
      dependencies: [],
      techStack: [],
      filePatterns: [],
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await sendTelegramReply(chatId, `Skill created: ${name}\n\nUse it: /build 3 with ${name}`)
    return
  }

  if (subcommand === 'default') {
    const name = parts[1]?.toLowerCase()
    if (!name) {
      await sendTelegramReply(chatId, 'Usage: /skill default <name>')
      return
    }

    // Find the skill
    const snap = await adminDb.collection('users').doc(uid).collection('builder_skills')
      .where('name', '==', name).limit(1).get()

    if (snap.empty) {
      // Check if it's a built-in and copy it
      const { DEFAULT_SKILLS } = await import('@/lib/claude-builder/default-skills')
      const builtin = DEFAULT_SKILLS.find(s => s.name === name)
      if (builtin) {
        const ref = adminDb.collection('users').doc(uid).collection('builder_skills').doc()
        await ref.set({ ...builtin, isDefault: true, createdAt: new Date(), updatedAt: new Date() })
        await sendTelegramReply(chatId, `${name} copied from built-ins and set as default.`)
      } else {
        await sendTelegramReply(chatId, `Skill "${name}" not found.`)
      }
      return
    }

    const doc = snap.docs[0]
    const current = doc.data().isDefault ?? false
    await doc.ref.update({ isDefault: !current, updatedAt: new Date() })
    await sendTelegramReply(chatId, `${name} ${!current ? 'set as default' : 'removed from defaults'}.`)
    return
  }

  if (subcommand === 'delete') {
    const name = parts[1]?.toLowerCase()
    if (!name) {
      await sendTelegramReply(chatId, 'Usage: /skill delete <name>')
      return
    }
    const snap = await adminDb.collection('users').doc(uid).collection('builder_skills')
      .where('name', '==', name).limit(1).get()
    if (snap.empty) {
      await sendTelegramReply(chatId, `Skill "${name}" not found in your collection.`)
      return
    }
    await snap.docs[0].ref.delete()
    await sendTelegramReply(chatId, `Skill "${name}" deleted.`)
    return
  }

  if (subcommand === 'info') {
    const name = parts[1]?.toLowerCase()
    if (!name) {
      await sendTelegramReply(chatId, 'Usage: /skill info <name>')
      return
    }
    // Check user skills
    const snap = await adminDb.collection('users').doc(uid).collection('builder_skills')
      .where('name', '==', name).limit(1).get()

    if (!snap.empty) {
      const s = snap.docs[0].data()
      const lines = [
        `Skill: ${s.name}`,
        `Label: ${s.label}`,
        `Category: ${s.category}`,
        `Default: ${s.isDefault ? 'yes' : 'no'}`,
        s.dependencies?.length ? `Depends on: ${s.dependencies.join(', ')}` : '',
        s.techStack?.length ? `Tech: ${s.techStack.join(', ')}` : '',
        '',
        'Prompt:',
        s.systemPrompt.slice(0, 500) + (s.systemPrompt.length > 500 ? '...' : ''),
      ].filter(Boolean)
      await sendTelegramReply(chatId, lines.join('\n'))
      return
    }

    // Check built-ins
    const { DEFAULT_SKILLS } = await import('@/lib/claude-builder/default-skills')
    const builtin = DEFAULT_SKILLS.find(s => s.name === name)
    if (builtin) {
      const lines = [
        `Skill: ${builtin.name} (built-in)`,
        `Label: ${builtin.label}`,
        `Category: ${builtin.category}`,
        builtin.techStack?.length ? `Tech: ${builtin.techStack.join(', ')}` : '',
        '',
        'Prompt:',
        builtin.systemPrompt.slice(0, 500) + (builtin.systemPrompt.length > 500 ? '...' : ''),
      ].filter(Boolean)
      await sendTelegramReply(chatId, lines.join('\n'))
      return
    }

    await sendTelegramReply(chatId, `Skill "${name}" not found.`)
    return
  }

  await sendTelegramReply(chatId, `Unknown skill command: ${subcommand}\n\nUse /skill for help.`)
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot not configured' }, { status: 500 })
  }

  // Verify Telegram webhook secret (mandatory — reject if not configured)
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

        // Detect if user said "build" at the start — route as build
        if (trimmedTranscript.startsWith('build')) {
          await handleClaudeBuild(uid, trimmedTranscript.slice('build'.length).trim(), chatId)
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
        '`/feedback <text>` — Revise the PRD with feedback',
        '`/build` — Build the venture from its PRD',
        '`/memo [#]` — Generate Sequoia-style pitch memo',
        '`/iterate <project> <changes>` — Iterate on deployed venture',
        '`/reset [#]` — Roll back a venture to its previous stage',
        '',
        '`/brief <text>` — Feedback on morning brief',
        '`/rss <url> #pillar` — Subscribe to RSS feed',
        '`/id` — Show your chat ID (for settings)',
        '',
        'Reply to a morning brief to send feedback.',
        'Voice notes → auto-transcribed as journal',
        'Say "venture" to spec, "build" to build, "signal" to save as signal',
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

    // Check if this is a reply to a morning brief → treat as brief feedback
    if (message.reply_to_message && message.text && !message.text.startsWith('/')) {
      const replyToId = message.reply_to_message.message_id
      const handled = await handleBriefReplyFeedback(uid, message.text, replyToId, chatId)
      if (handled) return NextResponse.json({ ok: true })
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

    // /approve removed — /build works directly from prd_draft
    if (parsed.command === 'approve') {
      await sendTelegramReply(chatId, '/approve is no longer needed. Just use /build to build directly from the PRD.')
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
        await sendTelegramReply(chatId, 'Usage: /iterate project-name add dark mode')
        return NextResponse.json({ ok: true })
      }
      await handleClaudeIterate(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle memo command
    if (parsed.command === 'memo') {
      await handleMemo(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle build command (routes to Claude builder)
    if (parsed.command === 'build') {
      await handleClaudeBuild(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle reset command
    if (parsed.command === 'reset') {
      await handleReset(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle Claude build command
    if (parsed.command === 'cbuild') {
      await handleClaudeBuild(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle Claude iterate command
    if (parsed.command === 'citerate') {
      if (!parsed.text) {
        await sendTelegramReply(chatId, 'Usage: /iterate project-name add dark mode')
        return NextResponse.json({ ok: true })
      }
      await handleClaudeIterate(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle skill management command
    if (parsed.command === 'skill') {
      await handleSkill(uid, parsed.text, chatId)
      return NextResponse.json({ ok: true })
    }

    // Handle morning brief on-demand trigger
    if (parsed.command === 'morning') {
      await sendTelegramReply(chatId, 'Generating your morning brief...')
      try {
        const { generateMorningBrief } = await import('@/lib/morning-brief')
        const { formatMorningBrief } = await import('@/lib/morning-brief-formatter')
        const { sendTelegramMessage } = await import('@/lib/telegram')
        const brief = await generateMorningBrief(uid)
        const formatted = formatMorningBrief(brief)
        const messageId = await sendTelegramMessage(chatId, formatted)
        const adminDb = await getAdminDb()
        await adminDb.collection('users').doc(uid).collection('daily_reports').doc(brief.date).set({
          type: 'morning_brief',
          brief,
          formatted,
          generatedAt: new Date(),
          ...(messageId ? { telegramMessageId: messageId, telegramChatId: chatId } : {}),
        }, { merge: true })
      } catch (error) {
        console.error('[morning] Manual brief failed:', error)
        await sendTelegramReply(chatId, `Brief generation failed: ${error instanceof Error ? error.message : String(error)}`)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle brief feedback command
    if (parsed.command === 'brief') {
      if (!parsed.text) {
        await sendTelegramReply(chatId, 'Usage: `/brief more actionable, less verbose` — or just reply to the morning brief message')
        return NextResponse.json({ ok: true })
      }
      await saveBriefFeedback(uid, parsed.text, chatId)
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
    // Always try to reply so the user knows something went wrong
    try {
      const update: TelegramUpdate = await req.clone().json()
      const chatId = update.message?.chat?.id
      if (chatId) {
        await sendTelegramReply(chatId, `Error: ${msg.slice(0, 200)}`)
      }
    } catch { /* ignore reply failure */ }
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 })
  }
}
