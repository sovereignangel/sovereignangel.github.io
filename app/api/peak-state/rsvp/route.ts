import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, status, constraints } = body

    if (!name || !status || !['yes', 'maybe', 'no'].includes(status)) {
      return NextResponse.json({ error: 'Invalid RSVP data' }, { status: 400 })
    }

    const docRef = await adminDb.collection('peak_state_rsvps').add({
      name: name.trim(),
      status,
      constraints: constraints?.trim() || '',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ id: docRef.id, success: true })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('peak_state_rsvps')
      .orderBy('createdAt', 'desc')
      .get()

    const rsvps = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ rsvps })
  } catch (error) {
    console.error('RSVP fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 })
  }
}
