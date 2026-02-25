import { NextRequest, NextResponse } from 'next/server'
import { generateRetro } from '@/lib/weekly-plan-ai'
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { uid, weekStart, plan, logs } = await req.json()

    if (!plan || !logs) {
      return NextResponse.json({ error: 'Missing plan or logs data' }, { status: 400 })
    }

    const result = await generateRetro(plan, logs)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[weekly-plan/retro] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retro generation failed' },
      { status: 500 }
    )
  }
}
