/**
 * Adventure Scheming votes - Firestore operations
 */

import { doc, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import type { PlanVote } from '@/lib/types'
import type { RelationalSpeaker } from '@/lib/types'

/**
 * Record a plan vote (swipe)
 */
export async function recordPlanVote(
  uid: string,
  planId: string,
  user: RelationalSpeaker,
  vote: 'right' | 'left' | 'maybe',
  feedback?: string
): Promise<string> {
  const userRef = doc(clientDb, 'users', uid)
  const votesRef = collection(userRef, 'plan_votes')

  const result = await addDoc(votesRef, {
    planId,
    user,
    vote,
    feedback: feedback || null,
    timestamp: Timestamp.now(),
  })

  return result.id
}

/**
 * Get all votes for a session
 */
export async function getSessionVotes(uid: string): Promise<PlanVote[]> {
  const userRef = doc(clientDb, 'users', uid)
  const votesRef = collection(userRef, 'plan_votes')
  const snapshot = await getDocs(votesRef)

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as PlanVote[]
}

/**
 * Get votes for a specific plan
 */
export async function getPlanVotes(uid: string, planId: string): Promise<PlanVote[]> {
  const userRef = doc(clientDb, 'users', uid)
  const votesRef = collection(userRef, 'plan_votes')
  const q = query(votesRef, where('planId', '==', planId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as PlanVote[]
}

/**
 * Get votes by user
 */
export async function getUserVotes(uid: string, user: RelationalSpeaker): Promise<PlanVote[]> {
  const userRef = doc(clientDb, 'users', uid)
  const votesRef = collection(userRef, 'plan_votes')
  const q = query(votesRef, where('user', '==', user))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as PlanVote[]
}
