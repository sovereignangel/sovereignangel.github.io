import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { uid, ventureId, status, repoUrl, previewUrl, repoName, filesGenerated, errorMessage } = await req.json()

    if (!uid || !ventureId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { adminDb } = await import('@/lib/firebase-admin')
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
    const snap = await ventureRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
    }

    if (status === 'live') {
      await ventureRef.update({
        stage: 'deployed',
        'build.status': 'live',
        'build.repoUrl': repoUrl || null,
        'build.previewUrl': previewUrl || null,
        'build.repoName': repoName || null,
        'build.filesGenerated': filesGenerated || null,
        'build.completedAt': new Date(),
        updatedAt: new Date(),
      })
    } else if (status === 'failed') {
      await ventureRef.update({
        'build.status': 'failed',
        'build.errorMessage': errorMessage || 'Unknown build error',
        'build.completedAt': new Date(),
        updatedAt: new Date(),
      })
    } else {
      // Intermediate status update (generating, pushing, deploying)
      await ventureRef.update({
        'build.status': status,
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Build callback error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
