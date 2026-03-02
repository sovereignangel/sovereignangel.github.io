import { NextRequest, NextResponse } from 'next/server'
import { extractInsightsV2 } from '@/lib/ai-extraction'
import { saveConversation, saveInsights, saveMacroPattern, addInteractionToContact } from '@/lib/firestore'
import { ConversationType } from '@/lib/types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth } from '@/lib/api-auth'
import { resolveContactsBatch } from '@/lib/entity-resolution'
import { embedConversation, embedInsight } from '@/lib/embed-on-save'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const uid = auth.uid
    const {
      title,
      date,
      participants,
      conversationType,
      transcriptText,
      linkedProjectId,
      projectNames,
      projectNameToId,
    } = body

    if (!uid || !title || !transcriptText || !participants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const activeProjectNames: string[] = projectNames || []
    const nameToIdMap: Record<string, string> = projectNameToId || {}

    // Extract insights with Gemini V2 (server-side with API key)
    const insights = await extractInsightsV2(
      transcriptText,
      conversationType,
      participants,
      activeProjectNames
    )

    // Resolve participants + AI-suggested contacts via entity resolution
    const allContactNames = [
      ...participants.map((name: string) => ({ name, context: `Participant in conversation: ${title}` })),
      ...(insights.suggestedContacts || [])
        .filter((name: string) => !participants.includes(name))
        .map((name: string) => ({ name, context: `Mentioned in conversation: ${title}` })),
    ]
    const resolvedContacts = await resolveContactsBatch(uid, allContactNames, 'transcript', date)

    // Log interactions on resolved contacts
    for (let i = 0; i < resolvedContacts.length; i++) {
      await addInteractionToContact(uid, resolvedContacts[i].contactId, {
        date,
        source: 'transcript',
        summary: allContactNames[i].context,
      })
    }

    // Save conversation with legacy insight arrays
    const conversationData = {
      title,
      date,
      participants,
      transcriptText,
      durationMinutes: 0,
      conversationType: conversationType as ConversationType,
      processInsights: insights.processInsights,
      featureIdeas: insights.featureIdeas,
      actionItems: insights.actionItems,
      valueSignals: insights.valueSignals,
      aiProcessed: true,
      aiProcessedAt: Timestamp.now(),
      linkedSignalIds: [],
      ...(linkedProjectId && { linkedProjectId }),
    }

    const conversationId = await saveConversation(uid, conversationData)

    // Batch-write structured insights to the insights collection
    let insightIds: string[] = []
    if (insights.structuredInsights.length > 0) {
      const insightDocs = insights.structuredInsights.map(si => {
        // Resolve project names to IDs (case-insensitive)
        const linkedProjectIds: string[] = []
        const linkedProjectNames: string[] = []
        for (const name of si.linkedProjectNames) {
          const lowerName = name.toLowerCase()
          const matchedKey = Object.keys(nameToIdMap).find(
            k => k.toLowerCase() === lowerName
          )
          if (matchedKey) {
            linkedProjectIds.push(nameToIdMap[matchedKey])
            linkedProjectNames.push(matchedKey)
          }
        }

        return {
          type: si.type,
          content: si.content,
          summary: si.summary,
          sourceConversationId: conversationId,
          sourceConversationTitle: title,
          sourceConversationDate: date,
          linkedProjectIds,
          linkedProjectNames,
          tags: si.tags,
          thesisPillars: si.thesisPillars,
          status: 'active' as const,
        }
      })

      insightIds = await saveInsights(uid, insightDocs)
    }

    // Save macro patterns
    const macroPatternIds: string[] = []
    for (const mp of insights.macroPatterns) {
      const projectIds: string[] = []
      const projectNames: string[] = []
      for (const name of mp.relatedProjectNames) {
        const lowerName = name.toLowerCase()
        const matchedKey = Object.keys(nameToIdMap).find(
          k => k.toLowerCase() === lowerName
        )
        if (matchedKey) {
          projectIds.push(nameToIdMap[matchedKey])
          projectNames.push(matchedKey)
        }
      }

      const patternId = await saveMacroPattern(uid, {
        pattern: mp.pattern,
        supportingInsightIds: insightIds,
        supportingConversationIds: [conversationId],
        projectIds,
        projectNames,
        confidence: mp.confidence,
      })
      macroPatternIds.push(patternId)
    }

    // Embed conversation transcript and insights into vector index
    const resolvedContactInfo = resolvedContacts.map(r => ({
      contactId: r.contactId,
      canonicalName: r.contact.canonicalName,
    }))
    embedConversation(uid, conversationId, transcriptText, date, resolvedContactInfo, activeProjectNames).catch(
      err => console.error('[embed] conversation embedding failed:', err)
    )
    for (let i = 0; i < insightIds.length; i++) {
      const si = insights.structuredInsights[i]
      if (si) {
        embedInsight(uid, insightIds[i], si.content, date, si.thesisPillars, si.linkedProjectNames).catch(
          err => console.error('[embed] insight embedding failed:', err)
        )
      }
    }

    return NextResponse.json({
      success: true,
      conversationId,
      insights,
      structuredInsights: insights.structuredInsights,
      macroPatterns: insights.macroPatterns,
    })
  } catch (error) {
    console.error('Error processing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to process conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
