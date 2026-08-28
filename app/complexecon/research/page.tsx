import type { Metadata } from 'next'
import ResearchSheet from '@/components/complexecon/ResearchSheet'

export const metadata: Metadata = {
  title: 'Research Lanes · Complexity Economics',
  description: 'Climate, grids, balance sheets — a working document of research lanes and hypotheses.',
}

export default function ComplexEconResearchPage() {
  return <ResearchSheet />
}
