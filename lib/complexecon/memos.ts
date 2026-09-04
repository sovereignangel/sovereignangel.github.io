// Memo registry for /complexecon/memos — metadata only, so the shared nav can
// list memos without pulling any memo body into common bundles. Bodies live in
// memo-bodies.ts and are imported only by the memo's own route.

export interface MemoMeta {
  slug: string
  title: string
  date: string // YYYY-MM-DD
  summary: string
  tags: string[]
}

// Newest first — keep this ordering when adding memos.
export const MEMOS: MemoMeta[] = [
  {
    slug: 'ofr-dossier',
    title: 'The OFR Dossier',
    date: '2026-09-04',
    summary:
      'A primer on the US Office of Financial Research: the CE-NIF origin, the Dodd-Frank compromise, two dismantlings, why it sits unused — and the eight people who map it to complexity theory, with their top three works each.',
    tags: ['OFR', 'systemic risk', 'networks', 'Bookstaber', 'Glasserman', 'Young', 'ACTUS', 'institutions'],
  },
]
