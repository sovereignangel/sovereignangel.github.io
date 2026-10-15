import type { Metadata } from 'next'
import MemosSheet from '@/components/complexecon/MemosSheet'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Memos · Complexity Economics',
  description: 'Research memos and primers — newest first, searchable.',
}

export default function ComplexEconMemosPage() {
  return (
    <>
      <MemosSheet />
      <SiteFooter />
    </>
  )
}
