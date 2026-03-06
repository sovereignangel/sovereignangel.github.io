import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const uid = process.env.FIREBASE_UID
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  const { adminDb } = await import('@/lib/firebase-admin')
  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]

  const doc = await adminDb.collection('users').doc(uid).collection('thesis_briefings').doc(date).get()
  if (!doc.exists) {
    return NextResponse.json({ error: 'No briefing found', date }, { status: 404 })
  }

  return NextResponse.json(doc.data())
}
