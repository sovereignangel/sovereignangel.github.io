'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getVenture, updateVenture } from '@/lib/firestore'
import type { Venture, VentureStage, CompetitorRow } from '@/lib/types'
import BuildStatusBar from './BuildStatusBar'

const STAGE_OPTIONS: VentureStage[] = ['idea', 'specced', 'validated', 'prd_draft', 'prd_approved', 'building', 'deployed', 'archived']

const PRIORITY_STYLES: Record<string, string> = {
  P0: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  P1: 'bg-amber-bg text-amber-ink border-amber-ink/20',
  P2: 'bg-cream text-ink-muted border-rule',
}

function MemoSection({ title, content }: { title: string; content: string }) {
  if (!content) return null
  const lines = content.split('\n')
  const headline = lines[0]?.startsWith('•') ? null : lines[0]
  const bullets = lines.filter(l => l.startsWith('• '))
  return (
    <div>
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1 border-b border-rule">
        {title}
      </div>
      {headline && (
        <p className="font-mono text-[10px] font-bold text-ink mb-0.5">{headline}</p>
      )}
      {bullets.length > 0 ? (
        <ul className="space-y-0.5">
          {bullets.map((b, i) => (
            <li key={i} className="font-mono text-[9px] text-ink leading-relaxed pl-1">{b}</li>
          ))}
        </ul>
      ) : !headline ? (
        <p className="font-mono text-[10px] text-ink leading-relaxed whitespace-pre-line">{content}</p>
      ) : null}
    </div>
  )
}

function MemoTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return null
  return (
    <div>
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1 border-b border-rule">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-cream">
              {headers.map((h, i) => (
                <th key={i} className="font-mono text-[7px] uppercase text-ink-muted text-left py-1 px-1.5 border-b border-rule whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-cream/50' : ''}>
                {row.map((cell, j) => (
                  <td key={j} className="font-mono text-[9px] text-ink py-1 px-1.5 border-b border-rule/50">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CompetitorTableView({ names, rows, ventureName }: { names: string[]; rows: CompetitorRow[]; ventureName: string }) {
  if (rows.length === 0) return null
  return (
    <div>
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-1 border-b border-rule">
        Competitive Landscape
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-cream">
              <th className="font-mono text-[7px] uppercase text-ink-muted text-left py-1 px-1.5 border-b border-rule whitespace-nowrap">Feature</th>
              <th className="font-mono text-[7px] uppercase text-burgundy text-left py-1 px-1.5 border-b border-rule whitespace-nowrap">{ventureName}</th>
              {names.map(n => (
                <th key={n} className="font-mono text-[7px] uppercase text-ink-muted text-left py-1 px-1.5 border-b border-rule whitespace-nowrap">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-cream/50' : ''}>
                <td className="font-mono text-[9px] font-medium text-ink py-1 px-1.5 border-b border-rule/50">{row.feature}</td>
                <td className="font-mono text-[9px] font-semibold text-green-ink py-1 px-1.5 border-b border-rule/50">{row.us}</td>
                {names.map(n => (
                  <td key={n} className="font-mono text-[9px] text-ink-muted py-1 px-1.5 border-b border-rule/50">{row.competitors[n] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function VentureDetail({ ventureId, onBack }: { ventureId: string; onBack: () => void }) {
  const { user } = useAuth()
  const [venture, setVenture] = useState<Venture | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [approvingPrd, setApprovingPrd] = useState(false)
  const [generatingPrd, setGeneratingPrd] = useState(false)
  const [iterateText, setIterateText] = useState('')
  const [submittingIterate, setSubmittingIterate] = useState(false)
  const [generatingMemo, setGeneratingMemo] = useState(false)
  const [memoFeedback, setMemoFeedback] = useState('')
  const [submittingMemoFeedback, setSubmittingMemoFeedback] = useState(false)

  useEffect(() => {
    if (!user) return
    getVenture(user.uid, ventureId).then(v => {
      setVenture(v)
      setLoading(false)
    })
  }, [user, ventureId])

  const handleStageChange = async (stage: VentureStage) => {
    if (!user || !venture) return
    await updateVenture(user.uid, ventureId, { stage })
    setVenture({ ...venture, stage })
  }

  const handleTriggerBuild = async () => {
    if (!user || !venture) return
    try {
      const res = await fetch('/api/ventures/build/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId }),
      })
      if (res.ok) {
        setVenture({
          ...venture,
          stage: 'building',
          build: { ...venture.build, status: 'generating', startedAt: new Date() },
        })
      }
    } catch (err) {
      console.error('Build trigger failed:', err)
    }
  }

  const handleApprovePrd = async () => {
    if (!user || !venture) return
    setApprovingPrd(true)
    try {
      const res = await fetch('/api/ventures/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, uid: user.uid }),
      })
      if (res.ok) {
        setVenture({ ...venture, stage: 'prd_approved' })
      }
    } catch (err) {
      console.error('Approve failed:', err)
    } finally {
      setApprovingPrd(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!user || !venture || !feedback.trim()) return
    setSubmittingFeedback(true)
    try {
      const res = await fetch('/api/ventures/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, uid: user.uid, feedback: feedback.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setVenture({ ...venture, prd: data.prd })
        setFeedback('')
      }
    } catch (err) {
      console.error('Feedback failed:', err)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleGeneratePrd = async () => {
    if (!user || !venture) return
    setGeneratingPrd(true)
    try {
      const res = await fetch('/api/ventures/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, uid: user.uid, generateNew: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setVenture({ ...venture, prd: data.prd, stage: 'prd_draft' })
      }
    } catch (err) {
      console.error('Generate PRD failed:', err)
    } finally {
      setGeneratingPrd(false)
    }
  }

  const handleSubmitIterate = async () => {
    if (!user || !venture || !iterateText.trim()) return
    setSubmittingIterate(true)
    try {
      const res = await fetch('/api/ventures/build/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, iterate: true, changes: iterateText.trim() }),
      })
      if (res.ok) {
        const iterations = [...(venture.iterations || []), { request: iterateText.trim(), completedAt: null }]
        setVenture({
          ...venture,
          stage: 'building',
          iterations,
          build: { ...venture.build, status: 'generating', startedAt: new Date() },
        })
        setIterateText('')
      }
    } catch (err) {
      console.error('Iterate failed:', err)
    } finally {
      setSubmittingIterate(false)
    }
  }

  const handleGenerateMemo = async () => {
    if (!user || !venture) return
    setGeneratingMemo(true)
    try {
      const res = await fetch('/api/ventures/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, uid: user.uid }),
      })
      if (res.ok) {
        const data = await res.json()
        setVenture({ ...venture, memo: data.memo })
      }
    } catch (err) {
      console.error('Generate memo failed:', err)
    } finally {
      setGeneratingMemo(false)
    }
  }

  const handleSubmitMemoFeedback = async () => {
    if (!user || !venture || !memoFeedback.trim()) return
    setSubmittingMemoFeedback(true)
    try {
      const res = await fetch('/api/ventures/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventureId, uid: user.uid, feedback: memoFeedback.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setVenture({ ...venture, memo: data.memo })
        setMemoFeedback('')
      }
    } catch (err) {
      console.error('Memo feedback failed:', err)
    } finally {
      setSubmittingMemoFeedback(false)
    }
  }

  if (loading) {
    return <div className="p-3 text-[11px] text-ink-muted">Loading...</div>
  }

  if (!venture) {
    return <div className="p-3 text-[11px] text-red-ink">Venture not found</div>
  }

  const s = venture.spec
  const b = venture.build
  const prd = venture.prd
  const memo = venture.memo

  return (
    <div className="p-3 space-y-3">
      {/* Back button */}
      <button onClick={onBack} className="font-serif text-[11px] text-ink-muted hover:text-ink transition-colors">
        &larr; Back to pipeline
      </button>

      {/* Header */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="font-serif text-[16px] font-bold text-ink">{s.name}</h2>
            <p className="font-mono text-[10px] text-ink-muted italic mt-0.5">{s.oneLiner}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {venture.score !== null && (
              <span className={`font-mono text-[14px] font-bold ${
                venture.score >= 70 ? 'text-green-ink' : venture.score >= 40 ? 'text-amber-ink' : 'text-red-ink'
              }`}>
                {venture.score}
              </span>
            )}
            <select
              value={venture.stage}
              onChange={e => handleStageChange(e.target.value as VentureStage)}
              className="font-mono text-[9px] uppercase bg-cream border border-rule rounded-sm px-1.5 py-0.5 text-ink-muted"
            >
              {STAGE_OPTIONS.map(st => (
                <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
            {s.category}
          </span>
          {s.thesisPillars.map(p => (
            <span key={p} className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border bg-cream text-ink-muted border-rule">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Problem / Customer / Solution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Problem
          </div>
          <p className="font-mono text-[10px] text-ink leading-relaxed">{s.problem}</p>
        </div>
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Customer
          </div>
          <p className="font-mono text-[10px] text-ink leading-relaxed">{s.targetCustomer}</p>
        </div>
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Solution
          </div>
          <p className="font-mono text-[10px] text-ink leading-relaxed">{s.solution}</p>
        </div>
      </div>

      {/* Business Model */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          Business Model
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="font-mono text-[9px] text-ink-muted block mb-0.5">Revenue</span>
            <span className="font-mono text-[10px] font-medium text-ink">{s.revenueModel || '—'}</span>
          </div>
          <div>
            <span className="font-mono text-[9px] text-ink-muted block mb-0.5">Pricing</span>
            <span className="font-mono text-[10px] font-medium text-ink">{s.pricingIdea || '—'}</span>
          </div>
          <div>
            <span className="font-mono text-[9px] text-ink-muted block mb-0.5">Market</span>
            <span className="font-mono text-[10px] font-medium text-ink">{s.marketSize || '—'}</span>
          </div>
        </div>
      </div>

      {/* PRD Section */}
      {prd ? (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-rule">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              PRD — {prd.projectName}
            </div>
            <span className="font-mono text-[8px] text-ink-muted">v{prd.version} · ~{prd.estimatedBuildMinutes}min</span>
          </div>

          {/* Features table */}
          <div className="mb-2">
            <span className="font-mono text-[9px] text-ink-muted block mb-1">Features</span>
            <div className="space-y-1">
              {prd.features.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 mt-0.5 ${PRIORITY_STYLES[f.priority] || PRIORITY_STYLES.P2}`}>
                    {f.priority}
                  </span>
                  <div>
                    <span className="font-mono text-[10px] font-medium text-ink">{f.name}</span>
                    <p className="font-mono text-[9px] text-ink-muted">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Schema */}
          {prd.dataSchema && (
            <details className="mb-2">
              <summary className="font-mono text-[9px] text-ink-muted cursor-pointer hover:text-ink">Data Schema</summary>
              <pre className="font-mono text-[8px] text-ink leading-relaxed mt-1 bg-cream rounded-sm p-2 whitespace-pre-wrap">{prd.dataSchema}</pre>
            </details>
          )}

          {/* User Flows */}
          {prd.userFlows.length > 0 && (
            <details className="mb-2">
              <summary className="font-mono text-[9px] text-ink-muted cursor-pointer hover:text-ink">User Flows ({prd.userFlows.length})</summary>
              <div className="mt-1 space-y-1.5">
                {prd.userFlows.map((flow, i) => (
                  <pre key={i} className="font-mono text-[8px] text-ink leading-relaxed bg-cream rounded-sm p-2 whitespace-pre-wrap">{flow}</pre>
                ))}
              </div>
            </details>
          )}

          {/* Design Notes */}
          {prd.designNotes && (
            <details className="mb-2">
              <summary className="font-mono text-[9px] text-ink-muted cursor-pointer hover:text-ink">Design Notes</summary>
              <p className="font-mono text-[8px] text-ink leading-relaxed mt-1">{prd.designNotes}</p>
            </details>
          )}

          {/* Success Metrics */}
          {prd.successMetrics.length > 0 && (
            <div className="mb-2">
              <span className="font-mono text-[9px] text-ink-muted block mb-0.5">Success Metrics</span>
              <ul className="space-y-0.5">
                {prd.successMetrics.map((m, i) => (
                  <li key={i} className="font-mono text-[9px] text-ink flex items-start gap-1">
                    <span className="text-green-ink shrink-0">✓</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback History */}
          {prd.feedbackHistory.length > 0 && (
            <details className="mb-2">
              <summary className="font-mono text-[9px] text-ink-muted cursor-pointer hover:text-ink">
                Feedback History ({prd.feedbackHistory.length})
              </summary>
              <ul className="mt-1 space-y-0.5">
                {prd.feedbackHistory.map((fb, i) => (
                  <li key={i} className="font-mono text-[8px] text-ink-muted italic">&ldquo;{fb}&rdquo;</li>
                ))}
              </ul>
            </details>
          )}

          {/* Approve / Feedback actions */}
          {venture.stage === 'prd_draft' && (
            <div className="mt-2 pt-2 border-t border-rule space-y-2">
              <div className="flex gap-1">
                <button
                  onClick={handleApprovePrd}
                  disabled={approvingPrd}
                  className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
                >
                  {approvingPrd ? 'Approving...' : 'Approve PRD'}
                </button>
              </div>
              <div className="flex gap-1">
                <input
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Request changes..."
                  className="flex-1 font-mono text-[9px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink placeholder:text-ink-faint focus:border-burgundy focus:outline-none"
                />
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback || !feedback.trim()}
                  className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                    submittingFeedback || !feedback.trim()
                      ? 'bg-cream text-ink-faint border-rule cursor-not-allowed'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {submittingFeedback ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (venture.stage === 'specced' || venture.stage === 'validated') ? (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            PRD
          </div>
          <p className="font-mono text-[9px] text-ink-muted mb-2">No PRD generated yet.</p>
          <button
            onClick={handleGeneratePrd}
            disabled={generatingPrd}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            {generatingPrd ? 'Generating PRD...' : 'Generate PRD'}
          </button>
        </div>
      ) : null}

      {/* Pitch Memo Section */}
      {memo ? (
        <div className="bg-white border border-rule rounded-sm">
          {/* Memo Page 1 — Executive Summary */}
          <div className="p-3 border-b-2 border-burgundy">
            <div className="flex items-center justify-between mb-2">
              <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                Investment Memo — {s.name}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/memo/${ventureId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] text-burgundy underline hover:text-ink transition-colors"
                >
                  Public Link
                </a>
                <span className="font-mono text-[8px] text-ink-muted">v{memo.version}</span>
              </div>
            </div>

            {/* Company Purpose */}
            <p className="font-serif text-[13px] text-ink leading-relaxed italic mb-3">
              {memo.companyPurpose}
            </p>

            {/* Key Metrics — compact inline strip */}
            {memo.keyMetrics.length > 0 && (
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-1 mb-3">
                {memo.keyMetrics.map((m, i) => (
                  <div key={i} className="bg-cream border border-rule rounded-sm px-1.5 py-1">
                    <span className="font-mono text-[7px] uppercase text-ink-muted">{m.label}</span>
                    <span className="font-mono text-[10px] font-bold text-ink leading-none"> {m.value}</span>
                    <span className="font-mono text-[7px] text-ink-muted block">{m.context}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Executive Summary */}
            <div className="mb-2">
              <span className="font-mono text-[9px] text-ink-muted block mb-1">Executive Summary</span>
              {(() => {
                const lines = memo.executiveSummary.split('\n')
                const tagline = lines[0]?.startsWith('•') ? null : lines[0]
                const bullets = lines.filter((l: string) => l.startsWith('• '))
                return (
                  <>
                    {tagline && <p className="font-mono text-[10px] font-bold text-ink mb-0.5">{tagline}</p>}
                    {bullets.length > 0 ? (
                      <ul className="space-y-0.5">
                        {bullets.map((b: string, i: number) => (
                          <li key={i} className="font-mono text-[9px] text-ink leading-relaxed pl-1">{b}</li>
                        ))}
                      </ul>
                    ) : !tagline ? (
                      <p className="font-mono text-[10px] text-ink leading-relaxed whitespace-pre-line">{memo.executiveSummary}</p>
                    ) : null}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Memo Body */}
          <div className="p-3 space-y-3">
            {/* Problem + Solution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <MemoSection title="Problem" content={memo.problem} />
              <MemoSection title="Solution" content={memo.solution} />
            </div>

            {/* Why Now + Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <MemoSection title="Why Now" content={memo.whyNow} />
              <MemoSection title="Founder Insight" content={memo.insight} />
            </div>

            {/* Market Size Table */}
            {memo.marketSizeTable && memo.marketSizeTable.length > 0 ? (
              <MemoTable
                title="Market Sizing"
                headers={['Segment', 'Size', 'CAGR', 'Notes']}
                rows={memo.marketSizeTable.map(r => [r.segment, r.size, r.cagr, r.notes])}
              />
            ) : (
              <MemoSection title="Market Size" content={memo.marketSize} />
            )}

            {/* Market Dynamics */}
            <MemoSection title="Market Dynamics" content={memo.marketDynamics} />

            {/* Competitive Landscape — table or prose fallback */}
            {memo.competitorTable && memo.competitorTable.length > 0 && memo.competitorNames ? (
              <CompetitorTableView names={memo.competitorNames} rows={memo.competitorTable} ventureName={s.name} />
            ) : (
              <MemoSection title="Competitive Landscape" content={memo.competitiveLandscape} />
            )}

            {/* Defensibility */}
            <MemoSection title="Defensibility" content={memo.defensibility} />

            {/* Business Model Table */}
            {memo.businessModelTable && memo.businessModelTable.length > 0 ? (
              <MemoTable
                title="Business Model"
                headers={['Revenue Lever', 'Mechanism', 'Target', 'Margin Profile']}
                rows={memo.businessModelTable.map(r => [r.lever, r.mechanism, r.target, r.marginProfile])}
              />
            ) : (
              <MemoSection title="Business Model" content={memo.businessModel} />
            )}

            {/* GTM Phases Table */}
            {memo.gtmPhases && memo.gtmPhases.length > 0 ? (
              <MemoTable
                title="Go-to-Market"
                headers={['Phase', 'Strategy', 'Channel', 'Milestone']}
                rows={memo.gtmPhases.map(r => [r.phase, r.strategy, r.channel, r.milestone])}
              />
            ) : (
              <MemoSection title="Go-to-Market" content={memo.goToMarket} />
            )}

            {/* Founder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <MemoSection title="Founder Advantage" content={memo.founderAdvantage} />
              <MemoSection title="Relevant Experience" content={memo.relevantExperience} />
            </div>

            {/* Financial Projection Table */}
            {memo.financialProjectionTable && memo.financialProjectionTable.length > 0 ? (
              <MemoTable
                title="Financial Projection"
                headers={['Year', 'Revenue', 'Customers', 'Burn', 'Key Assumption']}
                rows={memo.financialProjectionTable.map(r => [r.year, r.revenue, r.customers, r.burn, r.keyAssumption])}
              />
            ) : (
              <MemoSection title="Financial Projection" content={memo.financialProjection} />
            )}

            {/* Unit Economics Table */}
            {memo.unitEconomicsTable && memo.unitEconomicsTable.length > 0 ? (
              <MemoTable
                title="Unit Economics"
                headers={['Metric', 'Current', 'Target', 'Benchmark']}
                rows={memo.unitEconomicsTable.map(r => [r.metric, r.current, r.target, r.benchmark])}
              />
            ) : (
              <MemoSection title="Unit Economics" content={memo.unitEconomics} />
            )}

            {/* Funding Ask */}
            <MemoSection title="Funding Ask" content={memo.fundingAsk} />

            {/* Use of Funds Table */}
            {memo.useOfFundsTable && memo.useOfFundsTable.length > 0 ? (
              <MemoTable
                title="Use of Funds"
                headers={['Category', 'Allocation', 'Amount', 'Rationale']}
                rows={memo.useOfFundsTable.map(r => [r.category, r.allocation, r.amount, r.rationale])}
              />
            ) : (
              <MemoSection title="Use of Funds" content={memo.useOfFunds} />
            )}

            {/* Milestones Table */}
            {memo.milestonesTable && memo.milestonesTable.length > 0 ? (
              <MemoTable
                title="Key Milestones"
                headers={['Timeline', 'Milestone', 'Success Metric']}
                rows={memo.milestonesTable.map(r => [r.timeline, r.milestone, r.successMetric])}
              />
            ) : memo.milestones.length > 0 ? (
              <div>
                <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                  Key Milestones
                </div>
                <ol className="space-y-1">
                  {memo.milestones.map((m, i) => (
                    <li key={i} className="font-mono text-[10px] text-ink flex items-start gap-1.5">
                      <span className="font-mono text-[8px] font-bold text-burgundy bg-burgundy-bg px-1 py-0.5 rounded-sm shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {m}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* Feedback History */}
            {memo.feedbackHistory.length > 0 && (
              <details>
                <summary className="font-mono text-[9px] text-ink-muted cursor-pointer hover:text-ink">
                  Revision History ({memo.feedbackHistory.length})
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {memo.feedbackHistory.map((fb, i) => (
                    <li key={i} className="font-mono text-[8px] text-ink-muted italic">&ldquo;{fb}&rdquo;</li>
                  ))}
                </ul>
              </details>
            )}

            {/* Feedback / Regenerate */}
            <div className="pt-2 border-t border-rule space-y-2">
              <div className="flex gap-1">
                <button
                  onClick={handleGenerateMemo}
                  disabled={generatingMemo}
                  className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors disabled:opacity-50"
                >
                  {generatingMemo ? 'Regenerating...' : 'Regenerate Memo'}
                </button>
              </div>
              <div className="flex gap-1">
                <input
                  value={memoFeedback}
                  onChange={e => setMemoFeedback(e.target.value)}
                  placeholder="Request changes to memo..."
                  className="flex-1 font-mono text-[9px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink placeholder:text-ink-faint focus:border-burgundy focus:outline-none"
                />
                <button
                  onClick={handleSubmitMemoFeedback}
                  disabled={submittingMemoFeedback || !memoFeedback.trim()}
                  className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                    submittingMemoFeedback || !memoFeedback.trim()
                      ? 'bg-cream text-ink-faint border-rule cursor-not-allowed'
                      : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
                  }`}
                >
                  {submittingMemoFeedback ? 'Revising...' : 'Revise Memo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (venture.stage !== 'idea') ? (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Pitch Memo
          </div>
          <p className="font-mono text-[9px] text-ink-muted mb-2">
            Generate a Sequoia-quality investment memo from this venture&apos;s spec{prd ? ' and PRD' : ''}.
          </p>
          <button
            onClick={handleGenerateMemo}
            disabled={generatingMemo}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            {generatingMemo ? 'Generating Memo...' : 'Generate Pitch Memo'}
          </button>
        </div>
      ) : null}

      {/* Technical */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          Technical
        </div>
        <div className="space-y-2">
          {s.techStack.length > 0 && (
            <div>
              <span className="font-mono text-[9px] text-ink-muted block mb-0.5">Stack</span>
              <div className="flex flex-wrap gap-1">
                {s.techStack.map(t => (
                  <span key={t} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border border-rule bg-cream text-ink">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {s.mvpFeatures.length > 0 && (
            <div>
              <span className="font-mono text-[9px] text-ink-muted block mb-0.5">MVP Features</span>
              <ul className="space-y-0.5">
                {s.mvpFeatures.map((f, i) => (
                  <li key={i} className="font-mono text-[10px] text-ink flex items-start gap-1">
                    <span className="text-ink-faint shrink-0">{i + 1}.</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.apiIntegrations.length > 0 && (
            <div>
              <span className="font-mono text-[9px] text-ink-muted block mb-0.5">API Integrations</span>
              <div className="flex flex-wrap gap-1">
                {s.apiIntegrations.map(a => (
                  <span key={a} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border border-rule bg-cream text-ink">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Competitive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {s.existingAlternatives.length > 0 && (
          <div className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
              Alternatives
            </div>
            <ul className="space-y-0.5">
              {s.existingAlternatives.map((a, i) => (
                <li key={i} className="font-mono text-[10px] text-ink">· {a}</li>
              ))}
            </ul>
          </div>
        )}
        {s.unfairAdvantage && (
          <div className="bg-white border border-rule rounded-sm p-3">
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
              Unfair Advantage
            </div>
            <p className="font-mono text-[10px] text-ink leading-relaxed">{s.unfairAdvantage}</p>
          </div>
        )}
      </div>

      {/* Kill Criteria */}
      {s.killCriteria.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Kill Criteria
          </div>
          <ul className="space-y-0.5">
            {s.killCriteria.map((k, i) => (
              <li key={i} className="font-mono text-[10px] text-red-ink flex items-start gap-1">
                <span className="shrink-0">✕</span>
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Build Status */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          Build Status
        </div>
        <div className="mb-2">
          <BuildStatusBar status={b.status} />
        </div>

        {b.errorMessage && (
          <p className="font-mono text-[9px] text-red-ink mb-2">{b.errorMessage}</p>
        )}

        <div className="flex items-center gap-2">
          {b.repoUrl && (
            <a
              href={b.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] text-burgundy underline"
            >
              GitHub
            </a>
          )}
          {b.previewUrl && (
            <a
              href={b.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] text-burgundy underline"
            >
              Live Preview
            </a>
          )}
          {(venture.stage === 'prd_approved' && (b.status === 'pending' || b.status === 'failed')) && (
            <button
              onClick={handleTriggerBuild}
              className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
            >
              {b.status === 'failed' ? 'Retry Build' : 'Trigger Build'}
            </button>
          )}
        </div>

        {b.buildLog.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-rule">
            <span className="font-mono text-[9px] text-ink-muted block mb-1">Build Log</span>
            <div className="bg-cream rounded-sm p-2 max-h-32 overflow-y-auto">
              {b.buildLog.map((line, i) => (
                <p key={i} className="font-mono text-[8px] text-ink-muted leading-relaxed">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Iteration History + New Iteration */}
      {(venture.stage === 'deployed' || (venture.iterations && venture.iterations.length > 0)) && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Iterations
          </div>

          {venture.iterations && venture.iterations.length > 0 && (
            <div className="space-y-1 mb-2">
              {venture.iterations.map((it, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="font-mono text-[8px] text-ink-faint shrink-0 mt-0.5">#{i + 1}</span>
                  <span className="font-mono text-[9px] text-ink">{it.request}</span>
                </div>
              ))}
            </div>
          )}

          {venture.stage === 'deployed' && (
            <div className="flex gap-1">
              <input
                value={iterateText}
                onChange={e => setIterateText(e.target.value)}
                placeholder="Describe changes..."
                className="flex-1 font-mono text-[9px] bg-cream border border-rule rounded-sm px-2 py-1 text-ink placeholder:text-ink-faint focus:border-burgundy focus:outline-none"
              />
              <button
                onClick={handleSubmitIterate}
                disabled={submittingIterate || !iterateText.trim()}
                className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                  submittingIterate || !iterateText.trim()
                    ? 'bg-cream text-ink-faint border-rule cursor-not-allowed'
                    : 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
                }`}
              >
                {submittingIterate ? 'Iterating...' : 'Iterate'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Raw Input */}
      <details className="bg-white border border-rule rounded-sm">
        <summary className="p-3 font-serif text-[11px] text-ink-muted cursor-pointer hover:text-ink">
          Raw Input
        </summary>
        <div className="px-3 pb-3">
          <p className="font-mono text-[9px] text-ink-muted leading-relaxed whitespace-pre-wrap">
            {venture.rawInput}
          </p>
        </div>
      </details>
    </div>
  )
}
