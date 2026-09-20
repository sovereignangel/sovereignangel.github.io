/**
 * Write a day's ranking, and file everything else as backlog.
 *
 *   node scripts/feed-rank-write.mjs ranking.json [YYYY-MM-DD]
 *
 * The ranking file is a JSON array produced by whoever did the ranking — the
 * agent in the CLI, or the in-app LLM pass. Shape:
 *
 *   [{ "link": "https://…", "score": 78, "reason": "Twelve words, second person" }]
 *
 * What this does, in order:
 *
 *   1. Re-fetches the current candidate set from every source. It does not
 *      trust the ranking file for titles or dates — the file carries judgement,
 *      the feeds carry facts, and mixing the two lets a stale paste rewrite the
 *      archive.
 *   2. Upserts every candidate as a backlog row. Anything not ranked is still
 *      held and searchable; that is the point of the backlog.
 *   3. Stamps the ranked ones with score, reason and surfacedOn, which is what
 *      the /exec card reads.
 *
 * Rows already marked read stay read, and rows already carrying a score keep it
 * when this pass does not score them — so re-running a day is safe.
 */

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import Parser from 'rss-parser'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const rankingPath = process.argv[2]
if (!rankingPath) {
  console.error('usage: node scripts/feed-rank-write.mjs <ranking.json> [YYYY-MM-DD]')
  process.exit(1)
}

// Palanga time, to match todayLocal() in lib/ironman/plan.ts — the /exec page
// looks the ranking up by its own day key, and a machine in another timezone
// would otherwise write a card that the page never finds.
const localDay = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius' }).format(d)
const DAY = process.argv[3] || localDay()

const ARXIV = (c) => `https://export.arxiv.org/rss/${c}`
const SOURCES = [
  ['value', 'Santa Fe Institute', 'https://www.santafe.edu/news-center/feed'],
  ['value', 'Damodaran', 'https://aswathdamodaran.blogspot.com/feeds/posts/default'],
  ['value', 'arXiv econ.GN', ARXIV('econ.GN')],
  ['macro', 'Chartbook', 'https://adamtooze.substack.com/feed'],
  ['macro', 'Marginal Revolution', 'https://marginalrevolution.com/feed'],
  ['macro', 'FT Alphaville', 'https://www.ft.com/alphaville?format=rss'],
  ['ai', 'SemiAnalysis', 'https://semianalysis.com/feed/'],
  ['ai', 'Stratechery', 'https://stratechery.com/feed/'],
  ['ai', 'Import AI', 'https://importai.substack.com/feed'],
  ['ai', 'arXiv cs.AI', ARXIV('cs.AI')],
  ['systems', 'Quanta', 'https://www.quantamagazine.org/feed/'],
  ['systems', 'arXiv physics.soc-ph', ARXIV('physics.soc-ph')],
  ['systems', 'arXiv nlin.AO', ARXIV('nlin.AO')],
  ['capital', 'Capital Allocators', 'https://capitalallocators.com/feed/'],
  ['capital', '2Bobs', 'https://2bobs.libsyn.com/rss'],
]

const parser = new Parser({ timeout: 20000 })

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

const ranking = JSON.parse(readFileSync(rankingPath, 'utf-8'))
const byLink = new Map(ranking.map((r) => [r.link, r]))

const candidates = []
const unreachable = []
for (const [subject, name, url] of SOURCES) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; exec-feed/1.0)' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const feed = await parser.parseString(await res.text())
    for (const item of (feed.items || []).slice(0, 8)) {
      const title = (item.title || '').trim().replace(/\s+/g, ' ')
      const link = (item.link || '').trim()
      if (!title || !link) continue
      const raw = item.isoDate || item.pubDate
      const ts = raw ? Date.parse(raw) : NaN
      candidates.push({ title, link, source: name, subject, published: Number.isNaN(ts) ? null : ts })
    }
  } catch (e) {
    unreachable.push(`${name} (${e.message})`)
  }
}

const seen = new Set()
const unique = candidates.filter((c) => (seen.has(c.link) ? false : seen.add(c.link)))

const dateKey = (ms) => (ms === null ? '' : localDay(new Date(ms)))
const now = Date.now()
let ranked = 0

for (let i = 0; i < unique.length; i += 400) {
  const chunk = unique.slice(i, i + 400)
  const refs = chunk.map((c) =>
    db.collection('users').doc(uid).collection('feed_items')
      .doc(createHash('sha1').update(c.link).digest('hex').slice(0, 20)),
  )
  const existing = await db.getAll(...refs)
  const batch = db.batch()
  chunk.forEach((c, j) => {
    const prev = existing[j].exists ? existing[j].data() : null
    const r = byLink.get(c.link)
    if (r) ranked += 1
    batch.set(refs[j], {
      id: refs[j].id,
      title: c.title,
      link: c.link,
      source: c.source,
      subject: c.subject,
      publishedDate: dateKey(c.published),
      publishedAt: c.published,
      score: r ? r.score : prev?.score ?? null,
      reason: r ? r.reason : prev?.reason ?? null,
      surfacedOn: r ? DAY : prev?.surfacedOn ?? null,
      read: prev?.read ?? false,
      readAt: prev?.readAt ?? null,
      searchText: `${c.title} ${c.source}`.toLowerCase(),
      createdAt: prev?.createdAt ?? now,
    })
  })
  await batch.commit()
}

const missing = ranking.filter((r) => !seen.has(r.link))
console.log(`Day:         ${DAY}`)
console.log(`Candidates:  ${unique.length} held`)
console.log(`Ranked:      ${ranked} of ${ranking.length} surfaced on the card`)
if (missing.length) console.log(`Not in feed: ${missing.length} ranked links no longer in any source — skipped`)
if (unreachable.length) console.log(`Unreachable: ${unreachable.join(', ')}`)
