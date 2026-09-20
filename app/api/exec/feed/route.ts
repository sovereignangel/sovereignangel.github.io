/**
 * Backlog read/write.
 *
 *   GET  /api/exec/feed?from=&to=&q=&subject=&status=   → filtered entries
 *   POST /api/exec/feed  { id, read }                   → mark read/unread
 *
 * Auth is the same env-UID model the /exec page and the cron routes use: this
 * dashboard has exactly one reader, and the ranking that writes these rows runs
 * unattended with no session to borrow. The routes are not public — they sit
 * behind the same deployment as the rest of /exec.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listBacklog, setRead, backlogStats, type BacklogFilter } from '@/lib/exec/feed-store'
import type { SubjectId } from '@/lib/exec/feed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUBJECTS: SubjectId[] = ['value', 'macro', 'ai', 'systems', 'capital']

function uid(): string | null {
  return process.env.TRANSCRIPT_WEBHOOK_UID || process.env.FIREBASE_UID || null
}

export async function GET(req: NextRequest) {
  const user = uid()
  if (!user) return NextResponse.json({ error: 'UID not configured' }, { status: 500 })

  const p = req.nextUrl.searchParams
  const subject = p.get('subject')
  const status = p.get('status')

  const filter: BacklogFilter = {
    from: p.get('from') || undefined,
    to: p.get('to') || undefined,
    q: p.get('q') || undefined,
    subject: subject && SUBJECTS.includes(subject as SubjectId) ? (subject as SubjectId) : undefined,
    status: status === 'read' || status === 'all' ? status : 'unread',
    limit: Math.min(Number(p.get('limit')) || 200, 500),
  }

  try {
    const [entries, stats] = await Promise.all([listBacklog(user, filter), backlogStats(user)])
    return NextResponse.json({ entries, stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = uid()
  if (!user) return NextResponse.json({ error: 'UID not configured' }, { status: 500 })

  try {
    const body = (await req.json()) as { id?: string; read?: boolean }
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await setRead(user, body.id, body.read !== false)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
