'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/auth/AuthProvider'
import { useResearchFeeds } from '@/hooks/useResearchFeeds'
import { getRecentDailyLogs } from '@/lib/firestore/daily-logs'
import type { DailyLog } from '@/lib/types'
import type { ResearchPaper, ResearchProfessor } from '@/lib/types/research'
import type { ReaderSource } from '@/components/thesis/reader/ReaderOverlay'
import type { DocumentSourceType } from '@/lib/types/reading'

const ReaderOverlay = dynamic(() => import('@/components/thesis/reader/ReaderOverlay'), { ssr: false })

// ─── Static Research Profile ─────────────────────────────────────────────────

const CORE_QUESTION =
  'How does intelligence structure itself to expand agency over time?'

const DIRECTION = 'Computational Cognitive Science × Reinforcement Learning'

const DOMAINS = [
  { key: 'empowerment', label: 'Empowerment Theory', description: 'Maximizing future controllable states — intrinsic reward without extrinsic signal' },
  { key: 'intrinsic', label: 'Intrinsic Motivation', description: 'Curiosity-driven RL, information gain, novelty seeking' },
  { key: 'hierarchical', label: 'Hierarchical RL', description: 'POMDPs, options framework, temporal abstraction' },
  { key: 'meta-rl', label: 'Meta-RL', description: 'Learning to learn — adaptive policy selection, fast generalization' },
  { key: 'active-inference', label: 'Active Inference', description: 'Free energy minimization, predictive processing, belief updating' },
  { key: 'world-models', label: 'World Models', description: 'Model-based planning, successor representations, cognitive maps' },
  { key: 'multi-objective', label: 'Multi-Objective RL', description: 'Neuromodulator-inspired multi-signal reward, distributional RL' },
]

const BRIDGE_MAPPINGS = [
  { engine: 'Reward Function', research: 'Multi-objective RL, empowerment as intrinsic reward', domain: 'empowerment' },
  { engine: 'Daily Log → State', research: 'Computational model of human decision-making under uncertainty', domain: 'world-models' },
  { engine: 'RL Module', research: 'Successor representations, hierarchical POMDP exploration', domain: 'hierarchical' },
  { engine: 'Journal → Extraction', research: 'Natural language → structured state observation pipeline', domain: 'meta-rl' },
  { engine: 'Garmin / EEG', research: 'Neurofeedback RL, biometric reward shaping', domain: 'intrinsic' },
  { engine: 'Coherence (Theta)', research: 'Multi-objective alignment across time horizons', domain: 'multi-objective' },
]

