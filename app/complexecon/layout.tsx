import SiteFooter from '@/components/SiteFooter'

export default function ComplexeconLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
