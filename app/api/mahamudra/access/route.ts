import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'

// Gate for the Mahamudra Foundations recordings. The access word is shared
// with participants; MAHAMUDRA_ACCESS_CODE in Vercel env overrides the
// fallback. Audio lives in the mahamudra-media Vercel Blob store (not the
// repo / public dir) under unguessable random-suffix URLs that are returned
// only after the word is verified — the private page plays them inline with
// downloads disabled.
const SESSIONS = [
  { id: 'foundations-day-1', title: 'Day One', subtitle: 'Mahāmudrā Foundations', prefix: 'mahamudra/foundations-day-1' },
  { id: 'foundations-day-2', title: 'Day Two', subtitle: 'Mahāmudrā Foundations', prefix: 'mahamudra/foundations-day-2' },
  { id: 'foundations-day-3', title: 'Day Three', subtitle: 'Mahāmudrā Foundations', prefix: 'mahamudra/foundations-day-3' },
]

export async function POST(request: NextRequest) {
  let code = ''
  try {
    const body = await request.json()
    code = typeof body?.code === 'string' ? body.code : ''
  } catch {
    // fall through to rejection
  }

  const expected = process.env.MAHAMUDRA_ACCESS_CODE || 'peakstate2'
  if (!code || code.trim().toLowerCase() !== expected.toLowerCase()) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const token = process.env.MAHAMUDRA_BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ ok: false, error: 'storage unavailable' }, { status: 503 })
  }

  try {
    const { blobs } = await list({ prefix: 'mahamudra/', token })
    const sessions = SESSIONS.map((s) => {
      const blob = blobs.find((b) => b.pathname.startsWith(s.prefix))
      return blob ? { id: s.id, title: s.title, subtitle: s.subtitle, src: blob.url } : null
    }).filter(Boolean)
    if (sessions.length === 0) {
      return NextResponse.json({ ok: false, error: 'no recordings' }, { status: 503 })
    }
    return NextResponse.json({ ok: true, sessions })
  } catch (err) {
    console.error('[mahamudra/access] blob list failed', err)
    return NextResponse.json({ ok: false, error: 'storage unavailable' }, { status: 503 })
  }
}
