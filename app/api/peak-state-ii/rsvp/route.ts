import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyGuest } from '../_auth'

// GET — list confirmed guests (newest first)
export async function GET() {
  try {
    const snap = await adminDb
      .collection('peak_state_ii_rsvps')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    const rsvps = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name,
        guests: data.guests,
        depositConfirmed: data.depositConfirmed,
        note: data.note || '',
        uid: data.uid || '',
        photoURL: data.photoURL || '',
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ rsvps })
  } catch (error) {
    console.error('Peak State II rsvp GET error:', error)
    return NextResponse.json({ rsvps: [] })
  }
}

// POST — confirm attendance with a Venmo deposit (signed in with Google)
export async function POST(req: Request) {
  try {
    const guest = await verifyGuest(req)
    if (!guest) {
      return NextResponse.json({ error: 'Please sign in with Google first.' }, { status: 401 })
    }

    const { guests, depositConfirmed, note } = await req.json()

    const cleanNote = (note || '').toString().trim().slice(0, 500)
    const cleanGuests = Math.max(1, Math.min(20, parseInt(guests, 10) || 1))

    if (!depositConfirmed) {
      return NextResponse.json({ error: 'Please confirm your deposit' }, { status: 400 })
    }

    const doc = {
      name: guest.name,
      guests: cleanGuests,
      depositConfirmed: true,
      note: cleanNote,
      uid: guest.uid,
      email: guest.email,
      photoURL: guest.photoURL,
      createdAt: new Date().toISOString(),
    }

    const ref = await adminDb.collection('peak_state_ii_rsvps').add(doc)

    return NextResponse.json({ success: true, rsvp: { id: ref.id, ...doc } })
  } catch (error) {
    console.error('Peak State II rsvp POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
