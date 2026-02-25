import { NextRequest, NextResponse } from 'next/server'
import { parseVentureIdea } from '@/lib/ai-extraction'
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
    }

    const parsed = await parseVentureIdea(text, [])
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Venture parse error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Parse failed' },
      { status: 500 }
    )
  }
}
