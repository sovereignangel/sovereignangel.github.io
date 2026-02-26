import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { parseCapitalCommand } from '@/lib/ai-extraction'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { command, snapshot, debts } = await request.json()

    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or empty command' }, { status: 400 })
    }

    const parsed = await parseCapitalCommand(command.trim(), snapshot || {}, debts || [])

    if (parsed.operations.length === 0) {
      return NextResponse.json({
        error: 'Could not parse command. Try being more specific, e.g., "pay $500 to Apple Card" or "received 3k freelance income"',
      }, { status: 422 })
    }

    return NextResponse.json({ success: true, parsed })
  } catch (error) {
    console.error('Error parsing capital command:', error)
    return NextResponse.json(
      { error: 'Failed to parse capital command', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
