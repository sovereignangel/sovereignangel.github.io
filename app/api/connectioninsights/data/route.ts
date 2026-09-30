/**
 * GET /api/connectioninsights/data
 * The signed-in user's conversations, themes, values, and snapshots.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ROOT, getDb, requireUser } from '@/lib/connectioninsights/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (user instanceof NextResponse) return user

  try {
    const ref = (await getDb()).collection(ROOT).doc(user.uid)
    const [convs, themes, values, snapshots] = await Promise.all([
      ref.collection('conversations').orderBy('date', 'desc').limit(50).get(),
      ref.collection('themes').get(),
      ref.collection('values').get(),
      ref.collection('snapshots').orderBy('date', 'desc').limit(30).get(),
    ])
    return NextResponse.json({
      conversations: convs.docs.map(d => d.data()),
      themes: themes.docs.map(d => d.data()),
      values: values.docs.map(d => d.data()),
      snapshots: snapshots.docs.map(d => d.data()),
    })
  } catch (error) {
    console.error('[connectioninsights/data]', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
