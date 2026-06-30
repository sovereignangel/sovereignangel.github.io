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
  title: 'Peak State II — Copenhagen',
  description: 'Four days drawn as one curve — warm-up, exertion, peak, recovery. The thirty-fifth year.',
  openGraph: {
    title: 'Peak State II — Copenhagen',
    description: 'Four days on the fjord and in the city. The thirty-fifth year.',
    images: ['/peak-state-ii.png'],
    type: 'website',
  },
}

export default function PeakStateIILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cormorant.variable} ${plexMono.variable}`}>{children}</div>
  )
}
