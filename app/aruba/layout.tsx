import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aruba 2026',
  description: 'Lori & Aidas · Aruba · March 2026',
}

export default function ArubaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
