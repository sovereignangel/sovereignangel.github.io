import { NextRequest, NextResponse } from 'next/server'
import { generateVentureMemo } from '@/lib/ai-extraction'

export async function POST(req: NextRequest) {
  try {
    const { ventureId, uid, feedback } = await req.json()

    if (!ventureId || !uid) {
      return NextResponse.json({ error: 'Missing ventureId or uid' }, { status: 400 })
    }

    const { adminDb } = await import('@/lib/firebase-admin')
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
    const snap = await ventureRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
    }

    const venture = snap.data()!
    const spec = venture.spec
    const prd = venture.prd || null
    const existingMemo = venture.memo

    // Build feedback history
    const feedbackHistory = [...(existingMemo?.feedbackHistory || [])]
    if (feedback && typeof feedback === 'string') {
      feedbackHistory.push(feedback)
    }

    const memo = await generateVentureMemo(
      spec,
      prd,
      feedbackHistory.length > 0 ? feedbackHistory : undefined
    )

    // Set version
    memo.version = (existingMemo?.version || 0) + 1

    await ventureRef.update({
      memo,
      updatedAt: new Date(),
    })

    // Save public copy for shareable URL
    await adminDb.collection('public_memos').doc(ventureId).set({
      memo,
      ventureName: spec.name,
      oneLiner: spec.oneLiner,
      category: spec.category,
      thesisPillars: spec.thesisPillars || [],
      uid,
      ventureId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, memo })
  } catch (error) {
    console.error('Venture memo error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
