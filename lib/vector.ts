/**
 * Pinecone vector database client
 *
 * Wraps the Pinecone Serverless SDK for:
 *   - Upserting embedded document chunks
 *   - Semantic search with metadata filtering
 *   - Cleanup when documents are re-embedded
 *
 * Free tier: 2 billion vectors, 5 GB storage.
 */

import { Pinecone, type RecordMetadata } from '@pinecone-database/pinecone'

// ─── TYPES ───────────────────────────────────────────────────────────

export interface VectorMetadata extends RecordMetadata {
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

// ─── CLIENT ──────────────────────────────────────────────────────────

let pineconeClient: Pinecone | null = null

function getPinecone(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY
    if (!apiKey) throw new Error('[Vector] PINECONE_API_KEY not set')
    pineconeClient = new Pinecone({ apiKey })
  }
  return pineconeClient
}

function getIndex() {
  const indexName = process.env.PINECONE_INDEX || 'thesis-engine'
  return getPinecone().index<VectorMetadata>(indexName)
}

// ─── VECTOR ID GENERATION ────────────────────────────────────────────

/** Deterministic vector ID: uid::collection::docId::chunkN */
export function vectorId(uid: string, collection: string, documentId: string, chunkIndex: number): string {
  return `${uid}::${collection}::${documentId}::chunk${chunkIndex}`
}

// ─── UPSERT ──────────────────────────────────────────────────────────

export async function upsertVectors(
  vectors: { id: string; values: number[]; metadata: VectorMetadata }[]
): Promise<void> {
  if (vectors.length === 0) return
  const index = getIndex()

  // Pinecone max batch size is 100
  const BATCH_SIZE = 100
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE)
    await index.upsert({ records: batch })
  }
}

// ─── QUERY ───────────────────────────────────────────────────────────

export async function queryVectors(
  embedding: number[],
  topK: number,
  filters: VectorSearchFilters
): Promise<VectorSearchResult[]> {
  const index = getIndex()

  // Build Pinecone metadata filter
  const filterConditions: Record<string, unknown> = {
    uid: { $eq: filters.uid },
  }

  if (filters.collection) {
    filterConditions.collection = { $eq: filters.collection }
  }
  if (filters.contactName) {
    filterConditions.contactNames = { $in: [filters.contactName] }
  }
  if (filters.contactId) {
    filterConditions.contactIds = { $in: [filters.contactId] }
  }
  if (filters.pillar) {
    filterConditions.thesisPillars = { $in: [filters.pillar] }
  }
  if (filters.sourceType) {
    filterConditions.sourceType = { $eq: filters.sourceType }
  }
  if (filters.dateAfter) {
    filterConditions.date = { ...(filterConditions.date as Record<string, unknown> || {}), $gte: filters.dateAfter }
  }
  if (filters.dateBefore) {
    filterConditions.date = { ...(filterConditions.date as Record<string, unknown> || {}), $lte: filters.dateBefore }
  }

  const result = await index.query({
    vector: embedding,
    topK,
    filter: filterConditions,
    includeMetadata: true,
  })

  return (result.matches || []).map(m => ({
    id: m.id,
    score: m.score ?? 0,
    metadata: m.metadata as VectorMetadata,
  }))
}

// ─── DELETE ──────────────────────────────────────────────────────────

/** Delete all chunks for a specific document (before re-embedding) */
export async function deleteVectorsByDocId(
  uid: string,
  collection: string,
  documentId: string,
  maxChunks: number = 100
): Promise<void> {
  const index = getIndex()
  const ids = Array.from({ length: maxChunks }, (_, i) => vectorId(uid, collection, documentId, i))
  // Pinecone ignores IDs that don't exist, so this is safe
  await index.deleteMany({ ids })
}
