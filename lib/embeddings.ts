/**
 * Embedding generation using Gemini text-embedding-004
 *
 * Reuses existing @google/generative-ai package (already installed).
 * 768-dimensional embeddings at ~$0.006/1M tokens (generous free tier).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_NAME = 'text-embedding-004'
const EMBEDDING_DIMENSIONS = 768

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('[Embeddings] GEMINI_API_KEY not set')
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Generate a single embedding for a text string.
 * Returns a 768-dimensional float array.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: MODEL_NAME })
  const result = await model.embedContent(text)
  return result.embedding.values
}

/**
 * Generate embeddings for multiple texts in a batch.
 * Uses batchEmbedContents for efficiency.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  if (texts.length === 1) return [await generateEmbedding(texts[0])]

  const model = getGenAI().getGenerativeModel({ model: MODEL_NAME })
  const result = await model.batchEmbedContents({
    requests: texts.map(text => ({
      content: { role: 'user', parts: [{ text }] },
    })),
  })

  return result.embeddings.map(e => e.values)
}

export { EMBEDDING_DIMENSIONS }
