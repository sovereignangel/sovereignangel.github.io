import type { Metadata } from 'next'
import InvestmentsSheet from '@/components/finance/InvestmentsSheet'

export const metadata: Metadata = {
  title: 'Investments · Finance',
  robots: { index: false, follow: false },
}

export default function FinanceInvestmentsPage() {
  return <InvestmentsSheet />
}
