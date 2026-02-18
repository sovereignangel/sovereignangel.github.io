import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { SalesAssessment } from '../types'

export async function getSalesAssessment(uid: string, date: string): Promise<SalesAssessment | null> {
  const ref = doc(db, 'users', uid, 'sales_assessments', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as SalesAssessment : null
}

export async function getLatestSalesAssessment(uid: string): Promise<SalesAssessment | null> {
  const ref = collection(db, 'users', uid, 'sales_assessments')
  const q = query(ref, orderBy('date', 'desc'), limit(1))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as SalesAssessment
}

export async function getRecentSalesAssessments(uid: string, count: number = 6): Promise<SalesAssessment[]> {
  const ref = collection(db, 'users', uid, 'sales_assessments')
  const q = query(ref, orderBy('date', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SalesAssessment)
}

export async function saveSalesAssessment(uid: string, date: string, data: Partial<SalesAssessment>): Promise<void> {
  const ref = doc(db, 'users', uid, 'sales_assessments', date)
  await setDoc(ref, {
    ...data,
    date,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true })
}

export async function updateSalesAssessment(uid: string, date: string, data: Partial<SalesAssessment>): Promise<void> {
  const ref = doc(db, 'users', uid, 'sales_assessments', date)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}
