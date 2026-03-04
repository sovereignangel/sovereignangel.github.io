/**
 * Shared transcript processing logic.
 * Used by both the Telegram /transcript callback and the auto-processing webhook.
 * Saves extracted data to 6+ Firestore collections and returns counts.
 */

import type { TranscriptTemplateType } from './transcript-templates'
import type { TranscriptExtractionResult } from './ai-extraction'
import { parseVentureIdea } from './ai-extraction'

export interface TranscriptProcessingResult {
  conversationId: string
  title: string
  date: string
  templateType: TranscriptTemplateType
  keyTakeaways: string[]
  counts: {
    hypotheses: number
    beliefs: number
    decisions: number
    insights: number
    contacts: number
    ventures: number
  }
  alignmentAreas?: string[]
  dealPoints?: string[]
}

const TEMPLATE_LABELS: Record<string, string> = {
  partnership: 'Partnership',
  research: 'Research/Reading Club',
  discovery: 'Customer Discovery',
  investor: 'Investor',
  advisor: 'Advisor',
  internal: 'Internal',
  general: 'General',
}

const TEMPLATE_TO_CONV_TYPE: Record<string, string> = {
  partnership: 'partnership',
  research: 'other',
  discovery: 'customer_discovery',
  investor: 'investor',
  advisor: 'advisor',
  internal: 'other',
  general: 'other',
}

async function getNextVentureNumber(
  adminDb: FirebaseFirestore.Firestore,
  uid: string,
): Promise<number> {
  const snap = await adminDb.collection('users').doc(uid).collection('ventures').get()
  let maxNum = 0
  snap.docs.forEach(d => {
    const num = d.data().ventureNumber
    if (typeof num === 'number' && num > maxNum) maxNum = num
  })
  return maxNum + 1
}

