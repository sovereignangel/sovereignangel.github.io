import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getApps } from 'firebase-admin/app'

/**
 * Verify Firebase ID token from Authorization header.
 * Returns the authenticated uid, or a 401 NextResponse on failure.
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ uid: string } | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  try {
    // Ensure firebase-admin is initialized
    if (getApps().length === 0) {
      await import('@/lib/firebase-admin')
    }
    const decoded = await getAuth().verifyIdToken(token)
    return { uid: decoded.uid }
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
