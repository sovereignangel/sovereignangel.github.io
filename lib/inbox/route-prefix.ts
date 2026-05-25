/**
 * Phase 2 inbound router — slash-command + natural-language prefix dispatch.
 *
 * Recognizes:
 *   - Slash prefixes: /arm, /ab, /thesis, /lordas (intent=null)
 *   - NL prefixes:   "armstrong [intent] - <text>", "alamo bernal [intent] - <text>"
 *
 * Supported intents (case-insensitive): research, development, backtest.
 * If no intent keyword follows the source name, intent is null (treated as freeform).
 *
 * Existing commands (/journal, /morning, /build, /approve, /venture, /signal, etc.)
 * are NOT handled here — they keep flowing through parseTelegramMessage as before.
 *
 * This module is pure: no Firestore, no fetch, no Telegram API calls.
 */

import type { InboxSource } from './types'

export type RouteIntent = 'research' | 'development' | 'backtest'

export interface PrefixRouteResult {
  source: InboxSource
  text: string
  intent: RouteIntent | null
}

const SLASH_PREFIX_TO_SOURCE: Array<{ prefix: string; source: InboxSource }> = [
  { prefix: '/arm', source: 'armstrong' },
  { prefix: '/ab', source: 'alamo-bernal' },
  { prefix: '/thesis', source: 'thesis' },
  { prefix: '/lordas', source: 'lordas' },
]

// NL source aliases. Order matters: longer phrases must be tried before
// shorter ones that they contain (none currently, but the array shape
// keeps that contract explicit for future additions).
const NL_SOURCE_ALIASES: Array<{ alias: string; source: InboxSource }> = [
  { alias: 'alamo bernal', source: 'alamo-bernal' },
  { alias: 'alamobernal', source: 'alamo-bernal' },
  { alias: 'armstrong', source: 'armstrong' },
  { alias: 'thesis', source: 'thesis' },
  { alias: 'lordas', source: 'lordas' },
]

const INTENT_KEYWORDS: Record<string, RouteIntent> = {
  research: 'research',
  fundamentals: 'research',
  development: 'development',
  dev: 'development',
  build: 'development',
  backtest: 'backtest',
  backtests: 'backtest',
}

// Optional separator between "<source> [intent]" and the body text.
// Matches a single hyphen, em/en dash, colon, or pipe surrounded by spaces.
const SEPARATOR_RE = /^\s*[-—–:|]\s*/

/**
 * If the raw message starts with a known routing prefix (slash or NL), return
 * the source + optional intent + remaining text. Otherwise return null.
 */
export function matchPrefix(raw: string): PrefixRouteResult | null {
  const trimmed = raw.trim().replace(/^(\/\w+)@\w+/, '$1')

  // 1. Slash prefixes — preserve existing behavior, intent=null.
  for (const { prefix, source } of SLASH_PREFIX_TO_SOURCE) {
    if (trimmed === prefix) {
      return { source, text: '', intent: null }
    }
    if (trimmed.startsWith(prefix + ' ') || trimmed.startsWith(prefix + '\n')) {
      return { source, text: trimmed.slice(prefix.length).trim(), intent: null }
    }
  }

  // 2. Natural-language prefixes — case-insensitive.
  const lower = trimmed.toLowerCase()
  for (const { alias, source } of NL_SOURCE_ALIASES) {
    if (lower === alias) {
      return { source, text: '', intent: null }
    }
    if (!lower.startsWith(alias)) continue
    const nextChar = lower[alias.length]
    // Require word boundary after the alias (whitespace, separator, EOL).
    if (nextChar !== ' ' && nextChar !== '\n' && nextChar !== '\t') continue

    let rest = trimmed.slice(alias.length).trimStart()
    let intent: RouteIntent | null = null

    // Optional intent keyword as the next word.
    const firstWordMatch = rest.match(/^(\w+)/)
    if (firstWordMatch) {
      const candidate = firstWordMatch[1].toLowerCase()
      if (INTENT_KEYWORDS[candidate]) {
        intent = INTENT_KEYWORDS[candidate]
        rest = rest.slice(firstWordMatch[1].length).trimStart()
      }
    }

    // Optional separator between header and body.
    rest = rest.replace(SEPARATOR_RE, '')

    return { source, text: rest.trim(), intent }
  }

  return null
}

/**
 * List of routing prefixes for help text + onboarding.
 */
export function listPrefixes(): Array<{ prefix: string; source: InboxSource; label: string }> {
  return [
    { prefix: '/arm', source: 'armstrong', label: 'Armstrong' },
    { prefix: '/ab', source: 'alamo-bernal', label: 'Alamo Bernal' },
    { prefix: '/thesis', source: 'thesis', label: 'Thesis' },
    { prefix: '/lordas', source: 'lordas', label: 'Lordas' },
  ]
}
