import { NextRequest, NextResponse } from 'next/server'
import { generateVenturePRD } from '@/lib/ai-extraction'

export async function POST(req: NextRequest) {
  try {
    const { ventureId, uid, feedback, generateNew } = await req.json()

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
    const existingPrd = venture.prd

    // Get existing project names to avoid collision
    const allVenturesSnap = await adminDb.collection('users').doc(uid).collection('ventures')
      .orderBy('createdAt', 'desc').get()
    const existingPrdNames = allVenturesSnap.docs
      .filter(d => d.id !== ventureId)
      .map(d => d.data().prd?.projectName)
      .filter(Boolean) as string[]

    // Build feedback history
    const feedbackHistory = [...(existingPrd?.feedbackHistory || [])]
    if (feedback && typeof feedback === 'string') {
      feedbackHistory.push(feedback)
    }

    // Generate PRD (new or with feedback)
    const newPrd = await generateVenturePRD(spec, existingPrdNames, feedbackHistory.length > 0 ? feedbackHistory : undefined)

    // Set version
    if (generateNew) {
      newPrd.version = 1
    } else {
      newPrd.version = (existingPrd?.version || 0) + 1
    }

    await ventureRef.update({
      prd: newPrd,
      stage: 'prd_draft',
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, prd: newPrd })
  } catch (error) {
    console.error('Venture feedback error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
