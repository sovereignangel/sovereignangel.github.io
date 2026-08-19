import { NextRequest, NextResponse } from 'next/server'

// Soft gate for the First Series recordings. The access word is shared with
// participants; set MAHAMUDRA_ACCESS_CODE in Vercel env to rotate it.
// Draft fallback: 'clear-light'. Real enforcement (signed URLs) comes later —
// see MAHAMUDRA_BRAND_STRATEGY.md section 7.
const SESSIONS = [
  {
    id: 'first-series-1',
    title: 'Attention',
    subtitle: 'Settling the Mind',
    src: '/mahamudra/audio/session-1.mp3',
  },
  {
    id: 'first-series-2',
    title: 'Stability',
    subtitle: 'Taming the Mind',
    src: '/mahamudra/audio/session-2.mp3',
  },
  {
    id: 'first-series-3',
    title: 'Open Presence',
    subtitle: 'Resting as Awareness',
    src: '/mahamudra/audio/session-3.mp3',
  },
]

export async function POST(request: NextRequest) {
  let code = ''
  try {
    const body = await request.json()
    code = typeof body?.code === 'string' ? body.code : ''
  } catch {
    // fall through to rejection
  }

  const expected = process.env.MAHAMUDRA_ACCESS_CODE || 'clear-light'
  if (!code || code.trim().toLowerCase() !== expected.toLowerCase()) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({ ok: true, sessions: SESSIONS })
}
