import type { Metadata } from 'next'
import './mom.css'

export const metadata: Metadata = {
  title: 'Healthspan Hub',
  description:
    'Mom’s health data, analysis and hypotheses in one place — collected, tracked and tested to add good years.',
  robots: { index: false, follow: false },
}

export default function MomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Petrona:ital,wght@0,400;0,600;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
