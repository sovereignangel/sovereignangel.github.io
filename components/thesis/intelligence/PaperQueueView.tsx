'use client'

import { useState } from 'react'
import { usePaperQueue } from '@/hooks/usePaperQueue'
import type { PaperImplementation, PaperImplementationStatus, PaperDifficulty, ThesisPillar } from '@/lib/types'

const STATUS_ORDER: PaperImplementationStatus[] = ['implementing', 'reading', 'queued', 'published']

const STATUS_LABELS: Record<PaperImplementationStatus, string> = {
  queued: 'Queued',
  reading: 'Reading',
  implementing: 'Implementing',
  published: 'Published',
}

const STATUS_COLORS: Record<PaperImplementationStatus, string> = {
  queued: 'text-ink-muted',
  reading: 'text-amber-ink',
  implementing: 'text-burgundy',
  published: 'text-green-ink',
}

const ADVANCE_LABELS: Record<PaperImplementationStatus, string | null> = {
  queued: 'Start Reading',
  reading: 'Start Implementing',
  implementing: 'Mark Published',
  published: null,
}

const DIFFICULTY_COLORS: Record<PaperDifficulty, string> = {
  low: 'text-green-ink bg-green-bg border-green-ink/10',
  medium: 'text-amber-ink bg-amber-bg border-amber-ink/10',
  high: 'text-red-ink bg-red-ink/5 border-red-ink/10',
}

const PILLAR_OPTIONS: ThesisPillar[] = ['ai', 'markets', 'mind']

