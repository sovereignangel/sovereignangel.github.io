import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { ventureId } = await req.json()
    const uid = auth.uid

    if (!ventureId) {
      return NextResponse.json({ error: 'Missing ventureId' }, { status: 400 })
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
