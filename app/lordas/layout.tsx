import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Lordas',
  description: 'Connection insights dashboard',
  robots: 'noindex, nofollow',
}

export default function LordasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
      {children}
      <SiteFooter />
    </div>
  )
}
