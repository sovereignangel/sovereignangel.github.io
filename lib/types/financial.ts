import type { Timestamp } from './shared'

// ─── INCOME / EXPENSE LINE ITEMS ────────────────────────────────────

export interface IncomeBreakdown {
  employment: number
  sublease: number
  freelance: number
  other: number
}

export interface ExpenseBreakdown {
  rent: number
  food: number
  subscriptions: number
  miscellaneous: number
  travel: number
  familySupport: number
  other: number
}

export const EMPTY_INCOME_BREAKDOWN: IncomeBreakdown = {
  employment: 0,
  sublease: 0,
  freelance: 0,
  other: 0,
}

export const EMPTY_EXPENSE_BREAKDOWN: ExpenseBreakdown = {
  rent: 0,
  food: 0,
  subscriptions: 0,
  miscellaneous: 0,
  travel: 0,
  familySupport: 0,
  other: 0,
}

export interface FinancialSnapshot {
  id?: string
  month: string
  cashSavings: number
  investments: number
  crypto: number
  realEstate: number
  startupEquity: number
  otherAssets: number
  totalDebt: number
  monthlyIncome: number
  monthlyExpenses: number
  incomeBreakdown?: IncomeBreakdown
  expenseBreakdown?: ExpenseBreakdown
  totalAssets: number
  netWorth: number
  savingsRate: number
  runwayMonths: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const NET_WORTH_TARGET = 10_000_000
