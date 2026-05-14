import type { InboxPayload } from './types'

export function digestEnabled(): boolean {
  return process.env.INBOX_DIGEST_ENABLED === 'true'
}

export function shouldBundle(payload: InboxPayload): boolean {
  if (!digestEnabled()) return false
  if (payload.severity === 'critical') return false
  return payload.kind === 'info' || payload.kind === 'digest_item' || payload.kind === 'signal'
}

export async function enqueueForDigest(_payload: InboxPayload): Promise<void> {
  return
}
