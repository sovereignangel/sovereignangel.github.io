import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { ventureId, iterate, changes } = await req.json()
    const uid = auth.uid

    if (!ventureId) {
      return NextResponse.json({ error: 'Missing ventureId' }, { status: 400 })
    }

    const { adminDb } = await import('@/lib/firebase-admin')
    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc(ventureId)
    const snap = await ventureRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
    }

    const venture = snap.data()

    // Validate stage
    if (iterate) {
      if (venture?.stage !== 'deployed') {
        return NextResponse.json({ error: 'Venture must be deployed to iterate' }, { status: 400 })
      }
      if (!changes?.trim()) {
        return NextResponse.json({ error: 'Missing changes description' }, { status: 400 })
      }
    } else {
      const canBuild = venture?.stage === 'prd_draft' ||
        (venture?.stage === 'building' && venture?.build?.status === 'failed')
      if (!canBuild) {
        return NextResponse.json({ error: 'Venture must be in prd_draft stage' }, { status: 400 })
      }
    }

    // Mark as building
    if (iterate) {
      const iterations = venture?.iterations || []
      iterations.push({ request: changes.trim(), completedAt: null })
      await ventureRef.update({
        stage: 'building',
        iterations,
        'build.status': 'generating',
        'build.startedAt': new Date(),
        'build.errorMessage': null,
        updatedAt: new Date(),
      })
    } else {
      await ventureRef.update({
        stage: 'building',
        'build.status': 'generating',
        'build.startedAt': new Date(),
        'build.errorMessage': null,
        updatedAt: new Date(),
      })
    }

    // Fire repository_dispatch to venture-builder
    const githubToken = process.env.GITHUB_TOKEN
    const githubOwner = process.env.GITHUB_OWNER || 'sovereignangel'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    const callbackUrl = `${baseUrl}/api/ventures/build/callback`

    if (!githubToken) {
      await ventureRef.update({
        'build.status': 'failed',
        'build.errorMessage': 'GITHUB_TOKEN not configured on server',
        'build.completedAt': new Date(),
        ...(iterate ? { stage: 'deployed' } : {}),
        updatedAt: new Date(),
      })
      return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
    }

    const eventType = iterate ? 'iterate-venture' : 'build-venture'
    const clientPayload = iterate
      ? {
          uid,
          ventureId,
          repoName: venture?.build?.repoName,
          changes: changes.trim(),
          spec: venture?.spec,
          prd: venture?.prd,
          callbackUrl,
        }
      : {
          uid,
          ventureId,
          spec: venture?.spec,
          prd: venture?.prd,
          callbackUrl,
        }

    const dispatchRes = await fetch(
      `https://api.github.com/repos/${githubOwner}/venture-builder/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          client_payload: clientPayload,
        }),
      }
    )

    if (!dispatchRes.ok) {
      const errText = await dispatchRes.text()
      await ventureRef.update({
        'build.status': 'failed',
        'build.errorMessage': `GitHub dispatch failed (${dispatchRes.status}): ${errText}`,
        'build.completedAt': new Date(),
        ...(iterate ? { stage: 'deployed' } : {}),
        updatedAt: new Date(),
      })
      return NextResponse.json(
        { error: `GitHub dispatch failed: ${errText}` },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Build trigger error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
