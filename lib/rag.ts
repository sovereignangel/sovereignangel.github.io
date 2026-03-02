/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Semantic search → context assembly → LLM synthesis.
 * Powers: natural language Q&A, contact briefs ("baseball cards"),
 * and pattern detection across the knowledge corpus.
 */

import { generateEmbedding } from './embeddings'
import { queryVectors, type VectorSearchFilters, type VectorSearchResult } from './vector'
import { getUnifiedContact } from './firestore'
import { callLLM } from './llm'
import type { UnifiedContact } from './types'

// ─── RAG QUERY ───────────────────────────────────────────────────────

export interface RAGQueryOptions {
  uid: string
  query: string
  filters?: Omit<VectorSearchFilters, 'uid'>
  topK?: number
  synthesize?: boolean  // If true, pass results to LLM for answer synthesis
}

export interface RAGQueryResult {
  answer?: string                    // LLM-synthesized answer (if synthesize=true)
  chunks: VectorSearchResult[]       // Raw search results
  sourcesUsed: number
}

/**
 * Full RAG pipeline: embed query → search vectors → optionally synthesize answer.
 */
export async function ragQuery(options: RAGQueryOptions): Promise<RAGQueryResult> {
  const { uid, query, filters = {}, topK = 10, synthesize = true } = options

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)

  // Search vectors
  const chunks = await queryVectors(queryEmbedding, topK, { ...filters, uid })

  if (!synthesize || chunks.length === 0) {
    return { chunks, sourcesUsed: chunks.length }
  }

  // Build context from search results
  const contextBlocks = chunks.map((c, i) =>
    `[Source ${i + 1} — ${c.metadata.collection} from ${c.metadata.date}, relevance: ${(c.score * 100).toFixed(0)}%]\n${c.metadata.textPreview}`
  ).join('\n\n')

  // Synthesize answer
  const prompt = `You are a personal intelligence assistant. Answer the user's question using ONLY the context below. If the context doesn't contain enough information, say so honestly. Be specific and cite dates/sources.

Context:
${contextBlocks}

Question: ${query}

Answer concisely (2-4 sentences). Reference specific dates and sources when possible.`

  const answer = await callLLM(prompt, { temperature: 0.3, maxTokens: 500 })

  return { answer, chunks, sourcesUsed: chunks.length }
}

// ─── CONTACT BRIEF ("BASEBALL CARD") ──────────────────────────────────

export interface ContactBrief {
  contact: UnifiedContact
  // Structured sections
  relationshipTrajectory: string
  keyContext: string
  recentInteractions: string
  openCommitments: string
  suggestedApproach: string
  dalioPattern: {
    reliability: number    // 1-5
    openness: number       // 1-5
    valueFlow: number      // 1-5
  }
  sourcesUsed: number
}

/**
 * Generate a Bridgewater-style "baseball card" for a contact.
 *
 * 1. Load structured data from UnifiedContact
 * 2. Vector search for all chunks mentioning this contact
 * 3. Synthesize into brief sections via LLM
 */
