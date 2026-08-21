import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { sendToInbox } from '@/lib/inbox/client'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  let email = ''
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    // fall through to rejection
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (adminDb) {
    try {
      await adminDb.collection('mahamudra_signups').doc(email).set(
        { email, createdAt: new Date().toISOString(), source: 'mahamudra.loricorpuz.com' },
        { merge: true }
      )
    } catch (err) {
      console.error('[mahamudra/join] firestore write failed', err)
    }
  }

  try {
    await sendToInbox({
      source: 'thesis',
      kind: 'signal',
      severity: 'info',
      title: `Mahamudra: new signup ${email}`,
      body: 'Joined the Mahāmudrā NYC list via the site.',
      dedupe_key: `mahamudra-signup-${email}`,
    })
  } catch (err) {
    console.error('[mahamudra/join] inbox notify failed', err)
  }

  return NextResponse.json({ ok: true })
}
