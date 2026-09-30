/**
 * GET  /api/connectioninsights/settings  → the signed-in user's public settings
 * POST /api/connectioninsights/settings  → { partnerA?, partnerB?, waveKeyword?, waveToken?, disconnectWave? }
 *
 * Saving a Wave token validates it, then registers a per-user webhook on the
 * user's own Wave account pointing at /api/connectioninsights/wave/hook/{hookId}.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  ROOT, HOOKS, getDb, requireUser, loadProfile, publicSettings,
  listWaveSessions, registerWaveWebhook, deleteWaveWebhook, newHookId,
  type CIProfile,
} from '@/lib/connectioninsights/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (user instanceof NextResponse) return user
  const db = await getDb()
  const profile = await loadProfile(db, user.uid)
  return NextResponse.json(publicSettings(profile, user.email))
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (user instanceof NextResponse) return user

  let body: {
    partnerA?: string; partnerB?: string; waveKeyword?: string
    waveToken?: string; disconnectWave?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const db = await getDb()
  const ref = db.collection(ROOT).doc(user.uid)
  const profile = await loadProfile(db, user.uid)
  const update: Partial<CIProfile> & { updatedAt: Date; createdAt?: Date } = {
    email: user.email,
    updatedAt: new Date(),
  }
  if (!profile) update.createdAt = new Date()
  if (typeof body.partnerA === 'string') update.partnerA = body.partnerA.trim().slice(0, 40)
  if (typeof body.partnerB === 'string') update.partnerB = body.partnerB.trim().slice(0, 40)
  if (typeof body.waveKeyword === 'string') update.waveKeyword = body.waveKeyword.trim().slice(0, 40)

  const disconnect = async () => {
    if (profile?.waveToken && profile.waveWebhookId) await deleteWaveWebhook(profile.waveToken, profile.waveWebhookId)
    if (profile?.waveHookId) await db.collection(HOOKS).doc(profile.waveHookId).delete()
  }

  if (body.disconnectWave) {
    await disconnect()
    const { FieldValue } = await import('firebase-admin/firestore')
    await ref.set({
      ...update,
      waveToken: FieldValue.delete(),
      waveHookId: FieldValue.delete(),
      waveWebhookId: FieldValue.delete(),
      waveWebhookSecret: FieldValue.delete(),
    }, { merge: true })
  } else if (body.waveToken?.trim()) {
    const token = body.waveToken.trim()
    try {
      await listWaveSessions(token, 1)
    } catch {
      return NextResponse.json({ error: 'Wave rejected that token. Check it has sessions:read, transcripts:read and webhooks:manage.' }, { status: 400 })
    }
    await disconnect()
    const hookId = newHookId()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.loricorpuz.com'
    let webhook: { id: string; secret: string } | null = null
    try {
      webhook = await registerWaveWebhook(token, `${origin}/api/connectioninsights/wave/hook/${hookId}`)
    } catch (err) {
      // Token works for reading; import-by-hand still works without the webhook.
      console.warn('[connectioninsights/settings] webhook registration failed:', err instanceof Error ? err.message : err)
    }
    await db.collection(HOOKS).doc(hookId).set({ uid: user.uid, createdAt: new Date() })
    Object.assign(update, {
      waveToken: token,
      waveHookId: hookId,
      waveWebhookId: webhook?.id || '',
      waveWebhookSecret: webhook?.secret || '',
    })
    await ref.set(update, { merge: true })
  } else {
    await ref.set(update, { merge: true })
  }

  return NextResponse.json(publicSettings(await loadProfile(db, user.uid), user.email))
}
