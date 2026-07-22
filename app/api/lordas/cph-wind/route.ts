import { NextResponse } from 'next/server'
import { analyzeTripDates } from '@/lib/kite/copenhagen-wind'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const days = await analyzeTripDates()
    return NextResponse.json({ success: true, days })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
