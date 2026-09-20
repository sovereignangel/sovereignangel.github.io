/**
 * Backfill the feed backlog from whatever history each source still exposes.
 *
 *   node scripts/feed-backfill.mjs [days]        # default 31
 *   node scripts/feed-backfill.mjs 31 --dry
 *
 * RSS is a window, not an archive, and every source draws that window
 * differently. Three retrieval strategies are needed to reach back a month:
 *
 *   - WordPress feeds (Marginal Revolution, Stratechery, Quanta, SemiAnalysis)
 *     page with ?paged=N.
 *   - Blogspot (Damodaran) takes ?max-results=N in one request.
 *   - Substack (Chartbook, Import AI) only ever serves ~20 items over RSS, but
 *     its archive API pages properly with limit+offset and returns JSON.
 *
 * Everything else — SFI, FT Alphaville, 2Bobs, arXiv — gives what it gives.
 * arXiv in particular has no history at all: its feed is strictly the last
 * announcement cycle, so a month of papers is simply not recoverable this way
 * and the run reports that rather than pretending otherwise.
 *
 * Backfilled rows land unranked and unread. They are backlog, not a card: the
 * daily run ranks what is current, and this fills in what came before so the
 * archive is searchable by date and keyword.
 */

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import Parser from 'rss-parser'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const DAYS = Number(process.argv[2]) || 31
const DRY = process.argv.includes('--dry')
const UA = 'Mozilla/5.0 (compatible; exec-feed/1.0)'

// ── Sources, with how deep each one can be read ───────────────────────────
// `mode` picks the retrieval strategy; `pages` is how hard to push it.

const ARXIV = (c) => `https://export.arxiv.org/rss/${c}`

const SOURCES = [
  { subject: 'value', name: 'Santa Fe Institute', url: 'https://www.santafe.edu/news-center/feed', mode: 'rss' },
  { subject: 'value', name: 'Damodaran', url: 'https://aswathdamodaran.blogspot.com/feeds/posts/default', mode: 'blogspot' },
  { subject: 'value', name: 'arXiv econ.GN', url: ARXIV('econ.GN'), mode: 'rss' },

  { subject: 'macro', name: 'Chartbook', url: 'https://adamtooze.substack.com', mode: 'substack', pages: 4 },
  { subject: 'macro', name: 'Marginal Revolution', url: 'https://marginalrevolution.com/feed', mode: 'wp', pages: 8 },
  { subject: 'macro', name: 'FT Alphaville', url: 'https://www.ft.com/alphaville?format=rss', mode: 'rss' },

  { subject: 'ai', name: 'SemiAnalysis', url: 'https://semianalysis.com/feed/', mode: 'wp', pages: 3 },
  { subject: 'ai', name: 'Stratechery', url: 'https://stratechery.com/feed/', mode: 'wp', pages: 4 },
  { subject: 'ai', name: 'Import AI', url: 'https://importai.substack.com', mode: 'substack', pages: 3 },
  { subject: 'ai', name: 'arXiv cs.AI', url: ARXIV('cs.AI'), mode: 'rss' },

  { subject: 'systems', name: 'Quanta', url: 'https://www.quantamagazine.org/feed/', mode: 'wp', pages: 8 },
  { subject: 'systems', name: 'arXiv physics.soc-ph', url: ARXIV('physics.soc-ph'), mode: 'rss' },
  { subject: 'systems', name: 'arXiv nlin.AO', url: ARXIV('nlin.AO'), mode: 'rss' },

  { subject: 'capital', name: 'Capital Allocators', url: 'https://capitalallocators.com/feed/', mode: 'wp', pages: 3 },
  { subject: 'capital', name: '2Bobs', url: 'https://2bobs.libsyn.com/rss', mode: 'rss' },
]

const parser = new Parser({ timeout: 20000 })

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}

function fromRssItems(items, name, subject) {
  return items.flatMap((item) => {
    const title = (item.title || '').trim().replace(/\s+/g, ' ')
    const link = (item.link || '').trim()
    if (!title || !link) return []
    const raw = item.isoDate || item.pubDate
    const ts = raw ? Date.parse(raw) : NaN
    return [{ title, link, source: name, subject, published: Number.isNaN(ts) ? null : ts }]
  })
}

