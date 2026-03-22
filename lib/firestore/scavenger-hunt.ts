import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ScavengerHuntEntry, ScavengerHuntRedemption } from '@/lib/types'

const COLLECTION = 'scavenger_hunt'
const REDEMPTIONS_COLLECTION = 'scavenger_hunt_redemptions'

// Use a fixed UID for Aidas — this is a shared game, not per-user
const GAME_DOC = 'aruba_2026'

function entriesRef() {
  return collection(db, COLLECTION, GAME_DOC, 'entries')
}

function redemptionsRef() {
  return collection(db, COLLECTION, GAME_DOC, 'redemptions')
}

export async function getScavengerHuntEntries(): Promise<ScavengerHuntEntry[]> {
  const q = query(entriesRef(), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScavengerHuntEntry))
}

export async function getScavengerHuntRedemptions(): Promise<ScavengerHuntRedemption[]> {
  const q = query(redemptionsRef(), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ScavengerHuntRedemption))
}

export async function addScavengerHuntEntry(entry: Omit<ScavengerHuntEntry, 'id'>): Promise<string> {
  const docRef = await addDoc(entriesRef(), entry)
  return docRef.id
}

export async function addScavengerHuntRedemption(redemption: Omit<ScavengerHuntRedemption, 'id'>): Promise<string> {
  const docRef = await addDoc(redemptionsRef(), redemption)
  return docRef.id
}
