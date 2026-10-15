/**
 * GET|POST /api/ironman/lordas/{view}
 *
 * The race and training data behind /ironman/performance and
 * /ironman/opportunities lives in Lordas — one copy, not two. This route is
 * the only door to it: it checks the viewer is Lori, then asks Lordas with
 * the shared secret, which never reaches the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const LORDAS = process.env.LORDAS_ORIGIN || 'https://lordas.loricorpuz.com'
const VIEW = /^[a-z-]+$/

async function forward(request: NextRequest, view: string, method: 'GET' | 'POST') {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const owner = process.env.FIREBASE_UID || process.env.TRANSCRIPT_WEBHOOK_UID
  if (!owner || auth.uid !== owner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!VIEW.test(view)) return NextResponse.json({ error: 'Unknown view' }, { status: 404 })

  const secret = process.env.IRONMAN_SHARE_SECRET
  if (!secret) return NextResponse.json({ error: 'Share not configured' }, { status: 503 })

  const url = `${LORDAS}/api/share/ironman/${view}${request.nextUrl.search}`
  const res = await fetch(url, {
    method,
    headers: { 'x-share-secret': secret, 'content-type': 'application/json' },
    body: method === 'POST' ? await request.text() : undefined,
    cache: 'no-store',
  })
  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'private, no-store',
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { view: string } }) {
  return forward(request, params.view, 'GET')
}

export async function POST(request: NextRequest, { params }: { params: { view: string } }) {
  return forward(request, params.view, 'POST')
}
