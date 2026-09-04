import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Masthead } from '@/components/complexecon/tearsheet'
import { MEMOS } from '@/lib/complexecon/memos'
import { OFR_DOSSIER_HTML } from '@/lib/complexecon/memo-bodies'

const BODIES: Record<string, string> = {
  'ofr-dossier': OFR_DOSSIER_HTML,
}

export function generateStaticParams() {
  return MEMOS.map(m => ({ slug: m.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const memo = MEMOS.find(m => m.slug === params.slug)
  return {
    title: memo ? `${memo.title} · Memos` : 'Memo',
    description: memo?.summary,
  }
}

export default function MemoPage({ params }: { params: { slug: string } }) {
  const memo = MEMOS.find(m => m.slug === params.slug)
  const body = BODIES[params.slug]
  if (!memo || !body) notFound()

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-[1320px] px-3 py-5 md:px-5 md:py-7">
        <Masthead
          kicker="Lori Corpuz · Research Memo"
          title={memo.title}
          meta={memo.date}
          active="memos"
        />
        <div className="mb-3">
          <Link
            href="/complexecon/memos"
            className="font-mono text-[13px] uppercase tracking-[1px] text-ink-muted underline decoration-rule underline-offset-2 hover:text-burgundy"
          >
            ← All memos
          </Link>
        </div>
        <article dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </main>
  )
}
