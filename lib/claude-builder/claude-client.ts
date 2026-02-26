/**
 * Claude API client for venture code generation.
 *
 * Uses Anthropic's API directly (not the CLI) for server-side code generation.
 * This replaces the Gemini-based venture-builder GitHub Actions workflow.
 */

import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('[ClaudeBuilder] ANTHROPIC_API_KEY not configured')
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

export interface ClaudeGenerateOptions {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
}

/**
 * Call Claude to generate structured output (JSON).
 * Uses claude-sonnet-4-20250514 for speed/cost balance on code generation.
 */
export async function claudeGenerate(options: ClaudeGenerateOptions): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens = 16000, temperature = 0.3 } = options
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('[ClaudeBuilder] No text response from Claude')
  }
  return textBlock.text
}

/**
 * Call Claude for extended code generation (large codebases).
 * Uses extended thinking for complex multi-file generation.
 */
export async function claudeGenerateExtended(options: ClaudeGenerateOptions): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens = 64000 } = options
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000,
    },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Get the text block (skip thinking blocks)
  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('[ClaudeBuilder] No text response from Claude')
  }
  return textBlock.text
}
