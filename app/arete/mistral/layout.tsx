import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mistral · Arete LP Retreat · Kitesurf France · July 2026',
  description: 'On the wind, the long view. A four-week kitesurf retreat on the French coast for the partners of Arete Technologies.',
  openGraph: {
    title: 'Mistral · Arete LP Retreat',
    description: 'On the wind, the long view. Four weeks of kitesurf on the French coast — July 2026.',
    url: 'https://arete.loricorpuz.com/mistral',
    siteName: 'Arete Technologies',
    type: 'website',
  },
}

export default function MistralLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=GFS+Didot&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
