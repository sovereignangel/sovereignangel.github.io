/**
 * Shared Telegram messaging utility.
 * Handles the 4096-character limit by splitting at line boundaries.
 */

const MAX_LENGTH = 4096

function splitMessage(text: string): string[] {
  if (text.length <= MAX_LENGTH) return [text]

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= MAX_LENGTH) {
      chunks.push(remaining)
      break
    }

    const slice = remaining.slice(0, MAX_LENGTH)
    const lastNewline = slice.lastIndexOf('\n')
    const splitAt = lastNewline > MAX_LENGTH * 0.5 ? lastNewline : MAX_LENGTH

    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt).replace(/^\n/, '')
  }

  return chunks
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: { parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML' }
): Promise<number | null> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set — skipping sendTelegramMessage')
    return null
  }

  const parseMode = options?.parseMode ?? 'Markdown'
  const chunks = splitMessage(text)
  let lastMessageId: number | null = null

  for (const chunk of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        parse_mode: parseMode,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`Telegram sendMessage failed (${res.status}):`, body)
    } else {
      const data = await res.json()
      lastMessageId = data.result?.message_id ?? null
    }
  }

  return lastMessageId
}
