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
  GOAL_CATEGORIES,
  GOAL_OWNERS,
  MAX_COMMITMENTS_PER_OWNER,
  MAX_MILESTONES_PER_OWNER,
  activeCampaignId,
  campaignDef,
  currentWeekStart,
  emptyCampaign,
  nextCampaignDef,
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
  LordasRetro,
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
    // Campaign — the overarching goal (charter), its milestones (KPIs), and
    // the retrospective that closes it out
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    // Carry forward — copy the marked milestones into the next campaign
    // ------------------------------------------------------------------
    if (action === 'carryForwardMilestones') {
      const fromId = body.campaignId
      const fromDef = campaignDef(fromId)
      if (!fromDef) return bad('Unknown campaign')
      const toDef = nextCampaignDef(fromId)
      if (!toDef) return bad('No campaign after this one to carry into')

      const fromRef = userRef.collection('lordas_goals').doc(`campaign_${fromId}`)
      const toRef = userRef.collection('lordas_goals').doc(`campaign_${toDef.id}`)
      const [fromSnap, toSnap] = await Promise.all([fromRef.get(), toRef.get()])
      if (!fromSnap.exists) return bad('Nothing to carry forward', 404)

      const from: LordasCampaign = { ...emptyCampaign(fromId), ...(fromSnap.data() as LordasCampaign) }
      const to: LordasCampaign = toSnap.exists
        ? { ...emptyCampaign(toDef.id), ...(toSnap.data() as LordasCampaign) }
        : emptyCampaign(toDef.id)
      const picks = (from.retro?.carryForward || [])
        .map(id => from.milestones.find(m => m.id === id))
        .filter((m): m is LordasMilestone => !!m)
      if (picks.length === 0) return bad('No milestones are marked to carry forward')

      // Carried milestones are copies, not moves: the finished campaign keeps
      // its own record intact, and the new one starts them fresh at on-track
      // with the achieved value as the new starting point.
      const carried: LordasMilestone[] = []
      const skipped: string[] = []
      for (const m of picks) {
        const already = to.milestones.some(x => x.carriedFrom === m.id)
        const room = to.milestones.filter(x => x.person === m.person && x.status !== 'dropped').length
          + carried.filter(x => x.person === m.person).length
        if (already || room >= MAX_MILESTONES_PER_OWNER) {
          skipped.push(m.title)
          continue
        }
        carried.push({
          ...m,
          id: newId(),
          carriedFrom: m.id,
          status: 'on-track',
          sortOrder: to.milestones.filter(x => x.person === m.person).length + carried.filter(x => x.person === m.person).length,
          createdAt: now,
          updatedAt: now,
        })
      }

      if (carried.length > 0) {
        await toRef.set(cleanUndefined({ ...to, milestones: [...to.milestones, ...carried], updatedAt: now }))
      }
      const carriedInto = Array.from(new Set([...(from.retro?.carriedInto || []), toDef.id]))
      await fromRef.set(
        cleanUndefined({ ...from, retro: { reflections: {}, carryForward: [], ...(from.retro || {}), carriedInto, updatedAt: now } })
      )
      return NextResponse.json({ success: true, carried: carried.length, skipped })
    }

    const campaignActions = [
      'setCampaignCharter',
      'upsertMilestone',
      'deleteMilestone',
      'setRetroReflection',
      'toggleCarryForward',
    ]
    if (campaignActions.includes(action)) {
      // Unstated campaign means the one today falls in. A stated one must be
      // in the registry: an id nobody declared would write a doc the dashboard
      // never reads back.
      const campaignId = body.campaignId || activeCampaignId()
      if (!campaignDef(campaignId)) return bad('Unknown campaign')

      const docRef = userRef.collection('lordas_goals').doc(`campaign_${campaignId}`)
      const snap = await docRef.get()
      const campaign: LordasCampaign = snap.exists
        ? { ...emptyCampaign(campaignId), ...(snap.data() as LordasCampaign) }
        : emptyCampaign(campaignId)
      let milestones = [...campaign.milestones]
      const charters = { ...(campaign.charters || {}) }
      const retro: LordasRetro = {
        reflections: {},
        carryForward: [],
        updatedAt: 0,
        ...(campaign.retro || {}),
      }

      if (action === 'setRetroReflection') {
        const owner = asOwner(body.owner, person)
        if (!owner) return bad('Invalid owner')
        const worked = (body.worked || '').trim()
        const didnt = (body.didnt || '').trim()
        const carries = (body.carries || '').trim()
        if (!worked && !didnt && !carries) {
          delete retro.reflections[owner]
        } else {
          retro.reflections[owner] = { owner, worked, didnt, carries, updatedAt: now, updatedBy: person }
        }
        retro.updatedAt = now
      }

      if (action === 'toggleCarryForward') {
        const { milestoneId } = body
        if (!milestones.some((m) => m.id === milestoneId)) return bad('Milestone not found', 404)
        retro.carryForward = retro.carryForward.includes(milestoneId)
          ? retro.carryForward.filter((id) => id !== milestoneId)
          : [...retro.carryForward, milestoneId]
        retro.updatedAt = now
      }

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
        // A carry-forward pick pointing at a milestone that no longer exists
        // would silently drop out of the copy, so clear it here instead.
        retro.carryForward = retro.carryForward.filter(id => id !== milestoneId)
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

      await docRef.set(cleanUndefined({ ...campaign, charters, milestones, retro, updatedAt: now }))
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
