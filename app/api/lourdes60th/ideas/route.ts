import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const CATEGORIES = ['Saturday Activity', 'Saturday Dinner', 'Resort Weekend', 'Week Idea', 'Gift Idea', 'Other']

// GET — list brainstormed ideas (newest first)
export async function GET() {
  try {
    const snap = await adminDb
      .collection('lourdes60th_ideas')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    const ideas = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name,
        category: data.category,
        message: data.message,
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Lourdes 60th ideas GET error:', error)
    return NextResponse.json({ ideas: [] })
  }
}

// POST — add an idea to the wall. No sign-in required — this is a family brainstorm.
export async function POST(req: Request) {
  try {
    const { name, category, message } = await req.json()

    const cleanName = (name || '').toString().trim().slice(0, 80)
    const cleanCategory = CATEGORIES.includes(category) ? category : 'Other'
    const cleanMessage = (message || '').toString().trim().slice(0, 1000)

    if (!cleanName || !cleanMessage) {
      return NextResponse.json({ error: 'Name and idea required' }, { status: 400 })
    }

    const doc = {
      name: cleanName,
      category: cleanCategory,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
    }

    const ref = await adminDb.collection('lourdes60th_ideas').add(doc)

    return NextResponse.json({ success: true, idea: { id: ref.id, ...doc } })
  } catch (error) {
    console.error('Lourdes 60th ideas POST error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
