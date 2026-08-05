import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Copenhagen Scavenger Hunt',
  description: 'Copenhagen · Four Hours · Eight Hunters · One Winner',
}

export default function CphLayout({ children }: { children: React.ReactNode }) {
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
