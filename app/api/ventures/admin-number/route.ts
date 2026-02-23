import { NextRequest, NextResponse } from 'next/server'

// Temporary admin endpoint to assign venture numbers — DELETE after use
const TEMP_KEY = 'assign-numbers-2026'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== TEMP_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { adminDb } = await import('@/lib/firebase-admin')
  const usersSnap = await adminDb.collection('users').get()
  const results: Record<string, unknown[]> = {}

  for (const userDoc of usersSnap.docs) {
    const venturesSnap = await adminDb.collection('users').doc(userDoc.id).collection('ventures').orderBy('createdAt', 'asc').get()
    if (venturesSnap.empty) continue
    results[userDoc.id] = venturesSnap.docs.map(v => {
      const d = v.data()
      return {
        id: v.id,
        name: d.spec?.name || 'no name',
        stage: d.stage,
        ventureNumber: d.ventureNumber ?? null,
      }
    })
  }

  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== TEMP_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { uid, ventureId, ventureNumber } = await req.json()
  if (!uid || !ventureId || typeof ventureNumber !== 'number') {
    return NextResponse.json({ error: 'Missing uid, ventureId, or ventureNumber' }, { status: 400 })
  }

  const { adminDb } = await import('@/lib/firebase-admin')
  const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
  await ventureRef.update({ ventureNumber })

  return NextResponse.json({ success: true, ventureNumber })
}
