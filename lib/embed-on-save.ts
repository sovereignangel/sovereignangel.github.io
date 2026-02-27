/**
 * Embed-on-save hook
 *
 * Called after saving documents to Firestore. Generates embeddings
 * and upserts to Pinecone with metadata for semantic search.
 *
 * Chunking strategy:
 *   - Conversations: Split by paragraph (~500 tokens each)
 *   - Everything else: Single chunk (journals, insights, decisions are short)
 */

import { generateEmbedding, generateEmbeddings } from './embeddings'
import { upsertVectors, deleteVectorsByDocId, vectorId, type VectorMetadata } from './vector'
import { normalizeName } from './entity-resolution'

// ─── TEXT CHUNKING ───────────────────────────────────────────────────

const MAX_CHUNK_CHARS = 2000  // ~500 tokens
const OVERLAP_CHARS = 200     // Context overlap between chunks

export function chunkText(text: string): string[] {
  if (!text || text.length <= MAX_CHUNK_CHARS) return [text].filter(Boolean)

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + MAX_CHUNK_CHARS

    // Try to break at paragraph boundary
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end)
      if (paragraphBreak > start + MAX_CHUNK_CHARS * 0.5) {
        end = paragraphBreak + 2
      } else {
        // Fall back to sentence boundary
        const sentenceBreak = text.lastIndexOf('. ', end)
        if (sentenceBreak > start + MAX_CHUNK_CHARS * 0.5) {
          end = sentenceBreak + 2
        }
      }
    }

    chunks.push(text.slice(start, Math.min(end, text.length)).trim())
    start = end - OVERLAP_CHARS
  }

  return chunks.filter(c => c.length > 20)
}

// ─── CONTACT NAME EXTRACTION ─────────────────────────────────────────

/** Extract potential contact names from resolved contact data */
function extractContactInfo(
  resolvedContacts?: { contactId: string; canonicalName: string }[]
): { contactNames: string[]; contactIds: string[] } {
  if (!resolvedContacts?.length) return { contactNames: [], contactIds: [] }
  return {
    contactNames: resolvedContacts.map(c => normalizeName(c.canonicalName)),
    contactIds: resolvedContacts.map(c => c.contactId),
  }
}

// ─── MAIN EMBED FUNCTION ─────────────────────────────────────────────

interface EmbedDocumentOptions {
  uid: string
  collection: string
  documentId: string
  text: string
  date: string
  sourceType: 'journal' | 'transcript' | 'note' | 'synthesis' | 'insight' | 'decision' | 'signal'
  resolvedContacts?: { contactId: string; canonicalName: string }[]
  projectNames?: string[]
  thesisPillars?: string[]
}

/**
 * Embed a document's text and upsert to Firestore vector search.
 * Handles chunking for long texts (transcripts).
 * Deletes old vectors before upserting (idempotent re-embed).
 */
export async function embedDocument(options: EmbedDocumentOptions): Promise<number> {
  const { uid, collection, documentId, text, date, sourceType, resolvedContacts, projectNames, thesisPillars } = options

  if (!text?.trim()) return 0

  // Graceful no-op if Gemini API key not configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[embed-on-save] GEMINI_API_KEY not set, skipping embedding')
    return 0
  }

  // Chunk the text
  const chunks = chunkText(text)
  if (chunks.length === 0) return 0

  // Delete old vectors for this document
  await deleteVectorsByDocId(uid, collection, documentId, chunks.length + 10)

  // Generate embeddings
  const embeddings = await generateEmbeddings(chunks)
  const { contactNames, contactIds } = extractContactInfo(resolvedContacts)

  // Build vectors with metadata
  const vectors = embeddings.map((values, i) => ({
    id: vectorId(uid, collection, documentId, i),
    values,
    metadata: {
      collection,
      documentId,
      chunkIndex: i,
      date,
      contactNames,
      contactIds,
      projectNames: projectNames || [],
      thesisPillars: thesisPillars || [],
      sourceType,
      textPreview: chunks[i].slice(0, 200),
      uid,
    } satisfies VectorMetadata,
  }))

  await upsertVectors(vectors)
  return chunks.length
}

// ─── CONVENIENCE WRAPPERS ─────────────────────────────────────────────

/** Embed a journal entry from daily log */
export async function embedJournalEntry(
  uid: string,
  date: string,
  journalText: string,
  resolvedContacts?: { contactId: string; canonicalName: string }[]
): Promise<number> {
  return embedDocument({
    uid,
    collection: 'daily_logs',
    documentId: date,
    text: journalText,
    date,
    sourceType: 'journal',
    resolvedContacts,
  })
}

/** Embed a conversation transcript (will be chunked) */
export async function embedConversation(
  uid: string,
  conversationId: string,
  transcriptText: string,
  date: string,
  resolvedContacts?: { contactId: string; canonicalName: string }[],
  projectNames?: string[],
  thesisPillars?: string[]
): Promise<number> {
  return embedDocument({
    uid,
    collection: 'conversations',
    documentId: conversationId,
    text: transcriptText,
    date,
    sourceType: 'transcript',
    resolvedContacts,
    projectNames,
    thesisPillars,
  })
}

/** Embed an insight */
export async function embedInsight(
  uid: string,
  insightId: string,
  content: string,
  date: string,
  thesisPillars?: string[],
  projectNames?: string[]
): Promise<number> {
  return embedDocument({
    uid,
    collection: 'insights',
    documentId: insightId,
    text: content,
    date,
    sourceType: 'insight',
    thesisPillars,
    projectNames,
  })
}
