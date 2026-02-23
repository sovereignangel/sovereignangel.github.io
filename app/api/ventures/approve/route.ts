import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { ventureId, uid } = await req.json()

    if (!ventureId || !uid) {
      return NextResponse.json({ error: 'Missing ventureId or uid' }, { status: 400 })
    }

    const { adminDb } = await import('@/lib/firebase-admin')
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
    const snap = await ventureRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
    }

    const venture = snap.data()
    if (venture?.stage !== 'prd_draft') {
      return NextResponse.json({ error: 'Venture is not in prd_draft stage' }, { status: 400 })
    }

    await ventureRef.update({
      stage: 'prd_approved',
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Venture approve error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
