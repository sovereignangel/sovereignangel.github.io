/**
 * Vector search using Firestore's built-in findNearest()
 *
 * Zero external services — vectors are stored alongside metadata
 * in Firestore, using the native KNN vector search.
 *
 * Collection: users/{uid}/vectors/{vectorDocId}
 * Requires composite vector index on the 'embedding' field.
 *
 * Setup: Deploy the vector index via Firebase CLI:
 *   firebase deploy --only firestore:indexes
 *
 * Or create manually in Firebase Console → Firestore → Indexes:
 *   Collection: vectors (collection group)
 *   Fields: embedding (Vector Config: 768 dims, COSINE)
 */

import { FieldValue } from 'firebase-admin/firestore'

// ─── TYPES ───────────────────────────────────────────────────────────

export interface VectorMetadata {
  collection: string       // 'daily_logs', 'conversations', etc.
  documentId: string       // Firestore document ID
  chunkIndex: number       // For multi-chunk documents (transcripts)
  date: string             // YYYY-MM-DD
  contactNames: string[]   // Normalized names mentioned
  contactIds: string[]     // Resolved UnifiedContact IDs
  projectNames: string[]
  thesisPillars: string[]
  sourceType: string       // 'journal', 'transcript', 'note', 'synthesis'
  textPreview: string      // First 200 chars for display
  uid: string              // User ID (for multi-user scoping)
}

export interface VectorSearchResult {
  id: string
  score: number
  metadata: VectorMetadata
}

export interface VectorSearchFilters {
  collection?: string
  contactName?: string     // Searches contactNames array
  contactId?: string       // Searches contactIds array
  dateAfter?: string       // YYYY-MM-DD
  dateBefore?: string      // YYYY-MM-DD
  pillar?: string          // Searches thesisPillars array
  sourceType?: string
  uid: string              // Required: scope to user
}

// ─── ADMIN DB ACCESS ─────────────────────────────────────────────────

async function getAdminDb() {
  const { adminDb } = await import('./firebase-admin')
  return adminDb
}

// ─── VECTOR ID GENERATION ────────────────────────────────────────────

/** Deterministic vector doc ID: collection::docId::chunkN */
export function vectorId(uid: string, collection: string, documentId: string, chunkIndex: number): string {
  return `${collection}::${documentId}::chunk${chunkIndex}`
}

// ─── UPSERT ──────────────────────────────────────────────────────────

export async function upsertVectors(
  vectors: { id: string; values: number[]; metadata: VectorMetadata }[]
): Promise<void> {
  if (vectors.length === 0) return
  const db = await getAdminDb()

  // Firestore batch write limit is 500
  const BATCH_SIZE = 500
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = db.batch()
    const chunk = vectors.slice(i, i + BATCH_SIZE)

    for (const vec of chunk) {
      const ref = db.collection('users').doc(vec.metadata.uid).collection('vectors').doc(vec.id)
      batch.set(ref, {
        embedding: FieldValue.vector(vec.values),
        ...vec.metadata,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()
  }
}

// ─── QUERY ───────────────────────────────────────────────────────────

export async function queryVectors(
  embedding: number[],
  topK: number,
  filters: VectorSearchFilters
): Promise<VectorSearchResult[]> {
  const db = await getAdminDb()

  // Start with user-scoped collection
  let baseQuery = db.collection('users').doc(filters.uid).collection('vectors') as FirebaseFirestore.Query

  // Pre-filter by collection (equality — works with vector index)
  if (filters.collection) {
    baseQuery = baseQuery.where('collection', '==', filters.collection)
  }

  // Pre-filter by sourceType
  if (filters.sourceType) {
    baseQuery = baseQuery.where('sourceType', '==', filters.sourceType)
  }

  // Run vector search
  // Request extra results to allow for post-filtering
  const postFilterNeeded = !!(filters.contactName || filters.contactId || filters.dateAfter || filters.dateBefore || filters.pillar)
  const requestLimit = postFilterNeeded ? Math.min(topK * 3, 1000) : topK

  const vectorQuery = baseQuery.findNearest({
    vectorField: 'embedding',
    queryVector: embedding,
    limit: requestLimit,
    distanceMeasure: 'COSINE',
    distanceResultField: 'distance',
  })

  const snapshot = await vectorQuery.get()

  let results: VectorSearchResult[] = snapshot.docs.map(doc => {
    const data = doc.data()
    // Cosine distance: 0 = identical, 2 = opposite. Convert to similarity score (1 = identical, 0 = orthogonal)
    const distance = data.distance ?? 1
    const score = 1 - distance

    return {
      id: doc.id,
      score,
      metadata: {
        collection: data.collection,
        documentId: data.documentId,
        chunkIndex: data.chunkIndex,
        date: data.date,
        contactNames: data.contactNames || [],
        contactIds: data.contactIds || [],
        projectNames: data.projectNames || [],
        thesisPillars: data.thesisPillars || [],
        sourceType: data.sourceType,
        textPreview: data.textPreview,
        uid: data.uid,
      },
    }
  })

  // Post-filter for fields that can't be efficiently pre-filtered with vector indexes
  if (filters.contactName) {
    results = results.filter(r => r.metadata.contactNames.includes(filters.contactName!))
  }
  if (filters.contactId) {
    results = results.filter(r => r.metadata.contactIds.includes(filters.contactId!))
  }
  if (filters.dateAfter) {
    results = results.filter(r => r.metadata.date >= filters.dateAfter!)
  }
  if (filters.dateBefore) {
    results = results.filter(r => r.metadata.date <= filters.dateBefore!)
  }
  if (filters.pillar) {
    results = results.filter(r => r.metadata.thesisPillars.includes(filters.pillar!))
  }

  return results.slice(0, topK)
}

// ─── DELETE ──────────────────────────────────────────────────────────

/** Delete all chunks for a specific document (before re-embedding) */
export async function deleteVectorsByDocId(
  uid: string,
  collection: string,
  documentId: string,
  maxChunks: number = 100
): Promise<void> {
  const db = await getAdminDb()
  const batch = db.batch()

  for (let i = 0; i < maxChunks; i++) {
    const id = vectorId(uid, collection, documentId, i)
    const ref = db.collection('users').doc(uid).collection('vectors').doc(id)
    batch.delete(ref)
  }

  // Firestore batch delete silently ignores non-existent docs
  await batch.commit()
}
