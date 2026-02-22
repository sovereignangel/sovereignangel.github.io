/**
 * Telegram message parser for the Thesis Engine
 *
 * Supported commands:
 *   /signal <text>           — Create a new external signal
 *   /signal #ai <text>       — Signal with pillar tag
 *   /note <text>             — Quick note (saved as signal with low relevance)
 *   /journal <text>          — Journal entry (AI-parsed into daily log fields)
 *   /rss <url> [#pillar]     — Subscribe to an RSS feed
 *
 * Pillar hashtags: #ai, #markets, #mind
 */

import type { ThesisPillar } from '@/lib/types'

export interface ParsedTelegramMessage {
  command: 'signal' | 'note' | 'journal' | 'rss' | 'unknown'
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

  // /journal command
  if (raw.startsWith('/journal')) {
    const body = raw.slice('/journal'.length).trim()
    return { command: 'journal', text: body, pillars: [], raw }
  }

  // /rss command
  if (raw.startsWith('/rss')) {
    const body = raw.slice('/rss'.length).trim()
    const { pillars, cleaned } = extractPillars(body)
    return { command: 'rss', text: cleaned, pillars, raw }
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
    voice?: {
      file_id: string
      file_unique_id: string
      duration: number
      mime_type?: string
      file_size?: number
    }
  }
}
