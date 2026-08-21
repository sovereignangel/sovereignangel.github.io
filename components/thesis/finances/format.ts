import type { FinanceCategory } from '@/lib/types'

export function usd(n: number): string {
  const rounded = Math.round(n)
  const abs = Math.abs(rounded).toLocaleString('en-US')
  return rounded < 0 ? `-$${abs}` : `$${abs}`
}

export function signedUsd(n: number): string {
  return n >= 0 ? `+${usd(n)}` : usd(n)
}

export const CATEGORY_LABELS: Record<FinanceCategory, string> = {
  income: 'Income',
  rent: 'Rent',
  groceries: 'Groceries',
  dining: 'Dining',
  transport: 'Transport',
  travel: 'Travel',
  subscriptions: 'Subscriptions',
  utilities: 'Utilities',
  health: 'Health',
  shopping: 'Shopping',
  business: 'Business',
  crypto: 'Crypto',
  investing: 'Investing',
  debt_payment: 'Debt Payment',
  fees: 'Fees + Interest',
  taxes: 'Taxes',
  transfer: 'Transfer',
  cash: 'Cash',
  family: 'Family',
  other: 'Other',
  uncategorized: 'Uncategorized',
}
