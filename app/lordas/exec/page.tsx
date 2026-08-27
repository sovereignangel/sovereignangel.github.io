import type { Metadata } from 'next'
import ExecView from '@/components/lordas/exec/ExecView'

export const metadata: Metadata = {
  title: 'Lordas — Daily Orders',
  description: 'Where to kite, at what hour, and what the two of you train today',
  robots: 'noindex, nofollow',
}

export default function LordasExecPage() {
  return <ExecView />
}
