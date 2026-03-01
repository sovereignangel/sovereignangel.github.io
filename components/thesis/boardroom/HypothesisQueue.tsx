'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useHypotheses } from '@/hooks/useHypotheses'
import { useBlogDrafts } from '@/hooks/useBlogDrafts'
import { useBeliefs } from '@/hooks/useBeliefs'
import { authFetch } from '@/lib/auth-fetch'
import type { Hypothesis, HypothesisEvidence, DecisionDomain, BlogDraftStatus } from '@/lib/types'
import BeliefForm from './BeliefForm'

const DOMAIN_COLORS: Record<string, string> = {
  portfolio: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  product: 'text-ink-muted bg-cream border-rule',
  revenue: 'text-green-ink bg-green-bg border-green-ink/20',
  personal: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  thesis: 'text-burgundy bg-burgundy-bg border-burgundy/20',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-burgundy',
  medium: 'bg-amber-ink',
  low: 'bg-ink-faint',
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' },
]

const EVIDENCE_TYPES: { key: HypothesisEvidence['type']; label: string }[] = [
  { key: 'reading', label: 'Reading' },
  { key: 'observation', label: 'Observation' },
  { key: 'conversation', label: 'Conversation' },
  { key: 'data', label: 'Data' },
  { key: 'experiment', label: 'Experiment' },
]

const DOMAINS: { key: DecisionDomain; label: string }[] = [
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'product', label: 'Product' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'personal', label: 'Personal' },
  { key: 'thesis', label: 'Thesis' },
]

const BLOG_STATUS_LABELS: Record<BlogDraftStatus, string> = {
  idea: 'Idea',
  outlining: 'Outlining',
  drafting: 'Drafting',
  ready: 'Ready',
  published: 'Published',
}

const BLOG_STATUS_NEXT: Partial<Record<BlogDraftStatus, BlogDraftStatus>> = {
  idea: 'outlining',
  outlining: 'drafting',
  drafting: 'ready',
}

