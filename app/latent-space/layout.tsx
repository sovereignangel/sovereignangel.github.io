import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Latent Space — Frontier AI Research Dinner Series',
  description: 'An intimate, invite-only dinner series bringing together frontier AI researchers, builders, and investors to surface emerging ideas shaping the future of intelligence.',
  openGraph: {
    title: 'Latent Space',
    description: 'Frontier AI Research Dinner Series — New York City',
    type: 'website',
  },
}

export default function LatentSpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F5EDD6]">
      {children}
    </div>
  )
}
