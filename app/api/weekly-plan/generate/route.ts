import { NextRequest, NextResponse } from 'next/server'
import { generateNextWeekPlan } from '@/lib/weekly-plan-ai'
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { lastWeekPlan, logs, projectNames } = await req.json()

    const draft = await generateNextWeekPlan(
      lastWeekPlan || null,
      logs || [],
      projectNames || [],
    )

    return NextResponse.json(draft)
  } catch (error) {
    console.error('[weekly-plan/generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Plan generation failed' },
      { status: 500 }
    )
  }
}
