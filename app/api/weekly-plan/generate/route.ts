import { NextRequest, NextResponse } from 'next/server'
import { generateNextWeekPlan } from '@/lib/weekly-plan-ai'

export async function POST(req: NextRequest) {
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
