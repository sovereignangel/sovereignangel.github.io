import type { Metadata } from 'next'
import { Inter, Crimson_Pro, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const crimson = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const ibmPlex = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lori Corpuz',
  description: 'Emergence · AI · Markets · Mind',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${crimson.variable} ${ibmPlex.variable}`}>
      <body className="font-sans text-[#1a1a1a] bg-transparent antialiased min-h-screen relative">
        {children}
      </body>
    </html>
  )
}
