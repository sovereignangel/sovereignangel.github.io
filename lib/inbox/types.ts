export type InboxSource = 'armstrong' | 'alamo-bernal' | 'thesis' | 'lordas'

export type InboxKind = 'alert' | 'signal' | 'info' | 'digest_item'

export type InboxSeverity = 'critical' | 'warn' | 'info'

export interface InboxPayload {
  source: InboxSource
  kind: InboxKind
  severity: InboxSeverity
  title: string
  body?: string
  link?: string
  dedupe_key?: string
}

export interface InboxResult {
  ok: true
  message_id?: number
  deduped?: boolean
  digested?: boolean
}

export interface InboxError {
  ok: false
  error: string
}

export const INBOX_SOURCES: readonly InboxSource[] = [
  'armstrong',
  'alamo-bernal',
  'thesis',
  'lordas',
] as const

export const INBOX_KINDS: readonly InboxKind[] = [
  'alert',
  'signal',
  'info',
  'digest_item',
] as const

export const INBOX_SEVERITIES: readonly InboxSeverity[] = [
  'critical',
  'warn',
  'info',
] as const

export const SOURCE_PREFIX: Record<InboxSource, string> = {
  armstrong: '[Armstrong]',
  'alamo-bernal': '[Alamo Bernal]',
  thesis: '[Thesis]',
  lordas: '[Lordas]',
}
