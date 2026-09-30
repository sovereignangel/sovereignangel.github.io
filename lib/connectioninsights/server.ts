/**
 * Server helpers for the hosted Connection Insights app at /connectioninsights.
 *
 * Anyone with a Google account can sign in. Each user's data lives in its own
 * root-level doc, fully separate from the Thesis Engine's users/{uid} tree:
 *
 *   connection_insights/{uid}                  profile + settings (names, Wave)
 *   connection_insights/{uid}/conversations    sessions
 *   connection_insights/{uid}/themes|values|snapshots
 *   ci_wave_hooks/{hookId}                     webhook id → uid lookup
 *
 * Only the API routes touch these (firebase-admin). The browser never reads
 * Firestore directly, and the Wave token never leaves the server.
 */

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { Firestore } from 'firebase-admin/firestore'
import type { PartnerNames } from '@/lib/connectioninsights/extraction'

export const ROOT = 'connection_insights'
export const HOOKS = 'ci_wave_hooks'

export interface CIProfile {
  email: string
  partnerA: string
  partnerB: string
  waveToken?: string
  waveHookId?: string
  waveWebhookId?: string
  waveWebhookSecret?: string
  /** Only auto-ingest Wave sessions whose title contains this (case-insensitive). */
  waveKeyword?: string
}

/** What the browser is allowed to see about a profile. */
export interface CIPublicSettings {
  email: string
  partnerA: string
  partnerB: string
  waveConnected: boolean
  waveKeyword: string
}

export async function getDb(): Promise<Firestore> {
  const { adminDb } = await import('@/lib/firebase-admin')
  if (!adminDb) throw new Error('Firebase not configured')
  return adminDb
}

/** Verify the Firebase ID token; returns uid + email or a 401 response. */
export async function requireUser(
  request: NextRequest,
): Promise<{ uid: string; email: string } | NextResponse> {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  try {
    await getDb() // ensures firebase-admin is initialized
    const { getAuth } = await import('firebase-admin/auth')
    const decoded = await getAuth().verifyIdToken(header.slice(7))
    return { uid: decoded.uid, email: decoded.email || '' }
  } catch {
    return NextResponse.json({ error: 'Session expired — sign in again' }, { status: 401 })
  }
}

export async function loadProfile(db: Firestore, uid: string): Promise<CIProfile | null> {
  const snap = await db.collection(ROOT).doc(uid).get()
  return snap.exists ? (snap.data() as CIProfile) : null
}

export function namesOf(profile: CIProfile | null): PartnerNames {
  return { a: profile?.partnerA || 'Partner A', b: profile?.partnerB || 'Partner B' }
}

export function publicSettings(profile: CIProfile | null, email: string): CIPublicSettings {
  return {
    email: profile?.email || email,
    partnerA: profile?.partnerA || '',
    partnerB: profile?.partnerB || '',
    waveConnected: Boolean(profile?.waveToken && profile?.waveHookId),
    waveKeyword: profile?.waveKeyword ?? 'connection',
  }
}

// ---------------------------------------------------------------------------
// Wave.ai
// ---------------------------------------------------------------------------

const WAVE = 'https://api.wave.co/v1'

export interface WaveSession {
  id: string
  title: string
  timestamp: string | null
  duration_seconds: number
}

async function wave<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${WAVE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Wave ${res.status}: ${body.slice(0, 200)}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export async function listWaveSessions(token: string, limit = 20): Promise<WaveSession[]> {
  const data = await wave<{ sessions?: WaveSession[] }>(token, `/sessions?limit=${limit}`)
  return data.sessions || []
}

export async function fetchWaveTranscript(token: string, sessionId: string): Promise<string> {
  const data = await wave<{ transcript?: string; segments?: { speaker: string; text: string }[] }>(
    token, `/sessions/${sessionId}/transcript`,
  )
  // Prefer speaker-labelled segments so the model can attribute lines.
  if (data.segments?.length) return data.segments.map(s => `${s.speaker}: ${s.text}`).join('\n')
  return data.transcript || ''
}

export async function registerWaveWebhook(
  token: string,
  url: string,
): Promise<{ id: string; secret: string }> {
  const data = await wave<{ id: string; secret: string }>(token, '/webhooks', {
    method: 'POST',
    body: JSON.stringify({ url, events: ['session.completed'] }),
  })
  return { id: data.id, secret: data.secret }
}

export async function deleteWaveWebhook(token: string, webhookId: string): Promise<void> {
  try {
    await wave(token, `/webhooks/${webhookId}`, { method: 'DELETE' })
  } catch {
    // Already gone, or token revoked — nothing more to do.
  }
}

export function newHookId(): string {
  return crypto.randomBytes(18).toString('base64url')
}

/**
 * Wave signs webhooks Svix-style: HMAC-SHA256(secret, `${id}.${timestamp}.${body}`).
 * The encoding isn't documented, so accept any of the usual key/digest combos
 * (same approach as app/api/webhooks/wave).
 */
export function verifyWaveSignature(
  secret: string,
  headers: { id: string; timestamp: string; signature: string },
  body: string,
): boolean {
  const content = `${headers.id}.${headers.timestamp}.${body}`
  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const keys: (string | Buffer)[] = [raw, Buffer.from(raw, 'hex'), Buffer.from(raw, 'base64')]
  const candidates = keys.flatMap(k =>
    (['base64', 'hex'] as const).map(d => crypto.createHmac('sha256', k).update(content).digest(d)),
  )
  return headers.signature.split(' ').some(sig => {
    const value = Buffer.from(sig.startsWith('v1,') ? sig.slice(3) : sig)
    return candidates.some(c => {
      const expected = Buffer.from(c)
      return expected.length === value.length && crypto.timingSafeEqual(expected, value)
    })
  })
}
