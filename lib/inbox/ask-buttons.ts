/**
 * Phase 2 inbound router — free-form ask-button flow.
 *
 * When the user sends text without a routing prefix, the bot replies with a
 * 5-button inline keyboard ([Armstrong] [Alamo Bernal] [Thesis] [Lordas]
 * [Cancel]). The user taps; the bot dispatches the original text to the
 * chosen project's inbox. Zero misrouting — explicit confirmation always.
 *
 * Callback data shape: `ask:<draft_id>:<source>` where:
 *   - `draft_id` is the Firestore doc ID under users/{uid}/inbox_drafts/
 *   - `source` is "armstrong" | "alamo-bernal" | "thesis" | "lordas" | "cancel"
 *
 * Telegram caps callback_data at 64 bytes. Firestore auto-IDs are 20 chars,
 * so a typical callback is ~35 bytes — well under the limit.
 *
 * This module is pure: no Firestore, no Telegram API calls.
 */

import type { InboxSource } from './types'

export type AskCallbackSource = InboxSource | 'cancel'

export interface AskCallbackData {
  draftId: string
  source: AskCallbackSource
}

interface KeyboardButton {
  text: string
  callback_data: string
}

/**
 * Build the inline keyboard for a draft. Returns Telegram's keyboard shape
 * (array of rows, each row is an array of buttons).
 */
export function buildAskKeyboard(draftId: string): KeyboardButton[][] {
  return [
    [
      { text: 'Armstrong', callback_data: `ask:${draftId}:armstrong` },
      { text: 'Alamo Bernal', callback_data: `ask:${draftId}:alamo-bernal` },
    ],
    [
      { text: 'Thesis', callback_data: `ask:${draftId}:thesis` },
      { text: 'Lordas', callback_data: `ask:${draftId}:lordas` },
    ],
    [
      { text: 'Cancel', callback_data: `ask:${draftId}:cancel` },
    ],
  ]
}

/**
 * Parse the callback_data string from an ask-button press.
 * Returns null if the string doesn't match the `ask:<id>:<source>` shape.
 */
export function parseAskCallback(data: string): AskCallbackData | null {
  if (!data.startsWith('ask:')) return null
  const parts = data.split(':')
  if (parts.length !== 3) return null
  const draftId = parts[1]
  const source = parts[2] as AskCallbackSource
  const validSources: AskCallbackSource[] = ['armstrong', 'alamo-bernal', 'thesis', 'lordas', 'cancel']
  if (!validSources.includes(source)) return null
  if (!draftId || draftId.length === 0) return null
  return { draftId, source }
}

/**
 * Build the prompt message text shown above the keyboard. Keeps the preview
 * short — Telegram has a 4096-char limit on message text, and the user
 * already typed this so they don't need to see the full body again.
 */
export function buildAskPromptText(originalText: string, maxPreview = 300): string {
  const preview = originalText.length > maxPreview
    ? originalText.slice(0, maxPreview) + '…'
    : originalText
  return `Route to which project?\n\n_"${preview}"_`
}
