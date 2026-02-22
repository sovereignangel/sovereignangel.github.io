/**
 * Unified LLM wrapper — Groq primary, Gemini fallback
 *
 * High-frequency calls (journal parsing, RSS scoring, daily reports,
 * insight extraction) go through Groq's free tier (Llama 3.3 70B).
 * If Groq fails or rate-limits, we fall back to Gemini 2.5 Flash.
 *
 * Voice transcription stays on Gemini (multimodal audio support).
 */

import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

let groqClient: Groq | null = null
function getGroq(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

let geminiAI: GoogleGenerativeAI | null = null
function getGemini(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null
  if (!geminiAI) {
    geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return geminiAI
}

export interface LLMCallOptions {
  /** Lower = more deterministic. Default 0.3 for JSON extraction. */
  temperature?: number
  /** Max output tokens. Default 8000. */
  maxTokens?: number
}

/**
 * Call LLM with Groq as primary provider, Gemini as fallback.
 * Returns raw text response.
 */
export async function callLLM(
  prompt: string,
  options: LLMCallOptions = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 8000 } = options

  // --- Try Groq first ---
  const groq = getGroq()
  if (groq) {
    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      })
      const text = response.choices[0]?.message?.content
      if (text) return text
    } catch (error) {
      console.warn('[LLM] Groq failed, falling back to Gemini:', (error as Error).message)
    }
  }

  // --- Fallback to Gemini ---
  const genAI = getGemini()
  if (!genAI) {
    throw new Error('[LLM] No LLM provider available — set GROQ_API_KEY or GEMINI_API_KEY')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}
