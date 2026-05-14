import { NextRequest, NextResponse } from 'next/server'
import { sendToInbox } from '@/lib/inbox/client'

export const dynamic = 'force-dynamic'

/** Find a journal_review document by ID across all users (single-user app, so O(1) in practice) */
async function findReview(id: string) {
  const { adminDb } = await import('@/lib/firebase-admin')
  const usersSnap = await adminDb.collection('users').get()
  for (const userDoc of usersSnap.docs) {
    const reviewSnap = await adminDb
      .collection('users').doc(userDoc.id)
      .collection('journal_reviews').doc(id)
      .get()
    if (reviewSnap.exists) {
      return { uid: userDoc.id, review: reviewSnap }
    }
  }
  return null
}

// GET /api/review/[id] — public fetch of a review (no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await findReview(id)

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ id: result.review.id, ...result.review.data() })
}

// PATCH /api/review/[id] — public apply corrections (no auth required, review ID is the access token)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await findReview(id)

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { uid, review: snap } = result
  const body = await request.json()
  const { adminDb } = await import('@/lib/firebase-admin')
  const ref = adminDb.collection('users').doc(uid).collection('journal_reviews').doc(id)
  const review = snap.data()!

  const corrections = {
    contacts: body.contacts || review.contacts || [],
    decisions: body.decisions || review.decisions || [],
    principles: body.principles || review.principles || [],
    beliefs: body.beliefs || review.beliefs || [],
    notes: body.notes || review.notes || [],
  }

  // Process contact corrections
  for (const c of corrections.contacts) {
    if (!c.docId) continue
    if (c.status === 'deleted') {
      await adminDb.collection('users').doc(uid).collection('contacts').doc(c.docId).delete()
    } else if (c.status === 'edited') {
      await adminDb.collection('users').doc(uid).collection('contacts').doc(c.docId).update({
        name: c.name, notes: c.context, updatedAt: new Date(),
      })
    }
  }

  // Process decision corrections
  for (const d of corrections.decisions) {
    if (!d.docId) continue
    if (d.status === 'deleted') {
      await adminDb.collection('users').doc(uid).collection('decisions').doc(d.docId).delete()
    } else if (d.status === 'edited') {
      await adminDb.collection('users').doc(uid).collection('decisions').doc(d.docId).update({
        title: d.title, hypothesis: d.hypothesis, chosenOption: d.chosenOption,
        reasoning: d.reasoning, domain: d.domain, confidenceLevel: d.confidenceLevel,
        updatedAt: new Date(),
      })
    }
  }

  // Process principle corrections
  for (const p of corrections.principles) {
    if (!p.docId) continue
    if (p.status === 'deleted') {
      await adminDb.collection('users').doc(uid).collection('principles').doc(p.docId).delete()
    } else if (p.status === 'edited') {
      await adminDb.collection('users').doc(uid).collection('principles').doc(p.docId).update({
        text: p.text, shortForm: p.shortForm, domain: p.domain, updatedAt: new Date(),
      })
    }
  }

  // Process belief corrections
  for (const b of corrections.beliefs) {
    if (!b.docId) continue
    if (b.status === 'deleted') {
      await adminDb.collection('users').doc(uid).collection('beliefs').doc(b.docId).delete()
    } else if (b.status === 'edited') {
      await adminDb.collection('users').doc(uid).collection('beliefs').doc(b.docId).update({
        statement: b.statement, confidence: b.confidence, domain: b.domain,
        evidenceFor: b.evidenceFor, evidenceAgainst: b.evidenceAgainst,
        updatedAt: new Date(),
      })
    }
  }

  // Process note/signal corrections
  for (const n of corrections.notes) {
    if (!n.docId) continue
    if (n.status === 'deleted') {
      await adminDb.collection('users').doc(uid).collection('external_signals').doc(n.docId).delete()
    } else if (n.status === 'edited') {
      await adminDb.collection('users').doc(uid).collection('external_signals').doc(n.docId).update({
        title: n.text.slice(0, 120), aiSummary: n.text, keyTakeaway: n.text,
        updatedAt: new Date(),
      })
    }
  }

  // Mark review as corrected
  await ref.update({ ...corrections, status: 'corrected', updatedAt: new Date() })

  // Notify via Telegram
  if (review.telegramChatId) {
    const edited = [
      ...corrections.contacts, ...corrections.decisions, ...corrections.principles,
      ...corrections.beliefs, ...corrections.notes,
    ].filter((i: { status: string }) => i.status === 'edited').length
    const deleted = [
      ...corrections.contacts, ...corrections.decisions, ...corrections.principles,
      ...corrections.beliefs, ...corrections.notes,
    ].filter((i: { status: string }) => i.status === 'deleted').length

    const parts = []
    if (edited) parts.push(`${edited} edited`)
    if (deleted) parts.push(`${deleted} removed`)
    const msg = parts.length > 0
      ? `Journal review corrected: ${parts.join(', ')}`
      : 'Journal review confirmed — no changes needed'

    await sendToInbox({
      source: 'thesis',
      kind: 'info',
      severity: 'info',
      title: msg,
      dedupe_key: `review-correction:${id}`,
    })
  }

  return NextResponse.json({ ok: true, status: 'corrected' })
}
