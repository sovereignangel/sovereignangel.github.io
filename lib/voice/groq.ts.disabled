// @ts-nocheck
/**
 * Groq LLM Client
 * Uses Llama 3.1 70B for all intelligence processing
 * Zero-cost implementation for bootstrapping
 */

import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

const DEFAULT_MODEL = 'llama-3.1-70b-versatile'

export interface LLMResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  durationMs: number
}

/**
 * Call Groq LLM with a prompt
 */
export async function callGroq(
  prompt: string,
  systemPrompt?: string,
  model: string = DEFAULT_MODEL
): Promise<LLMResponse> {
  const startTime = Date.now()

  const messages: any[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 8000
  })

  const content = response.choices[0]?.message?.content || ''

  return {
    content,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0
    },
    model,
    durationMs: Date.now() - startTime
  }
}

/**
 * Stream responses from Groq (for real-time UI)
 */
export async function* streamGroq(
  prompt: string,
  systemPrompt?: string,
  model: string = DEFAULT_MODEL
): AsyncGenerator<string> {
  const messages: any[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const stream = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    max_tokens: 8000,
    stream: true
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    if (content) {
      yield content
    }
  }
}
