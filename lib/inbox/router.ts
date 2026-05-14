import { sendTelegramMessage } from '@/lib/telegram'
import { checkAndRecord } from './dedupe'
import { enqueueForDigest, shouldBundle } from './digest'
import {
  INBOX_KINDS,
  INBOX_SEVERITIES,
  INBOX_SOURCES,
  SOURCE_PREFIX,
  type InboxError,
  type InboxPayload,
  type InboxResult,
} from './types'

const TELEGRAM_HARD_LIMIT = 4096
const MAX_TITLE_CHARS = 1024
const MAX_BODY_CHARS = 16384
const MAX_LINK_CHARS = 2048
const MAX_DEDUPE_KEY_CHARS = 256
const ALLOWED_KEYS: ReadonlySet<string> = new Set([
  'source',
  'kind',
  'severity',
  'title',
  'body',
  'link',
  'dedupe_key',
])

function severityBadge(severity: InboxPayload['severity']): string {
  if (severity === 'critical') return '🔴'
  if (severity === 'warn') return '🟡'
  return ''
}

function composeMessage(payload: InboxPayload): string {
  const badge = severityBadge(payload.severity)
  const prefix = SOURCE_PREFIX[payload.source]
  const header = [badge, prefix, payload.title].filter(Boolean).join(' ')
  const parts: string[] = [header]
  if (payload.body && payload.body.trim().length > 0) parts.push(payload.body.trim())
  if (payload.link) parts.push(payload.link)
  return parts.join('\n\n')
}

export function chunkMessage(text: string, limit: number = TELEGRAM_HARD_LIMIT): string[] {
  if (text.length <= limit) return [text]
  const placeholderTag = ' (99/99)'
  const usable = limit - placeholderTag.length
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= usable) {
      chunks.push(remaining)
      break
    }
    const slice = remaining.slice(0, usable)
    const lastNewline = slice.lastIndexOf('\n')
    const splitAt = lastNewline > usable * 0.5 ? lastNewline : usable
    chunks.push(remaining.slice(0, splitAt))
    remaining = remaining.slice(splitAt).replace(/^\n+/, '')
  }
  const total = chunks.length
  return chunks.map((c, i) => `${c}\n\n(${i + 1}/${total})`)
}

export function isValidationError(x: InboxPayload | InboxError): x is InboxError {
  return 'ok' in x && x.ok === false
}

export function validatePayload(input: unknown): InboxPayload | InboxError {
  if (!input || typeof input !== 'object') return { ok: false, error: 'invalid payload: not an object' }
  const p = input as Record<string, unknown>

  const unknown = Object.keys(p).filter(k => !ALLOWED_KEYS.has(k))
  if (unknown.length > 0) {
    return { ok: false, error: `unknown fields: ${unknown.join(', ')} — allowed: ${[...ALLOWED_KEYS].join(', ')}` }
  }

  if (typeof p.source !== 'string' || !INBOX_SOURCES.includes(p.source as never)) {
    return { ok: false, error: `invalid source — must be one of: ${INBOX_SOURCES.join(', ')}` }
  }
  if (typeof p.kind !== 'string' || !INBOX_KINDS.includes(p.kind as never)) {
    return { ok: false, error: `invalid kind — must be one of: ${INBOX_KINDS.join(', ')}` }
  }
  if (typeof p.severity !== 'string' || !INBOX_SEVERITIES.includes(p.severity as never)) {
    return { ok: false, error: `invalid severity — must be one of: ${INBOX_SEVERITIES.join(', ')}` }
  }
  if (typeof p.title !== 'string' || p.title.trim().length === 0) {
    return { ok: false, error: 'invalid title — must be a non-empty string' }
  }
  if (p.title.length > MAX_TITLE_CHARS) {
    return { ok: false, error: `title exceeds ${MAX_TITLE_CHARS} chars` }
  }
  if (p.body !== undefined) {
    if (typeof p.body !== 'string') return { ok: false, error: 'invalid body — must be a string' }
    if (p.body.length > MAX_BODY_CHARS) return { ok: false, error: `body exceeds ${MAX_BODY_CHARS} chars` }
  }
  if (p.link !== undefined) {
    if (typeof p.link !== 'string') return { ok: false, error: 'invalid link — must be a string' }
    if (p.link.length > MAX_LINK_CHARS) return { ok: false, error: `link exceeds ${MAX_LINK_CHARS} chars` }
  }
  if (p.dedupe_key !== undefined) {
    if (typeof p.dedupe_key !== 'string') return { ok: false, error: 'invalid dedupe_key — must be a string' }
    if (p.dedupe_key.length > MAX_DEDUPE_KEY_CHARS) {
      return { ok: false, error: `dedupe_key exceeds ${MAX_DEDUPE_KEY_CHARS} chars` }
    }
  }
  return {
    source: p.source as InboxPayload['source'],
    kind: p.kind as InboxPayload['kind'],
    severity: p.severity as InboxPayload['severity'],
    title: p.title,
    body: p.body as string | undefined,
    link: p.link as string | undefined,
    dedupe_key: p.dedupe_key as string | undefined,
  }
}

function logDecision(payload: InboxPayload, decision: string, extra: Record<string, unknown> = {}): void {
  const entry = {
    at: new Date().toISOString(),
    component: 'inbox-router',
    source: payload.source,
    kind: payload.kind,
    severity: payload.severity,
    has_dedupe: !!payload.dedupe_key,
    decision,
    ...extra,
  }
  console.log(JSON.stringify(entry))
}

export async function routeMessage(payload: InboxPayload): Promise<InboxResult | InboxError> {
  const startedAt = Date.now()
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!chatId) {
    logDecision(payload, 'misconfigured', { reason: 'TELEGRAM_CHAT_ID unset' })
    return { ok: false, error: 'inbox chat id not configured' }
  }

  if (payload.dedupe_key) {
    const isDup = checkAndRecord(`${payload.source}:${payload.dedupe_key}`)
    if (isDup) {
      logDecision(payload, 'deduped', { dedupe_key: payload.dedupe_key })
      return { ok: true, deduped: true }
    }
  }

  if (shouldBundle(payload)) {
    await enqueueForDigest(payload)
    logDecision(payload, 'digested')
    return { ok: true, digested: true }
  }

  const full = composeMessage(payload)
  const chunks = chunkMessage(full)
  let lastId: number | null = null
  let sentChunks = 0
  for (const chunk of chunks) {
    const id = await sendTelegramMessage(chatId, chunk)
    if (id !== null) {
      lastId = id
      sentChunks++
    }
  }

  if (sentChunks === 0) {
    logDecision(payload, 'send_failed', { total_chunks: chunks.length, ms: Date.now() - startedAt })
    return { ok: false, error: 'telegram send failed — see server logs' }
  }

  if (sentChunks < chunks.length) {
    logDecision(payload, 'send_partial', {
      sent_chunks: sentChunks,
      total_chunks: chunks.length,
      message_id: lastId,
      ms: Date.now() - startedAt,
    })
  } else {
    logDecision(payload, 'sent', {
      total_chunks: chunks.length,
      message_id: lastId,
      ms: Date.now() - startedAt,
    })
  }

  return { ok: true, message_id: lastId ?? undefined }
}
