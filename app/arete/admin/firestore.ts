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
  getDocs,
  writeBatch,
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
  amount: number              // USD — total for this line item across the weeks selected
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

export async function wipeBudget() {
  const snap = await getDocs(collection(db, BUDGET))
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

// ============================================================
// Seed defaults — one-tap populate based on the Mistral budget model
// (refined tier, 6 attendees, 4 weeks)
// ============================================================

export async function seedDefaults() {
  const allWeeks: WeekN[] = ['I', 'II', 'III', 'IV']
  // Faithful to the original Mistral budget model:
  // refined tier · 6 attendees · 4 weeks · 1 assistant instructor (ceil(6/3)-1)
  type Seed = Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>
  const baseSeeds: Seed[] = [
    { name: 'Hyères Airbnb · 10 pax', amount: 6100, category: 'lodging', weeks: ['I'], notes: 'Week I lodging — sleeps 10, 29 Jun → 5 Jul 2026. Code HMSMRE24JK. Link: https://www.airbnb.com/book/stays/1477723892946943440?numberOfAdults=10&checkin=2026-06-29&checkout=2026-07-05&guestCurrency=USD&productId=1477723892946943440&code=HMSMRE24JK', charged: false },
    { name: 'Camargue Airbnb · 10 pax', amount: 7200, category: 'lodging', weeks: ['II'], notes: 'Week II lodging — sleeps 10, 5 Jul → 12 Jul 2026. Link: https://www.airbnb.com/rooms/1643522737742386213?adults=10&check_in=2026-07-05&check_out=2026-07-12&wishlist_item_id=11006301893825', charged: false },
    { name: 'Narbonne Airbnb · 11 pax', amount: 9600, category: 'lodging', weeks: ['III'], notes: 'Week III lodging — sleeps 11, 19 Jul → 26 Jul 2026 (spans the W3 → W4 transition). Code HMH3QAMDJJ. Link: https://www.airbnb.com/book/stays/948265181526557439?numberOfAdults=10&checkin=2026-07-19&checkout=2026-07-26&guestCurrency=USD&productId=948265181526557439&code=HMH3QAMDJJ', charged: false },
    { name: 'Le Barcarès Airbnb · 10 pax', amount: 4300, category: 'lodging', weeks: ['IV'], notes: 'Week IV lodging — 10 guests, $4.3k total.', charged: false },
    { name: 'Lead instructor — Théo', amount: 2700 * 4, category: 'coaching', weeks: allWeeks, notes: 'Resident pro, every week. $2,700/week.', charged: false },
    { name: 'Assistant instructor', amount: 1600 * 4, category: 'coaching', weeks: allWeeks, notes: '1:3 ratio, scales with attendance — 1 assistant for N=6. $1,600/week.', charged: false },
    { name: 'Kite quiver — rental', amount: 380 * 6 * 4, category: 'equipment', weeks: allWeeks, notes: '$380/rider × 6 riders × 4 weeks (refined tier).', charged: false },
    { name: 'French tutor', amount: 1600 * 4, category: 'tutor', weeks: allWeeks, notes: 'Live-in, daily lesson over olives. $1,600/week.', charged: false },
    { name: 'Cook', amount: 3000 * 4, category: 'food', weeks: allWeeks, notes: 'Local, three meals daily. $3,000/week (Adam Brunet 2026 rate).', charged: false },
    { name: 'Private chef · lunch + dinner', amount: 5800 * 4, category: 'food', weeks: allWeeks, notes: 'Mid-range private chef, not too lux. 10 pax × $48/meal × 2 meals × 6 days ≈ $5,800/week (service + ingredients). Overlaps with the seeded Cook + Groceries lines — pick one path: keep this and drop Cook, or keep Cook (three meals daily) and drop this.', charged: false },
    { name: 'Groceries', amount: 43 * (6 + 3) * 7 * 4, category: 'food', weeks: allWeeks, notes: '$43/pers/day × 9 pers (6 guests + 3 staff) × 7 days × 4 weeks.', charged: false },
    { name: 'Ground transport', amount: 1100 * 4, category: 'transport', weeks: allWeeks, notes: 'Van + airport / TGV transfers. $1,100/week.', charged: false },
    { name: 'Atmosphere', amount: 1600 * 4, category: 'atmosphere', weeks: allWeeks, notes: 'Wine, books, market flowers, candles. $1,600/week.', charged: false },
    { name: 'Photo & video', amount: 4300, category: 'media', weeks: [], notes: "Recap content, next year's invite.", charged: false },
    { name: 'Welcome kits', amount: 900, category: 'kits', weeks: [], notes: 'Notebook, swim trunks, branded items. ~24 guest-weeks × $54 × 70% unique.', charged: false },
    { name: 'Print collateral', amount: 1100, category: 'kits', weeks: [], notes: 'Invite cards, menu cards, library bookplates.', charged: false },
    { name: 'Activity insurance', amount: 2200, category: 'insurance', weeks: [], charged: false },
    { name: 'Admin & accounting', amount: 1100, category: 'admin', weeks: [], charged: false },
  ]

  // Contingency = 10% of (operational + one-time), per the original model
  const subtotal = baseSeeds.reduce((s, x) => s + x.amount, 0)
  const contingency = Math.round(subtotal * 0.1)

  const seeds: Seed[] = [
    ...baseSeeds,
    {
      name: 'Contingency (10%)',
      amount: contingency,
      category: 'contingency',
      weeks: [],
      notes: 'Weather days, last-minute swaps, ops slippage. 10% of operational + one-time.',
      charged: false,
    },
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
