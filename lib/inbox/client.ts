import { isValidationError, routeMessage, validatePayload } from './router'
import type { InboxError, InboxPayload, InboxResult } from './types'

export async function sendToInbox(payload: InboxPayload): Promise<InboxResult | InboxError> {
  const validated = validatePayload(payload)
  if (isValidationError(validated)) return validated
  return routeMessage(validated)
}

export type { InboxPayload, InboxResult, InboxError } from './types'
