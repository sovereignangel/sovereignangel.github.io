import type { Metadata } from 'next'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Arc — Know Your Trajectory',
  description: 'One daily score that tells you if you are actually getting closer to the life you want.',
  openGraph: {
    title: 'Arc — Know Your Trajectory',
    description: 'One daily score that tells you if you are actually getting closer to the life you want.',
    type: 'website',
  },
}

export default function ArcLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0c0c0b' }}>
      {children}
      <SiteFooter />
    </div>
  )
}
