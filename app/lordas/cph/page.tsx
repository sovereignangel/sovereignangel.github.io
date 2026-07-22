import type { Metadata } from 'next'
import { CphView } from '@/components/lordas/cph/CphView'

export const metadata: Metadata = {
  title: 'Copenhagen · Lordas',
  description: 'Aug 8-9 Copenhagen plan — sights, cycling, kiteboarding',
  robots: 'noindex, nofollow',
}

export default function CphPage() {
  return <CphView />
}
