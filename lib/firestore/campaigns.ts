/**
 * Campaign progress — per-domain, so each site owns its own data and /exec
 * is only a view onto it.
 *
 *   users/{uid}/complexecon_progress/main   units + pathway milestones
 *   users/{uid}/armstrong_progress/main     units
 *   users/{uid}/armstrong_days/{date}       the daily desk ritual
 *
 * Unit ids are written as object keys under `units` rather than as dotted
 * field paths, so an id containing a dot can never be read as a nested path.
 */

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  deleteField,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { CampaignId } from '../campaign/types'
import type { CampaignProgressDoc, CampaignRitualDay } from '../types/campaign'

const PROGRESS_COLLECTION: Record<CampaignId, string> = {
  complexecon: 'complexecon_progress',
  armstrong: 'armstrong_progress',
}

const DAYS_COLLECTION: Partial<Record<CampaignId, string>> = {
  armstrong: 'armstrong_days',
}

const progressRef = (uid: string, id: CampaignId) =>
  doc(db, 'users', uid, PROGRESS_COLLECTION[id], 'main')

function daysRef(uid: string, id: CampaignId) {
  const name = DAYS_COLLECTION[id]
  if (!name) throw new Error(`Campaign "${id}" has no ritual collection`)
  return collection(db, 'users', uid, name)
}

export async function getCampaignProgress(
  uid: string,
  id: CampaignId
): Promise<CampaignProgressDoc> {
  const snap = await getDoc(progressRef(uid, id))
  return snap.exists() ? (snap.data() as CampaignProgressDoc) : {}
}

/** Ticking a unit records when; unticking removes the record entirely. */
export async function setCampaignUnit(
  uid: string,
  id: CampaignId,
  unitId: string,
  done: boolean,
  note?: string
): Promise<void> {
  await setDoc(
    progressRef(uid, id),
    {
      units: {
        [unitId]: done
          ? { doneAt: Timestamp.now(), ...(note ? { note } : {}) }
          : deleteField(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function setCampaignMilestone(
  uid: string,
  id: CampaignId,
  milestoneId: string,
  on: boolean
): Promise<void> {
  await setDoc(
    progressRef(uid, id),
    {
      milestones: { [milestoneId]: on ? true : deleteField() },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

/**
 * One-time lift of locally-stored checkboxes into Firestore. Only runs when
 * the remote document has never been migrated and has no milestones of its
 * own, so a device with a stale localStorage copy can never resurrect a
 * milestone that was deliberately unticked elsewhere.
 */
export async function migrateCampaignMilestones(
  uid: string,
  id: CampaignId,
  localIds: string[]
): Promise<boolean> {
  if (localIds.length === 0) return false
  const existing = await getCampaignProgress(uid, id)
  if (existing.migratedAt || Object.keys(existing.milestones || {}).length > 0) return false

  const milestones: Record<string, boolean> = {}
  for (const key of localIds) if (key) milestones[key] = true

  await setDoc(
    progressRef(uid, id),
    { milestones, migratedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  )
  return true
}

export async function getRitualDay(
  uid: string,
  id: CampaignId,
  date: string
): Promise<CampaignRitualDay | null> {
  const snap = await getDoc(doc(daysRef(uid, id), date))
  return snap.exists() ? (snap.data() as CampaignRitualDay) : null
}

export async function setRitualDay(
  uid: string,
  id: CampaignId,
  date: string,
  done: boolean,
  note?: string
): Promise<void> {
  await setDoc(
    doc(daysRef(uid, id), date),
    {
      date,
      done,
      ...(note !== undefined ? { note } : {}),
      completedAt: done ? Timestamp.now() : deleteField(),
    },
    { merge: true }
  )
}

/** Ritual days from `from` (inclusive) forward — enough to read a streak. */
export async function getRitualDays(
  uid: string,
  id: CampaignId,
  from: string
): Promise<CampaignRitualDay[]> {
  const q = query(daysRef(uid, id), where('date', '>=', from), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as CampaignRitualDay)
}
