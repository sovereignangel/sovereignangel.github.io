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
import type { DailyLog, Signal, Project, WeeklySynthesis, UserProfile, FocusSession, GarminMetrics, Conversation, Contact, ExternalSignal, DailyReport } from './types'
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
      trainingTypes: [],
      vo2Intervals: [0, 0, 0, 0],
      zone2Distance: 0,
      calendarFocusHours: null,
      relationalBoundary: '',
      bodyFelt: 'neutral',
      pillarsTouched: [],
      rewardScore: null,
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

// ─── GARMIN METRICS ─────────────────────────────────────────────────────

export async function getGarminMetrics(uid: string, date: string): Promise<GarminMetrics | null> {
  const ref = doc(db, 'users', uid, 'garmin_metrics', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as GarminMetrics : null
}

export async function getRecentGarminMetrics(uid: string, days: number = 7): Promise<GarminMetrics[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startStr = startDate.toISOString().split('T')[0]

  const ref = collection(db, 'users', uid, 'garmin_metrics')
  const q = query(ref, where('date', '>=', startStr), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as GarminMetrics)
}

// ─── CONVERSATIONS ──────────────────────────────────────────────────────

export async function getConversation(uid: string, conversationId: string): Promise<Conversation | null> {
  const ref = doc(db, 'users', uid, 'conversations', conversationId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as Conversation : null
}

export async function getConversations(uid: string, limit: number = 10): Promise<Conversation[]> {
  const ref = collection(db, 'users', uid, 'conversations')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }) as Conversation)
}

export async function saveConversation(uid: string, data: Partial<Conversation>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'conversations'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateConversation(uid: string, conversationId: string, data: Partial<Conversation>): Promise<void> {
  const ref = doc(db, 'users', uid, 'conversations', conversationId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'conversations', conversationId)
  await deleteDoc(ref)
}

// ─── CONTACTS ───────────────────────────────────────────────────────────

export async function getContact(uid: string, contactId: string): Promise<Contact | null> {
  const ref = doc(db, 'users', uid, 'contacts', contactId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as Contact : null
}

export async function getContactByName(uid: string, name: string): Promise<Contact | null> {
  const ref = collection(db, 'users', uid, 'contacts')
  const q = query(ref, where('name', '==', name))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Contact
}

export async function getAllContacts(uid: string): Promise<Contact[]> {
  const ref = collection(db, 'users', uid, 'contacts')
  const q = query(ref, orderBy('lastConversationDate', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Contact)
}

export async function saveContact(uid: string, data: Partial<Contact>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'contacts'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateContact(uid: string, contactId: string, data: Partial<Contact>): Promise<void> {
  const ref = doc(db, 'users', uid, 'contacts', contactId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteContact(uid: string, contactId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'contacts', contactId)
  await deleteDoc(ref)
}

// ─── EXTERNAL SIGNALS ───────────────────────────────────────────────────

export async function getExternalSignal(uid: string, signalId: string): Promise<ExternalSignal | null> {
  const ref = doc(db, 'users', uid, 'external_signals', signalId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as ExternalSignal : null
}

export async function getExternalSignalsByStatus(uid: string, status: string): Promise<ExternalSignal[]> {
  const ref = collection(db, 'users', uid, 'external_signals')
  const q = query(ref, where('status', '==', status), orderBy('relevanceScore', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ExternalSignal)
}

export async function getTodaysExternalSignals(uid: string): Promise<ExternalSignal[]> {
  const today = new Date().toISOString().split('T')[0]
  const ref = collection(db, 'users', uid, 'external_signals')
  const q = query(ref, where('status', '==', 'inbox'), orderBy('relevanceScore', 'desc'))
  const snap = await getDocs(q)

  // Filter to only today's signals
  const signals = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ExternalSignal)
  return signals.filter(s => {
    const signalDate = s.createdAt?.toDate?.()
    if (!signalDate) return false
    return signalDate.toISOString().split('T')[0] === today
  })
}

export async function saveExternalSignal(uid: string, data: Partial<ExternalSignal>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'external_signals'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateExternalSignal(uid: string, signalId: string, data: Partial<ExternalSignal>): Promise<void> {
  const ref = doc(db, 'users', uid, 'external_signals', signalId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteExternalSignal(uid: string, signalId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'external_signals', signalId)
  await deleteDoc(ref)
}

// ─── DAILY REPORTS ──────────────────────────────────────────────────────

export async function getDailyReport(uid: string, date: string): Promise<DailyReport | null> {
  const ref = doc(db, 'users', uid, 'daily_reports', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as DailyReport : null
}

export async function saveDailyReport(uid: string, date: string, data: Partial<DailyReport>): Promise<void> {
  const ref = doc(db, 'users', uid, 'daily_reports', date)
  await setDoc(ref, {
    date,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function markDailyReportAsReviewed(uid: string, date: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'daily_reports', date)
  await updateDoc(ref, { reviewed: true })
}
