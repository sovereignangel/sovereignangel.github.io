import { NextRequest, NextResponse } from 'next/server'
import { generateMorningBrief } from '@/lib/weekly-plan-ai'
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { plan, logs, todayIndex } = await req.json()

    if (!plan || typeof todayIndex !== 'number') {
      return NextResponse.json(
        { error: 'plan and todayIndex are required' },
        { status: 400 }
      )
    }

    const brief = await generateMorningBrief(plan, logs || [], todayIndex)

    return NextResponse.json(brief)
  } catch (error) {
    console.error('[weekly-plan/morning-brief] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Morning brief generation failed' },
      { status: 500 }
    )
  }
}