export default function HypothesisQueue() {
  const { user } = useAuth()
  const { hypotheses, open, investigating, loading, save, remove } = useHypotheses(user?.uid)
  const { drafts, save: saveDraft, remove: removeDraft } = useBlogDrafts(user?.uid)
  const { save: saveBelief } = useBeliefs(user?.uid)

  // Hypothesis state
  const [filter, setFilter] = useState('all')
  const [collapsed, setCollapsed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // New hypothesis form
  const [newQuestion, setNewQuestion] = useState('')
  const [newContext, setNewContext] = useState('')
  const [newDomain, setNewDomain] = useState<DecisionDomain>('thesis')
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium')

  // Evidence form
  const [addingEvidenceId, setAddingEvidenceId] = useState<string | null>(null)
  const [evidenceText, setEvidenceText] = useState('')
  const [evidenceType, setEvidenceType] = useState<HypothesisEvidence['type']>('reading')
  const [evidenceSupports, setEvidenceSupports] = useState<'for' | 'against' | 'neutral'>('for')
  const [evidenceSource, setEvidenceSource] = useState('')

  // Resolution state
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionType, setResolutionType] = useState<'belief' | 'blog' | 'both' | 'abandoned'>('belief')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [abandonReason, setAbandonReason] = useState('')
  const [showBeliefForm, setShowBeliefForm] = useState(false)

  // Blog draft form (for resolution)
  const [blogTitle, setBlogTitle] = useState('')
  const [blogSummary, setBlogSummary] = useState('')
  const [blogArguments, setBlogArguments] = useState('')

  // Blog drafts section
  const [blogCollapsed, setBlogCollapsed] = useState(true)
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null)
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  const [editingUrl, setEditingUrl] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const filtered = filter === 'all'
    ? hypotheses
    : hypotheses.filter(h => h.status === filter)

  // Sort: investigating first, then open by priority, then resolved
  const sorted = [...filtered].sort((a, b) => {
    const statusOrder: Record<string, number> = { investigating: 0, open: 1, resolved: 2 }
    const aDiff = statusOrder[a.status] ?? 3
    const bDiff = statusOrder[b.status] ?? 3
    if (aDiff !== bDiff) return aDiff - bDiff
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
  })

  async function handleCreateHypothesis() {
    if (!newQuestion.trim()) return
    await save({
      question: newQuestion.trim(),
      context: newContext.trim(),
      domain: newDomain,
      priority: newPriority,
    })
    setNewQuestion('')
    setNewContext('')
    setNewDomain('thesis')
    setNewPriority('medium')
    setShowForm(false)
  }

  async function handleAddEvidence(hypothesis: Hypothesis) {
    if (!hypothesis.id || !evidenceText.trim()) return
    const newEvidence: HypothesisEvidence = {
      id: crypto.randomUUID(),
      type: evidenceType,
      text: evidenceText.trim(),
      supports: evidenceSupports,
      source: evidenceSource.trim() || undefined,
      addedAt: today,
    }
    await save({
      evidence: [...(hypothesis.evidence || []), newEvidence],
    }, hypothesis.id)
    setEvidenceText('')
    setEvidenceSource('')
    setAddingEvidenceId(null)
  }

  async function handleStartInvestigating(hypothesis: Hypothesis) {
    if (!hypothesis.id) return
    await save({ status: 'investigating' }, hypothesis.id)
  }

  async function handleResolveAsBelief(hypothesis: Hypothesis, beliefData: {
    statement: string
    confidence: number
    domain: DecisionDomain
    evidenceFor: string[]
    evidenceAgainst: string[]
  }) {
    if (!hypothesis.id) return
    const attentionDate = new Date()
    attentionDate.setDate(attentionDate.getDate() + 21)
    const beliefId = await saveBelief({
      ...beliefData,
      linkedDecisionIds: [],
      linkedPrincipleIds: [],
      sourceJournalDate: today,
      attentionDate: attentionDate.toISOString().split('T')[0],
    })

    const resolution = resolutionType === 'both' ? 'both' : 'belief'
    await save({
      status: 'resolved',
      resolution,
      resolutionNotes: resolutionNotes.trim() || undefined,
      linkedBeliefId: beliefId,
    }, hypothesis.id)

    // Trigger antithesis in background
    if (beliefId) {
      authFetch('/api/beliefs/antithesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(beliefData),
      }).then(async (res) => {
        if (res.ok) {
          const { antithesis, strength } = await res.json()
          if (antithesis) {
            await saveBelief({ antithesis, antithesisStrength: strength, status: 'tested' }, beliefId)
          }
        }
      }).catch(() => {})
    }

    setShowBeliefForm(false)
    if (resolutionType !== 'both') {
      setResolvingId(null)
      setResolutionNotes('')
    }
  }

  async function handleResolveAsBlog(hypothesis: Hypothesis) {
    if (!hypothesis.id || !blogTitle.trim()) return
    const draftId = await saveDraft({
      title: blogTitle.trim(),
      summary: blogSummary.trim(),
      keyArguments: blogArguments.split('\n').map(s => s.trim()).filter(Boolean),
      domain: hypothesis.domain,
      linkedHypothesisIds: [hypothesis.id],
      linkedBeliefIds: [],
    })

    const resolution = resolutionType === 'both' ? 'both' : 'blog'
    await save({
      status: 'resolved',
      resolution,
      resolutionNotes: resolutionNotes.trim() || undefined,
      linkedBlogDraftId: draftId,
    }, hypothesis.id)

    setBlogTitle('')
    setBlogSummary('')
    setBlogArguments('')
    setResolvingId(null)
    setResolutionNotes('')
  }

  async function handleAbandon(hypothesis: Hypothesis) {
    if (!hypothesis.id || !abandonReason.trim()) return
    await save({
      status: 'abandoned',
      resolution: 'abandoned',
      abandonedReason: abandonReason.trim(),
    }, hypothesis.id)
    setResolvingId(null)
    setAbandonReason('')
  }

  function startResolve(hypothesis: Hypothesis) {
    setResolvingId(hypothesis.id || null)
    setResolutionType('belief')
    setResolutionNotes('')
    setShowBeliefForm(false)
    // Pre-fill blog form from question
    setBlogTitle(hypothesis.question)
    setBlogSummary(hypothesis.context || '')
    setBlogArguments(
      (hypothesis.evidence || []).map(e => e.text).join('\n')
    )
  }

  return (
    <div className="space-y-2">
      {/* Hypothesis Queue Section */}
      <div className="bg-white border border-rule rounded-sm">
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cream/30 transition-colors"
        >
          <span className="font-mono text-[9px] text-ink-muted">{collapsed ? '▸' : '▾'}</span>
          <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Hypothesis Queue
          </span>
          {open.length > 0 && (
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border text-ink-muted bg-cream border-rule">
              {open.length} open
            </span>
          )}
          {investigating.length > 0 && (
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border text-burgundy bg-burgundy-bg border-burgundy/20">
              {investigating.length} investigating
            </span>
          )}
        </button>

        {!collapsed && (
          <div className="px-3 pb-3 border-t border-rule space-y-2">
            {/* Filter pills + new button */}
            <div className="flex items-center gap-1 flex-wrap pt-2">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                    filter === f.key
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <button
                onClick={() => setShowForm(!showForm)}
                className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors ml-auto"
              >
                + New Hypothesis
              </button>
            </div>

            {/* New hypothesis form */}
            {showForm && (
              <div className="bg-paper border border-rule rounded-sm p-3 space-y-2">
                <div>
                  <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
                    What do you want to investigate?
                  </label>
                  <textarea
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="State a hypothesis or question to research..."
                    className="w-full h-14 bg-white border border-rule rounded-sm p-2 font-serif text-[11px] text-ink resize-y focus:outline-none focus:border-burgundy"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
                    Context — why does this matter?
                  </label>
                  <textarea
                    value={newContext}
                    onChange={e => setNewContext(e.target.value)}
                    placeholder="What prompted this? Why is it worth investigating?"
                    className="w-full h-12 bg-white border border-rule rounded-sm p-2 font-serif text-[10px] text-ink-muted resize-y focus:outline-none focus:border-burgundy"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
                      Domain
                    </label>
                    <select
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value as DecisionDomain)}
                      className="bg-white border border-rule rounded-sm px-1.5 py-1 font-serif text-[10px] text-ink-muted focus:outline-none focus:border-burgundy"
                    >
                      {DOMAINS.map(d => (
                        <option key={d.key} value={d.key}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-0.5">
                      Priority
                    </label>
                    <div className="flex gap-1">
                      {(['high', 'medium', 'low'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors capitalize ${
                            newPriority === p
                              ? 'bg-burgundy text-paper border-burgundy'
                              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCreateHypothesis}
                    disabled={!newQuestion.trim()}
                    className={`font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
                      !newQuestion.trim()
                        ? 'bg-paper text-ink-muted border-rule cursor-not-allowed'
                        : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
                    }`}
                  >
                    Save Hypothesis
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setNewQuestion(''); setNewContext('') }}
                    className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border border-rule text-ink-muted hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Hypothesis list */}
            {loading ? (
              <div className="space-y-1">
                {[1, 2].map(i => (
                  <div key={i} className="h-10 bg-rule-light/40 rounded-sm animate-pulse" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-4">
                <p className="font-serif text-[11px] text-ink-muted">
                  No hypotheses yet. Capture questions worth investigating.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {sorted.map(hypothesis => {
                  const isExpanded = expandedId === hypothesis.id
                  const domainStyle = DOMAIN_COLORS[hypothesis.domain] || DOMAIN_COLORS.thesis
                  const priorityDot = PRIORITY_COLORS[hypothesis.priority] || PRIORITY_COLORS.medium
                  const isResolving = resolvingId === hypothesis.id
                  const isAddingEvidence = addingEvidenceId === hypothesis.id
                  const evidenceFor = (hypothesis.evidence || []).filter(e => e.supports === 'for')
                  const evidenceAgainst = (hypothesis.evidence || []).filter(e => e.supports === 'against')
                  const evidenceNeutral = (hypothesis.evidence || []).filter(e => e.supports === 'neutral')

                  return (
                    <div
                      key={hypothesis.id}
                      className={`bg-white border rounded-sm relative group ${
                        hypothesis.status === 'investigating'
                          ? 'border-burgundy/30 bg-burgundy-bg'
                          : hypothesis.status === 'resolved'
                          ? 'border-green-ink/20 bg-green-bg'
                          : 'border-rule'
                      }`}
                    >
                      {/* Delete X */}
                      <button
                        onClick={(e) => { e.stopPropagation(); hypothesis.id && remove(hypothesis.id) }}
                        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center font-mono text-[10px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Delete hypothesis"
                      >
                        ×
                      </button>

                      {/* Collapsed row */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : (hypothesis.id || null))}
                        className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 pr-6 hover:bg-cream/50 transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-sm shrink-0 ${priorityDot}`} title={`${hypothesis.priority} priority`} />
                        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainStyle}`}>
                          {hypothesis.domain}
                        </span>
                        <span className={`font-serif text-[11px] text-ink flex-1 ${isExpanded ? '' : 'truncate'}`}>
                          {hypothesis.question}
                        </span>
                        {(hypothesis.evidence?.length || 0) > 0 && (
                          <span className="font-mono text-[8px] text-ink-muted shrink-0">
                            {hypothesis.evidence.length} ev.
                          </span>
                        )}
                        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${
                          hypothesis.status === 'investigating'
                            ? 'text-burgundy bg-burgundy-bg border-burgundy/20'
                            : hypothesis.status === 'resolved'
                            ? 'text-green-ink bg-green-bg border-green-ink/20'
                            : 'text-ink-muted bg-cream border-rule'
                        }`}>
                          {hypothesis.status}
                        </span>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-2 pb-2 border-t border-rule-light space-y-1.5 mt-0.5 pt-1.5">
                          {/* Context */}
                          {hypothesis.context && (
                            <p className="font-serif text-[10px] text-ink-muted leading-relaxed">
                              {hypothesis.context}
                            </p>
                          )}

                          {/* Evidence grouped by supports */}
                          {evidenceFor.length > 0 && (
                            <div>
                              <span className="font-serif text-[8px] text-green-ink uppercase tracking-[0.5px]">Evidence For</span>
                              <ul className="mt-0.5 space-y-0.5">
                                {evidenceFor.map(e => (
                                  <li key={e.id} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                                    <span className="text-green-ink shrink-0 mt-px">+</span>
                                    <span className="flex-1">{e.text}</span>
                                    {e.source && <span className="font-mono text-[7px] text-ink-faint shrink-0">[{e.source}]</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evidenceAgainst.length > 0 && (
                            <div>
                              <span className="font-serif text-[8px] text-red-ink uppercase tracking-[0.5px]">Evidence Against</span>
                              <ul className="mt-0.5 space-y-0.5">
                                {evidenceAgainst.map(e => (
                                  <li key={e.id} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                                    <span className="text-red-ink shrink-0 mt-px">-</span>
                                    <span className="flex-1">{e.text}</span>
                                    {e.source && <span className="font-mono text-[7px] text-ink-faint shrink-0">[{e.source}]</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evidenceNeutral.length > 0 && (
                            <div>
                              <span className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px]">Observations</span>
                              <ul className="mt-0.5 space-y-0.5">
                                {evidenceNeutral.map(e => (
                                  <li key={e.id} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                                    <span className="text-ink-faint shrink-0 mt-px">~</span>
                                    <span className="flex-1">{e.text}</span>
                                    {e.source && <span className="font-mono text-[7px] text-ink-faint shrink-0">[{e.source}]</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Add Evidence inline form */}
                          {isAddingEvidence ? (
                            <div className="bg-paper border border-rule rounded-sm p-2 space-y-1.5">
                              <div>
                                <label className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px] block mb-0.5">Evidence</label>
                                <textarea
                                  value={evidenceText}
                                  onChange={e => setEvidenceText(e.target.value)}
                                  placeholder="What did you find?"
                                  className="w-full h-12 bg-white border border-rule rounded-sm p-1.5 font-serif text-[10px] text-ink resize-none focus:outline-none focus:border-burgundy"
                                  autoFocus
                                />
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex gap-0.5">
                                  {(['for', 'against', 'neutral'] as const).map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setEvidenceSupports(s)}
                                      className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors capitalize ${
                                        evidenceSupports === s
                                          ? s === 'for' ? 'bg-green-ink text-paper border-green-ink'
                                            : s === 'against' ? 'bg-red-ink text-paper border-red-ink'
                                            : 'bg-ink-muted text-paper border-ink-muted'
                                          : 'bg-transparent text-ink-muted border-rule'
                                      }`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                                <select
                                  value={evidenceType}
                                  onChange={e => setEvidenceType(e.target.value as HypothesisEvidence['type'])}
                                  className="bg-white border border-rule rounded-sm px-1 py-0.5 font-serif text-[9px] text-ink-muted focus:outline-none focus:border-burgundy"
                                >
                                  {EVIDENCE_TYPES.map(t => (
                                    <option key={t.key} value={t.key}>{t.label}</option>
                                  ))}
                                </select>
                                <input
                                  value={evidenceSource}
                                  onChange={e => setEvidenceSource(e.target.value)}
                                  placeholder="Source (optional)"
                                  className="flex-1 min-w-[100px] bg-white border border-rule rounded-sm px-1.5 py-0.5 font-serif text-[9px] text-ink-muted focus:outline-none focus:border-burgundy"
                                />
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAddEvidence(hypothesis)}
                                  disabled={!evidenceText.trim()}
                                  className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => { setAddingEvidenceId(null); setEvidenceText(''); setEvidenceSource('') }}
                                  className="font-serif text-[8px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingEvidenceId(hypothesis.id || null); setEvidenceText(''); setEvidenceSource('') }}
                              className="font-serif text-[9px] text-burgundy hover:text-burgundy/70 transition-colors"
                            >
                              + Add Evidence
                            </button>
                          )}

                          {/* Resolution panel */}
                          {isResolving && (
                            <div className="bg-paper border border-burgundy/30 rounded-sm p-2 space-y-2">
                              <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                                Resolve Hypothesis
                              </span>

                              {/* Resolution type selector */}
                              <div className="flex gap-1">
                                {(['belief', 'blog', 'both', 'abandoned'] as const).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => { setResolutionType(type); setShowBeliefForm(false) }}
                                    className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors capitalize ${
                                      resolutionType === type
                                        ? 'bg-burgundy text-paper border-burgundy'
                                        : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                                    }`}
                                  >
                                    {type === 'both' ? 'Both' : type === 'abandoned' ? 'Abandon' : type === 'belief' ? 'Belief' : 'Blog Draft'}
                                  </button>
                                ))}
                              </div>

                              {/* Resolution notes */}
                              {resolutionType !== 'abandoned' && (
                                <div>
                                  <label className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px] block mb-0.5">
                                    Conclusions (optional)
                                  </label>
                                  <textarea
                                    value={resolutionNotes}
                                    onChange={e => setResolutionNotes(e.target.value)}
                                    placeholder="What did you conclude from your investigation?"
                                    className="w-full h-10 bg-white border border-rule rounded-sm p-1.5 font-serif text-[10px] text-ink-muted resize-none focus:outline-none focus:border-burgundy"
                                  />
                                </div>
                              )}

                              {/* Belief creation */}
                              {(resolutionType === 'belief' || resolutionType === 'both') && !showBeliefForm && (
                                <button
                                  onClick={() => setShowBeliefForm(true)}
                                  className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
                                >
                                  Create Belief from Evidence
                                </button>
                              )}

                              {(resolutionType === 'belief' || resolutionType === 'both') && showBeliefForm && (
                                <div>
                                  <span className="font-serif text-[8px] text-green-ink uppercase tracking-[0.5px] block mb-1">
                                    New Belief (pre-filled from evidence)
                                  </span>
                                  <BeliefForm
                                    prefill={{
                                      statement: hypothesis.question,
                                      domain: hypothesis.domain,
                                      evidenceFor: evidenceFor.map(e => e.text),
                                      evidenceAgainst: evidenceAgainst.map(e => e.text),
                                    }}
                                    onSave={async (data) => {
                                      await handleResolveAsBelief(hypothesis, data)
                                      if (resolutionType === 'both') {
                                        // Keep resolving panel open for blog step
                                      }
                                    }}
                                    onCancel={() => setShowBeliefForm(false)}
                                  />
                                </div>
                              )}

                              {/* Blog draft creation */}
                              {(resolutionType === 'blog' || (resolutionType === 'both' && !showBeliefForm)) && (
                                <div className="space-y-1.5">
                                  <span className="font-serif text-[8px] text-burgundy uppercase tracking-[0.5px] block">
                                    Blog Draft for Substack
                                  </span>
                                  <input
                                    value={blogTitle}
                                    onChange={e => setBlogTitle(e.target.value)}
                                    placeholder="Post title"
                                    className="w-full bg-white border border-rule rounded-sm px-2 py-1.5 font-serif text-[11px] text-ink focus:outline-none focus:border-burgundy"
                                  />
                                  <textarea
                                    value={blogSummary}
                                    onChange={e => setBlogSummary(e.target.value)}
                                    placeholder="Summary — 2-3 sentence synopsis"
                                    className="w-full h-10 bg-white border border-rule rounded-sm p-1.5 font-serif text-[10px] text-ink-muted resize-none focus:outline-none focus:border-burgundy"
                                  />
                                  <div>
                                    <label className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px] block mb-0.5">
                                      Key arguments (one per line)
                                    </label>
                                    <textarea
                                      value={blogArguments}
                                      onChange={e => setBlogArguments(e.target.value)}
                                      placeholder="Core arguments and evidence..."
                                      className="w-full h-12 bg-white border border-rule rounded-sm p-1.5 font-serif text-[10px] text-ink-muted resize-y focus:outline-none focus:border-burgundy"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleResolveAsBlog(hypothesis)}
                                    disabled={!blogTitle.trim()}
                                    className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 disabled:opacity-40 transition-colors"
                                  >
                                    Create Blog Draft
                                  </button>
                                </div>
                              )}

                              {/* Abandon */}
                              {resolutionType === 'abandoned' && (
                                <div className="space-y-1">
                                  <label className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px] block">
                                    Why abandon? (required)
                                  </label>
                                  <textarea
                                    value={abandonReason}
                                    onChange={e => setAbandonReason(e.target.value)}
                                    placeholder="Why is this no longer worth investigating?"
                                    className="w-full h-10 bg-white border border-rule rounded-sm p-1.5 font-serif text-[10px] text-ink-muted resize-none focus:outline-none focus:border-burgundy"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleAbandon(hypothesis)}
                                    disabled={!abandonReason.trim()}
                                    className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-red-ink text-paper border-red-ink disabled:opacity-40 transition-colors"
                                  >
                                    Abandon
                                  </button>
                                </div>
                              )}

                              {/* Cancel resolution */}
                              <button
                                onClick={() => { setResolvingId(null); setResolutionNotes(''); setShowBeliefForm(false) }}
                                className="font-serif text-[8px] text-ink-muted hover:text-ink transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Resolution info (for resolved hypotheses) */}
                          {hypothesis.status === 'resolved' && hypothesis.resolutionNotes && (
                            <div className="bg-green-bg border-l-2 border-green-ink rounded-sm p-1.5">
                              <span className="font-serif text-[8px] text-green-ink uppercase tracking-[0.5px]">Resolved</span>
                              <p className="font-serif text-[9px] text-ink-muted mt-0.5">{hypothesis.resolutionNotes}</p>
                              {hypothesis.resolution && (
                                <span className="font-mono text-[7px] text-ink-faint mt-0.5 block">
                                  → {hypothesis.resolution === 'both' ? 'belief + blog' : hypothesis.resolution}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          {hypothesis.status !== 'resolved' && !isResolving && (
                            <div className="flex items-center gap-2 pt-1 border-t border-rule-light">
                              {hypothesis.status === 'open' && (
                                <button
                                  onClick={() => handleStartInvestigating(hypothesis)}
                                  className="font-serif text-[9px] font-medium text-burgundy hover:text-burgundy/70 transition-colors"
                                >
                                  Start Investigating
                                </button>
                              )}
                              <button
                                onClick={() => startResolve(hypothesis)}
                                className="font-serif text-[9px] font-medium text-burgundy hover:text-burgundy/70 transition-colors"
                              >
                                Resolve
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blog Drafts Section */}
      {drafts.length > 0 && (
        <div className="bg-white border border-rule rounded-sm">
          <button
            onClick={() => setBlogCollapsed(!blogCollapsed)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-cream/30 transition-colors"
          >
            <span className="font-mono text-[9px] text-ink-muted">{blogCollapsed ? '▸' : '▾'}</span>
            <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Blog Drafts
            </span>
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border text-ink-muted bg-cream border-rule">
              {drafts.length}
            </span>
          </button>

          {!blogCollapsed && (
            <div className="px-3 pb-3 border-t border-rule space-y-1 pt-2">
              {drafts.map(draft => {
                const isExpandedDraft = expandedDraftId === draft.id
                const isEditingUrlDraft = editingUrlId === draft.id
                const domainStyle = DOMAIN_COLORS[draft.domain] || DOMAIN_COLORS.thesis
                const statusColor = draft.status === 'published'
                  ? 'text-green-ink bg-green-bg border-green-ink/20'
                  : draft.status === 'ready'
                  ? 'text-burgundy bg-burgundy-bg border-burgundy/20'
                  : 'text-ink-muted bg-cream border-rule'

                return (
                  <div key={draft.id} className="bg-white border border-rule rounded-sm relative group">
                    <button
                      onClick={(e) => { e.stopPropagation(); draft.id && removeDraft(draft.id) }}
                      className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center font-mono text-[10px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Delete draft"
                    >
                      ×
                    </button>

                    <button
                      onClick={() => setExpandedDraftId(isExpandedDraft ? null : (draft.id || null))}
                      className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 pr-6 hover:bg-cream/50 transition-colors"
                    >
                      <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainStyle}`}>
                        {draft.domain}
                      </span>
                      <span className={`font-serif text-[11px] text-ink flex-1 ${isExpandedDraft ? '' : 'truncate'}`}>
                        {draft.title}
                      </span>
                      <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${statusColor}`}>
                        {BLOG_STATUS_LABELS[draft.status]}
                      </span>
                    </button>

                    {isExpandedDraft && (
                      <div className="px-2 pb-2 border-t border-rule-light space-y-1.5 mt-0.5 pt-1.5">
                        {draft.summary && (
                          <p className="font-serif text-[10px] text-ink-muted leading-relaxed">{draft.summary}</p>
                        )}
                        {draft.keyArguments?.length > 0 && (
                          <div>
                            <span className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px]">Key Arguments</span>
                            <ul className="mt-0.5 space-y-0.5">
                              {draft.keyArguments.map((arg, i) => (
                                <li key={i} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                                  <span className="text-burgundy shrink-0 mt-px">•</span>
                                  <span>{arg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Substack URL */}
                        {draft.substackUrl ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[8px] text-green-ink">Published:</span>
                            <a
                              href={draft.substackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[8px] text-burgundy hover:underline truncate"
                            >
                              {draft.substackUrl}
                            </a>
                          </div>
                        ) : isEditingUrlDraft ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={editingUrl}
                              onChange={e => setEditingUrl(e.target.value)}
                              placeholder="https://yourname.substack.com/p/..."
                              className="flex-1 bg-white border border-rule rounded-sm px-1.5 py-0.5 font-mono text-[9px] text-ink focus:outline-none focus:border-burgundy"
                              autoFocus
                            />
                            <button
                              onClick={async () => {
                                if (draft.id && editingUrl.trim()) {
                                  await saveDraft({ substackUrl: editingUrl.trim(), status: 'published' }, draft.id)
                                  setEditingUrlId(null)
                                  setEditingUrl('')
                                }
                              }}
                              className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border bg-burgundy text-paper border-burgundy"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingUrlId(null); setEditingUrl('') }}
                              className="font-serif text-[8px] text-ink-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : null}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-rule-light">
                          {draft.status !== 'published' && BLOG_STATUS_NEXT[draft.status] && (
                            <button
                              onClick={() => draft.id && saveDraft({ status: BLOG_STATUS_NEXT[draft.status] }, draft.id)}
                              className="font-serif text-[9px] font-medium text-burgundy hover:text-burgundy/70 transition-colors"
                            >
                              Advance to {BLOG_STATUS_LABELS[BLOG_STATUS_NEXT[draft.status]!]}
                            </button>
                          )}
                          {draft.status === 'ready' && !draft.substackUrl && (
                            <button
                              onClick={() => { setEditingUrlId(draft.id || null); setEditingUrl('') }}
                              className="font-serif text-[9px] font-medium text-green-ink hover:text-green-ink/70 transition-colors"
                            >
                              Set Published URL
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
