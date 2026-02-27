import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { resolveContactsBatch } from '@/lib/entity-resolution'
import { addInteractionToContact } from '@/lib/firestore'
import type { ContactInteraction } from '@/lib/types'

/**
 * POST /api/contacts/resolve
 *
 * Resolves extracted names to canonical UnifiedContact records.
 * Uses 3-tier cascade: exact → fuzzy → LLM disambiguation.
 *
 * Body: {
 *   contacts: { name: string; context: string }[]
 *   source: 'journal' | 'transcript' | 'note' | 'screenshot' | 'manual'
 *   date: string  // YYYY-MM-DD
 *   addInteraction?: boolean  // If true, also log an interaction on each contact
 *   sourceDocId?: string      // Firestore doc ID of the originating document
 *   sourceCollection?: string // e.g. 'daily_logs', 'conversations'
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const { contacts, source, date, addInteraction, sourceDocId, sourceCollection } = body

    if (!contacts?.length || !source || !date) {
      return NextResponse.json({ error: 'Missing required fields: contacts, source, date' }, { status: 400 })
    }

    const results = await resolveContactsBatch(auth.uid, contacts, source, date)

    // Optionally log interactions on resolved contacts
    if (addInteraction) {
      for (let i = 0; i < results.length; i++) {
        const interaction: ContactInteraction = {
          date,
          source,
          sourceDocId,
          sourceCollection,
          summary: contacts[i].context || '',
        }
        await addInteractionToContact(auth.uid, results[i].contactId, interaction)
      }
    }

    return NextResponse.json({
      success: true,
      results: results.map(r => ({
        contactId: r.contactId,
        canonicalName: r.contact.canonicalName,
        method: r.method,
        confidence: r.confidence,
        isNew: r.isNew,
        needsReview: r.contact.needsReview,
      })),
    })
  } catch (error) {
    console.error('Error resolving contacts:', error)
    return NextResponse.json(
      { error: 'Failed to resolve contacts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
