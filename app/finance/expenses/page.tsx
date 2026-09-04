import type { Metadata } from 'next'
import ExpensesSheet from '@/components/finance/ExpensesSheet'

export const metadata: Metadata = {
  title: 'Expenses · Finance',
  robots: { index: false, follow: false },
}

export default function FinanceExpensesPage() {
  return <ExpensesSheet />
}
