/**
 * API route for Lordas goals & accountability mutations.
 * Action-based POST: north stars, campaign milestones, weekly commitments
 * with partner lock-in, reviews, and partner notes.
 * Auth: simple PIN check (not Firebase auth — shared dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_NORTH_STARS,
  EMPTY_CAMPAIGN,
  LORDAS_CAMPAIGN_ID,
  MAX_COMMITMENTS_PER_PERSON,
  MAX_MILESTONES_PER_PERSON,
  currentWeekStart,
  nextWeekStart,
  partnerOf,
} from '@/lib/lordas-goals'
import type {
  LordasCampaign,
  LordasCommitment,
  LordasCommitmentStatus,
  LordasMilestone,
  LordasMilestoneStatus,
  LordasPerson,
  LordasWeek,
} from '@/lib/types'

export const runtime = 'nodejs'

const LORDAS_PIN = process.env.LORDAS_PIN || '1234'

const MILESTONE_STATUSES: LordasMilestoneStatus[] = ['on-track', 'at-risk', 'done', 'dropped']
const COMMITMENT_STATUSES: LordasCommitmentStatus[] = ['pending', 'in-progress', 'done', 'partial', 'missed']

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const pin = request.nextUrl.searchParams.get('pin')
  if (pin !== LORDAS_PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const uid = process.env.TRANSCRIPT_WEBHOOK_UID
  if (!uid) {
    return NextResponse.json({ error: 'UID not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action, person } = body as { action: string; person: LordasPerson }

    if (person !== 'lori' && person !== 'aidas') {
      return bad('Invalid person')
    }

    const db = await getAdminDb()
    const userRef = db.collection('users').doc(uid)
    const now = Date.now()
    const newId = () => db.collection('dummy').doc().id

    // ------------------------------------------------------------------
    // North stars
    // ------------------------------------------------------------------
    if (action === 'setNorthStar') {
      const { statement, doneLooksLike, targetDate } = body
      if (!statement?.trim()) return bad('Missing statement')

      const docRef = userRef.collection('lordas_goals').doc('north_stars')
      const snap = await docRef.get()
      const existing = snap.exists ? snap.data()! : {}
      const partner = partnerOf(person)

      await docRef.set({
        [person]: {
          person,
          statement: statement.trim(),
          doneLooksLike: (doneLooksLike || '').trim(),
          targetDate: targetDate || '',
          updatedAt: now,
          updatedBy: person,
        },
        // Seed the partner's default on first write so the doc is complete
        [partner]: existing[partner] || { ...DEFAULT_NORTH_STARS[partner], updatedAt: 0, updatedBy: partner },
        updatedAt: now,
      })
      return NextResponse.json({ success: true })
    }

    // ------------------------------------------------------------------
    // Campaign milestones
    // ------------------------------------------------------------------
    if (action === 'upsertMilestone' || action === 'deleteMilestone') {
      const docRef = userRef.collection('lordas_goals').doc(`campaign_${LORDAS_CAMPAIGN_ID}`)
      const snap = await docRef.get()
      const campaign: LordasCampaign = snap.exists
        ? (snap.data() as LordasCampaign)
        : { ...EMPTY_CAMPAIGN }
      let milestones = [...campaign.milestones]

      if (action === 'deleteMilestone') {
        const { milestoneId } = body
        milestones = milestones.filter(m => m.id !== milestoneId)
      } else {
        const m = body.milestone as Partial<LordasMilestone>
        if (!m?.title?.trim()) return bad('Missing milestone title')
        const status: LordasMilestoneStatus = MILESTONE_STATUSES.includes(m.status as LordasMilestoneStatus)
          ? (m.status as LordasMilestoneStatus)
          : 'on-track'

        if (m.id) {
          const idx = milestones.findIndex(x => x.id === m.id)
          if (idx === -1) return bad('Milestone not found', 404)
          milestones[idx] = {
            ...milestones[idx],
            title: m.title.trim(),
            metric: (m.metric || '').trim(),
            target: (m.target || '').trim(),
            current: (m.current || '').trim(),
            status,
            updatedAt: now,
          }
        } else {
          const activeCount = milestones.filter(x => x.person === person && x.status !== 'dropped').length
          if (activeCount >= MAX_MILESTONES_PER_PERSON) {
            return bad(`Max ${MAX_MILESTONES_PER_PERSON} active milestones per person`)
          }
          milestones.push({
            id: newId(),
            person,
            title: m.title.trim(),
            metric: (m.metric || '').trim(),
            target: (m.target || '').trim(),
            current: (m.current || '').trim(),
            status,
            sortOrder: milestones.filter(x => x.person === person).length,
            createdAt: now,
            updatedAt: now,
          })
        }
      }

      await docRef.set({ ...campaign, milestones, updatedAt: now })
      return NextResponse.json({ success: true })
    }

    // ------------------------------------------------------------------
    // Weekly sprint
    // ------------------------------------------------------------------
    const weekActions = ['upsertCommitment', 'deleteCommitment', 'lockCommitment', 'setCommitmentStatus', 'submitReview', 'submitPartnerNote']
    if (weekActions.includes(action)) {
      const { weekStart } = body
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart || '')) return bad('Invalid weekStart')

      const thisWeek = currentWeekStart()
      const comingWeek = nextWeekStart()
      const isMutableWeek = weekStart === thisWeek || weekStart === comingWeek
      if ((action === 'upsertCommitment' || action === 'deleteCommitment') && !isMutableWeek) {
        return bad('Commitments can only be edited for the current or next week')
      }

      const docRef = userRef.collection('lordas_weeks').doc(weekStart)
      const snap = await docRef.get()
      const week: LordasWeek = snap.exists
        ? (snap.data() as LordasWeek)
        : { weekStart, commitments: [], reviews: {}, partnerNotes: {}, createdAt: now, updatedAt: now }

      if (action === 'upsertCommitment') {
        const c = body.commitment as Partial<LordasCommitment>
        if (!c?.title?.trim()) return bad('Missing commitment title')

        if (c.id) {
          const idx = week.commitments.findIndex(x => x.id === c.id)
          if (idx === -1) return bad('Commitment not found', 404)
          const existing = week.commitments[idx]
          if (existing.person !== person) return bad('Only the owner can edit a commitment', 403)
          if (existing.lockedBy) return bad('Commitment is locked — the text can no longer change', 403)
          week.commitments[idx] = {
            ...existing,
            title: c.title.trim(),
            milestoneId: c.milestoneId || undefined,
            why: (c.why || '').trim() || undefined,
            updatedAt: now,
          }
        } else {
          const mineCount = week.commitments.filter(x => x.person === person).length
          if (mineCount >= MAX_COMMITMENTS_PER_PERSON) {
            return bad(`Max ${MAX_COMMITMENTS_PER_PERSON} commitments per person per week`)
          }
          week.commitments.push({
            id: newId(),
            person,
            title: c.title.trim(),
            milestoneId: c.milestoneId || undefined,
            why: (c.why || '').trim() || undefined,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          })
        }
      }

      if (action === 'deleteCommitment') {
        const target = week.commitments.find(x => x.id === body.commitmentId)
        if (!target) return bad('Commitment not found', 404)
        if (target.person !== person) return bad('Only the owner can delete a commitment', 403)
        if (target.lockedBy) return bad('Commitment is locked and cannot be deleted', 403)
        week.commitments = week.commitments.filter(x => x.id !== body.commitmentId)
      }

      if (action === 'lockCommitment') {
        const target = week.commitments.find(x => x.id === body.commitmentId)
        if (!target) return bad('Commitment not found', 404)
        if (target.person === person) return bad('Only your partner can lock your commitment', 403)
        if (!target.lockedBy) {
          target.lockedBy = person
          target.lockedAt = now
          target.updatedAt = now
        }
      }

      if (action === 'setCommitmentStatus') {
        const { commitmentId, status } = body
        if (!COMMITMENT_STATUSES.includes(status)) return bad('Invalid status')
        const target = week.commitments.find(x => x.id === commitmentId)
        if (!target) return bad('Commitment not found', 404)
        if (target.person !== person) return bad('Only the owner can set status', 403)
        target.status = status
        target.updatedAt = now
      }

      if (action === 'submitReview') {
        const { win, lesson } = body
        if (!win?.trim() && !lesson?.trim()) return bad('Missing win or lesson')
        week.reviews = {
          ...week.reviews,
          [person]: { person, win: (win || '').trim(), lesson: (lesson || '').trim(), submittedAt: now },
        }
      }

      if (action === 'submitPartnerNote') {
        const { text } = body
        if (!text?.trim()) return bad('Missing note text')
        week.partnerNotes = {
          ...week.partnerNotes,
          [person]: { from: person, about: partnerOf(person), text: text.trim(), createdAt: now },
        }
      }

      week.updatedAt = now
      await docRef.set(cleanUndefined(week))
      return NextResponse.json({ success: true })
    }

    return bad(`Unknown action: ${action}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[lordas/goals] Error:', msg)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}

/** Firestore rejects undefined values — strip them from nested objects/arrays. */
function cleanUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(cleanUndefined) as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = cleanUndefined(v)
    }
    return out as T
  }
  return value
}
