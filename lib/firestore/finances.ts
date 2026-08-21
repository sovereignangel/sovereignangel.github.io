import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit as fsLimit, writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { FinanceTransaction, FinanceImportBatch, CollateralLoan, TaxPlan } from '../types'

// ─── TRANSACTIONS ───────────────────────────────────────────────────
// Doc ids are deterministic (hash of date|amount|description|account|n)
// so re-importing the same CSV is idempotent.

export async function getFinanceTransactions(uid: string, max = 1000): Promise<FinanceTransaction[]> {
  const ref = collection(db, 'users', uid, 'finance_transactions')
  const q = query(ref, orderBy('date', 'desc'), fsLimit(max))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as FinanceTransaction)
}

export async function saveFinanceTransactions(
  uid: string,
  txs: (FinanceTransaction & { id: string })[]
): Promise<void> {
  const CHUNK = 400
  for (let i = 0; i < txs.length; i += CHUNK) {
    const batch = writeBatch(db)
    for (const tx of txs.slice(i, i + CHUNK)) {
      const { id, ...data } = tx
      batch.set(doc(db, 'users', uid, 'finance_transactions', id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    await batch.commit()
  }
}

export async function updateFinanceTransaction(
  uid: string, txId: string, data: Partial<FinanceTransaction>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'finance_transactions', txId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteFinanceTransaction(uid: string, txId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'finance_transactions', txId))
}

// ─── IMPORT BATCHES ─────────────────────────────────────────────────

export async function getFinanceImportBatches(uid: string): Promise<FinanceImportBatch[]> {
  const ref = collection(db, 'users', uid, 'finance_import_batches')
  const q = query(ref, orderBy('createdAt', 'desc'), fsLimit(50))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as FinanceImportBatch)
}

export async function saveFinanceImportBatch(uid: string, data: Omit<FinanceImportBatch, 'id' | 'createdAt'>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'finance_import_batches'))
  await setDoc(ref, { ...data, createdAt: serverTimestamp() })
  return ref.id
}

// ─── COLLATERAL LOANS ───────────────────────────────────────────────

export async function getCollateralLoans(uid: string): Promise<CollateralLoan[]> {
  const ref = collection(db, 'users', uid, 'collateral_loans')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CollateralLoan)
}

export async function saveCollateralLoan(uid: string, data: Partial<CollateralLoan>, loanId?: string): Promise<string> {
  if (loanId) {
    await updateDoc(doc(db, 'users', uid, 'collateral_loans', loanId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return loanId
  }
  const ref = doc(collection(db, 'users', uid, 'collateral_loans'))
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export async function deleteCollateralLoan(uid: string, loanId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'collateral_loans', loanId))
}

// ─── TAX PLANS ──────────────────────────────────────────────────────

export async function getTaxPlan(uid: string, year: number): Promise<TaxPlan | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'tax_plans', String(year)))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as TaxPlan
}

export async function saveTaxPlan(uid: string, plan: TaxPlan): Promise<void> {
  const { id: _id, createdAt: _c, ...data } = plan
  await setDoc(doc(db, 'users', uid, 'tax_plans', String(plan.year)), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}
