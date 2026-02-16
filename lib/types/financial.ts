import type { Timestamp } from './shared'

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
  totalAssets: number
  netWorth: number
  savingsRate: number
  runwayMonths: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export const NET_WORTH_TARGET = 10_000_000
