'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'

// ─── TYPES ──────────────────────────────────────────────────────────────

interface ArchitecturePanelProps {
  onClose: () => void
}

type DiagramView = 'reward' | 'system'

interface NodeDef {
  id: string
  label: string
  symbol?: string
  type: 'input' | 'component' | 'operator' | 'output' | 'api' | 'data' | 'state' | 'ui'
  column: number
  group?: string
  navigateTo?: string
  liveValueKey?: string
  liveFormatter?: (val: number) => string
}

interface ConnectionDef {
  from: string
  to: string
}

// ─── PATH GROUPS (for highlight-tracing) ────────────────────────────────

const REWARD_PATH_GROUPS: Record<string, string[]> = {
  ge: ['sleep', 'training', 'bodyFelt', 'nsState', 'ge', 'geoMean', 'finalCalc', 'score'],
  gi: ['problems', 'problemSelected', 'gi', 'geoMean', 'finalCalc', 'score'],
  gvc: ['focusHours', 'shipping', 'speed', 'gvc', 'geoMean', 'finalCalc', 'score'],
  kappa: ['revenueAsks', 'revenueSignal', 'feedbackLoop', 'kappa', 'geoMean', 'finalCalc', 'score'],
  gd: ['conversations', 'extSignals', 'insights', 'gd', 'geoMean', 'finalCalc', 'score'],
  optionality: ['projectAlloc', 'optionality', 'geoMean', 'finalCalc', 'score'],
  theta: ['pillars', 'theta', 'finalCalc', 'score'],
  fragmentation: ['projectAlloc', 'fragmentation', 'finalCalc', 'score'],
  gate: ['nsState', 'gate', 'finalCalc', 'score'],
}

const SYSTEM_PATH_GROUPS: Record<string, string[]> = {
  garmin: ['garminApi', 'garminMetrics', 'useDailyLogData', 'energyGauge'],
  calendar: ['calendarApi', 'focusSessions', 'useDailyLogActions', 'outputGauge'],
  gemini: ['geminiApi', 'conversations', 'useDailyLogData', 'intelligenceGauge'],
  rss: ['rssApi', 'externalSignals', 'useDailyLogData', 'intelligenceGauge'],
  energy: ['garminMetrics', 'dailyLogs', 'useDailyLogData', 'computeRewardHook', 'energyGauge'],
  output: ['dailyLogs', 'projects', 'useDailyLogData', 'computeRewardHook', 'outputGauge'],
  intelligence: ['conversations', 'externalSignals', 'dailyLogs', 'useDailyLogData', 'intelligenceGauge'],
  coherence: ['dailyLogs', 'projects', 'useDailyLogData', 'computeRewardHook', 'coherenceGauge'],
}

// ─── REWARD FLOW NODES ──────────────────────────────────────────────────

