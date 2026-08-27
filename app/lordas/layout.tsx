import type { Metadata } from 'next'
import { Fraunces, Chivo, JetBrains_Mono } from 'next/font/google'
import '@/components/lordas/design/console.css'

/**
 * Console is a committed world — espresso ground, no light theme. The three
 * families each have one job: Fraunces states conclusions, Chivo carries
 * prose, JetBrains Mono holds every digit. See LORDAS_BRAND_STRATEGY.md.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-lordas-display',
  display: 'swap',
})
const chivo = Chivo({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-lordas-body',
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-lordas-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lordas',
  description: 'Lori & Aidas',
  robots: 'noindex, nofollow',
}

export default function LordasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`lordas ${fraunces.variable} ${chivo.variable} ${mono.variable}`}
      style={
        {
          '--lordas-display': `var(--font-lordas-display), Georgia, serif`,
          '--lordas-body': `var(--font-lordas-body), -apple-system, BlinkMacSystemFont, sans-serif`,
          '--lordas-mono': `var(--font-lordas-mono), ui-monospace, Menlo, monospace`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
