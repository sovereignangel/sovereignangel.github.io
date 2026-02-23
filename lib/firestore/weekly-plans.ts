import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { WeeklyPlan, WeeklyGoalItem } from '../types'

// ─── CRUD for weekly_plans ──────────────────────────────────────────

export async function getWeeklyPlan(uid: string, weekStart: string): Promise<WeeklyPlan | null> {
  const ref = doc(db, 'users', uid, 'weekly_plans', weekStart)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as WeeklyPlan : null
}

export async function saveWeeklyPlan(uid: string, weekStart: string, data: Partial<WeeklyPlan>): Promise<void> {
  const ref = doc(db, 'users', uid, 'weekly_plans', weekStart)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      weekStartDate: weekStart,
      weekEndDate: '',
      weekLabel: '',
      status: 'draft',
      spineResolution: '',
      spineResolutionDetail: '',
      revenueTarget: '',
      goals: [],
      dailyAllocations: [],
      scorecard: [],
      projects: [],
      aiGenerated: false,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function getRecentWeeklyPlans(uid: string, count: number = 12): Promise<WeeklyPlan[]> {
  const ref = collection(db, 'users', uid, 'weekly_plans')
  const q = query(ref, orderBy('weekStartDate', 'desc'), firestoreLimit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as WeeklyPlan)
}

export async function updateGoalItemCompletion(
  uid: string,
  weekStart: string,
  goalId: string,
  itemIndex: number,
  completed: boolean,
  goals: WeeklyPlan['goals']
): Promise<void> {
  const updatedGoals = goals.map(g => {
    if (g.id !== goalId) return g
    const updatedItems = g.items.map((item, i) =>
      i === itemIndex ? { ...item, completed } : item
    )
    return { ...g, items: updatedItems }
  })
  const ref = doc(db, 'users', uid, 'weekly_plans', weekStart)
  await updateDoc(ref, { goals: updatedGoals, updatedAt: serverTimestamp() })
}
