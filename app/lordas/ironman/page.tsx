import type { Metadata } from 'next'
import PairIronmanView from '@/components/lordas/exec/PairIronmanView'

export const metadata: Metadata = {
  title: 'Lordas — Ironman',
  description: 'Both athletes: readiness, paces, plan completion and the New York goal odds',
  robots: 'noindex, nofollow',
}

export default function LordasIronmanPage() {
  return <PairIronmanView />
}
