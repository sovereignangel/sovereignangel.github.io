import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { DailyLog, Signal, Project, WeeklySynthesis, UserProfile, FocusSession } from './types'
import { SEED_PROJECTS, DEFAULT_SETTINGS } from './constants'

// ─── USER ────────────────────────────────────────────────────────────────

export async function getOrCreateUser(uid: string, email: string, name: string, photoURL: string): Promise<UserProfile> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    return snap.data() as UserProfile
  }

  const newUser: UserProfile = {
    name,
    email,
    profilePictureUrl: photoURL,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    spineProject: 'Armstrong',
    thesisStatement: '',
    settings: DEFAULT_SETTINGS,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }

  await setDoc(ref, newUser)

  // Seed projects
  for (const project of SEED_PROJECTS) {
    const projectRef = doc(db, 'users', uid, 'projects', project.id!)
    await setDoc(projectRef, {
      ...project,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }

  return newUser
}

export async function updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

// ─── DAILY LOGS ──────────────────────────────────────────────────────────

export async function getDailyLog(uid: string, date: string): Promise<DailyLog | null> {
  const ref = doc(db, 'users', uid, 'daily_logs', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as DailyLog : null
}

export async function saveDailyLog(uid: string, date: string, data: Partial<DailyLog>): Promise<void> {
  const ref = doc(db, 'users', uid, 'daily_logs', date)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      date,
      spineProject: 'Armstrong',
      focusHoursTarget: 6,
      focusHoursActual: 0,
      whatShipped: '',
      revenueAsksCount: 0,
      revenueAsksList: [],
      publicIteration: false,
      problems: [{ problem: '', painPoint: '', solution: '', brokenWhy: '' }],
      problemSelected: '',
      daysSinceLastOutput: 0,
      feedbackLoopClosed: false,
      revenueSignal: 0,
      speedOverPerfection: false,
      nervousSystemState: 'regulated',
      nervousSystemTrigger: '',
      twentyFourHourRuleApplied: false,
      cleanRequestRelease: '',
      noEmotionalTexting: true,
      revenueThisSession: 0,
      revenueStreamType: 'one_time',
      automationOpportunity: '',
      sleepHours: 0,
      trainingType: 'none',
      relationalBoundary: '',
      bodyFelt: 'neutral',
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function getRecentDailyLogs(uid: string, days: number = 7): Promise<DailyLog[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startStr = startDate.toISOString().split('T')[0]

  const ref = collection(db, 'users', uid, 'daily_logs')
  const q = query(ref, where('date', '>=', startStr), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as DailyLog)
}

// ─── SIGNALS ─────────────────────────────────────────────────────────────

export async function getSignals(uid: string, statusFilter?: string): Promise<Signal[]> {
  const ref = collection(db, 'users', uid, 'signals')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Signal)
}

export async function saveSignal(uid: string, data: Partial<Signal>, signalId?: string): Promise<string> {
  if (signalId) {
    const ref = doc(db, 'users', uid, 'signals', signalId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return signalId
  } else {
    const ref = doc(collection(db, 'users', uid, 'signals'))
    await setDoc(ref, {
      ...data,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteSignal(uid: string, signalId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'signals', signalId))
}

// ─── PROJECTS ────────────────────────────────────────────────────────────

export async function getProjects(uid: string): Promise<Project[]> {
  const ref = collection(db, 'users', uid, 'projects')
  const q = query(ref, orderBy('timeAllocationPercent', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Project)
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  const ref = doc(db, 'users', uid, 'projects', projectId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as Project : null
}

export async function updateProject(uid: string, projectId: string, data: Partial<Project>): Promise<void> {
  const ref = doc(db, 'users', uid, 'projects', projectId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

// ─── WEEKLY SYNTHESIS ────────────────────────────────────────────────────

export async function getWeeklySynthesis(uid: string, weekStart: string): Promise<WeeklySynthesis | null> {
  const ref = doc(db, 'users', uid, 'weekly_synthesis', weekStart)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as WeeklySynthesis : null
}

export async function saveWeeklySynthesis(uid: string, weekStart: string, data: Partial<WeeklySynthesis>): Promise<void> {
  const ref = doc(db, 'users', uid, 'weekly_synthesis', weekStart)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      weekStartDate: weekStart,
      aiSignal: '',
      marketsSignal: '',
      mindSignal: '',
      arbitrageTested: '',
      marketResponse: '',
      learning: '',
      didCompound: false,
      builtOnLastWeek: false,
      fragmentedOrFocused: '',
      clarityEnabledSpeed: '',
      shouldKill: '',
      shouldDouble: '',
      nextActionSpine: '',
      nextActionMarket: '',
      nextActionIntellectual: '',
      projectStatuses: {},
      surprisingInsight: '',
      patternToBreak: '',
      patternToAdopt: '',
      thesisStillValid: true,
      thesisAdjustment: '',
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

// ─── FOCUS SESSIONS ──────────────────────────────────────────────────────

export async function saveFocusSession(uid: string, data: Partial<FocusSession>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'focus_sessions'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTodayFocusSessions(uid: string): Promise<FocusSession[]> {
  const today = new Date().toISOString().split('T')[0]
  const startOfDay = Timestamp.fromDate(new Date(today + 'T00:00:00'))
  const endOfDay = Timestamp.fromDate(new Date(today + 'T23:59:59'))

  const ref = collection(db, 'users', uid, 'focus_sessions')
  const q = query(ref, where('startTime', '>=', startOfDay), where('startTime', '<=', endOfDay))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as FocusSession)
}
