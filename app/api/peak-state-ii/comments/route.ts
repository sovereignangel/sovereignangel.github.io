import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET — list comments (newest first)
export async function GET() {
  try {
    const snap = await adminDb
      .collection('peak_state_ii_comments')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    const comments = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name,
        message: data.message,
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Peak State II comments GET error:', error)
    return NextResponse.json({ comments: [] })
  }
}

// POST — add a comment
export async function POST(req: Request) {
  try {
    const { name, message } = await req.json()

    const cleanName = (name || '').toString().trim().slice(0, 80)
    const cleanMessage = (message || '').toString().trim().slice(0, 1000)

    if (!cleanName || !cleanMessage) {
      return NextResponse.json({ error: 'Name and message required' }, { status: 400 })
    }

    const doc = {
      name: cleanName,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
    }

    const ref = await adminDb.collection('peak_state_ii_comments').add(doc)

    return NextResponse.json({ success: true, comment: { id: ref.id, ...doc } })
  } catch (error) {
    console.error('Peak State II comments POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
