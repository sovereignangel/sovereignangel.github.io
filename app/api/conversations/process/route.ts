import { NextRequest, NextResponse } from 'next/server'
import { extractInsightsFromTranscript } from '@/lib/ai-extraction'
import { saveConversation, saveContact, getContactByName } from '@/lib/firestore'
import { ConversationType } from '@/lib/types'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      uid,
      title,
      date,
      participants,
      conversationType,
      transcriptText,
      linkedProjectId,
    } = body

    if (!uid || !title || !transcriptText || !participants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract insights with Gemini (server-side with API key)
    const insights = await extractInsightsFromTranscript(
      transcriptText,
      conversationType,
      participants
    )

    // Create/update contacts for participants
    for (const name of participants) {
      const existing = await getContactByName(uid, name)
      if (existing) {
        // Update last conversation date
        await saveContact(uid, {
          ...existing,
          lastConversationDate: date,
        })
      } else {
        // Create new contact
        await saveContact(uid, {
          name,
          lastConversationDate: date,
          notes: '',
        })
      }
    }

    // Save conversation with extracted insights
    // Fix: Use null instead of undefined for optional fields
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
      ...(linkedProjectId && { linkedProjectId }), // Only add if not empty
    }

    const conversationId = await saveConversation(uid, conversationData)

    return NextResponse.json({
      success: true,
      conversationId,
      insights,
    })
  } catch (error) {
    console.error('Error processing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to process conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
