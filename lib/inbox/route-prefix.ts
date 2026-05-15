/**
 * Phase 2 inbound router — slash-command prefix dispatch.
 *
 * Recognizes /arm, /ab, /thesis, /lordas as routing prefixes. Returns the
 * normalized source value + remaining text. Existing commands (/journal,
 * /morning, /build, /approve, /venture, /signal, etc.) are NOT handled here —
 * they keep flowing through parseTelegramMessage as before.
 *
 * This module is pure: no Firestore, no fetch, no Telegram API calls.
 */

import type { InboxSource } from './types'

export interface PrefixRouteResult {
  source: InboxSource
  text: string
}

const PREFIX_TO_SOURCE: Array<{ prefix: string; source: InboxSource }> = [
  { prefix: '/arm', source: 'armstrong' },
  { prefix: '/ab', source: 'alamo-bernal' },
  { prefix: '/thesis', source: 'thesis' },
  { prefix: '/lordas', source: 'lordas' },
]

/**
 * If the raw message starts with a known routing prefix, return the source +
 * remaining text. Otherwise return null. Match is whole-word (prefix followed
 * by whitespace, end-of-string, or @botname suffix — same shape as Telegram's
 * own slash-command parsing).
 */
export function matchPrefix(raw: string): PrefixRouteResult | null {
  const trimmed = raw.trim().replace(/^(\/\w+)@\w+/, '$1')
  for (const { prefix, source } of PREFIX_TO_SOURCE) {
    if (trimmed === prefix) {
      return { source, text: '' }
    }
    if (trimmed.startsWith(prefix + ' ') || trimmed.startsWith(prefix + '\n')) {
      return { source, text: trimmed.slice(prefix.length).trim() }
    }
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
