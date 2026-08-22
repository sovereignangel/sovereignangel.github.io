import SiteFooter from '@/components/SiteFooter'

export default function MasteryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
