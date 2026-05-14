import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Atune — the crowd composes the night',
  description: 'Computer vision reads the room. The room scores itself. The DJ becomes a conductor of feedback.',
  openGraph: {
    title: 'Atune',
    description: 'The crowd composes the night. A real-time, vision-driven music system.',
    url: 'https://atune.loricorpuz.com',
    siteName: 'Atune',
    type: 'website',
  },
}

export default function AtuneLayout({ children }: { children: React.ReactNode }) {
  return children
}
