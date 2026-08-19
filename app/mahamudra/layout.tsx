import type { Metadata } from 'next'
import { Cinzel, Cormorant_Garamond } from 'next/font/google'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cinzel',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mahāmudrā NYC',
  description:
    'A community of Mahāmudrā practice in Brooklyn, New York. Foundations taught by Lev Brie, authorized by Dustin DiPerna. Practice deeply. Live clearly.',
  openGraph: {
    title: 'Mahāmudrā NYC',
    description:
      'A community of Mahāmudrā practice in Brooklyn, New York. Practice deeply. Live clearly.',
    url: 'https://mahamudra.loricorpuz.com',
    siteName: 'Mahāmudrā NYC',
    type: 'website',
  },
}

export default function MahamudraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cinzel.variable} ${cormorant.variable}`}>{children}</div>
  )
}
