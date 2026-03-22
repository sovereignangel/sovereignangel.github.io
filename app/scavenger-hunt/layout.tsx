import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scavenger Hunt - Aruba 2026',
  description: 'Find ingenuity. Collect bananas. Redeem time.',
}

export default function ScavengerHuntLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
