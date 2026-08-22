import SiteFooter from '@/components/SiteFooter'

export default function WindLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
