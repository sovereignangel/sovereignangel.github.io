import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { sendToInbox } from '@/lib/inbox/client'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const VALID_INTERESTS = ['sundays', 'text-study', 'retreat-2027'] as const

const INTEREST_LABELS: Record<string, string> = {
  sundays: 'Sunday teachings (Brooklyn)',
  'text-study': 'Text study circle',
  'retreat-2027': '2027 retreat',
}

export async function POST(request: NextRequest) {
  let email = ''
  let interests: string[] = []
  try {
    const body = await request.json()
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (Array.isArray(body?.interests)) {
      interests = body.interests.filter((i: unknown): i is string =>
        typeof i === 'string' && (VALID_INTERESTS as readonly string[]).includes(i)
      )
    }
  } catch {
    // fall through to rejection
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (adminDb) {
    try {
      await adminDb.collection('mahamudra_signups').doc(email).set(
        {
          email,
          interests,
          createdAt: new Date().toISOString(),
          source: 'mahamudra.loricorpuz.com',
        },
        { merge: true }
      )
    } catch (err) {
      console.error('[mahamudra/join] firestore write failed', err)
    }
  }

  const interestText = interests.length
    ? interests.map((i) => INTEREST_LABELS[i] ?? i).join(', ')
    : 'none marked'

  try {
    await sendToInbox({
      source: 'thesis',
      kind: 'signal',
      severity: 'info',
      title: `Mahamudra: new signup ${email}`,
      body: `Joined the Mahamudra NYC list via the site. Interested in: ${interestText}.`,
      dedupe_key: `mahamudra-signup-${email}`,
    })
  } catch (err) {
    console.error('[mahamudra/join] inbox notify failed', err)
  }

  return NextResponse.json({ ok: true })
}
