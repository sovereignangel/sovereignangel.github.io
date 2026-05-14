import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { isValidationError, routeMessage, validatePayload } from '@/lib/inbox/router'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf-8')
  const b = Buffer.from(expected, 'utf-8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const expected = process.env.INBOX_SHARED_SECRET
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'inbox auth not configured' }, { status: 500 })
  }

  const provided = req.headers.get('x-inbox-secret') ?? ''
  if (!provided || !secretMatches(provided, expected)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON body' }, { status: 400 })
  }

  const validated = validatePayload(body)
  if (isValidationError(validated)) {
    return NextResponse.json(validated, { status: 400 })
  }

  const result = await routeMessage(validated)
  const status = result.ok ? 200 : 500
  return NextResponse.json(result, { status })
}
