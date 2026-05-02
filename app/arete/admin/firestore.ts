// Self-contained Firestore CRUD + types for the Arete Mistral admin section.
// Kept inline here (not in lib/firestore/) since it's scoped to one mini-app.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ============================================================
// Types
// ============================================================

export type WeekN = 'I' | 'II' | 'III' | 'IV'

export type BudgetCategory =
  | 'lodging'
  | 'coaching'
  | 'equipment'
  | 'food'
  | 'transport'
  | 'tutor'
  | 'atmosphere'
  | 'media'
  | 'kits'
  | 'admin'
  | 'insurance'
  | 'contingency'
  | 'other'

export interface BudgetItem {
  id: string
  name: string
  amount: number              // EUR — total for this line item across the weeks selected
  category: BudgetCategory
  weeks: WeekN[]              // [] = overall / one-time program cost; populated = per-week
  notes?: string
  charged: boolean
  chargedDate?: string        // ISO date when paid
  chargedBy?: string          // who paid
  createdAt: number
  updatedAt: number
}

export type Priority = 'high' | 'medium' | 'low'

export interface PlanningItem {
  id: string
  text: string
  priority: Priority
  done: boolean
  weekScope?: WeekN | 'overall'
  notes?: string
  createdAt: number
  updatedAt: number
}

// ============================================================
// Collections
// ============================================================

const BUDGET = 'arete_mistral_budget'
const PLANNING = 'arete_mistral_planning'

// ============================================================
// Budget CRUD
// ============================================================

export function subscribeBudget(cb: (items: BudgetItem[]) => void): Unsubscribe {
  const q = query(collection(db, BUDGET), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name || '',
        amount: data.amount || 0,
        category: data.category || 'other',
        weeks: data.weeks || [],
        notes: data.notes || '',
        charged: !!data.charged,
        chargedDate: data.chargedDate || '',
        chargedBy: data.chargedBy || '',
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || 0),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || 0),
      } as BudgetItem
    })
    cb(items)
  })
}

export async function addBudgetItem(item: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>) {
  await addDoc(collection(db, BUDGET), {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateBudgetItem(id: string, patch: Partial<BudgetItem>) {
  const { id: _, createdAt: __, ...rest } = patch
  void _; void __
  await updateDoc(doc(db, BUDGET, id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteBudgetItem(id: string) {
  await deleteDoc(doc(db, BUDGET, id))
}

// ============================================================
// Planning CRUD
// ============================================================

export function subscribePlanning(cb: (items: PlanningItem[]) => void): Unsubscribe {
  const q = query(collection(db, PLANNING), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        text: data.text || '',
        priority: data.priority || 'medium',
        done: !!data.done,
        weekScope: data.weekScope || 'overall',
        notes: data.notes || '',
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || 0),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || 0),
      } as PlanningItem
    })
    cb(items)
  })
}

export async function addPlanningItem(item: Omit<PlanningItem, 'id' | 'createdAt' | 'updatedAt'>) {
  await addDoc(collection(db, PLANNING), {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updatePlanningItem(id: string, patch: Partial<PlanningItem>) {
  const { id: _, createdAt: __, ...rest } = patch
  void _; void __
  await updateDoc(doc(db, PLANNING, id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePlanningItem(id: string) {
  await deleteDoc(doc(db, PLANNING, id))
}

// ============================================================
// Seed defaults — one-tap populate based on the Mistral budget model
// (refined tier, 6 attendees, 4 weeks)
// ============================================================

export async function seedDefaults() {
  const allWeeks: WeekN[] = ['I', 'II', 'III', 'IV']
  const seeds: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'Villa', amount: 13000 * 4, category: 'lodging', weeks: allWeeks, notes: '6-room ensuite, walking distance to launch (refined tier).', charged: false },
    { name: 'Lead instructor — Théo', amount: 2500 * 4, category: 'coaching', weeks: allWeeks, notes: 'Resident pro, on every week.', charged: false },
    { name: 'Assistant instructor', amount: 1500 * 4, category: 'coaching', weeks: allWeeks, notes: '1:3 ratio, scales with attendance (assumes N=6).', charged: false },
    { name: 'Kite quiver — rental', amount: 350 * 6 * 4, category: 'equipment', weeks: allWeeks, notes: '€350/rider × 6 riders × 4 weeks (refined tier).', charged: false },
    { name: 'French tutor', amount: 1500 * 4, category: 'tutor', weeks: allWeeks, notes: 'Live-in, daily lesson over olives.', charged: false },
    { name: 'Cook', amount: 2800 * 4, category: 'food', weeks: allWeeks, notes: 'Local, three meals daily.', charged: false },
    { name: 'Groceries', amount: 40 * (6 + 3) * 7 * 4, category: 'food', weeks: allWeeks, notes: '€40/pers/day × 9 pers × 7 days × 4 weeks.', charged: false },
    { name: 'Ground transport', amount: 1000 * 4, category: 'transport', weeks: allWeeks, notes: 'Van + airport / TGV transfers.', charged: false },
    { name: 'Atmosphere', amount: 1500 * 4, category: 'atmosphere', weeks: allWeeks, notes: 'Wine, books, flowers, candles.', charged: false },
    { name: 'Photo & video', amount: 4000, category: 'media', weeks: [], notes: "Recap content, next year's invite.", charged: false },
    { name: 'Welcome kits', amount: 840, category: 'kits', weeks: [], notes: 'Notebook, swim trunks, branded items (~24 unique guests).', charged: false },
    { name: 'Print collateral', amount: 1000, category: 'kits', weeks: [], notes: 'Invite cards, menu cards, library bookplates.', charged: false },
    { name: 'Activity insurance', amount: 2000, category: 'insurance', weeks: [], charged: false },
    { name: 'Admin & accounting', amount: 1000, category: 'admin', weeks: [], charged: false },
    { name: 'Contingency (10%)', amount: 31000, category: 'contingency', weeks: [], notes: 'Weather days, last-minute swaps, ops slippage.', charged: false },
  ]
  await Promise.all(seeds.map((s) => addBudgetItem(s)))

  const todos: Omit<PlanningItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { text: 'Lock Hyères villa for week I', priority: 'high', done: false, weekScope: 'I' },
    { text: 'Lock Camargue villa for week II', priority: 'high', done: false, weekScope: 'II' },
    { text: 'Lock Le Barcarès villa for week III', priority: 'high', done: false, weekScope: 'III' },
    { text: 'Lock Leucate villa for week IV', priority: 'high', done: false, weekScope: 'IV' },
    { text: 'Sign Théo for the season', priority: 'high', done: false, weekScope: 'overall' },
    { text: 'Confirm French tutor (Camille)', priority: 'medium', done: false, weekScope: 'overall' },
    { text: 'Vendor: kite rental shop quotes (3)', priority: 'medium', done: false, weekScope: 'overall' },
    { text: 'Activity insurance — request quotes', priority: 'medium', done: false, weekScope: 'overall' },
    { text: 'Welcome-kit design + print order', priority: 'low', done: false, weekScope: 'overall' },
    { text: 'LP invite send — week-by-week priority list', priority: 'high', done: false, weekScope: 'overall' },
  ]
  await Promise.all(todos.map((t) => addPlanningItem(t)))
}
