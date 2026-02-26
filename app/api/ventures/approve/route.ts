import { NextResponse } from 'next/server'

// /approve stage removed — /build works directly from prd_draft
export async function POST() {
  return NextResponse.json(
    { error: 'Approve stage removed. Use /build directly.' },
    { status: 410 }
  )
}
