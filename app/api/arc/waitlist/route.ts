import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()

    // Check for duplicate
    const existing = await adminDb
      .collection('arc_waitlist')
      .where('email', '==', normalized)
      .limit(1)
      .get()

    if (!existing.empty) {
      return NextResponse.json({ success: true, message: 'Already on the list' })
    }

    await adminDb.collection('arc_waitlist').add({
      email: normalized,
      joinedAt: new Date().toISOString(),
      source: 'arc-landing',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
