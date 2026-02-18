import type { Timestamp } from './shared'
import type { IncomeBreakdown, ExpenseBreakdown } from './financial'

// ─── DEBT MODELING ──────────────────────────────────────────────────

export type DebtCategory = 'credit_card' | 'personal_loan' | 'tax' | 'student_loan' | 'other'
export type DebtPayoffStrategy = 'avalanche' | 'snowball' | 'minimum_only'

export interface DebtItem {
  id?: string
  name: string
  category: DebtCategory
  balance: number
  apr: number                     // e.g. 0.285 = 28.5%
  minimumPayment: number
  introAprExpiry?: string | null  // ISO date when 0% APR ends
  postIntroApr?: number           // APR after intro period
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ─── SCENARIO ANALYSIS ─────────────────────────────────────────────

export type ScenarioType = 'corporate' | 'indie_conservative' | 'indie_moderate' | 'indie_liberal' | 'custom'

export interface ScenarioParams {
  name: string
  type: ScenarioType
  monthlyGrossIncome: number
  effectiveTaxRate: number        // e.g. 0.32 = 32%
  rampUpMonths: number            // months to reach full income (0 = immediate)
  monthlyExpenseOverride?: number // override burn if scenario changes lifestyle
  extraDebtPayment: number        // above minimums toward debt
  debtStrategy: DebtPayoffStrategy
}

export interface ScenarioMonth {
  month: number                   // 0-indexed from start
  label: string                   // "Mar 2026"
  income: number
  expenses: number
  debtPayment: number
  debtBalance: number
  interestCost: number
  cashflow: number
  liquidNetWorth: number
  runway: number
}

export interface ScenarioProjection {
  params: ScenarioParams
  months: ScenarioMonth[]
  debtFreeMonth: number | null
  breakEvenMonth: number | null
  totalInterestPaid: number
  endingNetWorth: number
}

// ─── CAPITAL POSITION (aggregated view) ─────────────────────────────

export interface CapitalPosition {
  cashSavings: number
  investments: number
  crypto: number
  otherAssets: number
  totalAssets: number
  totalDebt: number
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  incomeBreakdown?: IncomeBreakdown
  expenseBreakdown?: ExpenseBreakdown
  runwayMonths: number
  debtItems: DebtItem[]
  totalMinimumPayments: number
  monthlyInterestCost: number
}

// ─── DEFAULT SCENARIOS ──────────────────────────────────────────────

export const DEFAULT_SCENARIOS: ScenarioParams[] = [
  {
    name: 'Corporate ($200k)',
    type: 'corporate',
    monthlyGrossIncome: 16667,
    effectiveTaxRate: 0.32,
    rampUpMonths: 2,
    extraDebtPayment: 2000,
    debtStrategy: 'avalanche',
  },
  {
    name: 'Indie Conservative',
    type: 'indie_conservative',
    monthlyGrossIncome: 3000,
    effectiveTaxRate: 0.25,
    rampUpMonths: 6,
    extraDebtPayment: 500,
    debtStrategy: 'avalanche',
  },
  {
    name: 'Indie Moderate',
    type: 'indie_moderate',
    monthlyGrossIncome: 8000,
    effectiveTaxRate: 0.28,
    rampUpMonths: 9,
    extraDebtPayment: 1500,
    debtStrategy: 'avalanche',
  },
  {
    name: 'Indie Liberal',
    type: 'indie_liberal',
    monthlyGrossIncome: 15000,
    effectiveTaxRate: 0.30,
    rampUpMonths: 12,
    extraDebtPayment: 3000,
    debtStrategy: 'avalanche',
  },
]

// Scenario chart colors (Armstrong palette)
export const SCENARIO_COLORS: Record<ScenarioType, string> = {
  corporate: '#1e3a5f',      // navy
  indie_conservative: '#8a6d2f', // amber-ink
  indie_moderate: '#2d5f3f',    // green-ink
  indie_liberal: '#7c2d2d',     // burgundy
  custom: '#9a928a',            // ink-muted
}

// ─── INTELLIGENCE LAYER ──────────────────────────────────────────────

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface FinancialHealthScore {
  overall: number
  components: {
    liquidity: number
    leverage: number
    cashflow: number
    momentum: number
    debtToxicity: number
  }
  grade: HealthGrade
  previousScore?: number
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'positive'

export interface CapitalAlert {
  severity: AlertSeverity
  title: string
  detail: string
  metric?: string
  action?: string
}

export interface SensitivityResult {
  variable: string
  baseValue: number
  scenarios: { delta: number; label: string; netWorthAt12: number; debtFreeMonth: number | null }[]
}

export interface AllocationTarget {
  category: string
  label: string
  current: number
  target: number
  pct: number
  rationale: string
}

export interface FreedCascadeStep {
  debtName: string
  paidOffMonth: number
  freedMinimum: number
  acceleratesNext: string
}

export interface DeathSpiralMonth {
  month: number
  principalPaid: number
  interestPaid: number
  totalBalance: number
}
