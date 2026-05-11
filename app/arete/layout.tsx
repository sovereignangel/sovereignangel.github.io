import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Arete Technologies — The long practice.',
  description: 'Arete Technologies is the parent house. Three ventures operate beneath it: Armstrong (capital), Arete Salons (conversation), and Arete Mistral (craft). What compounds, endures.',
  openGraph: {
    title: 'Arete Technologies',
    description: 'The long practice. Armstrong · Salons · Mistral.',
    url: 'https://arete.loricorpuz.com',
    siteName: 'Arete Technologies',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function AreteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
