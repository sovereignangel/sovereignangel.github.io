import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { verifyGuest } from '../_auth'

const DAYS = ['Mon Aug 3', 'Tue Aug 4', 'Wed Aug 5', 'Thu Aug 6', 'Fri Aug 7']
const ROLES = ['Breakfast', 'Lunch', 'Dinner', 'Cleanup', 'Evening activity']

// GET — list signups (oldest first, so day boards read in claim order)
export async function GET() {
  try {
    const snap = await adminDb
      .collection('peak_state_ii_signups')
      .orderBy('createdAt', 'asc')
      .limit(300)
      .get()

    const signups = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name,
        day: data.day,
        role: data.role,
        what: data.what || '',
        uid: data.uid || '',
        email: data.email || '',
        photoURL: data.photoURL || '',
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ signups })
  } catch (error) {
    console.error('Peak State II signups GET error:', error)
    return NextResponse.json({ signups: [] })
  }
}

// POST — claim a slot / offer to facilitate (must be signed in with Google)
export async function POST(req: Request) {
  try {
    const guest = await verifyGuest(req)
    if (!guest) {
      return NextResponse.json({ error: 'Please sign in with Google first.' }, { status: 401 })
    }

    const { day, role, what } = await req.json()

    const cleanWhat = (what || '').toString().trim().slice(0, 300)
    const cleanDay = DAYS.includes(day) ? day : ''
    const cleanRole = ROLES.includes(role) ? role : ''

    if (!cleanDay || !cleanRole) {
      return NextResponse.json({ error: 'Day and role required' }, { status: 400 })
    }

    const doc = {
      name: guest.name,
      day: cleanDay,
      role: cleanRole,
      what: cleanWhat,
      uid: guest.uid,
      email: guest.email,
      photoURL: guest.photoURL,
      createdAt: new Date().toISOString(),
    }

    const ref = await adminDb.collection('peak_state_ii_signups').add(doc)

    return NextResponse.json({ success: true, signup: { id: ref.id, ...doc } })
  } catch (error) {
    console.error('Peak State II signups POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// DELETE — remove one of your own slots (?id=...)
export async function DELETE(req: Request) {
  try {
    const guest = await verifyGuest(req)
    if (!guest) {
      return NextResponse.json({ error: 'Please sign in with Google first.' }, { status: 401 })
    }

    const id = new URL(req.url).searchParams.get('id') || ''
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const ref = adminDb.collection('peak_state_ii_signups').doc(id)
    const doc = await ref.get()
    if (!doc.exists) {
      return NextResponse.json({ success: true })
    }
    if (doc.data()?.uid !== guest.uid) {
      return NextResponse.json({ error: 'That slot is not yours.' }, { status: 403 })
    }

    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Peak State II signups DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
