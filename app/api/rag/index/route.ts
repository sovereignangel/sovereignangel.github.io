import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { embedDocument } from '@/lib/embed-on-save'

/**
 * POST /api/rag/index
 *
 * Manually embed/re-embed a document in the vector index.
 *
 * Body: {
 *   collection: string     // Firestore collection name
 *   documentId: string     // Document ID
 *   text: string           // Full text to embed
 *   date: string           // YYYY-MM-DD
 *   sourceType: string     // 'journal', 'transcript', 'insight', etc.
 *   resolvedContacts?: { contactId: string; canonicalName: string }[]
 *   projectNames?: string[]
 *   thesisPillars?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { collection, documentId, text, date, sourceType, resolvedContacts, projectNames, thesisPillars } = body

    if (!collection || !documentId || !text || !date || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: collection, documentId, text, date, sourceType' },
        { status: 400 }
      )
    }

    const chunksEmbedded = await embedDocument({
      uid: auth.uid,
      collection,
      documentId,
      text,
      date,
      sourceType,
      resolvedContacts,
      projectNames,
      thesisPillars,
    })

    return NextResponse.json({
      success: true,
      chunksEmbedded,
      collection,
      documentId,
    })
  } catch (error) {
    console.error('Error indexing document:', error)
    return NextResponse.json(
      { error: 'Indexing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
