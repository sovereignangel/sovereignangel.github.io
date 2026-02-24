import { NextRequest, NextResponse } from 'next/server'
import { generateDecisionAntithesis } from '@/lib/ai-extraction'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, hypothesis, chosenOption, reasoning, options, premortem } = body

  if (!title || !chosenOption) {
    return NextResponse.json({ error: 'title and chosenOption required' }, { status: 400 })
  }

  const result = await generateDecisionAntithesis({
    title,
    hypothesis: hypothesis || '',
    chosenOption,
    reasoning: reasoning || '',
    options: options || [],
    premortem,
  })

  return NextResponse.json(result)
}
