import type { Metadata } from 'next'
import { Cormorant_Garamond, Lora } from 'next/font/google'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const body = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'loricorpuz.com/tech — the shape of a life',
  description: 'A notebook on the substrate of a renaissance practice. Alfred, the seven streams, the world, the metrics.',
  openGraph: {
    title: 'loricorpuz.com/tech',
    description: 'A notebook on the substrate of a renaissance practice.',
    url: 'https://www.loricorpuz.com/tech',
    siteName: 'loricorpuz',
    type: 'website',
  },
}

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable}`}>
      {children}
    </div>
  )
}
