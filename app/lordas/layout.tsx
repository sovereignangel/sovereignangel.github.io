import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lordas',
  description: 'Partnership health dashboard',
  robots: 'noindex, nofollow',
}

export default function LordasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
      {children}
    </div>
  )
}
