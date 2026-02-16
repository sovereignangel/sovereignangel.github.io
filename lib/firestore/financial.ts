import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, limit as firestoreLimit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { FinancialSnapshot } from '../types'

function computeDerived(data: Partial<FinancialSnapshot>): Partial<FinancialSnapshot> {
  const totalAssets = (data.cashSavings || 0) + (data.investments || 0) + (data.crypto || 0) +
    (data.realEstate || 0) + (data.startupEquity || 0) + (data.otherAssets || 0)
  const netWorth = totalAssets - (data.totalDebt || 0)
  const income = data.monthlyIncome || 0
  const expenses = data.monthlyExpenses || 0
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  const runwayMonths = expenses > 0 ? (data.cashSavings || 0) / expenses : 0

  return { ...data, totalAssets, netWorth, savingsRate, runwayMonths }
}

export async function saveFinancialSnapshot(uid: string, data: Partial<FinancialSnapshot> & { month: string }): Promise<void> {
  const computed = computeDerived(data)
  const ref = doc(db, 'users', uid, 'financial_snapshots', data.month)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await setDoc(ref, { ...computed, updatedAt: serverTimestamp() }, { merge: true })
  } else {
    await setDoc(ref, {
      cashSavings: 0,
      investments: 0,
      crypto: 0,
      realEstate: 0,
      startupEquity: 0,
      otherAssets: 0,
      totalDebt: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      totalAssets: 0,
      netWorth: 0,
      savingsRate: 0,
      runwayMonths: 0,
      ...computed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function getFinancialSnapshot(uid: string, month: string): Promise<FinancialSnapshot | null> {
  const ref = doc(db, 'users', uid, 'financial_snapshots', month)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as FinancialSnapshot : null
}

export async function getFinancialHistory(uid: string, count: number = 12): Promise<FinancialSnapshot[]> {
  const ref = collection(db, 'users', uid, 'financial_snapshots')
  const q = query(ref, orderBy('month', 'desc'), firestoreLimit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as FinancialSnapshot).reverse()
}
