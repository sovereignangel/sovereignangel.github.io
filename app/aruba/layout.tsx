import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Aruba Scavenger Hunt',
  description: "Savaneta Beach · Imgesu's Birthday Edition · 17:00–19:00",
}

export default function ArubaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,500&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
