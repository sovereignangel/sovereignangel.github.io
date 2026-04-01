/**
 * Debug route — check recent transcript processing.
 * Shows latest conversations, transcript_drafts, and whether any
 * contain the relational keyword.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const LORDAS_PIN = process.env.LORDAS_PIN || '1234'

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

export async function GET(request: NextRequest) {
  const pin = request.nextUrl.searchParams.get('pin')
  if (pin !== LORDAS_PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ error: 'UID not configured' }, { status: 500 })
  }

  try {
    const db = await getAdminDb()
    const userRef = db.collection('users').doc(uid)

    // Check recent transcript_drafts (debug records from wave webhook)
    const draftsSnap = await userRef.collection('transcript_drafts')
      .orderBy('receivedAt', 'desc')
      .limit(5)
      .get()

    const drafts = draftsSnap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        text: data.text?.slice(0, 200),
        source: data.source,
        status: data.status,
        templateType: data.templateType,
        title: data.title,
        receivedAt: data.receivedAt?.toDate?.()?.toISOString() || data.receivedAt,
        processedAt: data.processedAt?.toDate?.()?.toISOString() || data.processedAt,
        error: data.error,
        metadata: data.metadata,
      }
    })

    // Check recent conversations
    const convsSnap = await userRef.collection('conversations')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()

    const conversations = convsSnap.docs.map(d => {
      const data = d.data()
      const transcript = data.transcriptText || ''
      const hasRelationalKeyword = /relational\s+transcript/i.test(transcript.slice(0, 500)) ||
        /relationship\s+transcript/i.test(transcript.slice(0, 500))
      return {
        id: d.id,
        title: data.title,
        date: data.date,
        type: data.conversationType,
        hasRelationalKeyword,
        transcriptPreview: transcript.slice(0, 300),
        waveSessionId: data.metadata?.waveSessionId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      }
    })

    // Check relationship_conversations
    const relConvsSnap = await userRef.collection('relationship_conversations')
      .orderBy('date', 'desc')
      .limit(5)
      .get()

    const relConversations = relConvsSnap.docs.map(d => ({
      id: d.id,
      date: d.data().date,
      scores: d.data().scores,
      triggerTopic: d.data().extraction?.triggerTopic,
    }))

    return NextResponse.json({
      uid,
      recentDrafts: drafts,
      recentConversations: conversations,
      relationshipConversations: relConversations,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
