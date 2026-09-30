/**
 * POST /api/connectioninsights/extract
 * Body: { transcript: string, date?: "YYYY-MM-DD" }
 * Paste-a-transcript ingest for the signed-in user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb, requireUser, loadProfile, namesOf } from '@/lib/connectioninsights/server'
import { processTranscript } from '@/lib/connectioninsights/pipeline'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (user instanceof NextResponse) return user

  let body: { transcript?: string; date?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const transcript = (body.transcript || '').trim()
  if (transcript.length < 100) {
    return NextResponse.json({ error: 'Transcript too short' }, { status: 400 })
  }
  if (transcript.length > 200_000) {
    return NextResponse.json({ error: 'Transcript too long — split it into sessions' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const names = namesOf(await loadProfile(db, user.uid))
    const text = body.date ? `date: ${body.date}\n${transcript}` : transcript
    const result = await processTranscript(user.uid, db, text, names, {
      sourceId: body.date ? `paste-${body.date}` : undefined,
    })
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[connectioninsights/extract]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
