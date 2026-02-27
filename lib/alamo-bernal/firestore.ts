import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Meeting,
  Risk,
  ProposalPhase,
  FinancialScenario,
  ScalingMilestone,
  AgreementClause,
  ActionItem,
  FundMetrics,
} from './types'

// ── Collection Refs ─────────────────────────────────────────────
const col = (path: string) => collection(db, 'alamo_bernal', ...path.split('/'))
const docRef = (path: string) => doc(db, 'alamo_bernal', ...path.split('/'))

// ── Fund Metrics ────────────────────────────────────────────────
export async function getFundMetrics(): Promise<FundMetrics | null> {
  const snap = await getDoc(docRef('config/current'))
  return snap.exists() ? (snap.data() as FundMetrics) : null
}

export async function saveFundMetrics(data: FundMetrics): Promise<void> {
  await setDoc(docRef('config/current'), data)
}

// ── Meetings ────────────────────────────────────────────────────
export async function getMeetings(): Promise<Meeting[]> {
  const q = query(col('meetings'), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meeting)
}

export async function saveMeeting(meeting: Meeting): Promise<void> {
  await setDoc(doc(db, 'alamo_bernal', 'meetings', meeting.id), meeting)
}

// ── Risks ───────────────────────────────────────────────────────
export async function getRisks(): Promise<Risk[]> {
  const snap = await getDocs(col('risks'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Risk)
}

export async function saveRisk(risk: Risk): Promise<void> {
  await setDoc(doc(db, 'alamo_bernal', 'risks', risk.id), risk)
}

export async function updateRisk(id: string, data: Partial<Risk>): Promise<void> {
  await updateDoc(doc(db, 'alamo_bernal', 'risks', id), data)
}

export async function deleteRisk(id: string): Promise<void> {
  await deleteDoc(doc(db, 'alamo_bernal', 'risks', id))
}

// ── Proposal Phases ─────────────────────────────────────────────
export async function getProposalPhases(): Promise<ProposalPhase[]> {
  const q = query(col('proposal_phases'), orderBy('phase', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProposalPhase)
}

export async function saveProposalPhase(phase: ProposalPhase): Promise<void> {
  await setDoc(doc(db, 'alamo_bernal', 'proposal_phases', phase.id), phase)
}

// ── Financial Scenarios ─────────────────────────────────────────
export async function getFinancialScenarios(): Promise<FinancialScenario[]> {
  const q = query(col('financial_scenarios'), orderBy('aum', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FinancialScenario)
}

export async function saveFinancialScenario(scenario: FinancialScenario): Promise<void> {
  await setDoc(doc(db, 'alamo_bernal', 'financial_scenarios', scenario.id), scenario)
}

// ── Scaling Milestones ──────────────────────────────────────────
export async function getScalingMilestones(): Promise<ScalingMilestone[]> {
  const snap = await getDocs(col('scaling_milestones'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScalingMilestone)
}

export async function saveScalingMilestone(milestone: ScalingMilestone): Promise<void> {
  await setDoc(doc(db, 'alamo_bernal', 'scaling_milestones', milestone.id), milestone)
}

// ── Agreement Clauses ───────────────────────────────────────────
export async function getAgreementClauses(): Promise<AgreementClause[]> {
  const snap = await getDocs(col('agreement_clauses'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AgreementClause)
}

export async function saveAgreementClause(clause: AgreementClause): Promise<void> {
  await setDoc(doc(db, 'alamo_bernal', 'agreement_clauses', clause.id), clause)
}

export async function updateAgreementClause(id: string, data: Partial<AgreementClause>): Promise<void> {
  await updateDoc(doc(db, 'alamo_bernal', 'agreement_clauses', id), data)
}

// ── Action Items ────────────────────────────────────────────────
export async function getActionItems(): Promise<ActionItem[]> {
  const snap = await getDocs(col('action_items'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActionItem)
}

export async function saveActionItem(item: ActionItem): Promise<void> {
  await setDoc(doc(db, 'alamo_bernal', 'action_items', item.id), item)
}

export async function updateActionItem(id: string, data: Partial<ActionItem>): Promise<void> {
  await updateDoc(doc(db, 'alamo_bernal', 'action_items', id), data)
}

export async function deleteActionItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'alamo_bernal', 'action_items', id))
}
