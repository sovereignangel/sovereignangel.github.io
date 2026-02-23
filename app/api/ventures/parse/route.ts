import { NextRequest, NextResponse } from 'next/server'
import { parseVentureIdea } from '@/lib/ai-extraction'

export async function POST(req: NextRequest) {
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
