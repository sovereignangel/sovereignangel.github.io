/**
 * API route for Lordas goals & accountability mutations.
 * Action-based POST: north stars, campaign charters + milestones, weekly
 * commitments with partner lock-in, reviews, and partner notes.
 * Goals are owned by 'lori', 'aidas', or 'relationship'; either partner may
 * create/edit on any owner's behalf while a commitment is unlocked. The
 * countersign (lock) must come from someone other than the proposer.
 * Auth: simple PIN check (not Firebase auth — shared dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  DEFAULT_NORTH_STARS,
  EMPTY_CAMPAIGN,
  GOAL_CATEGORIES,
  GOAL_OWNERS,
  LORDAS_CAMPAIGN_ID,
  MAX_COMMITMENTS_PER_OWNER,
  MAX_MILESTONES_PER_OWNER,
  currentWeekStart,
  nextWeekStart,
  partnerOf,
  proposerOf,
} from '@/lib/lordas-goals'
import type {
  LordasCampaign,
  LordasCommitment,
  LordasCommitmentStatus,
  LordasGoalCategory,
  LordasGoalOwner,
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

function asOwner(value: unknown, fallback: LordasGoalOwner): LordasGoalOwner | null {
  if (value === undefined || value === null || value === '') return fallback
  return GOAL_OWNERS.includes(value as LordasGoalOwner) ? (value as LordasGoalOwner) : null
}

function asCategory(value: unknown): LordasGoalCategory | undefined {
  return GOAL_CATEGORIES.includes(value as LordasGoalCategory) ? (value as LordasGoalCategory) : undefined
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
    // North stars — identity statements per owner
    // ------------------------------------------------------------------
    if (action === 'setNorthStar') {
      const { statement, doneLooksLike, targetDate } = body
      const owner = asOwner(body.owner, person)
      if (!owner) return bad('Invalid owner')
      if (!statement?.trim()) return bad('Missing statement')
      if (owner !== person && owner !== 'relationship') {
        return bad('You can only edit your own or the relationship north star', 403)
      }

      const docRef = userRef.collection('lordas_goals').doc('north_stars')
      const snap = await docRef.get()
      const existing = snap.exists ? snap.data()! : {}

      const update: Record<string, unknown> = { updatedAt: now }
      for (const o of GOAL_OWNERS) {
        update[o] =
          o === owner
            ? {
                person: owner,
                statement: statement.trim(),
                doneLooksLike: (doneLooksLike || '').trim(),
                targetDate: targetDate || '',
                updatedAt: now,
                updatedBy: person,
              }
            : existing[o] || { ...DEFAULT_NORTH_STARS[o], updatedAt: 0, updatedBy: 'lori' }
      }
      await docRef.set(update)
      return NextResponse.json({ success: true })
    }

    // ------------------------------------------------------------------
    // Campaign — overarching summer goal (charter) + milestones (KPIs)
    // ------------------------------------------------------------------
    if (action === 'setCampaignCharter' || action === 'upsertMilestone' || action === 'deleteMilestone') {
      const docRef = userRef.collection('lordas_goals').doc(`campaign_${LORDAS_CAMPAIGN_ID}`)
      const snap = await docRef.get()
      const campaign: LordasCampaign = snap.exists
        ? { charters: {}, ...(snap.data() as LordasCampaign) }
        : { ...EMPTY_CAMPAIGN }
      let milestones = [...campaign.milestones]
      const charters = { ...(campaign.charters || {}) }

      if (action === 'setCampaignCharter') {
        const owner = asOwner(body.owner, person)
        if (!owner) return bad('Invalid owner')
        if (!body.statement?.trim()) {
          // Empty statement clears the charter
          delete charters[owner]
        } else {
          charters[owner] = {
            owner,
            statement: body.statement.trim(),
            doneLooksLike: (body.doneLooksLike || '').trim(),
            updatedAt: now,
            updatedBy: person,
          }
        }
      }

      if (action === 'deleteMilestone') {
        const { milestoneId } = body
        milestones = milestones.filter(m => m.id !== milestoneId)
      }

      if (action === 'upsertMilestone') {
        const m = body.milestone as Partial<LordasMilestone>
        if (!m?.title?.trim()) return bad('Missing milestone title')
        const status: LordasMilestoneStatus = MILESTONE_STATUSES.includes(m.status as LordasMilestoneStatus)
          ? (m.status as LordasMilestoneStatus)
          : 'on-track'
        const category = asCategory(m.category)

        if (m.id) {
          const idx = milestones.findIndex(x => x.id === m.id)
          if (idx === -1) return bad('Milestone not found', 404)
          milestones[idx] = {
            ...milestones[idx],
            title: m.title.trim(),
            metric: (m.metric || '').trim(),
            target: (m.target || '').trim(),
            current: (m.current || '').trim(),
            category,
            status,
            updatedAt: now,
          }
        } else {
          const owner = asOwner(m.person, person)
          if (!owner) return bad('Invalid owner')
          const activeCount = milestones.filter(x => x.person === owner && x.status !== 'dropped').length
          if (activeCount >= MAX_MILESTONES_PER_OWNER) {
            return bad(`Max ${MAX_MILESTONES_PER_OWNER} active milestones per owner`)
          }
          milestones.push({
            id: newId(),
            person: owner,
            title: m.title.trim(),
            metric: (m.metric || '').trim(),
            target: (m.target || '').trim(),
            current: (m.current || '').trim(),
            category,
            status,
            sortOrder: milestones.filter(x => x.person === owner).length,
            createdAt: now,
            updatedAt: now,
          })
        }
      }

      await docRef.set(cleanUndefined({ ...campaign, charters, milestones, updatedAt: now }))
      return NextResponse.json({ success: true })
    }

    // ------------------------------------------------------------------
    // Weekly sprint
    // ------------------------------------------------------------------
    const weekActions = ['upsertCommitment', 'deleteCommitment', 'lockCommitment', 'unlockCommitment', 'setCommitmentStatus', 'submitReview', 'submitPartnerNote']
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
        const category = asCategory(c.category)

        if (c.id) {
          const idx = week.commitments.findIndex(x => x.id === c.id)
          if (idx === -1) return bad('Commitment not found', 404)
          const existing = week.commitments[idx]
          if (existing.lockedBy) return bad('Commitment is locked — the text can no longer change', 403)
          week.commitments[idx] = {
            ...existing,
            title: c.title.trim(),
            successCriteria: (c.successCriteria || '').trim() || undefined,
            milestoneId: c.milestoneId || undefined,
            category,
            why: (c.why || '').trim() || undefined,
            updatedAt: now,
          }
        } else {
          const owner = asOwner(c.person, person)
          if (!owner) return bad('Invalid owner')
          const ownerCount = week.commitments.filter(x => x.person === owner).length
          if (ownerCount >= MAX_COMMITMENTS_PER_OWNER) {
            return bad(`Max ${MAX_COMMITMENTS_PER_OWNER} commitments per owner per week`)
          }
          week.commitments.push({
            id: newId(),
            person: owner,
            createdBy: person,
            title: c.title.trim(),
            successCriteria: (c.successCriteria || '').trim() || undefined,
            milestoneId: c.milestoneId || undefined,
            category,
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
        if (target.lockedBy) return bad('Commitment is locked and cannot be deleted', 403)
        week.commitments = week.commitments.filter(x => x.id !== body.commitmentId)
      }

      if (action === 'lockCommitment') {
        const target = week.commitments.find(x => x.id === body.commitmentId)
        if (!target) return bad('Commitment not found', 404)
        if (proposerOf(target) === person) {
          return bad('The proposer cannot countersign their own commitment', 403)
        }
        if (!target.lockedBy) {
          target.lockedBy = person
          target.lockedAt = now
          target.updatedAt = now
        }
      }

      if (action === 'unlockCommitment') {
        const target = week.commitments.find(x => x.id === body.commitmentId)
        if (!target) return bad('Commitment not found', 404)
        if (!target.lockedBy) return bad('Commitment is not locked')
        if (target.lockedBy !== person) {
          return bad('Only whoever countersigned can withdraw the lock', 403)
        }
        target.lockedBy = undefined
        target.lockedAt = undefined
        target.updatedAt = now
      }

      if (action === 'setCommitmentStatus') {
        const { commitmentId, status } = body
        if (!COMMITMENT_STATUSES.includes(status)) return bad('Invalid status')
        const target = week.commitments.find(x => x.id === commitmentId)
        if (!target) return bad('Commitment not found', 404)
        if (target.person !== person && target.person !== 'relationship') {
          return bad('Only the owner can set status', 403)
        }
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
