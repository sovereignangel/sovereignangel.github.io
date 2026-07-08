/**
 * API route for Lordas dashboard data.
 * Returns relationship conversations, themes, values, and snapshots.
 * Auth: simple PIN check (not Firebase auth — shared dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_NORTH_STARS,
  EMPTY_CAMPAIGN,
  LORDAS_CAMPAIGN_ID,
  currentWeekStart,
  nextWeekStart,
} from '@/lib/lordas-goals'
import type { LordasGoalsData, LordasNorthStar, LordasWeek } from '@/lib/types'

export const runtime = 'nodejs'

const LORDAS_PIN = process.env.LORDAS_PIN || '1234'

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

export async function GET(request: NextRequest) {
  const pin = request.nextUrl.searchParams.get('pin')
  if (pin !== LORDAS_PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ error: 'UID not configured' }, { status: 500 })
  }

  try {
    const db = await getAdminDb()
    const userRef = db.collection('users').doc(uid)

    // Fetch all data in parallel
    const [convsSnap, themesSnap, valuesSnap, snapshotsSnap, summerPlanSnap, adventureSessionSnap, northStarsSnap, campaignSnap, weeksSnap] = await Promise.all([
      userRef.collection('relationship_conversations').orderBy('date', 'desc').limit(50).get(),
      userRef.collection('relationship_themes').get(),
      userRef.collection('relationship_values').get(),
      userRef.collection('relationship_snapshots').orderBy('date', 'desc').limit(30).get(),
      userRef.collection('summer_plans').orderBy('createdAt', 'desc').limit(1).get(),
      userRef.collection('adventure_sessions').limit(1).get(),
      userRef.collection('lordas_goals').doc('north_stars').get(),
      userRef.collection('lordas_goals').doc(`campaign_${LORDAS_CAMPAIGN_ID}`).get(),
      // No orderBy: descending __name__ needs a composite index; the
      // collection is one doc per week, so sort in code instead.
      userRef.collection('lordas_weeks').get(),
    ])

    const conversations = convsSnap.docs.map(d => d.data())
    const themes = themesSnap.docs.map(d => d.data())
    const values = valuesSnap.docs.map(d => d.data())
    const snapshots = snapshotsSnap.docs.map(d => d.data())

    const summerPlan = summerPlanSnap.docs[0]?.data() || null
    let adventureComments: any[] = []

    if (adventureSessionSnap.docs[0]) {
      const sessionData = adventureSessionSnap.docs[0].data()
      adventureComments = sessionData.comments || []
    }

    // Goals: lazy defaults — north stars and campaign are seeded in the
    // response until the first mutation writes real docs.
    const storedNorthStars = northStarsSnap.exists ? northStarsSnap.data() : null
    const northStars: LordasGoalsData['northStars'] = {
      lori: (storedNorthStars?.lori as LordasNorthStar) || { ...DEFAULT_NORTH_STARS.lori, updatedAt: 0, updatedBy: 'lori' },
      aidas: (storedNorthStars?.aidas as LordasNorthStar) || { ...DEFAULT_NORTH_STARS.aidas, updatedAt: 0, updatedBy: 'aidas' },
      relationship:
        (storedNorthStars?.relationship as LordasNorthStar) || { ...DEFAULT_NORTH_STARS.relationship, updatedAt: 0, updatedBy: 'lori' },
    }
    const campaign = campaignSnap.exists
      ? { charters: {}, ...(campaignSnap.data() as LordasGoalsData['campaign']) }
      : EMPTY_CAMPAIGN

    const thisWeek = currentWeekStart()
    const comingWeek = nextWeekStart()
    const weeks = weeksSnap.docs
      .map(d => d.data() as LordasWeek)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    const goals: LordasGoalsData = {
      northStars,
      campaign,
      currentWeek: weeks.find(w => w.weekStart === thisWeek) || null,
      nextWeek: weeks.find(w => w.weekStart === comingWeek) || null,
      weekHistory: weeks.filter(w => w.weekStart < thisWeek).slice(0, 26),
    }

    return NextResponse.json({
      conversations,
      themes,
      values,
      snapshots,
      summerPlan,
      adventureComments,
      goals,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[lordas/data] Error:', msg)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
