import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { SalesAssessment } from '../types'

export async function getSalesAssessment(uid: string, date: string): Promise<SalesAssessment | null> {
  const ref = doc(db, 'users', uid, 'sales_assessments', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as SalesAssessment : null
}

export async function getLatestSalesAssessment(uid: string): Promise<SalesAssessment | null> {
  const ref = collection(db, 'users', uid, 'sales_assessments')
  const snap = await getDocs(query(ref))
  if (snap.empty) return null
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }) as SalesAssessment)
  all.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return all[0]
}

export async function getRecentSalesAssessments(uid: string, count: number = 6): Promise<SalesAssessment[]> {
  const ref = collection(db, 'users', uid, 'sales_assessments')
  const snap = await getDocs(query(ref))
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }) as SalesAssessment)
  all.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return all.slice(0, count)
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
