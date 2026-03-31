/**
 * Firestore CRUD for Lordas relationship dashboard.
 * All data stored under users/{uid}/relationship_* collections.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  RelationshipConversation,
  RelationshipTheme,
  RelationshipValue,
  RelationshipSnapshot,
  PillarScores,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

const CONVERSATIONS_COL = 'relationship_conversations'

export async function getRelationshipConversations(
  uid: string,
  max = 50
): Promise<RelationshipConversation[]> {
  const ref = collection(db, 'users', uid, CONVERSATIONS_COL)
  const q = query(ref, orderBy('date', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as RelationshipConversation)
}

export async function getRelationshipConversation(
  uid: string,
  id: string
): Promise<RelationshipConversation | null> {
  const ref = doc(db, 'users', uid, CONVERSATIONS_COL, id)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as RelationshipConversation) : null
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

const THEMES_COL = 'relationship_themes'

export async function getRelationshipThemes(uid: string): Promise<RelationshipTheme[]> {
  const ref = collection(db, 'users', uid, THEMES_COL)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as RelationshipTheme)
}

export async function saveRelationshipTheme(
  uid: string,
  theme: Omit<RelationshipTheme, 'id'> & { id?: string }
): Promise<string> {
  const id = theme.id || doc(collection(db, 'users', uid, THEMES_COL)).id
  const ref = doc(db, 'users', uid, THEMES_COL, id)
  await setDoc(ref, { ...theme, id, updatedAt: Timestamp.now() }, { merge: true })
  return id
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

const VALUES_COL = 'relationship_values'

export async function getRelationshipValues(uid: string): Promise<RelationshipValue[]> {
  const ref = collection(db, 'users', uid, VALUES_COL)
  const snap = await getDocs(ref)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as RelationshipValue)
}

// ---------------------------------------------------------------------------
// Snapshots (rolling scores)
// ---------------------------------------------------------------------------

const SNAPSHOTS_COL = 'relationship_snapshots'

export async function getRelationshipSnapshots(
  uid: string,
  max = 30
): Promise<RelationshipSnapshot[]> {
  const ref = collection(db, 'users', uid, SNAPSHOTS_COL)
  const q = query(ref, orderBy('date', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as RelationshipSnapshot)
}

export async function saveRelationshipSnapshot(
  uid: string,
  snapshot: RelationshipSnapshot
): Promise<void> {
  const ref = doc(db, 'users', uid, SNAPSHOTS_COL, snapshot.date)
  await setDoc(ref, snapshot, { merge: true })
}

// ---------------------------------------------------------------------------
// Compute rolling average from recent conversations
// ---------------------------------------------------------------------------

export function computeRollingAverage(
  conversations: RelationshipConversation[],
  window = 5
): PillarScores {
  const recent = conversations.slice(0, window)
  if (recent.length === 0) return { safety: 0, growth: 0, alignment: 0, composite: 0 }

  const sum = recent.reduce(
    (acc, c) => ({
      safety: acc.safety + c.scores.safety,
      growth: acc.growth + c.scores.growth,
      alignment: acc.alignment + c.scores.alignment,
      composite: acc.composite + c.scores.composite,
    }),
    { safety: 0, growth: 0, alignment: 0, composite: 0 }
  )

  const n = recent.length
  return {
    safety: Math.round((sum.safety / n) * 100) / 100,
    growth: Math.round((sum.growth / n) * 100) / 100,
    alignment: Math.round((sum.alignment / n) * 100) / 100,
    composite: Math.round((sum.composite / n) * 100) / 100,
  }
}
