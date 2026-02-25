import { NextRequest, NextResponse } from 'next/server'
import { sharpenBelief } from '@/lib/ai-extraction'
import { verifyAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const { statement, confidence, domain, evidenceFor, evidenceAgainst } = body

  if (!statement) {
    return NextResponse.json({ error: 'statement required' }, { status: 400 })
  }

  const result = await sharpenBelief({
    statement,
    confidence: confidence || 60,
    domain: domain || 'personal',
    evidenceFor: evidenceFor || [],
    evidenceAgainst: evidenceAgainst || [],
  })

  return NextResponse.json(result)
}
