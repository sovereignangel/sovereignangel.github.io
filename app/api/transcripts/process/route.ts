import { NextRequest, NextResponse } from 'next/server'
import { extractFromTranscript, parseVentureIdea } from '@/lib/ai-extraction'
import type { TranscriptTemplateType } from '@/lib/transcript-templates'
import {
  saveConversation,
  saveInsights,
  saveBelief,
  saveDecision,
  saveHypothesis,
  saveVenture,
  addInteractionToContact,
} from '@/lib/firestore'
import { resolveContactsBatch } from '@/lib/entity-resolution'
import { verifyAuth } from '@/lib/api-auth'
import type { ConversationType } from '@/lib/types'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const uid = auth.uid
    const {
      transcriptText,
      templateType,
      projectNames = [],
      projectNameToId = {},
    }: {
      transcriptText: string
      templateType: TranscriptTemplateType
      projectNames: string[]
      projectNameToId: Record<string, string>
    } = body

    if (!transcriptText || !templateType) {
      return NextResponse.json({ error: 'Missing transcriptText or templateType' }, { status: 400 })
    }

    // Extract structured data using template-specific prompt
    const extracted = await extractFromTranscript(transcriptText, templateType)

    const now = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const date = extracted.inferredDate || now
    const title = extracted.inferredTitle

    const counts = {
      hypotheses: 0,
      beliefs: 0,
      decisions: 0,
      insights: 0,
      contacts: 0,
      ventures: 0,
    }

    const linkedInsightIds: string[] = []
    const linkedDecisionIds: string[] = []
    const linkedBeliefIds: string[] = []
    const linkedHypothesisIds: string[] = []
    const linkedVentureIds: string[] = []

    // --- 1. Save action items as insights ---
    if (extracted.actionItems.length > 0) {
      const actionInsights = extracted.actionItems.map(item => ({
        type: 'action_item' as const,
        content: item.owner ? `${item.task} (Owner: ${item.owner}${item.deadline ? ', by ' + item.deadline : ''})` : item.task,
        summary: item.task.slice(0, 80),
        sourceConversationTitle: title,
        sourceConversationDate: date,
        linkedProjectIds: [] as string[],
        linkedProjectNames: [] as string[],
        tags: ['action_item'],
        thesisPillars: [] as import('@/lib/types').ThesisPillar[],
        status: 'active' as const,
      }))
      const ids = await saveInsights(uid, actionInsights)
      linkedInsightIds.push(...ids)
      counts.insights += ids.length
    }

    // --- 2. Save template-specific insights ---
    if (extracted.insights && extracted.insights.length > 0) {
      const structuredInsights = extracted.insights.map(insight => {
        const linkedProjectNames = projectNames.filter(p =>
          insight.tags?.some(t => t.toLowerCase().includes(p.toLowerCase()))
        )
        const linkedProjectIds = linkedProjectNames
          .map(n => projectNameToId[n])
          .filter(Boolean)

        return {
          type: insight.type,
          content: insight.content,
          summary: insight.summary,
          sourceConversationTitle: title,
          sourceConversationDate: date,
          linkedProjectIds,
          linkedProjectNames,
          tags: insight.tags || [],
          thesisPillars: [] as import('@/lib/types').ThesisPillar[],
          status: 'active' as const,
        }
      })
      const ids = await saveInsights(uid, structuredInsights)
      linkedInsightIds.push(...ids)
      counts.insights += ids.length
    }

    // --- 3. Save hypotheses (research template) ---
    if (extracted.hypotheses && extracted.hypotheses.length > 0) {
      for (const h of extracted.hypotheses) {
        const id = await saveHypothesis(uid, {
          question: h.question,
          context: h.context,
          domain: h.domain,
          status: 'open',
          priority: h.priority,
          evidence: [],
          resolution: h.resolution || undefined,
          sourceType: 'transcript',
        })
        linkedHypothesisIds.push(id)
        counts.hypotheses++
      }
    }

    // --- 4. Save beliefs (research template) ---
    if (extracted.beliefs && extracted.beliefs.length > 0) {
      for (const b of extracted.beliefs) {
        const attentionDate = new Date()
        attentionDate.setDate(attentionDate.getDate() + 21)
        const id = await saveBelief(uid, {
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
        })
        linkedBeliefIds.push(id)
        counts.beliefs++
      }
    }

    // --- 5. Save decisions (partnership/investor/internal templates) ---
    if (extracted.decisions && extracted.decisions.length > 0) {
      for (const d of extracted.decisions) {
        const reviewDate = new Date()
        reviewDate.setDate(reviewDate.getDate() + 90)
        const id = await saveDecision(uid, {
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
        })
        linkedDecisionIds.push(id)
        counts.decisions++
      }
    }

    // --- 6. Save venture ideas (partnership template) ---
    if (extracted.ventureIdeas && extracted.ventureIdeas.length > 0) {
      for (const rawIdea of extracted.ventureIdeas) {
        try {
          const parsed = await parseVentureIdea(rawIdea, projectNames)
          const id = await saveVenture(uid, {
            rawInput: rawIdea,
            inputSource: 'dashboard',
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
            stage: 'idea',
            score: parsed.suggestedScore || 50,
          })
          linkedVentureIds.push(id)
          counts.ventures++
        } catch (err) {
          console.error('Failed to parse venture idea:', err)
        }
      }
    }

    // --- 7. Resolve and save contacts ---
    const allContactNames = [
      ...extracted.participants.map(name => ({ name, context: `Participant in: ${title}` })),
      ...extracted.contacts.filter(c =>
        !extracted.participants.includes(c.name)
      ),
    ]

    if (allContactNames.length > 0) {
      const resolved = await resolveContactsBatch(uid, allContactNames, 'transcript', date)
      await Promise.all(
        resolved.map(r =>
          addInteractionToContact(uid, r.contactId, {
            date,
            source: 'transcript',
            summary: `${templateType} call: ${title}`,
          })
        )
      )
      counts.contacts = resolved.length
    }

    // --- 8. Save conversation document (links all extracted content) ---
    const templateToConversationType: Record<TranscriptTemplateType, ConversationType> = {
      partnership: 'partnership',
      research: 'other',
      discovery: 'customer_discovery',
      investor: 'investor',
      advisor: 'advisor',
      internal: 'other',
      general: 'other',
    }

    const conversationId = await saveConversation(uid, {
      title,
      date,
      participants: extracted.participants,
      transcriptText,
      durationMinutes: 0,
      conversationType: templateToConversationType[templateType],
      processInsights: extracted.keyTakeaways,
      featureIdeas: [],
      actionItems: extracted.actionItems.map(a => a.task),
      valueSignals: [],
      aiProcessed: true,
      linkedSignalIds: [],
      linkedProjectId: undefined,
    })

    return NextResponse.json({
      success: true,
      conversationId,
      title,
      date,
      keyTakeaways: extracted.keyTakeaways,
      counts,
      alignmentAreas: extracted.alignmentAreas,
      dealPoints: extracted.dealPoints,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[transcripts/process] Error:', msg)
    return NextResponse.json({ error: 'Processing failed', detail: msg }, { status: 500 })
  }
}
