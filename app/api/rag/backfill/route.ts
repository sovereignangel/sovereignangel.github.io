import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { embedDocument } from '@/lib/embed-on-save'

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

/**
 * POST /api/rag/backfill
 *
 * Backfills existing Firestore documents into the vector index.
 * Idempotent — safe to re-run (old vectors are replaced on each embed).
 *
 * Body: { "collection": "daily_logs" | "conversations" | "insights" | "all" }
 * Response: { success, embedded, skipped, errors }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  const { collection = 'all' } = body

  const uid = auth.uid
  const adminDb = await getAdminDb()

  let embedded = 0
  let skipped = 0
  const errors: string[] = []

  async function backfillCollection(col: string) {
    const snap = await adminDb.collection('users').doc(uid).collection(col).get()
    for (const doc of snap.docs) {
      try {
        const data = doc.data()
        let text = ''
        let date = ''
        let sourceType: 'journal' | 'transcript' | 'insight' = 'journal'

        if (col === 'daily_logs') {
          text = data.journalEntry || ''
          date = doc.id // YYYY-MM-DD
          sourceType = 'journal'
        } else if (col === 'conversations') {
          text = data.transcript || data.rawInput || data.summary || ''
          date = data.date || data.createdAt?.toDate?.()?.toISOString?.()?.slice(0, 10) || new Date().toISOString().slice(0, 10)
          sourceType = 'transcript'
        } else if (col === 'insights') {
          text = data.content || data.summary || ''
          date = data.date || data.createdAt?.toDate?.()?.toISOString?.()?.slice(0, 10) || new Date().toISOString().slice(0, 10)
          sourceType = 'insight'
        }

        if (!text.trim()) {
          skipped++
          continue
        }

        const chunks = await embedDocument({
          uid,
          collection: col,
          documentId: doc.id,
          text,
          date,
          sourceType,
          thesisPillars: data.thesisPillars || [],
          projectNames: data.linkedProjectNames || [],
        })

        if (chunks > 0) embedded++
        else skipped++
      } catch (err) {
        errors.push(`${col}/${doc.id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  const collections = collection === 'all'
    ? ['daily_logs', 'conversations', 'insights']
    : [collection]

  for (const col of collections) {
    await backfillCollection(col)
  }

  return NextResponse.json({
    success: true,
    collection,
    embedded,
    skipped,
    errors,
  })
}