async function collect(src) {
  const out = []
  if (src.mode === 'substack') {
    // Substack RSS stops at ~20; its archive API pages properly.
    for (let page = 0; page < (src.pages || 3); page += 1) {
      const res = await get(`${src.url}/api/v1/archive?sort=new&limit=20&offset=${page * 20}`)
      const posts = await res.json()
      if (!Array.isArray(posts) || posts.length === 0) break
      for (const p of posts) {
        const ts = p.post_date ? Date.parse(p.post_date) : NaN
        out.push({
          title: (p.title || '').trim(),
          link: p.canonical_url || `${src.url}/p/${p.slug}`,
          source: src.name,
          subject: src.subject,
          published: Number.isNaN(ts) ? null : ts,
        })
      }
    }
    return out
  }

  if (src.mode === 'blogspot') {
    const res = await get(`${src.url}?max-results=200`)
    const feed = await parser.parseString(await res.text())
    return fromRssItems(feed.items || [], src.name, src.subject)
  }

  const pages = src.mode === 'wp' ? src.pages || 4 : 1
  const seen = new Set()
  for (let page = 1; page <= pages; page += 1) {
    const url = page === 1 ? src.url : `${src.url}${src.url.includes('?') ? '&' : '?'}paged=${page}`
    let items
    try {
      const res = await get(url)
      const feed = await parser.parseString(await res.text())
      items = fromRssItems(feed.items || [], src.name, src.subject)
    } catch {
      break
    }
    // A feed that ignores ?paged serves page 1 forever — stop when nothing is new.
    const fresh = items.filter((i) => !seen.has(i.link))
    if (fresh.length === 0) break
    fresh.forEach((i) => seen.add(i.link))
    out.push(...fresh)
  }
  return out
}

// ── Firestore ─────────────────────────────────────────────────────────────

function loadEnv() {
  const text = readFileSync('.env.local', 'utf-8')
  const env = {}
  let key = null
  let val = ''
  let multi = false
  for (const line of text.split('\n')) {
    if (multi) {
      val += '\n' + line
      if (/\}""?$/.test(line.trim())) { env[key] = val.replace(/"*$/, ''); multi = false }
      continue
    }
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m) continue
    const [, k, v] = m
    if (v.startsWith('"') && !v.endsWith('"')) { key = k; val = v.slice(1); multi = true }
    else env[k] = v.replace(/^"|"$/g, '')
  }
  return env
}

const env = loadEnv()
initializeApp({
  credential: cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY.trim().replace(/^['"]|['"]$/g, ''))),
})
const db = getFirestore()
const uid = env.TRANSCRIPT_WEBHOOK_UID || env.FIREBASE_UID

const dateKey = (ms) => {
  if (ms === null) return ''
  const d = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const cutoff = Date.now() - DAYS * 86400000
const report = []
let all = []

for (const src of SOURCES) {
  let items = []
  let error = null
  try {
    items = await collect(src)
  } catch (e) {
    error = e.message
  }
  const inWindow = items.filter((i) => i.published !== null && i.published >= cutoff)
  const oldest = items.reduce((min, i) => (i.published && i.published < min ? i.published : min), Infinity)
  report.push({
    name: src.name,
    error,
    fetched: items.length,
    inWindow: inWindow.length,
    reach: Number.isFinite(oldest) ? Math.round((Date.now() - oldest) / 86400000) : null,
  })
  all.push(...inWindow)
}

// De-duplicate: the same link can legitimately arrive from two pages.
const byLink = new Map()
for (const item of all) byLink.set(item.link, item)
all = [...byLink.values()]

console.log(`\nWindow: last ${DAYS} days\n`)
console.log('SOURCE                  FETCHED  IN-WINDOW  REACH')
for (const r of report) {
  const reach = r.error ? `ERR ${r.error}` : r.reach === null ? 'no dates' : `${r.reach}d`
  console.log(`${r.name.padEnd(22)}  ${String(r.fetched).padStart(7)}  ${String(r.inWindow).padStart(9)}  ${reach}`)
}
console.log(`\nUnique items in window: ${all.length}`)

if (DRY) {
  console.log('(dry run — nothing written)')
  process.exit(0)
}

const now = Date.now()
let written = 0
for (let i = 0; i < all.length; i += 400) {
  const chunk = all.slice(i, i + 400)
  const refs = chunk.map((item) =>
    db.collection('users').doc(uid).collection('feed_items')
      .doc(createHash('sha1').update(item.link).digest('hex').slice(0, 20)),
  )
  const existing = await db.getAll(...refs)
  const batch = db.batch()
  chunk.forEach((item, j) => {
    const prev = existing[j].exists ? existing[j].data() : null
    batch.set(refs[j], {
      id: refs[j].id,
      title: item.title,
      link: item.link,
      source: item.source,
      subject: item.subject,
      publishedDate: dateKey(item.published),
      publishedAt: item.published,
      score: prev?.score ?? null,
      reason: prev?.reason ?? null,
      surfacedOn: prev?.surfacedOn ?? null,
      read: prev?.read ?? false,
      readAt: prev?.readAt ?? null,
      searchText: `${item.title} ${item.source}`.toLowerCase(),
      createdAt: prev?.createdAt ?? now,
    })
    written += 1
  })
  await batch.commit()
}
console.log(`Written: ${written} rows to users/${uid}/feed_items`)
