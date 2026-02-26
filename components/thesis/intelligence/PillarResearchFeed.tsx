'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useResearchFeeds } from '@/hooks/useResearchFeeds'
import { getInboxExternalSignals } from '@/lib/firestore/external-signals'
import { getRecentDailyLogs } from '@/lib/firestore/daily-logs'
import { PROFESSORS, RESEARCH_KEYWORDS, EMERGENCE_KEYWORDS, MIND_KEYWORDS } from '@/lib/research-constants'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'
import type { ExternalSignal } from '@/lib/types'
import type { DailyLog } from '@/lib/types'

interface JournalSignal {
  date: string
  excerpt: string
  keywords: string[]
}

function extractKeywordSignals(logs: DailyLog[], keywords: string[]): JournalSignal[] {
  const signals: JournalSignal[] = []
  for (const log of logs) {
    const entry = (log.journalEntry || '').toLowerCase()
    if (!entry) continue
    const matched = keywords.filter(kw => entry.includes(kw))
    if (matched.length === 0) continue
    const sentences = (log.journalEntry || '').split(/[.!?\n]+/).filter(s => s.trim().length > 15)
    const relevant = sentences.filter(s => {
      const lower = s.toLowerCase()
      return matched.some(kw => lower.includes(kw))
    }).slice(0, 2)
    if (relevant.length > 0) {
      signals.push({
        date: log.date || log.id || '',
        excerpt: relevant.map(s => s.trim()).join('. '),
        keywords: matched.slice(0, 4),
      })
    }
  }
  return signals.slice(0, 8)
}

function SignalCard({ signal }: { signal: ExternalSignal }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="border border-rule-light rounded-sm p-2 hover:border-rule transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-1.5">
        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 mt-0.5 ${
          signal.source === 'arxiv' ? 'bg-green-bg text-green-ink border-green-ink/10' :
          signal.source === 'edgar' ? 'bg-amber-bg text-amber-ink border-amber-ink/10' :
          'bg-cream text-ink-muted border-rule-light'
        }`}>
          {signal.source === 'rss_feed' ? 'RSS' : signal.source === 'twitter_list' ? 'X' : signal.source.toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-ink leading-tight">{signal.title}</div>
          {expanded && signal.aiSummary && (
            <div className="text-[9px] text-ink-muted leading-tight mt-1">{signal.aiSummary}</div>
          )}
          {expanded && signal.valueBullets && signal.valueBullets.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {signal.valueBullets.map((b, i) => (
                <li key={i} className="text-[9px] text-ink-muted leading-tight flex items-start gap-1">
                  <span className="text-ink-faint shrink-0">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[8px] text-ink-faint font-mono">{Math.round(signal.relevanceScore * 100)}%</span>
            {signal.thesisPillars?.map(p => (
              <span key={p} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function JournalSignalCard({ signal, color }: { signal: JournalSignal; color: string }) {
  return (
    <div className={`border-l-2 ${color} pl-2 py-0.5`}>
      <div className="text-[8px] text-ink-faint font-mono">{signal.date}</div>
      <div className="text-[10px] text-ink leading-tight mt-0.5">
        {signal.excerpt.length > 160 ? signal.excerpt.slice(0, 160) + '...' : signal.excerpt}
      </div>
      <div className="flex gap-1 mt-0.5">
        {signal.keywords.map(kw => (
          <span key={kw} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-green-bg text-green-ink border border-green-ink/10">
            {kw}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProfessorFeed() {
  const { feeds, loading, refresh } = useResearchFeeds()

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Professor Papers
        </span>
        <button
          onClick={refresh}
          disabled={loading}
          className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div className="space-y-1">
        {PROFESSORS.slice(0, 6).map(prof => {
          const papers = feeds[prof.id] || []
          if (papers.length === 0) return null
          return (
            <div key={prof.id} className="border border-rule-light rounded-sm p-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-semibold text-ink">{prof.name}</span>
                <span className="text-[8px] text-ink-faint">{prof.institution}</span>
              </div>
              {papers.slice(0, 2).map(paper => (
                <a
                  key={paper.paperId}
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[9px] text-ink-muted hover:text-burgundy leading-tight mt-0.5 truncate"
                >
                  {paper.title}
                </a>
              ))}
            </div>
          )
        }).filter(Boolean)}
        {!loading && Object.keys(feeds).length === 0 && (
          <div className="text-[9px] text-ink-faint">No papers loaded. Click Refresh.</div>
        )}
      </div>
    </div>
  )
}

export default function PillarResearchFeed({ pillar }: { pillar: ThesisPillarExtended }) {
  const { user } = useAuth()
  const [signals, setSignals] = useState<ExternalSignal[]>([])
  const [journalSignals, setJournalSignals] = useState<JournalSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)

    const keywords = pillar === 'ai' ? RESEARCH_KEYWORDS
      : pillar === 'emergence' ? EMERGENCE_KEYWORDS
      : pillar === 'mind' ? MIND_KEYWORDS
      : []

    Promise.all([
      getInboxExternalSignals(user.uid).then(all =>
        all.filter(s => s.thesisPillars?.includes(pillar as typeof s.thesisPillars[number]))
      ).catch(() => []),
      pillar !== 'markets'
        ? getRecentDailyLogs(user.uid, 30).then(logs => extractKeywordSignals(logs, keywords)).catch(() => [])
        : Promise.resolve([]),
    ]).then(([sigs, jSigs]) => {
      setSignals(sigs.slice(0, 10))
      setJournalSignals(jSigs)
    }).finally(() => setLoading(false))
  }, [user?.uid, pillar])

  if (loading) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-cream rounded-sm w-1/4" />
          <div className="h-2 bg-cream rounded-sm w-full" />
          <div className="h-2 bg-cream rounded-sm w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        Research Feed
      </div>

      {/* AI tab gets professor papers section */}
      {pillar === 'ai' && (
        <div className="mb-3">
          <ProfessorFeed />
        </div>
      )}

      {/* External signals for this pillar */}
      {signals.length > 0 && (
        <div className="mb-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            {pillar === 'ai' ? 'ArXiv & Research Signals' :
             pillar === 'markets' ? 'Market & Filing Signals' :
             pillar === 'emergence' ? 'Complexity Signals' :
             'Signals'}
          </div>
          <div className="space-y-1">
            {signals.map(s => (
              <SignalCard key={s.id} signal={s} />
            ))}
          </div>
        </div>
      )}

      {/* Journal pattern signals */}
      {journalSignals.length > 0 && (
        <div>
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
            Journal Signals
          </div>
          <div className="space-y-1.5">
            {journalSignals.map((s, i) => (
              <JournalSignalCard
                key={i}
                signal={s}
                color={pillar === 'ai' ? 'border-burgundy/30' :
                       pillar === 'emergence' ? 'border-amber-ink/30' :
                       'border-green-ink/30'}
              />
            ))}
          </div>
        </div>
      )}

      {signals.length === 0 && journalSignals.length === 0 && pillar !== 'ai' && (
        <div className="text-[10px] text-ink-faint">
          No signals yet. Fetch RSS feeds, sync ArXiv papers, or write journal entries mentioning {pillar} topics.
        </div>
      )}
    </div>
  )
}
