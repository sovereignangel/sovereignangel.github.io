import type { Timestamp } from './shared'

// ─── CAPITAL COMMAND TYPES ──────────────────────────────────────────

export type CapitalOperationType =
  | 'debt_payment'
  | 'income_received'
  | 'expense'
  | 'asset_transfer'
  | 'snapshot_update'

export interface CapitalFieldChange {
  target: 'snapshot' | 'debt'
  field: string               // e.g. 'balance', 'cashSavings', 'totalDebt'
  debtName?: string           // required if target === 'debt'
  before: number
  after: number
  label: string               // human-readable, e.g. "Chase Sapphire balance"
}

export interface CapitalOperation {
  type: CapitalOperationType
  description: string
  debtName?: string
  amount: number
  fieldChanges: CapitalFieldChange[]
}

export interface ParsedCapitalCommand {
  operations: CapitalOperation[]
  summary: string
  netWorthDelta: number
  totalDebtDelta: number
  totalCashDelta: number
}

export interface CapitalTransaction {
  id?: string
  command: string
  summary: string
  netWorthDelta: number
  appliedAt: Timestamp
  month: string               // YYYY-MM
}

// ─── CORPORATE METRICS ──────────────────────────────────────────────

export interface CorporateMetrics {
  debtToIncomeRatio: number | null
  debtServiceCoverage: number | null
  operatingMargin: number | null
  currentRatio: number | null
  leverageRatio: number | null
}
