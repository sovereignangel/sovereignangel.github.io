/**
 * Telegram message parser for the Thesis Engine
 *
 * Supported commands:
 *   /signal <text>           — Create a new external signal
 *   /signal #ai <text>       — Signal with pillar tag
 *   /note <text>             — Quick note (saved as signal with low relevance)
 *   /journal <text>          — Journal entry (AI-parsed into daily log fields)
 *   /rss <url> [#pillar]     — Subscribe to an RSS feed
 *   /predict <text>          — Log a prediction with AI analysis
 *   /venture <text>          — Spec a business idea with AI
 *   /build                   — Auto-build the most recent approved venture
 *   /approve                 — Approve the most recent PRD draft
 *   /feedback <text>         — Send feedback on the most recent PRD draft
 *   /iterate <project> <changes> — Request changes to a deployed venture
 *
 * Pillar hashtags: #ai, #markets, #mind
 */

import type { ThesisPillar } from '@/lib/types'

export interface ParsedTelegramMessage {
  command: 'signal' | 'note' | 'journal' | 'rss' | 'predict' | 'venture' | 'build' | 'approve' | 'feedback' | 'iterate' | 'unknown'
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

  // /predict command
  if (raw.startsWith('/predict')) {
    const body = raw.slice('/predict'.length).trim()
    return { command: 'predict', text: body, pillars: [], raw }
  }

  // /venture command
  if (raw.startsWith('/venture')) {
    const body = raw.slice('/venture'.length).trim()
    return { command: 'venture', text: body, pillars: [], raw }
  }

  // /approve command
  if (raw.startsWith('/approve')) {
    return { command: 'approve', text: '', pillars: [], raw }
  }

  // /feedback command
  if (raw.startsWith('/feedback')) {
    const body = raw.slice('/feedback'.length).trim()
    return { command: 'feedback', text: body, pillars: [], raw }
  }

  // /iterate command
  if (raw.startsWith('/iterate')) {
    const body = raw.slice('/iterate'.length).trim()
    return { command: 'iterate', text: body, pillars: [], raw }
  }

  // /build command
  if (raw.startsWith('/build')) {
    return { command: 'build', text: '', pillars: [], raw }
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
