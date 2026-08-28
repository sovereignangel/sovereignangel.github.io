import type { Metadata } from 'next'
import StrategySheet from '@/components/complexecon/StrategySheet'

export const metadata: Metadata = {
  title: 'Research Strategy · Complexity Economics',
  description: 'The competitive map of complexity economics — schools, practitioners, and the gaps in their research.',
}

export default function ComplexEconStrategyPage() {
  return <StrategySheet />
}
