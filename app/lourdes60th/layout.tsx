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
  title: 'Lourdes Turns 60 — Panama',
  description: 'A week to brainstorm together — family and friends in Panama, closing with the birthday on Monday.',
  openGraph: {
    title: 'Lourdes Turns 60 — Panama',
    description: 'A week to brainstorm together — family and friends in Panama, closing with the birthday on Monday.',
    type: 'website',
  },
}

export default function Lourdes60thLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cormorant.variable} ${plexMono.variable}`}>{children}</div>
  )
}
