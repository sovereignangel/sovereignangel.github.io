import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Scavenger Hunt - Aruba 2026',
  description: 'Find ingenuity. Collect bananas. Redeem time.',
}

export default function ScavengerHuntLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
