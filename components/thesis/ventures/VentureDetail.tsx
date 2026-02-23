'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getVenture, updateVenture } from '@/lib/firestore'
import type { Venture, VentureStage } from '@/lib/types'
import BuildStatusBar from './BuildStatusBar'

const STAGE_OPTIONS: VentureStage[] = ['idea', 'specced', 'building', 'deployed', 'archived']

export default function VentureDetail({ ventureId, onBack }: { ventureId: string; onBack: () => void }) {
  const { user } = useAuth()
  const [venture, setVenture] = useState<Venture | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div className="p-3 text-[11px] text-ink-muted">Loading...</div>
  }

  if (!venture) {
    return <div className="p-3 text-[11px] text-red-ink">Venture not found</div>
  }

  const s = venture.spec
  const b = venture.build

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
                <option key={st} value={st}>{st}</option>
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
          {(b.status === 'pending' || b.status === 'failed') && (
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
