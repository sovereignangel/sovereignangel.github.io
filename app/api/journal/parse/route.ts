import { NextRequest, NextResponse } from 'next/server'
import { parseJournalEntry } from '@/lib/ai-extraction'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { journalText } = body

    if (!journalText || typeof journalText !== 'string' || journalText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty journalText' },
        { status: 400 }
      )
    }

    const parsed = await parseJournalEntry(journalText.trim())

    return NextResponse.json({ success: true, parsed })
  } catch (error) {
    console.error('Error parsing journal:', error)
    return NextResponse.json(
      { error: 'Failed to parse journal entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
