import type { Metadata } from 'next'
import { Cormorant, IBM_Plex_Mono } from 'next/font/google'

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Peak State II — The Weekend After · Copenhagen',
  description: 'Aug 7-10 in Copenhagen — sights, cycling, and kiteboarding once the retreat wraps.',
  robots: 'noindex, nofollow',
}

export default function ThirtyFiveWeekendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cormorant.variable} ${plexMono.variable}`}>{children}</div>
  )
}
