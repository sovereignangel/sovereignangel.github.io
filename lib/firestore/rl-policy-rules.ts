import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { PolicyRule } from '../types'

export async function getRLPolicyRules(uid: string, activeOnly?: boolean): Promise<PolicyRule[]> {
  const ref = collection(db, 'users', uid, 'rl_policy_rules')
  let q
  if (activeOnly) {
    q = query(ref, where('isActive', '==', true), orderBy('matchCount', 'desc'))
  } else {
    q = query(ref, orderBy('matchCount', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PolicyRule)
}

export async function saveRLPolicyRule(uid: string, data: Partial<PolicyRule>, ruleId?: string): Promise<string> {
  if (ruleId) {
    const ref = doc(db, 'users', uid, 'rl_policy_rules', ruleId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return ruleId
  } else {
    const ref = doc(collection(db, 'users', uid, 'rl_policy_rules'))
    await setDoc(ref, {
      ...data,
      matchCount: 0,
      followedCount: 0,
      avgRewardWhenFollowed: null,
      avgRewardWhenIgnored: null,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteRLPolicyRule(uid: string, ruleId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'rl_policy_rules', ruleId))
}