export async function generateContactBrief(uid: string, contactId: string): Promise<ContactBrief | null> {
  const contact = await getUnifiedContact(uid, contactId)
  if (!contact) return null

  // Search for all chunks mentioning this contact
  const dummyEmbedding = await generateEmbedding(
    `${contact.canonicalName} relationship context interactions`
  )
  const chunks = await queryVectors(dummyEmbedding, 30, {
    uid,
    contactId,
  })

  // If no vector results, fall back to search by name
  let allChunks = chunks
  if (chunks.length < 3) {
    const nameChunks = await queryVectors(
      await generateEmbedding(contact.canonicalName),
      20,
      { uid, contactName: contact.normalizedName }
    )
    // Deduplicate
    const existingIds = new Set(chunks.map(c => c.id))
    const newChunks = nameChunks.filter(c => !existingIds.has(c.id))
    allChunks = [...chunks, ...newChunks].slice(0, 30)
  }

  // Build context from structured data + vector results
  const structuredContext = [
    `Name: ${contact.canonicalName}`,
    contact.company ? `Company: ${contact.company}` : '',
    contact.role ? `Role: ${contact.role}` : '',
    `Tier: ${contact.tier}, Trust Stage: ${contact.trustStage}/6, Strength: ${contact.relationshipStrength}/10`,
    contact.whatTheyControl ? `Controls: ${contact.whatTheyControl}` : '',
    contact.yourValueToThem ? `Your value to them: ${contact.yourValueToThem}` : '',
    contact.nextAction ? `Next action: ${contact.nextAction}` : '',
    contact.painPoints?.length ? `Known pain points: ${contact.painPoints.join(', ')}` : '',
    contact.topics?.length ? `Topics discussed: ${contact.topics.join(', ')}` : '',
    `Interactions: ${contact.interactionCount || 0} total, last touch: ${contact.lastTouchDate}`,
    contact.warmIntrosGenerated ? `Warm intros generated: ${contact.warmIntrosGenerated}` : '',
  ].filter(Boolean).join('\n')

  const interactionHistory = (contact.interactions || []).slice(0, 10)
    .map(i => `[${i.date}] (${i.source}) ${i.summary}`)
    .join('\n')

  const vectorContext = allChunks.map((c, i) =>
    `[${c.metadata.date} — ${c.metadata.collection}] ${c.metadata.textPreview}`
  ).join('\n')

  const prompt = `You are generating a relationship intelligence brief (Bridgewater "baseball card" style).

STRUCTURED DATA:
${structuredContext}

INTERACTION HISTORY:
${interactionHistory || 'No logged interactions yet.'}

SEMANTIC CONTEXT (from journals, transcripts, notes):
${vectorContext || 'No vector context available yet.'}

Generate a brief with these EXACT sections. Be specific, cite dates. If data is limited, say so.

1. RELATIONSHIP TRAJECTORY (1-2 sentences: how relationship has evolved, direction)
2. KEY CONTEXT (2-3 bullets: their pain points, opportunities, what matters to them)
3. RECENT INTERACTIONS (last 3 touchpoints, 1 line each)
4. OPEN COMMITMENTS (any promises made by either side)
5. SUGGESTED APPROACH (1-2 sentences: how to approach next interaction based on their personality/needs)
6. DALIO PATTERN (rate 1-5 each):
   - Reliability: (do they follow through?)
   - Openness: (do they share real problems?)
   - Value Flow: (is value exchange mutual?)

Reply as JSON:
{
  "relationshipTrajectory": "...",
  "keyContext": "...",
  "recentInteractions": "...",
  "openCommitments": "...",
  "suggestedApproach": "...",
  "dalioPattern": { "reliability": N, "openness": N, "valueFlow": N }
}`

  try {
    const response = await callLLM(prompt, { temperature: 0.3, maxTokens: 1500 })
    const cleaned = response.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      contact,
      relationshipTrajectory: parsed.relationshipTrajectory || '',
      keyContext: parsed.keyContext || '',
      recentInteractions: parsed.recentInteractions || '',
      openCommitments: parsed.openCommitments || '',
      suggestedApproach: parsed.suggestedApproach || '',
      dalioPattern: {
        reliability: Math.min(5, Math.max(1, parsed.dalioPattern?.reliability || 3)),
        openness: Math.min(5, Math.max(1, parsed.dalioPattern?.openness || 3)),
        valueFlow: Math.min(5, Math.max(1, parsed.dalioPattern?.valueFlow || 3)),
      },
      sourcesUsed: allChunks.length,
    }
  } catch (error) {
    console.error('[RAG] Contact brief generation failed:', error)
    // Return minimal brief with just structured data
    return {
      contact,
      relationshipTrajectory: 'Unable to generate — insufficient data.',
      keyContext: contact.painPoints?.join(', ') || 'No key context captured yet.',
      recentInteractions: interactionHistory || 'No interactions logged.',
      openCommitments: contact.nextAction || 'None tracked.',
      suggestedApproach: 'Build relationship with value delivery first.',
      dalioPattern: { reliability: 3, openness: 3, valueFlow: 3 },
      sourcesUsed: allChunks.length,
    }
  }
}
