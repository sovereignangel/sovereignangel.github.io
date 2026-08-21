import type { Metadata } from 'next'
import { Cormorant_Garamond, EB_Garamond } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-mah-display',
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-mah-text',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mahāmudrā New York',
  description:
    'A theory & practice community for meditation and awareness in New York. Foundations of Mahāmudrā taught by Lev Brie, authorized by Dustin DiPerna. Practice deeply. Live clearly.',
  openGraph: {
    title: 'Mahāmudrā New York',
    description:
      'A theory & practice community for meditation and awareness in New York. Practice deeply. Live clearly.',
    url: 'https://mahamudra.loricorpuz.com',
    siteName: 'Mahāmudrā New York',
    type: 'website',
  },
}

export default function MahamudraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${cormorant.variable} ${ebGaramond.variable}`}>
      {children}
    </div>
  )
}
