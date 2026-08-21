import type { Metadata } from 'next'

// Private page — reached only by the shared link, gated by access word.
export const metadata: Metadata = {
  title: 'Recordings · Mahāmudrā New York',
  robots: { index: false, follow: false },
}

export default function RecordingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
