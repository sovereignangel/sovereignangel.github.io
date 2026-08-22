import SiteFooter from '@/components/SiteFooter'

export default function BriefLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
