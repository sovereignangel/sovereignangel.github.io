import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Mistral · Hosts portal',
  description: 'Budget & planning — Arete Mistral',
  robots: 'noindex, nofollow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
