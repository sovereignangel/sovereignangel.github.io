import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf-8')
  const b = Buffer.from(expected, 'utf-8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  const expected = process.env.INBOX_SHARED_SECRET
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'inbox auth not configured' },
      { status: 500 },
    )
  }
  const provided = req.headers.get('x-inbox-secret') ?? ''
  if (!provided || !secretMatches(provided, expected)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const env = {
    INBOX_SHARED_SECRET_set: !!process.env.INBOX_SHARED_SECRET,
    TELEGRAM_CHAT_ID_set: !!process.env.TELEGRAM_CHAT_ID,
    TELEGRAM_BOT_TOKEN_set: !!process.env.TELEGRAM_BOT_TOKEN,
    INBOX_DIGEST_ENABLED: process.env.INBOX_DIGEST_ENABLED === 'true',
    NODE_ENV: process.env.NODE_ENV,
  }

  const sufficient =
    env.INBOX_SHARED_SECRET_set &&
    env.TELEGRAM_CHAT_ID_set &&
    env.TELEGRAM_BOT_TOKEN_set

  return NextResponse.json({
    ok: true,
    component: 'inbox-router',
    sufficient_for_send: sufficient,
    env,
    server_time: new Date().toISOString(),
    vercel: {
      region: process.env.VERCEL_REGION ?? null,
      url: process.env.VERCEL_URL ?? null,
      git_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    },
  })
}
