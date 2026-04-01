import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Still Point',
  description: 'A weekend for inner work.',
  robots: 'noindex, nofollow',
}

export default function StillPointLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f2efe8' }}>
      {children}
    </div>
  )
}
