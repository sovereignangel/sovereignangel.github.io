'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getInsights, getMacroPatterns, getProjects, updateInsight } from '@/lib/firestore'
import type { Insight, InsightType, MacroPattern, Project } from '@/lib/types'

const INSIGHT_TYPE_LABELS: Record<InsightType, string> = {
  process_insight: 'Process',
  feature_idea: 'Feature',
  action_item: 'Action',
  value_signal: 'Value',
  market_pattern: 'Market',
  arbitrage_opportunity: 'Arbitrage',
}

const INSIGHT_TYPE_COLORS: Record<InsightType, string> = {
  process_insight: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  feature_idea: 'bg-green-bg text-green-ink border-green-ink/20',
  action_item: 'bg-amber-bg text-amber-ink border-amber-ink/20',
  value_signal: 'bg-green-bg text-green-ink border-green-ink/20',
  market_pattern: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  arbitrage_opportunity: 'bg-amber-bg text-amber-ink border-amber-ink/20',
}

const CONFIDENCE_COLORS: Record<string, string> = {
  emerging: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  confirmed: 'bg-amber-bg text-amber-ink border-amber-ink/20',
  strong: 'bg-green-bg text-green-ink border-green-ink/20',
}

const ALL_INSIGHT_TYPES: InsightType[] = [
  'process_insight', 'feature_idea', 'action_item',
  'value_signal', 'market_pattern', 'arbitrage_opportunity',
]

