import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { generateContactBrief } from '@/lib/rag'

/**
 * GET /api/rag/contact-brief?contactId=xxx
 *
 * Generates a Bridgewater-style "baseball card" for a contact.
 * Combines structured Firestore data with vector search results,
 * synthesized by LLM into actionable relationship intelligence.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const contactId = request.nextUrl.searchParams.get('contactId')
  if (!contactId) {
    return NextResponse.json({ error: 'Missing contactId parameter' }, { status: 400 })
  }

  try {
    const brief = await generateContactBrief(auth.uid, contactId)
    if (!brief) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      brief: {
        contactId,
        canonicalName: brief.contact.canonicalName,
        company: brief.contact.company,
        role: brief.contact.role,
        tier: brief.contact.tier,
        trustStage: brief.contact.trustStage,
        relationshipStrength: brief.contact.relationshipStrength,
        relationshipTrajectory: brief.relationshipTrajectory,
        keyContext: brief.keyContext,
        recentInteractions: brief.recentInteractions,
        openCommitments: brief.openCommitments,
        suggestedApproach: brief.suggestedApproach,
        dalioPattern: brief.dalioPattern,
        sourcesUsed: brief.sourcesUsed,
      },
    })
  } catch (error) {
    console.error('Error generating contact brief:', error)
    return NextResponse.json(
      { error: 'Failed to generate brief', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
