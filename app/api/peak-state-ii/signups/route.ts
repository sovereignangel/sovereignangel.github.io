import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const DAYS = ['Mon Aug 3', 'Tue Aug 4', 'Wed Aug 5', 'Thu Aug 6', 'Fri Aug 7']
const ROLES = ['Lunch', 'Dinner', 'Cleanup', 'Evening activity']

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
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ signups })
  } catch (error) {
    console.error('Peak State II signups GET error:', error)
    return NextResponse.json({ signups: [] })
  }
}

// POST — claim a slot / offer to facilitate
export async function POST(req: Request) {
  try {
    const { name, day, role, what } = await req.json()

    const cleanName = (name || '').toString().trim().slice(0, 80)
    const cleanWhat = (what || '').toString().trim().slice(0, 300)
    const cleanDay = DAYS.includes(day) ? day : ''
    const cleanRole = ROLES.includes(role) ? role : ''

    if (!cleanName || !cleanDay || !cleanRole) {
      return NextResponse.json({ error: 'Name, day and role required' }, { status: 400 })
    }

    const doc = {
      name: cleanName,
      day: cleanDay,
      role: cleanRole,
      what: cleanWhat,
      createdAt: new Date().toISOString(),
    }

    const ref = await adminDb.collection('peak_state_ii_signups').add(doc)

    return NextResponse.json({ success: true, signup: { id: ref.id, ...doc } })
  } catch (error) {
    console.error('Peak State II signups POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
