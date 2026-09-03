import type { Metadata } from 'next'
import RoadmapSheet from '@/components/complexecon/RoadmapSheet'

export const metadata: Metadata = {
  title: 'Roadmap · Complexity Economics',
  description: 'The road to Abu Dhabi — four winter goals, six phases, data-quality ranking, and the reading program.',
}

export default function ComplexEconRoadmapPage() {
  return <RoadmapSheet />
}
