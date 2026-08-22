import SiteFooter from '@/components/SiteFooter'

export default function ExecLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