export default function InsightsInbox() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<Insight[]>([])
  const [macroPatterns, setMacroPatterns] = useState<MacroPattern[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<InsightType | null>(null)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [allInsights, allPatterns, allProjects] = await Promise.all([
        getInsights(user.uid),
        getMacroPatterns(user.uid),
        getProjects(user.uid),
      ])
      setInsights(allInsights)
      setMacroPatterns(allPatterns)
      setProjects(allProjects)
    } catch (error) {
      console.error('Error loading insights:', error)
    }
    setLoading(false)
  }

  // Filter insights
  const filteredInsights = useMemo(() => {
    let filtered = insights.filter(i => i.status !== 'archived')
    if (selectedProject) {
      filtered = filtered.filter(i => i.linkedProjectIds.includes(selectedProject))
    }
    if (selectedType) {
      filtered = filtered.filter(i => i.type === selectedType)
    }
    return filtered
  }, [insights, selectedProject, selectedType])

  // Filter macro patterns
  const filteredPatterns = useMemo(() => {
    if (!selectedProject) return macroPatterns
    return macroPatterns.filter(mp => mp.projectIds.includes(selectedProject))
  }, [macroPatterns, selectedProject])

  // Group insights by project
  const groupedInsights = useMemo(() => {
    const groups: Record<string, { name: string; insights: Insight[] }> = {}

    // Initialize groups for active projects
    for (const proj of projects.filter(p => p.status !== 'archived')) {
      if (proj.id) {
        groups[proj.id] = { name: proj.name, insights: [] }
      }
    }
    groups['_unlinked'] = { name: 'Unlinked', insights: [] }

    for (const insight of filteredInsights) {
      if (insight.linkedProjectIds.length === 0) {
        groups['_unlinked'].insights.push(insight)
      } else {
        for (const projectId of insight.linkedProjectIds) {
          if (groups[projectId]) {
            groups[projectId].insights.push(insight)
          } else {
            groups['_unlinked'].insights.push(insight)
          }
        }
      }
    }

    // Return only groups with insights, sorted: non-empty first, unlinked last
    return Object.entries(groups)
      .filter(([, g]) => g.insights.length > 0)
      .sort(([aKey], [bKey]) => {
        if (aKey === '_unlinked') return 1
        if (bKey === '_unlinked') return -1
        return 0
      })
  }, [filteredInsights, projects])

  const handleArchive = async (insight: Insight) => {
    if (!user || !insight.id) return
    await updateInsight(user.uid, insight.id, { status: 'archived' })
    setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, status: 'archived' } : i))
  }

  // Count active insight types for badge
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const i of insights.filter(i => i.status !== 'archived')) {
      counts[i.type] = (counts[i.type] || 0) + 1
    }
    return counts
  }, [insights])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <span className="font-serif text-[11px] italic text-ink-muted">Loading insights...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Insights
        </h2>
        <span className="font-mono text-[9px] text-ink-muted">
          {filteredInsights.length} total
        </span>
      </div>

      {/* Project Filter */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedProject(null)}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              selectedProject === null
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            All Projects
          </button>
          {projects.filter(p => p.status !== 'archived').map(proj => (
            <button
              key={proj.id}
              onClick={() => setSelectedProject(selectedProject === proj.id ? null : proj.id!)}
              className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                selectedProject === proj.id
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {proj.name}
            </button>
          ))}
        </div>
      )}

      {/* Type Filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedType(null)}
          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            selectedType === null
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          All Types
        </button>
        {ALL_INSIGHT_TYPES.map(type => {
          const count = typeCounts[type] || 0
          if (count === 0) return null
          return (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                selectedType === type
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {INSIGHT_TYPE_LABELS[type]} ({count})
            </button>
          )
        })}
      </div>

      {/* Macro Intelligence */}
      {filteredPatterns.length > 0 && (
        <div className="bg-cream border border-rule rounded-sm p-3">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
            Macro Intelligence
          </h3>
          <div className="space-y-1.5">
            {filteredPatterns.map(mp => (
              <div key={mp.id} className="flex items-start gap-2">
                <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                  CONFIDENCE_COLORS[mp.confidence] || CONFIDENCE_COLORS.emerging
                }`}>
                  {mp.confidence}
                </span>
                <div className="flex-1">
                  <p className="text-[10px] text-ink leading-relaxed">{mp.pattern}</p>
                  <div className="flex gap-1 mt-0.5">
                    {mp.projectNames.map(name => (
                      <span key={name} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights by Project */}
      {filteredInsights.length === 0 ? (
        <div className="bg-paper border border-rule rounded-sm p-6 text-center">
          <p className="font-sans text-[11px] text-ink-muted">
            {insights.length === 0
              ? 'No insights yet. Upload a conversation to extract insights.'
              : 'No insights match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedInsights.map(([groupId, group]) => (
            <div key={groupId}>
              {/* Group Header */}
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-rule">
                <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {group.name}
                </h3>
                <span className="font-mono text-[9px] text-ink-muted">
                  {group.insights.length}
                </span>
              </div>

              {/* Insights */}
              <div className="space-y-1.5">
                {group.insights.map(insight => (
                  <div
                    key={insight.id}
                    className="bg-white border border-rule rounded-sm p-2 hover:border-burgundy/30 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {/* Type Badge */}
                      <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                        INSIGHT_TYPE_COLORS[insight.type] || 'text-ink-muted border-rule'
                      }`}>
                        {INSIGHT_TYPE_LABELS[insight.type] || insight.type}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-ink leading-relaxed">
                          {expandedInsight === insight.id ? insight.content : insight.summary || insight.content}
                        </p>

                        {/* Source + Date */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[9px] text-ink-muted truncate">
                            {insight.sourceConversationTitle}
                          </span>
                          <span className="font-mono text-[9px] text-ink-faint">
                            {insight.sourceConversationDate}
                          </span>
                        </div>

                        {/* Tags */}
                        {insight.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {insight.tags.map(tag => (
                              <span key={tag} className="font-mono text-[8px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Expanded: Full content + actions */}
                        {expandedInsight === insight.id && insight.summary && (
                          <div className="mt-1.5 pt-1.5 border-t border-rule-light">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleArchive(insight)}
                                className="font-mono text-[9px] text-ink-muted hover:text-red-ink transition-colors"
                              >
                                Archive
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(insight.content)
                                }}
                                className="font-mono text-[9px] text-ink-muted hover:text-burgundy transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id!)}
                        className="font-mono text-[9px] text-burgundy hover:text-burgundy/70 shrink-0"
                      >
                        {expandedInsight === insight.id ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
