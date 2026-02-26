'use client'

import { usePillarBrief } from '@/hooks/usePillarBrief'
import type { ThesisPillarExtended } from '@/lib/types/pillar-brief'

const PILLAR_LABELS: Record<ThesisPillarExtended, string> = {
  ai: 'AI Research',
  markets: 'Markets',
  mind: 'Mind',
  emergence: 'Emergence',
}

const PILLAR_DESCRIPTIONS: Record<ThesisPillarExtended, string> = {
  ai: 'Computational Cognitive Science × Reinforcement Learning — papers, research connections, and how they map to your ventures.',
  markets: 'Portfolio construction, 10-K patterns, venture economics — capital allocation signals and market intelligence.',
  mind: 'Journal patterns, decision calibration, belief evolution — what your data is telling you about your inner state.',
  emergence: 'Complex adaptive systems, phase transitions, scaling laws — where chaos meets order in your work.',
}

const SOURCE_LABELS: Record<string, string> = {
  arxiv: 'ArXiv',
  edgar: 'SEC',
  journal: 'Journal',
  signal: 'Signal',
  venture: 'Venture',
}

export default function PillarBriefCard({ pillar }: { pillar: ThesisPillarExtended }) {
  const { brief, loading, generating, error, generate, markReviewed } = usePillarBrief(pillar)

  if (loading) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-cream rounded-sm w-1/3" />
          <div className="h-3 bg-cream rounded-sm w-full" />
          <div className="h-3 bg-cream rounded-sm w-2/3" />
        </div>
      </div>
    )
  }

  if (!brief) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          {PILLAR_LABELS[pillar]} Brief
        </div>
        <div className="text-[10px] text-ink-muted leading-relaxed mb-3">
          {PILLAR_DESCRIPTIONS[pillar]}
        </div>
        {error && (
          <div className="text-[10px] text-red-ink bg-burgundy-bg border border-burgundy/20 rounded-sm px-2 py-1 mb-2">
            {error}
          </div>
        )}
        <button
          onClick={generate}
          disabled={generating}
          className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Brief'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            {PILLAR_LABELS[pillar]} Brief
          </span>
          {brief.reviewed && (
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm bg-green-bg text-green-ink border border-green-ink/10">
              Reviewed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-ink-faint font-mono">{brief.dataSourceCount} sources</span>
          <button
            onClick={generate}
            disabled={generating}
            className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors disabled:opacity-50"
          >
            {generating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[10px] text-red-ink bg-burgundy-bg border border-burgundy/20 rounded-sm px-2 py-1 mb-2">
          {error}
        </div>
      )}

      {/* Synthesis */}
      <div className="text-[11px] text-ink leading-relaxed mb-3 whitespace-pre-line">
        {brief.synthesis}
      </div>

      {/* Key Findings */}
      {brief.keyFindings.length > 0 && (
        <div className="mb-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Key Findings
          </div>
          <div className="space-y-1.5">
            {brief.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm bg-cream border border-rule-light text-ink-muted shrink-0 mt-0.5">
                  {SOURCE_LABELS[f.source] || f.source}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium text-ink leading-tight">{f.finding}</div>
                  <div className="text-[9px] text-ink-muted leading-tight mt-0.5">{f.relevance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connections */}
      {brief.connections.length > 0 && (
        <div className="mb-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Connections
          </div>
          <div className="space-y-1.5">
            {brief.connections.map((c, i) => (
              <div key={i} className="border-l-2 border-burgundy/30 pl-2">
                <div className="flex items-center gap-1 text-[9px] text-ink-muted">
                  <span className="font-medium text-ink">{c.from}</span>
                  <span>→</span>
                  <span className="font-medium text-ink">{c.to}</span>
                </div>
                <div className="text-[10px] text-ink leading-tight mt-0.5">{c.insight}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {brief.actionItems.length > 0 && (
        <div className="mb-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
            Action Items
          </div>
          <div className="space-y-1">
            {brief.actionItems.map((a, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border shrink-0 mt-0.5 ${
                  a.priority === 'high'
                    ? 'bg-burgundy-bg text-burgundy border-burgundy/20'
                    : 'bg-cream text-ink-muted border-rule-light'
                }`}>
                  {a.priority}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium text-ink leading-tight">{a.action}</div>
                  <div className="text-[9px] text-ink-muted leading-tight mt-0.5">{a.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Question */}
      {brief.openQuestion && (
        <div className="bg-cream border border-rule-light rounded-sm p-2 mb-3">
          <div className="text-[9px] font-semibold uppercase text-ink-muted mb-1">What if you're wrong?</div>
          <div className="text-[10px] font-serif italic text-ink leading-relaxed">{brief.openQuestion}</div>
        </div>
      )}

      {/* Footer */}
      {!brief.reviewed && (
        <button
          onClick={markReviewed}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
        >
          Mark Reviewed
        </button>
      )}
    </div>
  )
}
