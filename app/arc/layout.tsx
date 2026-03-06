import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Arc — Know Your Trajectory',
  description: 'One daily score that tells you if you are actually getting closer to the life you want. Garmin for your whole life.',
  openGraph: {
    title: 'Arc — Know Your Trajectory',
    description: 'One daily score that tells you if you are actually getting closer to the life you want.',
    type: 'website',
  },
}

export default function ArcLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      {children}
    </div>
  )
}
