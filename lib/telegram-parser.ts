/**
 * Telegram message parser for the Thesis Engine
 *
 * Supported commands:
 *   /signal <text>           — Create a new external signal
 *   /signal #ai <text>       — Signal with pillar tag
 *   /note <text>             — Quick note (saved as signal with low relevance)
 *
 * Pillar hashtags: #ai, #markets, #mind
 */

import type { ThesisPillar } from '@/lib/types'

export interface ParsedTelegramMessage {
  command: 'signal' | 'note' | 'unknown'
  text: string
  pillars: ThesisPillar[]
  raw: string
}

const PILLAR_TAGS: Record<string, ThesisPillar> = {
  '#ai': 'ai',
  '#markets': 'markets',
  '#mind': 'mind',
}

export function parseTelegramMessage(text: string): ParsedTelegramMessage {
  const raw = text.trim()

  // /signal command
  if (raw.startsWith('/signal')) {
    const body = raw.slice('/signal'.length).trim()
    const { pillars, cleaned } = extractPillars(body)
    return { command: 'signal', text: cleaned, pillars, raw }
  }

  // /note command
  if (raw.startsWith('/note')) {
    const body = raw.slice('/note'.length).trim()
    const { pillars, cleaned } = extractPillars(body)
    return { command: 'note', text: cleaned, pillars, raw }
  }

  // Plain text — treat as signal
  const { pillars, cleaned } = extractPillars(raw)
  return { command: 'signal', text: cleaned, pillars, raw }
}

function extractPillars(text: string): { pillars: ThesisPillar[]; cleaned: string } {
  const pillars: ThesisPillar[] = []
  let cleaned = text

  for (const [tag, pillar] of Object.entries(PILLAR_TAGS)) {
    if (cleaned.toLowerCase().includes(tag)) {
      pillars.push(pillar)
      cleaned = cleaned.replace(new RegExp(tag, 'gi'), '').trim()
    }
  }

  return { pillars, cleaned }
}

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
}
