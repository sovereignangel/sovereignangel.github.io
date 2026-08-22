import SiteFooter from '@/components/SiteFooter'

export default function ArmstrongLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