export async function processTranscriptData(
  uid: string,
  transcriptText: string,
  templateType: TranscriptTemplateType,
  extracted: TranscriptExtractionResult,
): Promise<TranscriptProcessingResult> {
  const { adminDb } = await import('./firebase-admin')
  const userRef = adminDb.collection('users').doc(uid)

  const now = new Date().toISOString().split('T')[0]
  const date = extracted.inferredDate || now
  const title = extracted.inferredTitle

  const counts = { hypotheses: 0, beliefs: 0, decisions: 0, insights: 0, contacts: 0, ventures: 0 }

  // 1. Save action items as insights
  for (const item of extracted.actionItems) {
    await userRef.collection('insights').add({
      type: 'action_item',
      content: item.owner
        ? `${item.task} (Owner: ${item.owner}${item.deadline ? ', by ' + item.deadline : ''})`
        : item.task,
      summary: item.task.slice(0, 80),
      sourceConversationTitle: title,
      sourceConversationDate: date,
      linkedProjectIds: [],
      linkedProjectNames: [],
      tags: ['action_item'],
      thesisPillars: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    counts.insights++
  }

  // 2. Save template-specific insights
  for (const insight of extracted.insights || []) {
    await userRef.collection('insights').add({
      type: insight.type,
      content: insight.content,
      summary: insight.summary,
      sourceConversationTitle: title,
      sourceConversationDate: date,
      linkedProjectIds: [],
      linkedProjectNames: [],
      tags: insight.tags || [],
      thesisPillars: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    counts.insights++
  }

  // 3. Save hypotheses (research template)
  for (const h of extracted.hypotheses || []) {
    await userRef.collection('hypotheses').add({
      question: h.question,
      context: h.context,
      domain: h.domain,
      status: 'open',
      priority: h.priority,
      evidence: [],
      resolution: h.resolution || null,
      sourceType: 'transcript',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    counts.hypotheses++
  }

  // 4. Save beliefs (research template)
  for (const b of extracted.beliefs || []) {
    const attentionDate = new Date()
    attentionDate.setDate(attentionDate.getDate() + 21)
    await userRef.collection('beliefs').add({
      statement: b.statement,
      confidence: Math.min(100, Math.max(0, b.confidence)),
      domain: b.domain,
      evidenceFor: b.evidenceFor,
      evidenceAgainst: b.evidenceAgainst,
      status: 'active',
      linkedDecisionIds: [],
      linkedPrincipleIds: [],
      sourceJournalDate: date,
      attentionDate: attentionDate.toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    counts.beliefs++
  }

  // 5. Save decisions (partnership/investor/internal templates)
  for (const d of extracted.decisions || []) {
    const reviewDate = new Date()
    reviewDate.setDate(reviewDate.getDate() + 90)
    await userRef.collection('decisions').add({
      title: d.title,
      hypothesis: '',
      options: [d.chosenOption],
      chosenOption: d.chosenOption,
      reasoning: d.reasoning,
      confidenceLevel: Math.min(100, Math.max(0, d.confidenceLevel)),
      killCriteria: [],
      premortem: '',
      domain: d.domain,
      linkedProjectIds: [],
      linkedSignalIds: [],
      status: 'active',
      reviewDate: reviewDate.toISOString().split('T')[0],
      decidedAt: date,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    counts.decisions++
  }

  // 6. Save venture ideas (partnership template)
  for (const rawIdea of extracted.ventureIdeas || []) {
    try {
      const parsed = await parseVentureIdea(rawIdea, [])
      const nextNum = await getNextVentureNumber(adminDb, uid)
      await userRef.collection('ventures').add({
        ventureNumber: nextNum,
        rawInput: rawIdea,
        inputSource: 'auto_transcript',
        spec: {
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
        },
        prd: null,
        memo: null,
        build: {
          status: 'pending',
          repoUrl: null,
          previewUrl: null,
          customDomain: null,
          repoName: null,
          buildLog: [],
          startedAt: null,
          completedAt: null,
          errorMessage: null,
          filesGenerated: null,
        },
        iterations: [],
        linkedProjectId: null,
        notes: '',
        stage: 'idea',
        score: parsed.suggestedScore || 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      counts.ventures++
    } catch (err) {
      console.error('Failed to parse venture idea:', err)
    }
  }

  // 7. Save contacts (simple name-match, same as existing Telegram handler)
  for (const contact of extracted.contacts) {
    if (contact.name && contact.name.trim()) {
      try {
        const existing = await userRef.collection('contacts').where('name', '==', contact.name.trim()).limit(1).get()
        if (existing.empty) {
          await userRef.collection('contacts').add({
            name: contact.name.trim(),
            notes: contact.context,
            interactions: [{ date, type: 'meeting', summary: `${TEMPLATE_LABELS[templateType] || templateType} call: ${title}` }],
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else {
          const existingRef = existing.docs[0].ref
          const existingData = existing.docs[0].data()
          await existingRef.update({
            interactions: [...(existingData.interactions || []), { date, type: 'meeting', summary: `${TEMPLATE_LABELS[templateType] || templateType} call: ${title}` }],
            updatedAt: new Date(),
          })
        }
        counts.contacts++
      } catch (err) {
        console.error('Failed to save contact:', contact.name, err)
      }
    }
  }

  // 8. Save conversation document (central hub linking everything)
  const convRef = await userRef.collection('conversations').add({
    title,
    date,
    participants: extracted.participants,
    transcriptText,
    durationMinutes: 0,
    conversationType: TEMPLATE_TO_CONV_TYPE[templateType] || 'other',
    processInsights: extracted.keyTakeaways,
    featureIdeas: [],
    actionItems: extracted.actionItems.map(a => a.task),
    valueSignals: [],
    aiProcessed: true,
    aiProcessedAt: new Date(),
    linkedSignalIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return {
    conversationId: convRef.id,
    title,
    date,
    templateType,
    keyTakeaways: extracted.keyTakeaways,
    counts,
    alignmentAreas: extracted.alignmentAreas,
    dealPoints: extracted.dealPoints,
  }
}

/**
 * Format a TranscriptProcessingResult into a human-readable summary.
 */
export function formatTranscriptSummary(
  result: TranscriptProcessingResult,
  options?: { source?: string; autoClassified?: boolean }
): string {
  const lines: string[] = []

  if (options?.source) {
    lines.push(`Auto-processed transcript (${options.source})`)
  }

  lines.push(`Transcript processed: ${result.title}`)

  if (options?.autoClassified) {
    lines.push(`Type: ${TEMPLATE_LABELS[result.templateType] || result.templateType} (auto-classified)`)
  }

  const storedItems: string[] = []
  const { counts } = result
  if (counts.hypotheses > 0) storedItems.push(`${counts.hypotheses} hypothesis${counts.hypotheses > 1 ? 'es' : ''}`)
  if (counts.beliefs > 0) storedItems.push(`${counts.beliefs} belief${counts.beliefs > 1 ? 's' : ''}`)
  if (counts.decisions > 0) storedItems.push(`${counts.decisions} decision${counts.decisions > 1 ? 's' : ''}`)
  if (counts.insights > 0) storedItems.push(`${counts.insights} insight${counts.insights > 1 ? 's' : ''}`)
  if (counts.ventures > 0) storedItems.push(`${counts.ventures} venture idea${counts.ventures > 1 ? 's' : ''}`)
  if (counts.contacts > 0) storedItems.push(`${counts.contacts} contact${counts.contacts > 1 ? 's' : ''}`)

  if (storedItems.length > 0) {
    lines.push('', 'Stored:', ...storedItems.map(s => `  + ${s}`))
  }

  if (result.alignmentAreas?.length) {
    lines.push('', 'Alignment areas:', ...result.alignmentAreas.slice(0, 3).map(a => `  - ${a}`))
  }

  if (result.dealPoints?.length) {
    lines.push('', 'Deal points:', ...result.dealPoints.slice(0, 3).map(d => `  - ${d}`))
  }

  if (result.keyTakeaways.length > 0) {
    lines.push('', 'Key takeaways:', ...result.keyTakeaways.slice(0, 3).map(t => `  - ${t}`))
  }

  return lines.join('\n')
}
