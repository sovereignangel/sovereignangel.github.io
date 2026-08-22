import SiteFooter from '@/components/SiteFooter'

export default function MemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
