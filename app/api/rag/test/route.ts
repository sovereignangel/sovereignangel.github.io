import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

/**
 * GET /api/rag/test
 *
 * End-to-end test of the RAG pipeline:
 *   1. Gemini embeddings
 *   2. Firestore vector write
 *   3. findNearest query
 *   4. Data inventory (how much exists to backfill)
 *
 * Returns a JSON report. Safe to re-run — cleans up after itself.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const uid = auth.uid
  const report: Record<string, unknown> = {}
  const errors: string[] = []

  // ── 1. Embeddings ──────────────────────────────────────────────────
  let embedding: number[] = []
  try {
    const { generateEmbedding } = await import('@/lib/embeddings')
    const testText = 'Had a conversation about infrastructure pain points and data pipeline challenges'
    embedding = await generateEmbedding(testText)
    report.embeddings = {
      status: 'ok',
      dimensions: embedding.length,
      sample: embedding.slice(0, 3).map(v => Math.round(v * 10000) / 10000),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    report.embeddings = { status: 'error', error: msg }
    errors.push(`embeddings: ${msg}`)
  }

  // ── 2. Firestore vector write ──────────────────────────────────────
  if (embedding.length > 0) {
    try {
      const { upsertVectors } = await import('@/lib/vector')
      const testId = 'test::rag-test::chunk0'
      await upsertVectors([{
        id: testId,
        values: embedding,
        metadata: {
          collection: 'test',
          documentId: 'rag-test',
          chunkIndex: 0,
          date: new Date().toISOString().slice(0, 10),
          contactNames: [],
          contactIds: [],
          projectNames: [],
          thesisPillars: [],
          sourceType: 'journal',
          textPreview: 'Test vector: infrastructure pain points and data pipeline challenges',
          uid,
        },
      }])
      report.vectorWrite = { status: 'ok', docPath: `users/${uid}/vectors/${testId}` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      report.vectorWrite = { status: 'error', error: msg }
      errors.push(`vectorWrite: ${msg}`)
    }
  }

  // ── 3. Vector query (findNearest) ──────────────────────────────────
  if (embedding.length > 0) {
    try {
      const { generateEmbedding } = await import('@/lib/embeddings')
      const { queryVectors } = await import('@/lib/vector')
      const queryEmbedding = await generateEmbedding('infrastructure problems data pipeline')
      const results = await queryVectors(queryEmbedding, 5, { uid })
      const testFound = results.some(r => r.id === 'test::rag-test::chunk0')
      report.vectorQuery = {
        status: results.length > 0 ? 'ok' : 'no_results',
        resultCount: results.length,
        testVectorFound: testFound,
        topResult: results[0] ? {
          score: Math.round(results[0].score * 1000) / 1000,
          collection: results[0].metadata.collection,
          preview: results[0].metadata.textPreview,
        } : null,
        note: results.length === 0
          ? 'No results — create vector index in Firebase Console: Firestore → Indexes → Add vector index (collection: vectors, field: embedding, dim: 768, COSINE)'
          : undefined,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isIndexError = msg.toLowerCase().includes('index') || msg.toLowerCase().includes('failed-precondition')
      report.vectorQuery = {
        status: 'error',
        error: msg,
        note: isIndexError
          ? 'Vector index missing — create it in Firebase Console: Firestore → Indexes → Add vector index (collection: vectors, field: embedding, dim: 768, COSINE)'
          : undefined,
      }
      errors.push(`vectorQuery: ${msg}`)
    }

    // Clean up test vector
    try {
      const { deleteVectorsByDocId } = await import('@/lib/vector')
      await deleteVectorsByDocId(uid, 'test', 'rag-test')
    } catch { /* non-fatal */ }
  }

  // ── 4. Data inventory ─────────────────────────────────────────────
  try {
    const { adminDb } = await import('@/lib/firebase-admin')
    const userRef = adminDb.collection('users').doc(uid)
    const [logsSnap, convsSnap, insightsSnap, contactsSnap, networkSnap, vectorsSnap] = await Promise.all([
      userRef.collection('daily_logs').limit(500).get(),
      userRef.collection('conversations').limit(500).get(),
      userRef.collection('insights').limit(500).get(),
      userRef.collection('contacts').limit(500).get(),
      userRef.collection('network_contacts').limit(500).get(),
      userRef.collection('vectors').limit(500).get(),
    ])
    const logsWithJournal = logsSnap.docs.filter(d => d.data().journalEntry?.trim()).length
    report.dataInventory = {
      daily_logs_total: logsSnap.size,
      daily_logs_with_journal: logsWithJournal,
      conversations: convsSnap.size,
      insights: insightsSnap.size,
      contacts: contactsSnap.size,
      network_contacts: networkSnap.size,
      vectors_indexed: vectorsSnap.size,
      toBackfill: logsWithJournal + convsSnap.size + insightsSnap.size,
    }
  } catch (err) {
    report.dataInventory = { status: 'error', error: err instanceof Error ? err.message : String(err) }
  }

  // ── Result ────────────────────────────────────────────────────────
  const allOk = errors.length === 0
  return NextResponse.json({
    success: allOk,
    errors: errors.length > 0 ? errors : undefined,
    report,
    nextSteps: allOk
      ? [
          'POST /api/contacts/migrate — merge contacts + network_contacts into unified_contacts',
          'POST /api/rag/backfill {"collection":"all"} — embed all journal entries, conversations, insights',
          'POST /api/rag/query {"query":"..."} — test semantic search',
        ]
      : [
          'Fix errors above, then re-run this test',
        ],
  }, { status: allOk ? 200 : 500 })
}
