import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connection Insights',
  description: 'A private dashboard for tracking the health of one relationship over time.',
}

export default function ConnectionInsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#2a2420' }}>
      {children}
    </div>
  )
}
