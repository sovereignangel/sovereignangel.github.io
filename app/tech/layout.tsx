import type { Metadata } from 'next'
import { Crimson_Pro, IBM_Plex_Mono, Inter } from 'next/font/google'

const display = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'loricorpuz.com/tech — the shape of a life',
  description: 'A renaissance practice, indexed. Alfred, the seven streams, the world, the metrics that compound.',
  openGraph: {
    title: 'loricorpuz.com/tech',
    description: 'A renaissance practice, indexed.',
    url: 'https://www.loricorpuz.com/tech',
    siteName: 'loricorpuz',
    type: 'website',
  },
}

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${mono.variable} ${body.variable}`}>
      {children}
    </div>
  )
}