const REWARD_NODES: NodeDef[] = [
  // Column 0 — Inputs
  { id: 'sleep', label: 'Sleep Hours', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis', liveValueKey: 'sleepHours', liveFormatter: (v) => `${v}h` },
  { id: 'training', label: 'Training', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis' },
  { id: 'bodyFelt', label: 'Body Felt', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis' },
  { id: 'nsState', label: 'NS State', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis' },
  { id: 'problems', label: 'Problems', column: 0, type: 'input', group: 'gi', navigateTo: '/thesis/intelligence' },
  { id: 'problemSelected', label: 'Problem Selected', column: 0, type: 'input', group: 'gi', navigateTo: '/thesis/intelligence' },
  { id: 'focusHours', label: 'Focus Hours', column: 0, type: 'input', group: 'gvc', navigateTo: '/thesis/output', liveValueKey: 'focusHoursActual', liveFormatter: (v) => `${v}h` },
  { id: 'shipping', label: 'Shipping', column: 0, type: 'input', group: 'gvc', navigateTo: '/thesis/output' },
  { id: 'speed', label: 'Speed > Perfection', column: 0, type: 'input', group: 'gvc', navigateTo: '/thesis/output' },
  { id: 'revenueAsks', label: 'Revenue Asks', column: 0, type: 'input', group: 'kappa', navigateTo: '/thesis/output', liveValueKey: 'revenueAsksCount' },
  { id: 'revenueSignal', label: 'Revenue Signal', column: 0, type: 'input', group: 'kappa', navigateTo: '/thesis/output' },
  { id: 'feedbackLoop', label: 'Feedback Loop', column: 0, type: 'input', group: 'kappa', navigateTo: '/thesis/output' },
  { id: 'conversations', label: 'Conversations', column: 0, type: 'input', group: 'gd', navigateTo: '/thesis/intelligence', liveValueKey: 'discoveryConversationsCount' },
  { id: 'extSignals', label: 'External Signals', column: 0, type: 'input', group: 'gd', navigateTo: '/thesis/intelligence', liveValueKey: 'externalSignalsReviewed' },
  { id: 'insights', label: 'Insights', column: 0, type: 'input', group: 'gd', navigateTo: '/thesis/intelligence', liveValueKey: 'insightsExtracted' },
  { id: 'pillars', label: 'Pillars Touched', column: 0, type: 'input', group: 'theta', navigateTo: '/thesis/coherence' },
  { id: 'projectAlloc', label: 'Project Allocation', column: 0, type: 'input', group: 'optionality', navigateTo: '/thesis/coherence' },

  // Column 1 — Component Scores
  { id: 'ge', label: 'Generative Energy', symbol: 'GE', column: 1, type: 'component', navigateTo: '/thesis', liveValueKey: 'comp_ge' },
  { id: 'gi', label: 'Intelligence Growth', symbol: 'GI', column: 1, type: 'component', navigateTo: '/thesis/intelligence', liveValueKey: 'comp_gi' },
  { id: 'gvc', label: 'Value Creation', symbol: 'GVC', column: 1, type: 'component', navigateTo: '/thesis/output', liveValueKey: 'comp_gvc' },
  { id: 'kappa', label: 'Capture Ratio', symbol: 'K', column: 1, type: 'component', navigateTo: '/thesis/output', liveValueKey: 'comp_kappa' },
  { id: 'gd', label: 'Discovery', symbol: 'GD', column: 1, type: 'component', navigateTo: '/thesis/intelligence', liveValueKey: 'comp_gd' },
  { id: 'optionality', label: 'Optionality', symbol: 'O', column: 1, type: 'component', navigateTo: '/thesis/coherence', liveValueKey: 'comp_optionality' },
  { id: 'theta', label: 'Coherence', symbol: 'Theta', column: 1, type: 'component', navigateTo: '/thesis/coherence', liveValueKey: 'comp_theta' },
  { id: 'fragmentation', label: 'Fragmentation', symbol: 'F', column: 1, type: 'component', navigateTo: '/thesis/coherence', liveValueKey: 'comp_fragmentation' },
  { id: 'gate', label: 'NS Gate', symbol: 'g(v)', column: 1, type: 'component', navigateTo: '/thesis', liveValueKey: 'comp_gate' },

  // Column 2 — Aggregation
  { id: 'geoMean', label: '(GE*GI*GVC*K*O*GD)^1/6', column: 2, type: 'operator' },
  { id: 'finalCalc', label: 'gate * geoMean - F*0.3 + Theta*0.15', column: 2, type: 'operator' },

  // Column 3 — Output
  { id: 'score', label: 'g* Score', symbol: 'g*', column: 3, type: 'output', liveValueKey: 'score' },
]

const REWARD_CONNECTIONS: ConnectionDef[] = [
  // Inputs → Components
  { from: 'sleep', to: 'ge' }, { from: 'training', to: 'ge' }, { from: 'bodyFelt', to: 'ge' }, { from: 'nsState', to: 'ge' },
  { from: 'problems', to: 'gi' }, { from: 'problemSelected', to: 'gi' },
  { from: 'focusHours', to: 'gvc' }, { from: 'shipping', to: 'gvc' }, { from: 'speed', to: 'gvc' },
  { from: 'revenueAsks', to: 'kappa' }, { from: 'revenueSignal', to: 'kappa' }, { from: 'feedbackLoop', to: 'kappa' },
  { from: 'conversations', to: 'gd' }, { from: 'extSignals', to: 'gd' }, { from: 'insights', to: 'gd' },
  { from: 'pillars', to: 'theta' },
  { from: 'projectAlloc', to: 'optionality' }, { from: 'projectAlloc', to: 'fragmentation' },
  { from: 'nsState', to: 'gate' },
  // Components → Aggregation
  { from: 'ge', to: 'geoMean' }, { from: 'gi', to: 'geoMean' }, { from: 'gvc', to: 'geoMean' },
  { from: 'kappa', to: 'geoMean' }, { from: 'gd', to: 'geoMean' }, { from: 'optionality', to: 'geoMean' },
  { from: 'geoMean', to: 'finalCalc' }, { from: 'gate', to: 'finalCalc' },
  { from: 'fragmentation', to: 'finalCalc' }, { from: 'theta', to: 'finalCalc' },
  // Aggregation → Output
  { from: 'finalCalc', to: 'score' },
]

// ─── SYSTEM ARCHITECTURE NODES ──────────────────────────────────────────

const SYSTEM_NODES: NodeDef[] = [
  // Column 0 — External APIs
  { id: 'garminApi', label: 'Garmin Connect', column: 0, type: 'api' },
  { id: 'calendarApi', label: 'Google Calendar', column: 0, type: 'api' },
  { id: 'geminiApi', label: 'Gemini AI', column: 0, type: 'api' },
  { id: 'rssApi', label: 'RSS Feeds', column: 0, type: 'api' },

  // Column 1 — Firestore Collections
  { id: 'dailyLogs', label: 'daily_logs', column: 1, type: 'data' },
  { id: 'projects', label: 'projects', column: 1, type: 'data' },
  { id: 'signals', label: 'signals', column: 1, type: 'data' },
  { id: 'conversations', label: 'conversations', column: 1, type: 'data' },
  { id: 'externalSignals', label: 'external_signals', column: 1, type: 'data' },
  { id: 'garminMetrics', label: 'garmin_metrics', column: 1, type: 'data' },
  { id: 'focusSessions', label: 'focus_sessions', column: 1, type: 'data' },
  { id: 'weeklyReview', label: 'weekly_synthesis', column: 1, type: 'data' },

  // Column 2 — State Layer
  { id: 'useDailyLogData', label: 'useDailyLogData', column: 2, type: 'state' },
  { id: 'useDailyLogActions', label: 'useDailyLogActions', column: 2, type: 'state' },
  { id: 'useRecentData', label: 'useRecentData', column: 2, type: 'state' },
  { id: 'computeRewardHook', label: 'computeReward', column: 2, type: 'state' },

  // Column 3 — UI Components
  { id: 'energyGauge', label: 'Energy', symbol: 'GE', column: 3, type: 'ui', navigateTo: '/thesis' },
  { id: 'outputGauge', label: 'Output', symbol: 'GVC+K', column: 3, type: 'ui', navigateTo: '/thesis/output' },
  { id: 'intelligenceGauge', label: 'Intelligence', symbol: 'GI', column: 3, type: 'ui', navigateTo: '/thesis/intelligence' },
  { id: 'coherenceGauge', label: 'Coherence', symbol: 'Theta', column: 3, type: 'ui', navigateTo: '/thesis/coherence' },
  { id: 'thesisNav', label: 'ThesisNav', symbol: 'g*', column: 3, type: 'ui' },
]

const SYSTEM_CONNECTIONS: ConnectionDef[] = [
  // APIs → Data
  { from: 'garminApi', to: 'garminMetrics' },
  { from: 'calendarApi', to: 'focusSessions' },
  { from: 'geminiApi', to: 'conversations' },
  { from: 'rssApi', to: 'externalSignals' },
  // Data → State
  { from: 'dailyLogs', to: 'useDailyLogData' },
  { from: 'projects', to: 'useRecentData' },
  { from: 'garminMetrics', to: 'useDailyLogData' },
  { from: 'conversations', to: 'useDailyLogData' },
  { from: 'externalSignals', to: 'useDailyLogData' },
  { from: 'signals', to: 'useRecentData' },
  { from: 'focusSessions', to: 'useDailyLogActions' },
  { from: 'weeklyReview', to: 'useRecentData' },
  // State → State
  { from: 'useDailyLogData', to: 'computeRewardHook' },
  { from: 'useRecentData', to: 'computeRewardHook' },
  // State → UI
  { from: 'useDailyLogData', to: 'energyGauge' },
  { from: 'useDailyLogActions', to: 'outputGauge' },
  { from: 'useDailyLogData', to: 'intelligenceGauge' },
  { from: 'computeRewardHook', to: 'coherenceGauge' },
  { from: 'computeRewardHook', to: 'thesisNav' },
]

// ─── COLUMN HEADERS ─────────────────────────────────────────────────────

const REWARD_COLUMN_HEADERS = ['Inputs', 'Components', 'Aggregation', 'Score']
const SYSTEM_COLUMN_HEADERS = ['External APIs', 'Data (Firestore)', 'State (Hooks)', 'UI (Components)']

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────

export default function ArchitecturePanel({ onClose }: ArchitecturePanelProps) {
  const [view, setView] = useState<DiagramView>('reward')
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set())
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const { log } = useDailyLogContext()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement>())
  const [nodePositions, setNodePositions] = useState<Record<string, DOMRect>>({})

  const reward = log.rewardScore
  const components = reward?.components

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Compute node positions for SVG connections
  const computePositions = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const newPositions: Record<string, DOMRect> = {}
    nodeRefs.current.forEach((el, id) => {
      if (el) {
        const rect = el.getBoundingClientRect()
        newPositions[id] = new DOMRect(
          rect.left - containerRect.left,
          rect.top - containerRect.top,
          rect.width,
          rect.height
        )
      }
    })
    setNodePositions(newPositions)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(computePositions)
    const container = containerRef.current
    if (!container) return () => cancelAnimationFrame(id)
    const observer = new ResizeObserver(computePositions)
    observer.observe(container)
    return () => { cancelAnimationFrame(id); observer.disconnect() }
  }, [computePositions, view])

  // Live value lookup
  const getLiveValue = useCallback((key?: string): number | null => {
    if (!key) return null
    if (key.startsWith('comp_')) {
      const compKey = key.replace('comp_', '') as keyof typeof components
      return components?.[compKey] ?? null
    }
    if (key === 'score') return reward?.score ?? null
    const logVal = (log as Record<string, unknown>)[key]
    return typeof logVal === 'number' ? logVal : null
  }, [components, reward, log])

  // Highlight logic
  const handleNodeClick = useCallback((nodeId: string, navigateTo?: string) => {
    if (activeNodeId === nodeId) {
      // Second click on same node — navigate if possible
      if (navigateTo) {
        router.push(navigateTo)
        onClose()
        return
      }
      setActiveNodeId(null)
      setHighlightedNodes(new Set())
      return
    }

    // Find all path groups containing this node
    const pathGroups = view === 'reward' ? REWARD_PATH_GROUPS : SYSTEM_PATH_GROUPS
    const highlighted = new Set<string>()
    for (const group of Object.values(pathGroups)) {
      if (group.includes(nodeId)) {
        for (const id of group) highlighted.add(id)
      }
    }

    if (highlighted.size === 0) highlighted.add(nodeId)
    setActiveNodeId(nodeId)
    setHighlightedNodes(highlighted)
  }, [activeNodeId, view, router, onClose])

  const clearHighlight = useCallback(() => {
    setActiveNodeId(null)
    setHighlightedNodes(new Set())
  }, [])

  // Current diagram data
  const nodes = view === 'reward' ? REWARD_NODES : SYSTEM_NODES
  const connections = view === 'reward' ? REWARD_CONNECTIONS : SYSTEM_CONNECTIONS
  const columnHeaders = view === 'reward' ? REWARD_COLUMN_HEADERS : SYSTEM_COLUMN_HEADERS

  // Group nodes by column
  const columns = useMemo(() => {
    const cols: NodeDef[][] = [[], [], [], []]
    for (const node of nodes) {
      cols[node.column].push(node)
    }
    return cols
  }, [nodes])

  // Set node ref callback
  const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el)
    else nodeRefs.current.delete(id)
  }, [])

  const hasHighlight = highlightedNodes.size > 0

  // Component color helper
  const componentColor = (val: number | null) => {
    if (val === null) return 'text-ink-muted'
    if (val >= 0.7) return 'text-green-ink'
    if (val >= 0.4) return 'text-amber-ink'
    return 'text-red-ink'
  }

  const scoreColor = (val: number | null) => {
    if (val === null) return 'text-ink-muted'
    if (val >= 7) return 'text-green-ink'
    if (val >= 4) return 'text-amber-ink'
    return 'text-red-ink'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-paper border border-rule rounded-sm w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-lg z-50">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-paper border-b border-rule px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-serif text-[18px] font-bold text-ink tracking-tight">
              System Architecture
            </h2>
            <p className="font-serif text-[10px] italic text-ink-muted mt-0.5">
              {view === 'reward' ? 'How inputs flow through the reward function' : 'Tech stack layers and data flow'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex gap-1">
              {(['reward', 'system'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setView(v); clearHighlight(); nodeRefs.current.clear() }}
                  className={`font-serif text-[11px] px-3 py-1.5 rounded-sm border transition-colors ${
                    view === v
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {v === 'reward' ? 'Reward Flow' : 'System Architecture'}
                </button>
              ))}
            </div>

            {/* Close */}
            <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hint bar */}
        <div className="px-6 py-2 bg-cream/60 border-b border-rule-light">
          <p className="font-sans text-[10px] text-ink-muted">
            Click a node to trace its data path. Click again to navigate to that section.
          </p>
        </div>

        {/* Diagram */}
        <div className="px-6 py-5">
          <div ref={containerRef} className="relative" style={{ minHeight: view === 'reward' ? '680px' : '420px' }}>
            {/* SVG connection layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" style={{ zIndex: 0 }}>
              {connections.map((conn, i) => {
                const fromPos = nodePositions[conn.from]
                const toPos = nodePositions[conn.to]
                if (!fromPos || !toPos) return null

                const x1 = fromPos.x + fromPos.width
                const y1 = fromPos.y + fromPos.height / 2
                const x2 = toPos.x
                const y2 = toPos.y + toPos.height / 2
                const cp = (x2 - x1) * 0.4

                const isHighlighted = hasHighlight && highlightedNodes.has(conn.from) && highlightedNodes.has(conn.to)
                const isDimmed = hasHighlight && !isHighlighted

                return (
                  <path
                    key={`${conn.from}-${conn.to}-${i}`}
                    d={`M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isHighlighted ? '#7c2d2d' : '#d8d0c8'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={isHighlighted ? 'none' : '4 2'}
                    opacity={isDimmed ? 0.1 : 1}
                    className="transition-all duration-200"
                  />
                )
              })}
            </svg>

            {/* Column headers + node columns */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 relative" style={{ zIndex: 10 }}>
              {columns.map((col, colIdx) => {
                // Column widths: inputs wider, output narrower
                const colWidths = view === 'reward'
                  ? ['25%', '22%', '30%', '15%']
                  : ['20%', '25%', '25%', '22%']

                // Group input nodes by their group for reward view
                let groupedContent: React.ReactNode
                if (view === 'reward' && colIdx === 0) {
                  const groups: Record<string, NodeDef[]> = {}
                  for (const node of col) {
                    const g = node.group || 'other'
                    if (!groups[g]) groups[g] = []
                    groups[g].push(node)
                  }
                  const groupLabels: Record<string, string> = {
                    ge: 'Energy', gi: 'Intelligence', gvc: 'Value Creation',
                    kappa: 'Capture', gd: 'Discovery', theta: 'Coherence', optionality: 'Portfolio',
                  }
                  groupedContent = (
                    <div className="flex flex-col gap-2">
                      {Object.entries(groups).map(([groupId, groupNodes]) => (
                        <div key={groupId} className="border border-rule-light rounded-sm p-1.5 bg-cream/30">
                          <p className="font-serif text-[8px] uppercase tracking-[0.5px] text-ink-faint mb-1">
                            {groupLabels[groupId] || groupId}
                          </p>
                          <div className="flex flex-col gap-1">
                            {groupNodes.map(node => (
                              <DiagramNodeEl
                                key={node.id}
                                node={node}
                                ref={setNodeRef(node.id)}
                                liveValue={getLiveValue(node.liveValueKey)}
                                liveFormatter={node.liveFormatter}
                                isHighlighted={hasHighlight && highlightedNodes.has(node.id)}
                                isDimmed={hasHighlight && !highlightedNodes.has(node.id)}
                                isActive={activeNodeId === node.id}
                                componentColor={componentColor}
                                scoreColor={scoreColor}
                                onClick={() => handleNodeClick(node.id, node.navigateTo)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                } else {
                  groupedContent = (
                    <div className="flex flex-col gap-1.5">
                      {col.map(node => (
                        <DiagramNodeEl
                          key={node.id}
                          node={node}
                          ref={setNodeRef(node.id)}
                          liveValue={getLiveValue(node.liveValueKey)}
                          liveFormatter={node.liveFormatter}
                          isHighlighted={hasHighlight && highlightedNodes.has(node.id)}
                          isDimmed={hasHighlight && !highlightedNodes.has(node.id)}
                          isActive={activeNodeId === node.id}
                          componentColor={componentColor}
                          scoreColor={scoreColor}
                          onClick={() => handleNodeClick(node.id, node.navigateTo)}
                        />
                      ))}
                    </div>
                  )
                }

                return (
                  <div
                    key={colIdx}
                    className="flex-shrink-0 lg:px-2"
                    style={{ width: undefined }}
                  >
                    {/* Use lg styles for width */}
                    <style>{`
                      @media (min-width: 1024px) {
                        .arch-col-${view}-${colIdx} { width: ${colWidths[colIdx]}; }
                      }
                    `}</style>
                    <div className={`arch-col-${view}-${colIdx}`}>
                      <p className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule-light">
                        {columnHeaders[colIdx]}
                      </p>
                      {groupedContent}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-3 pt-3 border-t border-rule-light">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-ink rounded-sm" />
              <span className="font-sans text-[9px] text-ink-muted">&ge; 0.7 Good</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-ink rounded-sm" />
              <span className="font-sans text-[9px] text-ink-muted">&ge; 0.4 Watch</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-ink rounded-sm" />
              <span className="font-sans text-[9px] text-ink-muted">&lt; 0.4 Alert</span>
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <svg className="w-4 h-1" viewBox="0 0 16 4"><line x1="0" y1="2" x2="16" y2="2" stroke="#d8d0c8" strokeWidth="1" strokeDasharray="4 2" /></svg>
              <span className="font-sans text-[9px] text-ink-muted">Data flow</span>
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-1" viewBox="0 0 16 4"><line x1="0" y1="2" x2="16" y2="2" stroke="#7c2d2d" strokeWidth="2" /></svg>
              <span className="font-sans text-[9px] text-ink-muted">Active path</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DIAGRAM NODE COMPONENT ─────────────────────────────────────────────

interface DiagramNodeElProps {
  node: NodeDef
  liveValue: number | null
  liveFormatter?: (val: number) => string
  isHighlighted: boolean
  isDimmed: boolean
  isActive: boolean
  componentColor: (val: number | null) => string
  scoreColor: (val: number | null) => string
  onClick: () => void
}

import { forwardRef } from 'react'

const DiagramNodeEl = forwardRef<HTMLDivElement, DiagramNodeElProps>(function DiagramNodeEl(
  { node, liveValue, liveFormatter, isHighlighted, isDimmed, isActive, componentColor, scoreColor, onClick },
  ref
) {
  const typeStyles: Record<string, string> = {
    input: 'bg-white',
    component: 'bg-white',
    operator: 'bg-cream/60',
    output: 'bg-white',
    api: 'bg-cream/60',
    data: 'bg-amber-bg',
    state: 'bg-burgundy-bg',
    ui: 'bg-burgundy-bg',
  }

  const borderStyle = isActive
    ? 'border-burgundy ring-1 ring-burgundy/20'
    : isHighlighted
      ? 'border-burgundy bg-burgundy-bg'
      : 'border-rule hover:border-ink-faint'

  const formatted = liveValue !== null
    ? (liveFormatter ? liveFormatter(liveValue) : liveValue.toFixed(2))
    : null

  const valColor = node.type === 'output'
    ? scoreColor(liveValue)
    : componentColor(liveValue)

  if (node.type === 'output') {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`border rounded-sm px-3 py-3 cursor-pointer transition-all duration-200 text-center ${typeStyles[node.type]} ${borderStyle} ${isDimmed ? 'opacity-20' : ''}`}
      >
        {node.symbol && (
          <p className={`font-mono text-[10px] text-ink-muted mb-1`}>{node.symbol}</p>
        )}
        <p className={`font-mono text-[28px] font-bold ${valColor}`}>
          {liveValue !== null ? liveValue.toFixed(1) : '—'}
        </p>
        <p className="font-serif text-[9px] text-ink-muted mt-0.5">{node.label}</p>
      </div>
    )
  }

  if (node.type === 'operator') {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`border rounded-sm px-2 py-2 cursor-pointer transition-all duration-200 ${typeStyles[node.type]} ${borderStyle} ${isDimmed ? 'opacity-20' : ''}`}
      >
        <p className="font-mono text-[9px] text-ink-muted leading-snug break-all">{node.label}</p>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`border rounded-sm px-2 py-1 cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${typeStyles[node.type]} ${borderStyle} ${isDimmed ? 'opacity-20' : ''}`}
    >
      {node.symbol && (
        <span className={`font-mono text-[10px] font-semibold shrink-0 ${isHighlighted ? 'text-burgundy' : 'text-ink'}`}>
          {node.symbol}
        </span>
      )}
      <span className="font-serif text-[9px] text-ink-muted truncate">{node.label}</span>
      {formatted !== null && (
        <span className={`font-mono text-[10px] font-semibold ml-auto shrink-0 ${valColor}`}>
          {formatted}
        </span>
      )}
      {node.navigateTo && (
        <svg className="w-2.5 h-2.5 text-ink-faint shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
})
