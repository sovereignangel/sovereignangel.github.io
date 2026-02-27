import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

// GET /api/journal-review/[id] — fetch a single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const { adminDb } = await import('@/lib/firebase-admin')
  const ref = adminDb.collection('users').doc(auth.uid).collection('journal_reviews').doc(id)
  const snap = await ref.get()

  if (!snap.exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ id: snap.id, ...snap.data() })
}

// PATCH /api/journal-review/[id] — apply corrections to already-saved items
// Items were saved immediately on parse. This endpoint handles edits and deletions.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await request.json()
  const { adminDb } = await import('@/lib/firebase-admin')
  const ref = adminDb.collection('users').doc(auth.uid).collection('journal_reviews').doc(id)
  const snap = await ref.get()

  if (!snap.exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const review = snap.data()!
  const uid = auth.uid

  // Apply corrections: items marked 'edited' get updated, 'deleted' get removed
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
        name: c.name,
        notes: c.context,
        updatedAt: new Date(),
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
        text: p.text, shortForm: p.shortForm, domain: p.domain,
        updatedAt: new Date(),
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
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    if (BOT_TOKEN) {
      const edited = [
        ...corrections.contacts.filter((c: { status: string }) => c.status === 'edited'),
        ...corrections.decisions.filter((d: { status: string }) => d.status === 'edited'),
        ...corrections.principles.filter((p: { status: string }) => p.status === 'edited'),
        ...corrections.beliefs.filter((b: { status: string }) => b.status === 'edited'),
        ...corrections.notes.filter((n: { status: string }) => n.status === 'edited'),
      ].length
      const deleted = [
        ...corrections.contacts.filter((c: { status: string }) => c.status === 'deleted'),
        ...corrections.decisions.filter((d: { status: string }) => d.status === 'deleted'),
        ...corrections.principles.filter((p: { status: string }) => p.status === 'deleted'),
        ...corrections.beliefs.filter((b: { status: string }) => b.status === 'deleted'),
        ...corrections.notes.filter((n: { status: string }) => n.status === 'deleted'),
      ].length

      const parts = []
      if (edited) parts.push(`${edited} edited`)
      if (deleted) parts.push(`${deleted} removed`)
      const msg = parts.length > 0
        ? `Journal review corrected: ${parts.join(', ')}`
        : 'Journal review confirmed — no changes needed'

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: review.telegramChatId, text: msg }),
      })
    }
  }

  return NextResponse.json({ ok: true, status: 'corrected' })
}