function PaperCard({
  paper,
  onAdvance,
  onUpdate,
  onRemove,
}: {
  paper: PaperImplementation
  onAdvance: (id: string, status: PaperImplementationStatus) => void
  onUpdate: (id: string, data: Partial<PaperImplementation>) => void
  onRemove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const advanceLabel = ADVANCE_LABELS[paper.status]

  return (
    <div className="border border-rule-light rounded-sm p-2 hover:border-rule transition-colors">
      <div className="flex items-start gap-1.5">
        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 mt-0.5 ${STATUS_COLORS[paper.status]} bg-cream`}>
          {STATUS_LABELS[paper.status]}
        </span>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full"
          >
            <div className="text-[10px] font-medium text-ink leading-tight">{paper.title}</div>
          </button>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="font-mono text-[8px] text-ink-faint">
              {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''} ({paper.year})
            </span>
            {paper.difficulty && (
              <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${DIFFICULTY_COLORS[paper.difficulty]}`}>
                {paper.difficulty}
              </span>
            )}
            {paper.pillars?.map(p => (
              <span key={p} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
                {p}
              </span>
            ))}
            {paper.estimatedHours > 0 && (
              <span className="font-mono text-[8px] text-ink-faint">
                ~{paper.estimatedHours}h
              </span>
            )}
          </div>

          {expanded && (
            <div className="mt-2 space-y-1.5">
              {paper.abstract && (
                <p className="text-[9px] text-ink-muted leading-tight">{paper.abstract}</p>
              )}

              {paper.keyConceptsToImplement?.length > 0 && (
                <div>
                  <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">Key Concepts</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {paper.keyConceptsToImplement.map((c, i) => (
                      <span key={i} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm bg-cream border border-rule text-ink-muted">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {paper.paperUrl && (
                <a
                  href={paper.paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-burgundy hover:underline"
                >
                  View Paper
                </a>
              )}

              {/* Blog/Repo links for published */}
              {paper.status === 'published' && (
                <div className="flex gap-2">
                  {paper.substackUrl && (
                    <a href={paper.substackUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-green-ink hover:underline">
                      Substack Post
                    </a>
                  )}
                  {paper.repoUrl && (
                    <a href={paper.repoUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-green-ink hover:underline">
                      GitHub Repo
                    </a>
                  )}
                </div>
              )}

              {/* Editable fields for implementing */}
              {paper.status === 'implementing' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={paper.blogTitle || ''}
                    onChange={e => onUpdate(paper.id!, { blogTitle: e.target.value })}
                    className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="Blog title for Substack..."
                  />
                  <input
                    type="text"
                    value={paper.keyInsight || ''}
                    onChange={e => onUpdate(paper.id!, { keyInsight: e.target.value })}
                    className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="Key insight from implementation..."
                  />
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={paper.repoUrl || ''}
                      onChange={e => onUpdate(paper.id!, { repoUrl: e.target.value })}
                      className="flex-1 font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                      placeholder="GitHub repo URL..."
                    />
                    <input
                      type="text"
                      value={paper.substackUrl || ''}
                      onChange={e => onUpdate(paper.id!, { substackUrl: e.target.value })}
                      className="flex-1 font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                      placeholder="Substack URL..."
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 pt-1">
                {advanceLabel && (
                  <button
                    onClick={() => onAdvance(paper.id!, paper.status)}
                    className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
                  >
                    {advanceLabel}
                  </button>
                )}
                <button
                  onClick={() => onRemove(paper.id!)}
                  className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-red-ink hover:border-red-ink/30 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaperQueueView() {
  const { papers, loading, todayPublished, queue, advance, update, remove, byStatus } = usePaperQueue()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<PaperImplementationStatus | 'all'>('all')

  // Add form state
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [paperUrl, setPaperUrl] = useState('')
  const [abstract, setAbstract] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [difficulty, setDifficulty] = useState<PaperDifficulty>('medium')
  const [pillars, setPillars] = useState<ThesisPillar[]>(['ai'])
  const [concepts, setConcepts] = useState('')
  const [estHours, setEstHours] = useState(4)

  const handleAdd = async () => {
    if (!title.trim()) return
    await queue({
      title: title.trim(),
      authors: authors.split(',').map(a => a.trim()).filter(Boolean),
      paperUrl: paperUrl.trim(),
      abstract: abstract.trim(),
      year,
      difficulty,
      pillars,
      keyConceptsToImplement: concepts.split(',').map(c => c.trim()).filter(Boolean),
      estimatedHours: estHours,
    })
    setTitle('')
    setAuthors('')
    setPaperUrl('')
    setAbstract('')
    setConcepts('')
    setShowAdd(false)
  }

  const togglePillar = (p: ThesisPillar) => {
    setPillars(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const displayed = filter === 'all'
    ? STATUS_ORDER.flatMap(s => byStatus(s))
    : byStatus(filter)

  const inProgress = byStatus('implementing').length + byStatus('reading').length
  const queuedCount = byStatus('queued').length

  return (
    <div className="space-y-3">
      {/* Header Stats */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Paper Reproduction Queue
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
          >
            {showAdd ? 'Cancel' : '+ Queue Paper'}
          </button>
        </div>

        {/* Daily metric */}
        <div className="flex items-center gap-3 pb-2 border-b border-rule-light">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-ink-muted">Today</span>
            <span className={`font-mono text-[16px] font-bold ${todayPublished >= 1 ? 'text-green-ink' : 'text-red-ink'}`}>
              {todayPublished}/1
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-ink-muted">In Progress</span>
            <span className="font-mono text-[11px] font-semibold text-ink">{inProgress}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-ink-muted">Queued</span>
            <span className="font-mono text-[11px] font-semibold text-ink">{queuedCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-ink-muted">Total Published</span>
            <span className="font-mono text-[11px] font-semibold text-green-ink">{byStatus('published').length}</span>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="mt-2 space-y-1.5 pb-2 border-b border-rule-light">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
              placeholder="Paper title..."
              autoFocus
            />
            <div className="flex gap-1">
              <input
                type="text"
                value={authors}
                onChange={e => setAuthors(e.target.value)}
                className="flex-1 font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                placeholder="Authors (comma-separated)..."
              />
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-[60px] font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
              />
            </div>
            <input
              type="text"
              value={paperUrl}
              onChange={e => setPaperUrl(e.target.value)}
              className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
              placeholder="Paper URL (ArXiv, DOI)..."
            />
            <textarea
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy resize-none"
              placeholder="Abstract or key summary..."
              rows={2}
            />
            <input
              type="text"
              value={concepts}
              onChange={e => setConcepts(e.target.value)}
              className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
              placeholder="Key concepts to implement (comma-separated)..."
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(['low', 'medium', 'high'] as PaperDifficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
                      difficulty === d
                        ? DIFFICULTY_COLORS[d]
                        : 'bg-transparent text-ink-muted border-rule'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {PILLAR_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => togglePillar(p)}
                    className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
                      pillars.includes(p)
                        ? 'bg-burgundy-bg text-burgundy border-burgundy/20'
                        : 'bg-transparent text-ink-muted border-rule'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[8px] text-ink-muted">Est:</span>
                <input
                  type="number"
                  value={estHours}
                  onChange={e => setEstHours(Number(e.target.value))}
                  className="w-[36px] font-mono text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy"
                />
                <span className="font-mono text-[8px] text-ink-muted">h</span>
              </div>
              <button
                onClick={handleAdd}
                disabled={!title.trim()}
                className="ml-auto font-serif text-[9px] font-semibold px-3 py-1 rounded-sm bg-burgundy text-paper hover:bg-burgundy/90 transition-colors disabled:opacity-50"
              >
                Queue
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 mt-2">
          {(['all', ...STATUS_ORDER] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                filter === s
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
              {s !== 'all' && <span className="ml-0.5 text-[8px]">({byStatus(s).length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Paper List */}
      {loading ? (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-cream rounded-sm w-1/4" />
            <div className="h-2 bg-cream rounded-sm w-full" />
            <div className="h-2 bg-cream rounded-sm w-3/4" />
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="text-[10px] text-ink-faint">
            No papers {filter !== 'all' ? `with status "${STATUS_LABELS[filter as PaperImplementationStatus]}"` : 'in queue'}. Add papers from the research feed or manually.
          </div>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-sm p-3 space-y-1">
          {displayed.map(paper => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onAdvance={advance}
              onUpdate={update}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
