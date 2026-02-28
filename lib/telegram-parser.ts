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
 *   /cbuild [#] [with skills]   — Claude-powered build (composable skills)
 *   /citerate <project> <changes> — Claude-powered iterate on deployed venture
 *   /skill <subcommand>          — Manage composable builder skills
 *   /sbuild [#]                    — Start Superpowers structured build
 *   /srespond <text>               — Respond to structured build questions
 *   /sapprove                      — Approve structured build design
 *   /discipline                    — Toggle superpowers-methodology as default skill
 *
 * Pillar hashtags: #ai, #markets, #mind
 */

import type { ThesisPillar } from '@/lib/types'

export interface ParsedTelegramMessage {
  command: 'signal' | 'note' | 'journal' | 'rss' | 'predict' | 'venture' | 'build' | 'approve' | 'feedback' | 'iterate' | 'reset' | 'brief' | 'memo' | 'morning' | 'cbuild' | 'citerate' | 'skill' | 'sbuild' | 'srespond' | 'sapprove' | 'discipline' | 'unknown'
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
  // Strip @botname suffix from commands (e.g., /memo@thesis_bot 3 → /memo 3)
  const raw = text.trim().replace(/^(\/\w+)@\w+/, '$1')

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

  // /approve command (optional number: /approve 3)
  if (raw.startsWith('/approve')) {
    const body = raw.slice('/approve'.length).trim()
    return { command: 'approve', text: body, pillars: [], raw }
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

  // /build command (optional number: /build 3)
  if (raw.startsWith('/build')) {
    const body = raw.slice('/build'.length).trim()
    return { command: 'build', text: body, pillars: [], raw }
  }

  // /reset command (optional number: /reset 3)
  if (raw.startsWith('/reset')) {
    const body = raw.slice('/reset'.length).trim()
    return { command: 'reset', text: body, pillars: [], raw }
  }

  // /memo command (optional number: /memo 3)
  if (raw.startsWith('/memo')) {
    const body = raw.slice('/memo'.length).trim()
    return { command: 'memo', text: body, pillars: [], raw }
  }

  // /morning command — trigger morning brief on demand
  if (raw.startsWith('/morning')) {
    return { command: 'morning', text: '', pillars: [], raw }
  }

  // /brief command — feedback on morning brief
  if (raw.startsWith('/brief')) {
    const body = raw.slice('/brief'.length).trim()
    return { command: 'brief', text: body, pillars: [], raw }
  }

  // /cbuild command — Claude-powered build (optional number + skill names)
  if (raw.startsWith('/cbuild')) {
    const body = raw.slice('/cbuild'.length).trim()
    return { command: 'cbuild', text: body, pillars: [], raw }
  }

  // /citerate command — Claude-powered iterate on deployed venture
  if (raw.startsWith('/citerate')) {
    const body = raw.slice('/citerate'.length).trim()
    return { command: 'citerate', text: body, pillars: [], raw }
  }

  // /sbuild command — Superpowers structured build (optional number: /sbuild 3)
  if (raw.startsWith('/sbuild')) {
    const body = raw.slice('/sbuild'.length).trim()
    return { command: 'sbuild', text: body, pillars: [], raw }
  }

  // /srespond command — respond to structured build brainstorm/design questions
  if (raw.startsWith('/srespond')) {
    const body = raw.slice('/srespond'.length).trim()
    return { command: 'srespond', text: body, pillars: [], raw }
  }

  // /sapprove command — approve structured build design
  if (raw.startsWith('/sapprove')) {
    const body = raw.slice('/sapprove'.length).trim()
    return { command: 'sapprove', text: body, pillars: [], raw }
  }

  // /discipline command — toggle superpowers-methodology as default skill
  if (raw.startsWith('/discipline')) {
    return { command: 'discipline', text: '', pillars: [], raw }
  }

  // /skill command — manage composable builder skills
  if (raw.startsWith('/skill')) {
    const body = raw.slice('/skill'.length).trim()
    return { command: 'skill', text: body, pillars: [], raw }
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
    reply_to_message?: {
      message_id: number
      text?: string
    }
  }
}
