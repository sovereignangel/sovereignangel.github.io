import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { generateEmbedding } from '@/lib/embeddings'
import { queryVectors, type VectorSearchFilters } from '@/lib/vector'

/**
 * POST /api/rag/query
 *
 * Semantic search across embedded documents.
 *
 * Body: {
 *   query: string                    // Natural language query
 *   filters?: {
 *     collection?: string            // 'daily_logs', 'conversations', etc.
 *     contactName?: string           // Filter by normalized contact name
 *     contactId?: string             // Filter by contact ID
 *     dateAfter?: string             // YYYY-MM-DD
 *     dateBefore?: string            // YYYY-MM-DD
 *     pillar?: string                // 'ai', 'markets', 'mind'
 *     sourceType?: string            // 'journal', 'transcript', etc.
 *   }
 *   topK?: number                    // Default 10, max 50
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { query, filters = {}, topK = 10 } = body

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }

    const clampedTopK = Math.min(Math.max(topK, 1), 50)

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Search Pinecone with metadata filters
    const searchFilters: VectorSearchFilters = {
      ...filters,
      uid: auth.uid,
    }

    const results = await queryVectors(queryEmbedding, clampedTopK, searchFilters)

    return NextResponse.json({
      success: true,
      query,
      results: results.map(r => ({
        score: r.score,
        collection: r.metadata.collection,
        documentId: r.metadata.documentId,
        chunkIndex: r.metadata.chunkIndex,
        date: r.metadata.date,
        sourceType: r.metadata.sourceType,
        contactNames: r.metadata.contactNames,
        projectNames: r.metadata.projectNames,
        textPreview: r.metadata.textPreview,
      })),
      count: results.length,
    })
  } catch (error) {
    console.error('Error in RAG query:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
