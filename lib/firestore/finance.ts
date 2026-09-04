import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { TaxInputs } from '../finance/tax-2025'

/** users/{uid}/finance/tax-{year}: the model inputs and the checklist state. */
export interface TaxSheetDoc {
  inputs?: Partial<TaxInputs>
  checks?: Record<string, boolean>
  notes?: Record<string, string>
}

const sheetRef = (uid: string, year: number) => doc(db, 'users', uid, 'finance', `tax-${year}`)

export async function getTaxSheet(uid: string, year: number): Promise<TaxSheetDoc | null> {
  const snap = await getDoc(sheetRef(uid, year))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    inputs: (data.inputs as Partial<TaxInputs>) || {},
    checks: (data.checks as Record<string, boolean>) || {},
    notes: (data.notes as Record<string, string>) || {},
  }
}

export async function saveTaxSheet(uid: string, year: number, patch: TaxSheetDoc): Promise<void> {
  await setDoc(sheetRef(uid, year), { ...patch, updatedAt: serverTimestamp() }, { merge: true })
}
