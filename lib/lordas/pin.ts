/**
 * Shared PIN check for the Lordas API surface. The dashboard is a two-person
 * shared page with no accounts, so every route behind it gates the same way.
 */
import type { NextRequest } from 'next/server'

export function pinOk(request: NextRequest): boolean {
  const expected = process.env.LORDAS_PIN || '1234'
  return request.nextUrl.searchParams.get('pin') === expected
}
