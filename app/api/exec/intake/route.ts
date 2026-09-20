/**
 * POST /api/exec/intake — pull the day's download.
 *
 * Fetches the feeds and the arXiv categories, and creates a document for
 * anything not already in the ledger. It only ever creates: an item already
 * read, skipped, or sitting in the backlog is left exactly as it is, so a
 * second pull on the same day is free and a re-pull never resurrects
 * something already judged.
 *
 * Nothing here scores or summarises. The point of the pile is that it is
 * already narrowed by the choice of source, and a relevance model between
 * you and the reading is one more thing to tune instead of read.
 */

import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { verifyAuth } from '@/lib/api-auth'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { ARXIV_CATEGORIES, INTAKE_FEEDS, itemIdFromUrl } from '@/lib/exec/intake'
import type { IntakeItem, IntakeKind } from '@/lib/types/intake'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ARXIV_API = 'https://export.arxiv.org/api/query'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Per feed, so one prolific blog cannot bury the rest of the pull. */
const PER_FEED = 4
const PER_CATEGORY = 3

const isoDay = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback
  const t = Date.parse(value)
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : fallback
}

const clean = (s: string): string =>
  s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()

interface Candidate {
  kind: IntakeKind
  title: string
  url: string
  source: string
  publishedAt: string
  blurb: string
}

async function pullFeeds(today: string): Promise<Candidate[]> {
  const parser = new Parser({ timeout: 12_000 })
  const out: Candidate[] = []
  // One slow or dead feed must not cost the whole pull, so each is settled
  // independently and a rejection simply contributes nothing.
  const results = await Promise.allSettled(
    INTAKE_FEEDS.map(async (feed) => ({ feed, parsed: await parser.parseURL(feed.url) }))
  )
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const { feed, parsed } = r.value
    for (const item of (parsed.items || []).slice(0, PER_FEED)) {
      const url = item.link?.trim()
      const title = clean(item.title || '')
      if (!url || !title) continue
      out.push({
        kind: feed.kind,
        title: title.slice(0, 300),
        url,
        source: feed.name,
        publishedAt: isoDay(item.isoDate || item.pubDate, today),
        blurb: clean(item.contentSnippet || item.content || '').slice(0, 400),
      })
    }
  }
  return out
}

async function pullArxiv(today: string): Promise<Candidate[]> {
  const out: Candidate[] = []
  const results = await Promise.allSettled(
    ARXIV_CATEGORIES.map(async (c) => {
      const url = `${ARXIV_API}?search_query=cat:${encodeURIComponent(c.cat)}&sortBy=submittedDate&sortOrder=descending&max_results=${PER_CATEGORY}`
      const res = await fetch(url, { headers: { 'User-Agent': 'loricorpuz.com intake' } })
      if (!res.ok) throw new Error(`arXiv ${c.cat}: ${res.status}`)
      return { c, xml: await res.text() }
    })
  )
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const { c, xml } = r.value
    for (const entry of xml.split('<entry>').slice(1)) {
      const tag = (t: string) => entry.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1]?.trim() || ''
      const link = tag('id')
      const title = clean(tag('title'))
      if (!link || !title) continue
      out.push({
        kind: 'paper',
        title: title.slice(0, 300),
        url: link,
        source: `arXiv ${c.cat}`,
        publishedAt: isoDay(tag('published'), today),
        blurb: clean(tag('summary')).slice(0, 400),
      })
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  const today: string = DATE_RE.test(body?.date) ? body.date : new Date().toISOString().slice(0, 10)

  let candidates: Candidate[]
  try {
    const [feeds, papers] = await Promise.all([pullFeeds(today), pullArxiv(today)])
    candidates = [...feeds, ...papers]
  } catch (error) {
    console.error('[exec/intake] pull failed:', error)
    return NextResponse.json({ error: 'Could not reach the sources — try again shortly.' }, { status: 502 })
  }

  if (candidates.length === 0) {
    return NextResponse.json({ error: 'Every source came back empty — likely a network blip.' }, { status: 502 })
  }

  // Collapse duplicates inside the pull itself before touching Firestore: the
  // same story reaching two feeds should cost one read, not two writes.
  const byId = new Map<string, Candidate>()
  for (const c of candidates) {
    const id = itemIdFromUrl(c.url)
    if (!byId.has(id)) byId.set(id, c)
  }

  const col = adminDb.collection(`users/${auth.uid}/intake_items`)
  const ids = [...byId.keys()]
  const existing = new Set<string>()
  // getAll caps at a few hundred refs; chunk so a wide pull cannot exceed it.
  for (let i = 0; i < ids.length; i += 200) {
    const snaps = await adminDb.getAll(...ids.slice(i, i + 200).map((id) => col.doc(id)))
    for (const s of snaps) if (s.exists) existing.add(s.id)
  }

  const fresh = ids.filter((id) => !existing.has(id))
  const batch = adminDb.batch()
  for (const id of fresh) {
    const c = byId.get(id)!
    const item: Omit<IntakeItem, 'id'> = {
      kind: c.kind,
      title: c.title,
      url: c.url,
      source: c.source,
      publishedAt: c.publishedAt,
      addedOn: today,
      status: 'backlog',
      blurb: c.blurb,
    }
    batch.set(col.doc(id), { ...item, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
  }
  if (fresh.length > 0) await batch.commit()

  const added = fresh.reduce<Record<string, number>>((acc, id) => {
    const k = byId.get(id)!.kind
    return { ...acc, [k]: (acc[k] || 0) + 1 }
  }, {})

  return NextResponse.json({ success: true, seen: ids.length, added: fresh.length, byKind: added })
}
