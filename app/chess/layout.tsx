import SiteFooter from '@/components/SiteFooter'

export default function ChessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  )
}
