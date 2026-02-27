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

// PATCH /api/journal-review/[id] — update items and/or confirm/reject
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

  // If confirming, persist the (possibly edited) items
  if (body.action === 'confirm') {
    const updatedReview = {
      contacts: body.contacts || review.contacts || [],
      decisions: body.decisions || review.decisions || [],
      principles: body.principles || review.principles || [],
      beliefs: body.beliefs || review.beliefs || [],
      notes: body.notes || review.notes || [],
    }

    // Persist non-rejected items to their respective collections
    const today = review.date || new Date().toISOString().split('T')[0]

    // Inline persist logic using admin SDK
    for (const d of updatedReview.decisions) {
      if (d.status === 'rejected') continue
      const reviewDate = new Date()
      reviewDate.setDate(reviewDate.getDate() + 90)
      await adminDb.collection('users').doc(auth.uid).collection('decisions').doc().set({
        title: d.title, hypothesis: d.hypothesis, options: [d.chosenOption],
        chosenOption: d.chosenOption, reasoning: d.reasoning, confidenceLevel: d.confidenceLevel,
        killCriteria: [], premortem: '', domain: d.domain,
        linkedProjectIds: [], linkedSignalIds: [], status: 'active',
        reviewDate: reviewDate.toISOString().split('T')[0], decidedAt: today,
        createdAt: new Date(), updatedAt: new Date(),
      })
    }

    for (const p of updatedReview.principles) {
      if (p.status === 'rejected') continue
      await adminDb.collection('users').doc(auth.uid).collection('principles').doc().set({
        text: p.text, shortForm: p.shortForm, source: 'manual',
        sourceDescription: 'Extracted from Telegram journal', domain: p.domain,
        dateFirstApplied: today, linkedDecisionIds: [], lastReinforcedAt: today,
        reinforcementCount: 0, createdAt: new Date(), updatedAt: new Date(),
      })
    }

    for (const c of updatedReview.contacts) {
      if (c.status === 'rejected') continue
      const contactsRef = adminDb.collection('users').doc(auth.uid).collection('contacts')
      const existing = await contactsRef.where('name', '==', c.name).limit(1).get()
      if (existing.empty) {
        await contactsRef.doc().set({
          name: c.name, lastConversationDate: today, notes: c.context,
          createdAt: new Date(), updatedAt: new Date(),
        })
      } else {
        const doc = existing.docs[0]
        const prevNotes = doc.data().notes || ''
        await doc.ref.update({
          lastConversationDate: today,
          notes: prevNotes ? `${prevNotes}\n${today}: ${c.context}` : `${today}: ${c.context}`,
          updatedAt: new Date(),
        })
      }
    }

    for (const n of updatedReview.notes) {
      if (n.status === 'rejected') continue
      await adminDb.collection('users').doc(auth.uid).collection('external_signals').doc().set({
        title: n.text.slice(0, 120), aiSummary: n.text, keyTakeaway: n.text,
        valueBullets: [], sourceUrl: '', sourceName: 'Journal note',
        source: 'telegram', relevanceScore: n.actionRequired ? 0.8 : 0.4,
        thesisPillars: [], status: 'inbox', readStatus: 'unread',
        publishedAt: new Date().toISOString(), createdAt: new Date(), updatedAt: new Date(),
      })
    }

    for (const b of updatedReview.beliefs) {
      if (b.status === 'rejected') continue
      const attentionDate = new Date()
      attentionDate.setDate(attentionDate.getDate() + 21)
      await adminDb.collection('users').doc(auth.uid).collection('beliefs').doc().set({
        statement: b.statement, confidence: b.confidence, domain: b.domain,
        evidenceFor: b.evidenceFor, evidenceAgainst: b.evidenceAgainst,
        status: 'active', linkedDecisionIds: [], linkedPrincipleIds: [],
        sourceJournalDate: today, attentionDate: attentionDate.toISOString().split('T')[0],
        createdAt: new Date(), updatedAt: new Date(),
      })
    }

    // Mark review as confirmed
    await ref.update({ ...updatedReview, status: 'confirmed', updatedAt: new Date() })

    // Notify via Telegram
    if (review.telegramChatId) {
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
      if (BOT_TOKEN) {
        const counts = [
          updatedReview.contacts.filter((c: { status: string }) => c.status !== 'rejected').length && `${updatedReview.contacts.filter((c: { status: string }) => c.status !== 'rejected').length} contacts`,
          updatedReview.decisions.filter((d: { status: string }) => d.status !== 'rejected').length && `${updatedReview.decisions.filter((d: { status: string }) => d.status !== 'rejected').length} decisions`,
          updatedReview.principles.filter((p: { status: string }) => p.status !== 'rejected').length && `${updatedReview.principles.filter((p: { status: string }) => p.status !== 'rejected').length} principles`,
          updatedReview.beliefs.filter((b: { status: string }) => b.status !== 'rejected').length && `${updatedReview.beliefs.filter((b: { status: string }) => b.status !== 'rejected').length} beliefs`,
          updatedReview.notes.filter((n: { status: string }) => n.status !== 'rejected').length && `${updatedReview.notes.filter((n: { status: string }) => n.status !== 'rejected').length} notes`,
        ].filter(Boolean).join(', ')

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: review.telegramChatId, text: `Journal review confirmed via web. Saved: ${counts || 'nothing'}` }),
        })
      }
    }

    return NextResponse.json({ ok: true, status: 'confirmed' })
  }

  // If rejecting
  if (body.action === 'reject') {
    await ref.update({ status: 'rejected', updatedAt: new Date() })
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // Otherwise, just update the review data (partial save without persisting)
  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (body.contacts) updateData.contacts = body.contacts
  if (body.decisions) updateData.decisions = body.decisions
  if (body.principles) updateData.principles = body.principles
  if (body.beliefs) updateData.beliefs = body.beliefs
  if (body.notes) updateData.notes = body.notes

  await ref.update(updateData)
  return NextResponse.json({ ok: true })
}
