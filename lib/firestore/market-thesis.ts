import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { MarketThesisState } from '../types'

const thesisDocRef = (uid: string) => doc(db, 'users', uid, 'market_thesis', 'state')

export async function getMarketThesis(uid: string): Promise<MarketThesisState | null> {
  const snap = await getDoc(thesisDocRef(uid))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as MarketThesisState
}

export async function saveMarketThesis(uid: string, data: Partial<MarketThesisState>): Promise<void> {
  await setDoc(thesisDocRef(uid), {
    ...data,
    updatedAt: new Date().toISOString(),
    serverUpdatedAt: serverTimestamp(),
  }, { merge: true })
}
