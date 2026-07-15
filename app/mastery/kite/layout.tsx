import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kite Mastery',
  description: 'Kiteboarding belt progression and training log',
  robots: 'noindex, nofollow',
}

export default function KiteMasteryLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-cream">{children}</div>
}
