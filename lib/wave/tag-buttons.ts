/**
 * Phase 2B Wave fanout — 7-tag inline keyboard.
 *
 * When a Wave session.completed event arrives, the bot sends Lori an inline
 * keyboard with 7 options. She taps one; the callback handler in the Telegram
 * webhook dispatches the transcript to the chosen destination.
 *
 * Callback data shape: `wave:<sessionId>:<tag>` where:
 *   - sessionId is the Wave session ID
 *   - tag ∈ {fundraising, research, management, investing, lordas, alamobernal, defer}
 *
 * Wave session IDs are typically UUIDs (~36 chars), tags ≤ 12 chars, prefix 5
 * chars. Total ~55 chars — well under Telegram's 64-byte callback_data limit.
 *
 * This module is pure: no Firestore, no Telegram API.
 */

export type WaveTag =
  | 'fundraising'
  | 'research'
  | 'management'
  | 'investing'
  | 'lordas'
  | 'alamobernal'
  | 'defer'

export const WAVE_TAGS: readonly WaveTag[] = [
  'fundraising',
  'research',
  'management',
  'investing',
  'lordas',
  'alamobernal',
  'defer',
] as const

const TAG_LABEL: Record<WaveTag, string> = {
  fundraising: 'Fundraising',
  research: 'Research',
  management: 'Management',
  investing: 'Investing',
  lordas: 'Lordas',
  alamobernal: 'Alamo Bernal',
  defer: 'Defer',
}

export function labelForTag(tag: WaveTag): string {
  return TAG_LABEL[tag]
}

interface KeyboardButton {
  text: string
  callback_data: string
}

/**
 * Build the 7-tag inline keyboard for a Wave session prompt.
 * Layout: 4 in row 1 (fundraising/research/management/investing), 2 in row 2
 * (lordas/alamobernal), 1 in row 3 (defer). Visual hierarchy: the 4 DeepOps
 * surfaces are the most common; lordas + alamobernal are mid-frequency;
 * defer is the escape hatch.
 */
export function buildWaveKeyboard(sessionId: string): KeyboardButton[][] {
  return [
    [
      { text: 'Fundraising', callback_data: `wave:${sessionId}:fundraising` },
      { text: 'Research', callback_data: `wave:${sessionId}:research` },
      { text: 'Management', callback_data: `wave:${sessionId}:management` },
      { text: 'Investing', callback_data: `wave:${sessionId}:investing` },
    ],
    [
      { text: 'Lordas', callback_data: `wave:${sessionId}:lordas` },
      { text: 'Alamo Bernal', callback_data: `wave:${sessionId}:alamobernal` },
    ],
    [
      { text: 'Defer', callback_data: `wave:${sessionId}:defer` },
    ],
  ]
}

export interface WaveCallbackData {
  sessionId: string
  tag: WaveTag
}

/**
 * Parse the callback_data string from a wave-tag button press.
 * Returns null if the string doesn't match `wave:<id>:<tag>` shape.
 */
export function parseWaveCallback(data: string): WaveCallbackData | null {
  if (!data.startsWith('wave:')) return null
  // Use indexOf to split: sessionIds may contain colons (defensive even though
  // Wave UUIDs don't), so we only split off the leading prefix + trailing tag.
  const lastColon = data.lastIndexOf(':')
  const firstColon = data.indexOf(':')
  if (lastColon <= firstColon) return null
  const sessionId = data.slice(firstColon + 1, lastColon)
  const tag = data.slice(lastColon + 1) as WaveTag
  if (!sessionId) return null
  if (!WAVE_TAGS.includes(tag)) return null
  return { sessionId, tag }
}

/**
 * Build the prompt text shown above the keyboard.
 */
export function buildWavePromptText(sessionTitle: string, durationSeconds?: number): string {
  const title = sessionTitle.slice(0, 200) || 'Untitled session'
  const minutes = durationSeconds ? ` (${Math.round(durationSeconds / 60)} min)` : ''
  return `New Wave transcript${minutes}\n\n*${title}*\n\nTag?`
}
