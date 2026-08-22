import SiteFooter from '@/components/SiteFooter'

export default function MarkovAgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
