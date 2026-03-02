import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { normalizeName } from '@/lib/entity-resolution'
import type { UnifiedContact } from '@/lib/types'

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

/**
 * POST /api/contacts/migrate
 *
 * One-time migration: merges existing contacts + network_contacts
 * into the unified_contacts collection.
 *
 * - Prefers network_contacts data (richer CRM fields) when duplicates exist
 * - Deduplicates by normalized name
 * - Sets migration traceability fields (migratedFromContactId, etc.)
 * - Idempotent: skips contacts that already exist in unified_contacts by name
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const uid = auth.uid
  const adminDb = await getAdminDb()
  const userRef = adminDb.collection('users').doc(uid)

  let created = 0
  let skipped = 0
  const errors: string[] = []

  // Load existing unified_contacts to skip already-migrated ones
  const existingSnap = await userRef.collection('unified_contacts').get()
  const existingNames = new Set(
    existingSnap.docs.map(d => d.data().normalizedName as string).filter(Boolean)
  )

  // Map: normalizedName → merged UnifiedContact partial
  const merged = new Map<string, Partial<UnifiedContact> & { _sourceId?: string; _sourceCollection?: string }>()

  // ── Pass 1: Load discovery contacts (lighter weight) ──────────────────
  const contactsSnap = await userRef.collection('contacts').get()
  for (const doc of contactsSnap.docs) {
    const d = doc.data()
    const name: string = d.name || ''
    if (!name.trim()) continue
    const normalized = normalizeName(name)

    merged.set(normalized, {
      canonicalName: name.trim(),
      normalizedName: normalized,
      aliases: [],
      tier: 'acquaintance',
      relationshipStrength: 1,
      trustStage: 1,
      isTop30: false,
      connectedTo: [],
      warmIntrosGenerated: 0,
      touchCount: 1,
      lastTouchDate: d.lastConversationDate || new Date().toISOString().slice(0, 10),
      interactions: [],
      interactionCount: 0,
      topics: [],
      painPoints: [],
      thesisPillars: [],
      nextAction: '',
      whatTheyControl: '',
      yourValueToThem: '',
      notes: d.notes || '',
      needsReview: false,
      migratedFromContactId: doc.id,
    })
  }

  // ── Pass 2: Load network_contacts (richer — overwrites discovery data) ─
  const networkSnap = await userRef.collection('network_contacts').get()
  for (const doc of networkSnap.docs) {
    const d = doc.data()
    const name: string = d.name || ''
    if (!name.trim()) continue
    const normalized = normalizeName(name)

    const existing = merged.get(normalized) || {}
    merged.set(normalized, {
      ...existing,
      canonicalName: name.trim(),
      normalizedName: normalized,
      aliases: [],
      tier: d.tier || existing.tier || 'acquaintance',
      relationshipStrength: d.relationshipStrength ?? existing.relationshipStrength ?? 1,
      trustStage: d.trustStage ?? existing.trustStage ?? 1,
      isTop30: d.isTop30 ?? existing.isTop30 ?? false,
      email: d.email || existing.email,
      connectedTo: d.connectedTo || existing.connectedTo || [],
      warmIntrosGenerated: d.warmIntrosGenerated ?? existing.warmIntrosGenerated ?? 0,
      touchCount: d.touchCount ?? existing.touchCount ?? 1,
      lastTouchDate: d.lastTouchDate || existing.lastTouchDate || new Date().toISOString().slice(0, 10),
      lastAskDate: d.lastAskDate || existing.lastAskDate,
      interactions: existing.interactions || [],
      interactionCount: existing.interactionCount || 0,
      topics: existing.topics || [],
      painPoints: d.problemIdentified ? [d.problemIdentified] : existing.painPoints || [],
      thesisPillars: existing.thesisPillars || [],
      nextAction: d.nextAction || existing.nextAction || '',
      whatTheyControl: d.whatTheyControl || existing.whatTheyControl || '',
      yourValueToThem: d.yourValueToThem || existing.yourValueToThem || '',
      notes: d.notes || existing.notes || '',
      pipelineStage: d.pipelineStage,
      dealValue: d.dealValue,
      dealCurrency: d.dealCurrency,
      expectedCloseDate: d.expectedCloseDate,
      linkedProjectName: d.linkedProjectName,
      problemIdentified: d.problemIdentified,
      needsReview: false,
      migratedFromContactId: existing.migratedFromContactId,
      migratedFromNetworkContactId: doc.id,
    })
  }

  // ── Write to unified_contacts ─────────────────────────────────────────
  for (const [normalizedName, contact] of merged.entries()) {
    if (existingNames.has(normalizedName)) {
      skipped++
      continue
    }

    try {
      const ref = userRef.collection('unified_contacts').doc()
      await ref.set({
        ...contact,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      created++
    } catch (err) {
      errors.push(`${contact.canonicalName}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({
    success: true,
    created,
    skipped,
    total: merged.size,
    errors,
  })
}
