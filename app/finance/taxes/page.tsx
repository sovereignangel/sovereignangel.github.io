import type { Metadata } from 'next'
import TaxesSheet from '@/components/finance/TaxesSheet'

export const metadata: Metadata = {
  title: 'Taxes 2025 · Finance',
  description: 'The 2025 bill, the levers still open, and the paper trail.',
  robots: { index: false, follow: false },
}

export default function FinanceTaxesPage() {
  return <TaxesSheet />
}
