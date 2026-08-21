import type { Timestamp } from './shared'

// ─── TRANSACTIONS (CSV-imported ledger) ─────────────────────────────

export type FinanceCategory =
  | 'income'
  | 'rent'
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'travel'
  | 'subscriptions'
  | 'utilities'
  | 'health'
  | 'shopping'
  | 'business'
  | 'crypto'
  | 'investing'
  | 'debt_payment'
  | 'fees'
  | 'taxes'
  | 'transfer'
  | 'cash'
  | 'family'
  | 'other'
  | 'uncategorized'

export const FINANCE_CATEGORIES: FinanceCategory[] = [
  'income', 'rent', 'groceries', 'dining', 'transport', 'travel',
  'subscriptions', 'utilities', 'health', 'shopping', 'business',
  'crypto', 'investing', 'debt_payment', 'fees', 'taxes', 'transfer',
  'cash', 'family', 'other', 'uncategorized',
]

export interface FinanceTransaction {
  id?: string
  date: string // YYYY-MM-DD
  amount: number // signed: positive = inflow, negative = outflow
  description: string
  account: string // source account label, e.g. 'Lili', 'Chase Sapphire'
  category: FinanceCategory
  categorySource: 'rule' | 'manual' | 'source'
  note?: string
  importBatchId?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface FinanceImportBatch {
  id?: string
  fileName: string
  account: string
  rowCount: number
  importedCount: number
  duplicateCount: number
  minDate: string
  maxDate: string
  createdAt?: Timestamp
}

// ─── COLLATERALIZED LOANS (BTC margin tracking) ─────────────────────

export type CollateralLoanStatus = 'active' | 'closed' | 'liquidated'

export interface CollateralLoan {
  id?: string
  label: string
  status: CollateralLoanStatus
  asset: 'BTC' | 'ETH'
  collateralQty: number // asset units posted
  assetPriceAtPost: number // USD price when posted
  loanDrawn: number // USD borrowed against the collateral
  loanUsed: number // USD actually deployed (vs sitting idle)
  liquidationLtv: number // LTV that triggers margin call / liquidation, e.g. 0.85
  openedDate?: string // YYYY-MM-DD
  closedDate?: string
  // Set when status = 'liquidated'
  liquidatedUsd?: number // collateral value seized at liquidation
  assetPriceAtLiquidation?: number
  notes?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface CollateralMetrics {
  collateralUsdAtPost: number
  currentCollateralValue: number
  currentLtv: number | null // null when no live price / no loan
  liquidationPrice: number // asset price at which LTV hits liquidationLtv
  distanceToLiquidation: number | null // fraction of current price, e.g. 0.32 = 32% drawdown away
  seizedQty: number // asset units taken at liquidation
  seizedValueNow: number // what the seized units are worth at current price
  opportunityCost: number // seizedValueNow - liquidatedUsd
  idleDrawn: number // loanDrawn - loanUsed (borrowed but never deployed)
}

export type LtvBand = 'ok' | 'elevated' | 'high' | 'critical'

// ─── TAX PLAN ───────────────────────────────────────────────────────

export interface TaxPayment {
  label: string // e.g. 'Q3 estimated', '2022 SURI installment'
  due: string // YYYY-MM-DD
  amount: number
  paid: boolean
  paidDate?: string
}

export interface TaxPlan {
  id?: string // doc id = String(year)
  year: number
  estimatedLiability: number
  basisNote?: string
  payments: TaxPayment[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
