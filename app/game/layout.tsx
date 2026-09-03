import SiteFooter from '@/components/SiteFooter'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
