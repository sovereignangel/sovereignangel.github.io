/**
 * Dump today's feed candidates for ranking in the CLI.
 *
 * The in-app ranker (lib/exec/feed.ts) calls an LLM. When that is unavailable —
 * or when a sharper read is wanted than a batched prompt gives — this prints the
 * same candidate set for a human or an agent to rank by hand.
 *
 *   node scripts/feed-candidates.mjs
 */
import Parser from 'rss-parser'

const ARXIV = (c) => `https://export.arxiv.org/rss/${c}`

const SUBJECTS = [
  { id: 'value', title: 'Value', sources: [
    ['Santa Fe Institute', 'https://www.santafe.edu/news-center/feed'],
    ['Damodaran', 'https://aswathdamodaran.blogspot.com/feeds/posts/default'],
    ['arXiv econ.GN', ARXIV('econ.GN')],
  ]},
  { id: 'macro', title: 'Macro & Geopolitics', sources: [
    ['Chartbook', 'https://adamtooze.substack.com/feed'],
    ['Marginal Revolution', 'https://marginalrevolution.com/feed'],
    ['FT Alphaville', 'https://www.ft.com/alphaville?format=rss'],
  ]},
  { id: 'ai', title: 'AI & Compute', sources: [
    ['SemiAnalysis', 'https://semianalysis.com/feed/'],
    ['Stratechery', 'https://stratechery.com/feed/'],
    ['Import AI', 'https://importai.substack.com/feed'],
    ['arXiv cs.AI', ARXIV('cs.AI')],
  ]},
  { id: 'systems', title: 'Systems', sources: [
    ['Quanta', 'https://www.quantamagazine.org/feed/'],
    ['arXiv physics.soc-ph', ARXIV('physics.soc-ph')],
    ['arXiv nlin.AO', ARXIV('nlin.AO')],
  ]},
  { id: 'capital', title: 'Capital & Persuasion', sources: [
    ['Capital Allocators', 'https://capitalallocators.com/feed/'],
    ['2Bobs', 'https://2bobs.libsyn.com/rss'],
  ]},
]

const parser = new Parser({ timeout: 15000 })
const age = (ms) => {
  if (!ms) return '?'
  const d = Math.round((Date.now() - ms) / 86400000)
  return d < 1 ? 'today' : `${d}d`
}

for (const subject of SUBJECTS) {
  console.log(`\n##### ${subject.title}`)
  for (const [name, url] of subject.sources) {
    let items = []
    let err = null
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; exec-feed/1.0)' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const feed = await parser.parseString(await res.text())
      items = (feed.items || []).slice(0, 6)
    } catch (e) {
      err = e.message
    }
    if (err) { console.log(`  [${name}] UNREACHABLE — ${err}`); continue }
    if (items.length === 0) { console.log(`  [${name}] no items`); continue }
    for (const it of items) {
      const t = (it.title || '').trim().replace(/\s+/g, ' ')
      const raw = it.isoDate || it.pubDate
      const ts = raw ? Date.parse(raw) : NaN
      console.log(`  [${name}] ${age(Number.isNaN(ts) ? null : ts)} · ${t}`)
      console.log(`      ${(it.link || '').trim()}`)
    }
  }
}
