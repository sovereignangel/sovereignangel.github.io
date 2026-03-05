/**
 * LLM client for venture code generation.
 *
 * Uses Gemini 2.5 Flash for server-side code generation.
 * Fast, high-output-token model ideal for generating full codebases.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('[Builder] GEMINI_API_KEY not configured')
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return genAI
}

export interface ClaudeGenerateOptions {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

/**
 * Generate structured output (JSON) for code generation.
 */
export async function claudeGenerate(options: ClaudeGenerateOptions): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens = 16000, temperature = 0.3 } = options
  const ai = getClient()

  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  })

  const result = await model.generateContent(userPrompt)
  const response = await result.response
  return response.text()
}

/**
 * Generate large codebases (extended output).
 * Uses Gemini 2.5 Flash with high token limit for multi-file generation.
 */
export async function claudeGenerateExtended(options: ClaudeGenerateOptions): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens = 65536, temperature = 0.2 } = options
  const ai = getClient()

  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  })

  const result = await model.generateContent(userPrompt)
  const response = await result.response
  return response.text()
}
