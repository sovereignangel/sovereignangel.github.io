import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Peak State',
  description: 'Peak performance. Peak experiences.',
  openGraph: {
    title: 'Peak State',
    description: 'Peak performance. Peak experiences.',
    url: 'https://peakstate.loricorpuz.com',
    siteName: 'Peak State',
    type: 'website',
  },
}

export default function PeakStateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
