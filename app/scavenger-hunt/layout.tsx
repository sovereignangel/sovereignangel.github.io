import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Banana Hunt - Aruba 2026',
  description: 'Find ingenuity. Collect bananas. Redeem time. Aidas & Lori take Aruba.',
}

export default function ScavengerHuntLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