const PROFESSORS: ResearchProfessor[] = [
  {
    id: 'gershman',
    name: 'Sam Gershman',
    institution: 'Harvard',
    field: 'Computational Neuroscience / RL',
    focus: ['Model-based vs model-free', 'Cognitive maps', 'Successor representations', 'Exploration'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=bVT6aqoAAAAJ',
    labUrl: 'https://gershmanlab.com',
    relevance: 'Cleanest overlap — empowerment, intrinsic motivation, cognitive control',
  },
  {
    id: 'tenenbaum',
    name: 'Josh Tenenbaum',
    institution: 'MIT',
    field: 'Computational Cognitive Science',
    focus: ['Probabilistic reasoning', 'Program induction', 'Concept learning', 'Structured world models'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=rRJ9wTJMUB8C',
    labUrl: 'https://cocosci.mit.edu',
    relevance: 'Internal generative models — world-model / meta-architecture thinking',
  },
  {
    id: 'griffiths',
    name: 'Tom Griffiths',
    institution: 'Princeton',
    field: 'Bayesian Cognition',
    focus: ['Decision-making under uncertainty', 'Human inference', 'Planning', 'Rational process models'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=eAaoj6sAAAAJ',
    labUrl: 'https://cocosci.princeton.edu',
    relevance: 'Strategic reasoning models, hierarchical RL + belief updating',
  },
  {
    id: 'littman',
    name: 'Michael Littman',
    institution: 'Brown',
    field: 'RL Theory',
    focus: ['Hierarchical RL', 'POMDPs', 'Multi-agent systems', 'RL foundations'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=Gx_JJ3gAAAAJ',
    labUrl: 'https://www.littmania.com',
    relevance: 'POMDP formalism, hierarchical decision-making theory',
  },
  {
    id: 'finn',
    name: 'Chelsea Finn',
    institution: 'Stanford',
    field: 'Meta-Learning',
    focus: ['Learning to learn', 'Adaptation', 'Fast generalization', 'Few-shot learning'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=vfPE6hgAAAAJ',
    labUrl: 'https://ai.stanford.edu/~cbfinn/',
    relevance: 'Meta-optimization, adaptive policy — learning how to learn',
  },
  {
    id: 'levine',
    name: 'Sergey Levine',
    institution: 'UC Berkeley',
    field: 'Reinforcement Learning',
    focus: ['Model-based RL', 'Offline RL', 'Decision transformers', 'Real-world RL'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=8R35rCwAAAAJ',
    labUrl: 'https://rail.eecs.berkeley.edu',
    relevance: 'Applied RL at scale, decision transformers',
  },
  {
    id: 'friston',
    name: 'Karl Friston',
    institution: 'UCL',
    field: 'Active Inference',
    focus: ['Free energy principle', 'Predictive processing', 'Agency under uncertainty'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=q_4u0aoAAAAJ',
    labUrl: 'https://www.fil.ion.ucl.ac.uk/~karl/',
    relevance: 'Philosophical alignment — agency as free energy minimization',
  },
  {
    id: 'abbeel',
    name: 'Pieter Abbeel',
    institution: 'UC Berkeley',
    field: 'Hierarchical RL / Robotics',
    focus: ['Imitation learning', 'Hierarchical RL', 'Scalable control', 'Foundation models for RL'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=vtwH6GkAAAAJ',
    labUrl: 'https://people.eecs.berkeley.edu/~pabbeel/',
    relevance: 'Hierarchical RL systems, scalable control architectures',
  },
  {
    id: 'sadigh',
    name: 'Dorsa Sadigh',
    institution: 'Stanford',
    field: 'Human-in-the-Loop RL',
    focus: ['Interactive learning', 'Alignment', 'Human-robot interaction', 'Preference learning'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=HbFHkJkAAAAJ',
    labUrl: 'https://iliad.stanford.edu',
    relevance: 'Agency + real-world decision systems, human-aligned RL',
  },
  {
    id: 'krakauer_d',
    name: 'David Krakauer',
    institution: 'Santa Fe Institute',
    field: 'Complex Systems + Intelligence',
    focus: ['Collective computation', 'Information theory', 'Adaptive systems', 'Cognitive evolution'],
    googleScholarUrl: 'https://scholar.google.com/citations?user=0gVkfxIAAAAJ',
    labUrl: 'https://www.santafe.edu/people/profile/david-krakauer',
    relevance: 'Macro-level intelligence theory, complex adaptive systems',
  },
]

// ─── Foundation Stack with source URLs ───────────────────────────────────────

interface FoundationItem {
  title: string
  author: string
  status: 'core' | 'queue' | 'done'
  sourceUrl: string
  sourceType: DocumentSourceType
}

const FOUNDATION_STACK: FoundationItem[] = [
  {
    title: 'Reinforcement Learning: An Introduction',
    author: 'Sutton & Barto',
    status: 'core',
    sourceUrl: 'http://incompleteideas.net/book/RLbook2020.pdf',
    sourceType: 'direct_url',
  },
  {
    title: 'Theoretical Neuroscience',
    author: 'Dayan & Abbott',
    status: 'core',
    sourceUrl: 'https://archive.org/download/theoretical-neuroscience/Theoretical%20Neuroscience.pdf',
    sourceType: 'archive_org',
  },
  {
    title: 'Vision (Levels of Analysis)',
    author: 'David Marr',
    status: 'core',
    sourceUrl: 'https://archive.org/download/marrvision/marr-vision.pdf',
    sourceType: 'archive_org',
  },
  {
    title: 'Empowerment — An Introduction',
    author: 'Klyubin, Polani, Nehaniv',
    status: 'queue',
    sourceUrl: 'https://arxiv.org/pdf/0811.4376',
    sourceType: 'arxiv_pdf',
  },
  {
    title: 'Curiosity-Driven Exploration by Self-Supervised Prediction',
    author: 'Pathak et al.',
    status: 'queue',
    sourceUrl: 'https://arxiv.org/pdf/1705.05363',
    sourceType: 'arxiv_pdf',
  },
  {
    title: 'Active Inference: The Free Energy Principle in Mind, Brain, and Behavior',
    author: 'Friston et al.',
    status: 'queue',
    sourceUrl: 'https://arxiv.org/pdf/2201.04011',
    sourceType: 'arxiv_pdf',
  },
  {
    title: 'The Successor Representation in Human Reinforcement Learning',
    author: 'Momennejad et al.',
    status: 'queue',
    sourceUrl: 'https://www.biorxiv.org/content/10.1101/083824v2.full.pdf',
    sourceType: 'direct_url',
  },
]

// Research-relevant keywords to scan in journal entries
const RESEARCH_KEYWORDS = [
  'empowerment', 'agency', 'reward function', 'reinforcement learning', 'rl',
  'pomdp', 'hierarchy', 'meta-learning', 'world model', 'active inference',
  'bayesian', 'exploration', 'intrinsic motivation', 'curiosity', 'successor',
  'cognitive', 'intelligence', 'phd', 'research', 'professor', 'paper',
  'gershman', 'tenenbaum', 'griffiths', 'littman', 'finn', 'friston',
  'thesis engine', 'decision architecture', 'credit assignment', 'belief',
  'dopamine', 'neuroscience', 'consciousness', 'eeg', 'representation',
]

function extractResearchSignals(logs: DailyLog[]): { date: string; excerpt: string; keywords: string[] }[] {
  const signals: { date: string; excerpt: string; keywords: string[] }[] = []

  for (const log of logs) {
    const entry = (log.journalEntry || '').toLowerCase()
    if (!entry) continue

    const matched = RESEARCH_KEYWORDS.filter(kw => entry.includes(kw))
    if (matched.length === 0) continue

    const sentences = (log.journalEntry || '').split(/[.!?\n]+/).filter(s => s.trim().length > 15)
    const relevantSentences = sentences.filter(s => {
      const lower = s.toLowerCase()
      return matched.some(kw => lower.includes(kw))
    }).slice(0, 2)

    if (relevantSentences.length > 0) {
      signals.push({
        date: log.date || log.id || '',
        excerpt: relevantSentences.map(s => s.trim()).join('. '),
        keywords: matched.slice(0, 4),
      })
    }
  }

  return signals.slice(0, 8)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResearchNorthStarView() {
  const { user } = useAuth()
  const { feeds, loading: feedsLoading, refresh } = useResearchFeeds()
  const [journalSignals, setJournalSignals] = useState<{ date: string; excerpt: string; keywords: string[] }[]>([])
  const [journalLoading, setJournalLoading] = useState(true)
  const [expandedProf, setExpandedProf] = useState<string | null>(null)
  const [readerSource, setReaderSource] = useState<ReaderSource | null>(null)

  // Fetch last 30 days of journal entries for research signal extraction
  useEffect(() => {
    if (!user?.uid) return
    setJournalLoading(true)
    getRecentDailyLogs(user.uid, 30)
      .then(logs => setJournalSignals(extractResearchSignals(logs)))
      .finally(() => setJournalLoading(false))
  }, [user?.uid])

  function openReader(source: ReaderSource) {
    setReaderSource(source)
  }

  function openFoundationItem(item: FoundationItem) {
    openReader({
      title: item.title,
      author: item.author,
      sourceUrl: item.sourceUrl,
      sourceType: item.sourceType,
    })
  }

  function openPaper(paper: ResearchPaper, prof: ResearchProfessor) {
    const pdfUrl = getPaperPdfUrl(paper)
    if (pdfUrl) {
      openReader({
        title: paper.title,
        author: paper.authors.join(', '),
        sourceUrl: pdfUrl,
        sourceType: 'semantic_scholar',
        linkedPaperId: paper.paperId,
        linkedProfessorId: prof.id,
      })
    } else {
      // Fallback: open in new tab
      window.open(paper.url, '_blank')
    }
  }

  return (
    <>
      <div className="h-full p-3 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-3 h-full">

          {/* ─── Column 1: Thesis Vector + Bridge ─── */}
          <div className="flex flex-col gap-3 min-h-0">

            {/* Thesis Vector */}
            <div className="bg-white border border-rule rounded-sm p-3">
              <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
                Thesis Vector
              </div>
              <div className="text-[12px] font-serif text-ink leading-snug mb-2 italic">
                &ldquo;{CORE_QUESTION}&rdquo;
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-[9px] font-semibold uppercase text-ink-muted tracking-wide">Direction</span>
                <span className="text-[10px] font-semibold text-ink">{DIRECTION}</span>
              </div>
              <div>
                <span className="text-[9px] font-semibold uppercase text-ink-muted tracking-wide">Key Domains</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {DOMAINS.map(d => (
                    <span
                      key={d.key}
                      className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20"
                      title={d.description}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Thesis Engine → Research Bridge */}
            <div className="bg-white border border-rule rounded-sm p-3 flex-1 min-h-0 overflow-y-auto">
              <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                Engine → Research Bridge
              </div>
              <div className="space-y-1.5">
                {BRIDGE_MAPPINGS.map((m, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[10px] font-semibold text-ink whitespace-nowrap">{m.engine}</span>
                    <span className="text-[9px] text-ink-muted">→</span>
                    <span className="text-[9px] text-ink-muted leading-tight">{m.research}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Column 2: Field Intelligence (Professors + Feeds) ─── */}
          <div className="bg-white border border-rule rounded-sm p-3 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
              <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Field Intelligence
              </div>
              <button
                onClick={refresh}
                disabled={feedsLoading}
                className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
              >
                {feedsLoading ? 'Fetching...' : 'Refresh'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {PROFESSORS.map(prof => {
                const papers = feeds[prof.id] || []
                const isExpanded = expandedProf === prof.id

                return (
                  <div key={prof.id} className="border border-rule-light rounded-sm">
                    <button
                      onClick={() => setExpandedProf(isExpanded ? null : prof.id)}
                      className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-cream/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[11px] font-semibold text-ink">{prof.name}</span>
                          <span className="text-[9px] text-ink-muted">{prof.institution}</span>
                          <span className="text-[8px] text-ink-faint">· {prof.field}</span>
                        </div>
                        {!isExpanded && papers.length > 0 && (
                          <div className="text-[9px] text-ink-muted truncate mt-0.5">
                            Latest: {papers[0].title}
                          </div>
                        )}
                        {!isExpanded && papers.length === 0 && !feedsLoading && (
                          <div className="text-[9px] text-ink-faint mt-0.5">No recent papers loaded</div>
                        )}
                      </div>
                      <span className="text-[9px] text-ink-faint shrink-0">
                        {papers.length > 0 && `${papers.length}`}
                      </span>
                      <svg
                        className={`w-3 h-3 text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-2 pb-2 border-t border-rule-light">
                        {/* Professor detail */}
                        <div className="mt-1.5 mb-1.5">
                          <div className="text-[9px] text-ink-muted italic leading-tight">{prof.relevance}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {prof.focus.map(f => (
                              <span key={f} className="text-[8px] px-1 py-0.5 rounded-sm bg-cream border border-rule-light text-ink-muted">
                                {f}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {prof.googleScholarUrl && (
                              <a href={prof.googleScholarUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[8px] text-burgundy hover:underline">Scholar</a>
                            )}
                            {prof.labUrl && (
                              <a href={prof.labUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[8px] text-burgundy hover:underline">Lab</a>
                            )}
                          </div>
                        </div>

                        {/* Papers */}
                        {papers.length > 0 ? (
                          <div className="space-y-1">
                            {papers.map(paper => (
                              <PaperRow
                                key={paper.paperId}
                                paper={paper}
                                onRead={() => openPaper(paper, prof)}
                              />
                            ))}
                          </div>
                        ) : feedsLoading ? (
                          <div className="text-[9px] text-ink-faint py-1">Loading...</div>
                        ) : (
                          <div className="text-[9px] text-ink-faint py-1">No papers fetched yet</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Column 3: Research Signals from Journal ─── */}
          <div className="flex flex-col gap-3 min-h-0">

            {/* Journal → Research Signals */}
            <div className="bg-white border border-rule rounded-sm p-3 flex-1 min-h-0 overflow-y-auto">
              <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
                Journal Signals
              </div>
              <div className="text-[9px] text-ink-muted mb-2">
                Research-relevant excerpts from last 30 days
              </div>

              {journalLoading ? (
                <div className="text-[9px] text-ink-faint">Scanning journals...</div>
              ) : journalSignals.length === 0 ? (
                <div className="text-[9px] text-ink-faint">
                  No research signals found in recent journals. Write about your research thinking to surface connections here.
                </div>
              ) : (
                <div className="space-y-2">
                  {journalSignals.map((sig, i) => (
                    <div key={i} className="border-l-2 border-burgundy/30 pl-2">
                      <div className="text-[8px] text-ink-faint font-mono">{sig.date}</div>
                      <div className="text-[10px] text-ink leading-tight mt-0.5">
                        {sig.excerpt.length > 160 ? sig.excerpt.slice(0, 160) + '...' : sig.excerpt}
                      </div>
                      <div className="flex gap-1 mt-0.5">
                        {sig.keywords.map(kw => (
                          <span key={kw} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-green-bg text-green-ink border border-green-ink/10">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Readings / Foundation Stack */}
            <div className="bg-white border border-rule rounded-sm p-3">
              <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                Foundation Stack
              </div>
              <div className="space-y-1">
                {FOUNDATION_STACK.map((item, i) => (
                  <ReadingItem
                    key={i}
                    item={item}
                    onRead={() => openFoundationItem(item)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reader Overlay */}
      {readerSource && (
        <ReaderOverlay
          source={readerSource}
          onClose={() => setReaderSource(null)}
        />
      )}
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PaperRow({ paper, onRead }: { paper: ResearchPaper; onRead: () => void }) {
  const hasPdf = !!(getPaperPdfUrl(paper))

  return (
    <div className="flex items-start gap-1 px-1.5 py-1 rounded-sm hover:bg-cream/50 transition-colors group">
      <a
        href={paper.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0"
      >
        <div className="text-[10px] text-ink font-medium leading-tight group-hover:text-burgundy transition-colors">
          {paper.title}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {paper.year && <span className="text-[8px] text-ink-faint font-mono">{paper.year}</span>}
          {paper.venue && <span className="text-[8px] text-ink-faint truncate">{paper.venue}</span>}
          {paper.citationCount != null && paper.citationCount > 0 && (
            <span className="text-[8px] text-ink-faint">{paper.citationCount} cit.</span>
          )}
        </div>
      </a>
      {hasPdf && (
        <button
          onClick={(e) => { e.stopPropagation(); onRead() }}
          className="text-[8px] font-serif font-medium px-1.5 py-0.5 rounded-sm border border-burgundy/30 text-burgundy hover:bg-burgundy hover:text-paper transition-colors shrink-0 mt-0.5"
        >
          Read
        </button>
      )}
    </div>
  )
}

function ReadingItem({ item, onRead }: { item: FoundationItem; onRead: () => void }) {
  return (
    <div className="flex items-start gap-1.5 group">
      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
        item.status === 'core' ? 'bg-burgundy' : item.status === 'done' ? 'bg-green-ink' : 'bg-ink-faint'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-ink leading-tight">{item.title}</div>
        <div className="text-[8px] text-ink-muted">{item.author}</div>
      </div>
      <button
        onClick={onRead}
        className="text-[8px] font-serif font-medium px-1.5 py-0.5 rounded-sm border border-burgundy/30 text-burgundy hover:bg-burgundy hover:text-paper transition-colors shrink-0 opacity-0 group-hover:opacity-100"
      >
        Read
      </button>
    </div>
  )
}

// Helper shared between component and PaperRow
function getPaperPdfUrl(paper: ResearchPaper): string | null {
  if (!paper.url) return null
  const arxivMatch = paper.url.match(/arxiv\.org\/abs\/(\d+\.\d+)/)
  if (arxivMatch) return `https://arxiv.org/pdf/${arxivMatch[1]}`
  if (paper.url.endsWith('.pdf')) return paper.url
  return null
}
