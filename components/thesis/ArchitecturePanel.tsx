'use client'

import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react'
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
  sublabel?: string
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

// ─── PATH GROUPS ────────────────────────────────────────────────────────

const REWARD_PATH_GROUPS: Record<string, string[]> = {
  ge: ['sleep', 'training', 'bodyFelt', 'nsState', 'ge', 'geoMean', 'finalCalc', 'score'],
  gi: ['problems', 'problemSelected', 'gi', 'geoMean', 'finalCalc', 'score'],
  gvc: ['focusHours', 'shipping', 'speed', 'gvc', 'geoMean', 'finalCalc', 'score'],
  kappa: ['revenueAsks', 'revenueSignal', 'feedbackLoop', 'kappa', 'geoMean', 'finalCalc', 'score'],
  gd: ['conversations', 'extSignals', 'insights', 'gd', 'geoMean', 'finalCalc', 'score'],
  optionality: ['projectAlloc', 'optionality', 'geoMean', 'finalCalc', 'score'],
  sigma: ['practice', 'technique', 'automation', 'sigma', 'geoMean', 'finalCalc', 'score'],
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
  // Column 0 — Daily Inputs
  { id: 'sleep', label: 'Sleep Hours', sublabel: 'Target: 7.5h', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis', liveValueKey: 'sleepHours', liveFormatter: (v) => `${v}h` },
  { id: 'training', label: 'Training Type', sublabel: 'Strength / VO2 / Zone2', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis' },
  { id: 'bodyFelt', label: 'Body Felt', sublabel: 'Open / Neutral / Tense', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis' },
  { id: 'nsState', label: 'Nervous System', sublabel: 'Regulated / Spiked', column: 0, type: 'input', group: 'ge', navigateTo: '/thesis' },
  { id: 'problems', label: 'Problems Identified', sublabel: 'Pain points & solutions', column: 0, type: 'input', group: 'gi', navigateTo: '/thesis/intelligence' },
  { id: 'problemSelected', label: 'Problem Selected', sublabel: '48h test candidate', column: 0, type: 'input', group: 'gi', navigateTo: '/thesis/intelligence' },
  { id: 'focusHours', label: 'Focus Hours', sublabel: 'Target: 6h/day', column: 0, type: 'input', group: 'gvc', navigateTo: '/thesis/output', liveValueKey: 'focusHoursActual', liveFormatter: (v) => `${v}h` },
  { id: 'shipping', label: 'What Shipped', sublabel: 'Public iteration bonus', column: 0, type: 'input', group: 'gvc', navigateTo: '/thesis/output' },
  { id: 'speed', label: 'Speed > Perfection', sublabel: 'Velocity bonus', column: 0, type: 'input', group: 'gvc', navigateTo: '/thesis/output' },
  { id: 'revenueAsks', label: 'Revenue Asks', sublabel: 'Target: 2/day', column: 0, type: 'input', group: 'kappa', navigateTo: '/thesis/output', liveValueKey: 'revenueAsksCount' },
  { id: 'revenueSignal', label: 'Revenue Earned', sublabel: 'Stream type multiplier', column: 0, type: 'input', group: 'kappa', navigateTo: '/thesis/output' },
  { id: 'feedbackLoop', label: 'Feedback Loop', sublabel: 'Closed = +0.15', column: 0, type: 'input', group: 'kappa', navigateTo: '/thesis/output' },
  { id: 'conversations', label: 'Discovery Calls', sublabel: 'Target: 2/day', column: 0, type: 'input', group: 'gd', navigateTo: '/thesis/intelligence', liveValueKey: 'discoveryConversationsCount' },
  { id: 'extSignals', label: 'External Signals', sublabel: 'Target: 5/day', column: 0, type: 'input', group: 'gd', navigateTo: '/thesis/intelligence', liveValueKey: 'externalSignalsReviewed' },
  { id: 'insights', label: 'Insights Extracted', sublabel: 'From conversations', column: 0, type: 'input', group: 'gd', navigateTo: '/thesis/intelligence', liveValueKey: 'insightsExtracted' },
  { id: 'practice', label: 'Deliberate Practice', sublabel: 'Target: 30 min/day', column: 0, type: 'input', group: 'sigma', navigateTo: '/thesis/coherence', liveValueKey: 'deliberatePracticeMinutes', liveFormatter: (v) => `${v}m` },
  { id: 'technique', label: 'New Technique', sublabel: 'Applied today?', column: 0, type: 'input', group: 'sigma', navigateTo: '/thesis/coherence' },
  { id: 'automation', label: 'Automation Created', sublabel: 'Leverage built?', column: 0, type: 'input', group: 'sigma', navigateTo: '/thesis/coherence' },
  { id: 'projectAlloc', label: 'Project Allocation', sublabel: 'Time % per project', column: 0, type: 'input', group: 'optionality', navigateTo: '/thesis/coherence' },

  // Column 1 — Component Scores (0-1)
  { id: 'ge', label: 'Generative Energy', symbol: 'GE', sublabel: 'sleep^0.35 * train^0.2 * body^0.2 * ns^0.25', column: 1, type: 'component', navigateTo: '/thesis', liveValueKey: 'comp_ge' },
  { id: 'gi', label: 'Intelligence Growth', symbol: 'GI', sublabel: 'Problems + selection bonus', column: 1, type: 'component', navigateTo: '/thesis/intelligence', liveValueKey: 'comp_gi' },
  { id: 'gvc', label: 'Value Creation', symbol: 'GVC', sublabel: 'Ship + focus + recency + speed', column: 1, type: 'component', navigateTo: '/thesis/output', liveValueKey: 'comp_gvc' },
  { id: 'kappa', label: 'Capture Ratio', symbol: 'K', sublabel: 'Asks + revenue + feedback', column: 1, type: 'component', navigateTo: '/thesis/output', liveValueKey: 'comp_kappa' },
  { id: 'gd', label: 'Discovery', symbol: 'GD', sublabel: 'Conversations + signals + insights', column: 1, type: 'component', navigateTo: '/thesis/intelligence', liveValueKey: 'comp_gd' },
  { id: 'optionality', label: 'Optionality', symbol: 'O', sublabel: '1 - HHI + backup bonus', column: 1, type: 'component', navigateTo: '/thesis/coherence', liveValueKey: 'comp_optionality' },
  { id: 'sigma', label: 'Skill Building', symbol: 'Sigma', sublabel: 'Practice + technique + automation', column: 1, type: 'component', navigateTo: '/thesis/coherence', liveValueKey: 'comp_sigma' },
  { id: 'fragmentation', label: 'Fragmentation Tax', symbol: 'F', sublabel: 'KL divergence penalty', column: 1, type: 'component', navigateTo: '/thesis/coherence', liveValueKey: 'comp_fragmentation' },
  { id: 'gate', label: 'NS Gate', symbol: 'g(v)', sublabel: '1.0 / 0.7 / 0.3', column: 1, type: 'component', navigateTo: '/thesis', liveValueKey: 'comp_gate' },

  // Column 2 — Aggregation
  { id: 'geoMean', label: 'Geometric Mean', sublabel: '(GE*GI*GVC*K*O*GD*GN*J*Σ) ^ 1/9', column: 2, type: 'operator' },
  { id: 'finalCalc', label: 'Final Computation', sublabel: 'gate * geoMean - F*0.3', column: 2, type: 'operator' },

  // Column 3 — Output
  { id: 'score', label: 'Reward Score', symbol: 'g*', sublabel: 'Range: 0 - 10', column: 3, type: 'output', liveValueKey: 'score' },
]

const REWARD_CONNECTIONS: ConnectionDef[] = [
  { from: 'sleep', to: 'ge' }, { from: 'training', to: 'ge' }, { from: 'bodyFelt', to: 'ge' }, { from: 'nsState', to: 'ge' },
  { from: 'problems', to: 'gi' }, { from: 'problemSelected', to: 'gi' },
  { from: 'focusHours', to: 'gvc' }, { from: 'shipping', to: 'gvc' }, { from: 'speed', to: 'gvc' },
  { from: 'revenueAsks', to: 'kappa' }, { from: 'revenueSignal', to: 'kappa' }, { from: 'feedbackLoop', to: 'kappa' },
  { from: 'conversations', to: 'gd' }, { from: 'extSignals', to: 'gd' }, { from: 'insights', to: 'gd' },
  { from: 'practice', to: 'sigma' }, { from: 'technique', to: 'sigma' }, { from: 'automation', to: 'sigma' },
  { from: 'projectAlloc', to: 'optionality' }, { from: 'projectAlloc', to: 'fragmentation' },
  { from: 'nsState', to: 'gate' },
  { from: 'ge', to: 'geoMean' }, { from: 'gi', to: 'geoMean' }, { from: 'gvc', to: 'geoMean' },
  { from: 'kappa', to: 'geoMean' }, { from: 'gd', to: 'geoMean' }, { from: 'optionality', to: 'geoMean' },
  { from: 'sigma', to: 'geoMean' },
  { from: 'geoMean', to: 'finalCalc' }, { from: 'gate', to: 'finalCalc' },
  { from: 'fragmentation', to: 'finalCalc' },
  { from: 'finalCalc', to: 'score' },
]

// ─── SYSTEM ARCHITECTURE NODES ──────────────────────────────────────────

const SYSTEM_NODES: NodeDef[] = [
  { id: 'garminApi', label: 'Garmin Connect', sublabel: 'Health metrics sync', column: 0, type: 'api' },
  { id: 'calendarApi', label: 'Google Calendar', sublabel: 'Focus session import', column: 0, type: 'api' },
  { id: 'geminiApi', label: 'Gemini AI', sublabel: 'Insight extraction', column: 0, type: 'api' },
  { id: 'rssApi', label: 'RSS Feeds', sublabel: 'Signal aggregation', column: 0, type: 'api' },

  { id: 'dailyLogs', label: 'daily_logs', sublabel: 'Core daily entries', column: 1, type: 'data' },
  { id: 'projects', label: 'projects', sublabel: 'Portfolio & allocation', column: 1, type: 'data' },
  { id: 'signals', label: 'signals', sublabel: 'Problems & opportunities', column: 1, type: 'data' },
  { id: 'conversations', label: 'conversations', sublabel: 'Discovery transcripts', column: 1, type: 'data' },
  { id: 'externalSignals', label: 'external_signals', sublabel: 'RSS & web signals', column: 1, type: 'data' },
  { id: 'garminMetrics', label: 'garmin_metrics', sublabel: 'Sleep, HRV, stress', column: 1, type: 'data' },
  { id: 'focusSessions', label: 'focus_sessions', sublabel: 'Time tracking', column: 1, type: 'data' },
  { id: 'weeklyReview', label: 'weekly_synthesis', sublabel: 'Weekly reviews', column: 1, type: 'data' },

  { id: 'useDailyLogData', label: 'useDailyLogData', sublabel: 'Fetches today + Garmin', column: 2, type: 'state' },
  { id: 'useDailyLogActions', label: 'useDailyLogActions', sublabel: 'Save + recompute', column: 2, type: 'state' },
  { id: 'useRecentData', label: 'useRecentData', sublabel: '7-day history + projects', column: 2, type: 'state' },
  { id: 'computeRewardHook', label: 'computeReward', sublabel: 'Reward function engine', column: 2, type: 'state' },

  { id: 'energyGauge', label: 'Energy Tab', symbol: 'GE', sublabel: 'Gauge + Dial', column: 3, type: 'ui', navigateTo: '/thesis' },
  { id: 'outputGauge', label: 'Output Tab', symbol: 'GVC+K', sublabel: 'Gauge + Dial', column: 3, type: 'ui', navigateTo: '/thesis/output' },
  { id: 'intelligenceGauge', label: 'Intelligence Tab', symbol: 'GI', sublabel: 'Gauge + Dial + Inboxes', column: 3, type: 'ui', navigateTo: '/thesis/intelligence' },
  { id: 'coherenceGauge', label: 'Coherence Tab', symbol: 'Σ', sublabel: 'Gauge + Dial', column: 3, type: 'ui', navigateTo: '/thesis/coherence' },
  { id: 'thesisNav', label: 'ThesisNav', symbol: 'g*', sublabel: 'Live score readout', column: 3, type: 'ui' },
]

const SYSTEM_CONNECTIONS: ConnectionDef[] = [
  { from: 'garminApi', to: 'garminMetrics' },
  { from: 'calendarApi', to: 'focusSessions' },
  { from: 'geminiApi', to: 'conversations' },
  { from: 'rssApi', to: 'externalSignals' },
  { from: 'dailyLogs', to: 'useDailyLogData' },
  { from: 'projects', to: 'useRecentData' },
  { from: 'garminMetrics', to: 'useDailyLogData' },
  { from: 'conversations', to: 'useDailyLogData' },
  { from: 'externalSignals', to: 'useDailyLogData' },
  { from: 'signals', to: 'useRecentData' },
  { from: 'focusSessions', to: 'useDailyLogActions' },
  { from: 'weeklyReview', to: 'useRecentData' },
  { from: 'useDailyLogData', to: 'computeRewardHook' },
  { from: 'useRecentData', to: 'computeRewardHook' },
  { from: 'useDailyLogData', to: 'energyGauge' },
  { from: 'useDailyLogActions', to: 'outputGauge' },
  { from: 'useDailyLogData', to: 'intelligenceGauge' },
  { from: 'computeRewardHook', to: 'coherenceGauge' },
  { from: 'computeRewardHook', to: 'thesisNav' },
]

// ─── SWIM LANE CONFIG ───────────────────────────────────────────────────

const REWARD_LANES = [
  { title: 'Daily Inputs', subtitle: 'What you log each day', bg: 'bg-cream/40', border: 'border-rule-light' },
  { title: 'Component Scores', subtitle: 'Computed 0-1 metrics', bg: 'bg-green-bg', border: 'border-green-ink/10' },
  { title: 'Aggregation', subtitle: 'Mathematical combination', bg: 'bg-amber-bg', border: 'border-amber-ink/10' },
  { title: 'Output', subtitle: 'Final score', bg: 'bg-burgundy-bg', border: 'border-burgundy/10' },
]

const SYSTEM_LANES = [
  { title: 'External APIs', subtitle: 'Third-party integrations', bg: 'bg-cream/40', border: 'border-rule-light' },
  { title: 'Firestore', subtitle: 'Database collections', bg: 'bg-amber-bg', border: 'border-amber-ink/10' },
  { title: 'State Layer', subtitle: 'React hooks', bg: 'bg-green-bg', border: 'border-green-ink/10' },
  { title: 'UI Components', subtitle: 'What the user sees', bg: 'bg-burgundy-bg', border: 'border-burgundy/10' },
]

// ─── INPUT GROUP CONFIG ─────────────────────────────────────────────────

const INPUT_GROUP_LABELS: Record<string, { label: string; color: string }> = {
  ge: { label: 'Energy', color: 'text-green-ink' },
  gi: { label: 'Intelligence', color: 'text-ink' },
  gvc: { label: 'Value Creation', color: 'text-ink' },
  kappa: { label: 'Capture', color: 'text-ink' },
  gd: { label: 'Discovery', color: 'text-ink' },
  sigma: { label: 'Skill Building', color: 'text-ink' },
  optionality: { label: 'Portfolio', color: 'text-ink' },
}

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

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Compute positions for SVG arrows
  const computePositions = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const cr = container.getBoundingClientRect()
    const pos: Record<string, DOMRect> = {}
    nodeRefs.current.forEach((el, id) => {
      if (el) {
        const r = el.getBoundingClientRect()
        pos[id] = new DOMRect(r.left - cr.left, r.top - cr.top, r.width, r.height)
      }
    })
    setNodePositions(pos)
  }, [])

  useEffect(() => {
    // Delay to let layout settle after view switch
    const t1 = setTimeout(() => requestAnimationFrame(computePositions), 50)
    const container = containerRef.current
    if (!container) return () => clearTimeout(t1)
    const observer = new ResizeObserver(() => requestAnimationFrame(computePositions))
    observer.observe(container)
    return () => { clearTimeout(t1); observer.disconnect() }
  }, [computePositions, view])

  // Live value lookup
  const getLiveValue = useCallback((key?: string): number | null => {
    if (!key) return null
    if (key.startsWith('comp_')) {
      const compKey = key.replace('comp_', '') as keyof NonNullable<typeof components>
      return components?.[compKey] ?? null
    }
    if (key === 'score') return reward?.score ?? null
    const logVal = (log as Record<string, unknown>)[key]
    return typeof logVal === 'number' ? logVal : null
  }, [components, reward, log])

  // Highlight logic
  const handleNodeClick = useCallback((nodeId: string, navigateTo?: string) => {
    if (activeNodeId === nodeId) {
      if (navigateTo) { router.push(navigateTo); onClose(); return }
      setActiveNodeId(null)
      setHighlightedNodes(new Set())
      return
    }
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

  const nodes = view === 'reward' ? REWARD_NODES : SYSTEM_NODES
  const connections = view === 'reward' ? REWARD_CONNECTIONS : SYSTEM_CONNECTIONS
  const lanes = view === 'reward' ? REWARD_LANES : SYSTEM_LANES

  const columns = useMemo(() => {
    const cols: NodeDef[][] = [[], [], [], []]
    for (const n of nodes) cols[n.column].push(n)
    return cols
  }, [nodes])

  const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el)
    else nodeRefs.current.delete(id)
  }, [])

  const hasHighlight = highlightedNodes.size > 0

  const valColor = (val: number | null, isScore = false) => {
    if (val === null) return 'text-ink-muted'
    if (isScore) return val >= 7 ? 'text-green-ink' : val >= 4 ? 'text-amber-ink' : 'text-red-ink'
    return val >= 0.7 ? 'text-green-ink' : val >= 0.4 ? 'text-amber-ink' : 'text-red-ink'
  }

  const valBg = (val: number | null) => {
    if (val === null) return 'bg-cream/40'
    if (val >= 0.7) return 'bg-green-bg'
    if (val >= 0.4) return 'bg-amber-bg'
    return 'bg-burgundy-bg'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-3 px-3">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-[3px]" onClick={onClose} />

      <div className="relative bg-paper border border-rule rounded-sm w-full max-w-[1200px] max-h-[92vh] overflow-y-auto shadow-lg z-50">
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b-2 border-ink px-6 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="font-serif text-[16px] font-bold text-ink tracking-tight">
              {view === 'reward' ? 'Reward Function Flow' : 'System Architecture'}
            </h2>
            <p className="font-sans text-[10px] text-ink-muted mt-0.5">
              Click node to trace path &middot; click again to navigate
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-0.5 border border-rule rounded-sm p-0.5">
              {(['reward', 'system'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => { setView(v); clearHighlight(); nodeRefs.current.clear() }}
                  className={`font-serif text-[10px] px-3 py-1 rounded-sm transition-colors ${
                    view === v
                      ? 'bg-burgundy text-paper'
                      : 'bg-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {v === 'reward' ? 'Reward Flow' : 'System'}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Diagram canvas */}
        <div className="px-5 py-4 overflow-x-auto">
          <div ref={containerRef} className="relative min-w-[800px]">
            {/* SVG arrow layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#9a928a" />
                </marker>
                <marker id="arrow-active" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#7c2d2d" />
                </marker>
              </defs>
              {connections.map((conn, i) => {
                const fp = nodePositions[conn.from]
                const tp = nodePositions[conn.to]
                if (!fp || !tp) return null

                const x1 = fp.x + fp.width + 2
                const y1 = fp.y + fp.height / 2
                const x2 = tp.x - 2
                const y2 = tp.y + tp.height / 2
                const dx = x2 - x1
                const cp = dx * 0.35

                const isActive = hasHighlight && highlightedNodes.has(conn.from) && highlightedNodes.has(conn.to)
                const isDimmed = hasHighlight && !isActive

                return (
                  <path
                    key={`${conn.from}-${conn.to}-${i}`}
                    d={`M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={isActive ? '#7c2d2d' : '#c8c0b8'}
                    strokeWidth={isActive ? 2.5 : 1}
                    opacity={isDimmed ? 0.08 : isActive ? 1 : 0.5}
                    markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                    className="transition-all duration-300"
                  />
                )
              })}
            </svg>

            {/* Swim lane columns */}
            <div className="flex gap-2" style={{ zIndex: 10, position: 'relative' }}>
              {columns.map((col, colIdx) => {
                const lane = lanes[colIdx]
                const isInputCol = view === 'reward' && colIdx === 0
                const isOutputCol = view === 'reward' && colIdx === 3
                const widths = view === 'reward'
                  ? ['26%', '24%', '28%', '14%']
                  : ['22%', '26%', '24%', '22%']

                return (
                  <div key={colIdx} className={`${lane.bg} border ${lane.border} rounded-sm flex-shrink-0`} style={{ width: widths[colIdx] }}>
                    {/* Lane header */}
                    <div className="px-3 py-2 border-b border-rule-light/60">
                      <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                        {lane.title}
                      </h3>
                      <p className="font-sans text-[9px] text-ink-muted">{lane.subtitle}</p>
                    </div>

                    {/* Lane body */}
                    <div className={`px-2 py-2 ${isOutputCol ? 'flex items-center justify-center' : ''}`}>
                      {isInputCol ? (
                        // Grouped inputs with section dividers
                        <div className="space-y-1.5">
                          {Object.entries(
                            col.reduce<Record<string, NodeDef[]>>((acc, n) => {
                              const g = n.group || 'other'
                              if (!acc[g]) acc[g] = []
                              acc[g].push(n)
                              return acc
                            }, {})
                          ).map(([groupId, groupNodes]) => {
                            const cfg = INPUT_GROUP_LABELS[groupId] || { label: groupId, color: 'text-ink' }
                            return (
                              <div key={groupId}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`font-serif text-[8px] font-semibold uppercase tracking-[0.5px] ${cfg.color}`}>
                                    {cfg.label}
                                  </span>
                                  <span className="flex-1 h-px bg-rule-light" />
                                </div>
                                <div className="space-y-0.5">
                                  {groupNodes.map(node => (
                                    <BANode
                                      key={node.id}
                                      node={node}
                                      ref={setNodeRef(node.id)}
                                      liveValue={getLiveValue(node.liveValueKey)}
                                      isHighlighted={hasHighlight && highlightedNodes.has(node.id)}
                                      isDimmed={hasHighlight && !highlightedNodes.has(node.id)}
                                      isActive={activeNodeId === node.id}
                                      valColor={valColor}
                                      valBg={valBg}
                                      onClick={() => handleNodeClick(node.id, node.navigateTo)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className={`space-y-1 ${isOutputCol ? 'w-full' : ''}`}>
                          {col.map(node => (
                            <BANode
                              key={node.id}
                              node={node}
                              ref={setNodeRef(node.id)}
                              liveValue={getLiveValue(node.liveValueKey)}
                              isHighlighted={hasHighlight && highlightedNodes.has(node.id)}
                              isDimmed={hasHighlight && !highlightedNodes.has(node.id)}
                              isActive={activeNodeId === node.id}
                              valColor={valColor}
                              valBg={valBg}
                              onClick={() => handleNodeClick(node.id, node.navigateTo)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* spacer */}
            <div className="h-2" />
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 pb-3">
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-rule-light">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-green-ink" />
              <span className="font-sans text-[9px] text-ink-muted">&ge;0.7</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-amber-ink" />
              <span className="font-sans text-[9px] text-ink-muted">&ge;0.4</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-red-ink" />
              <span className="font-sans text-[9px] text-ink-muted">&lt;0.4</span>
            </span>
            <span className="w-px h-3 bg-rule-light" />
            <span className="flex items-center gap-1.5">
              <svg className="w-5 h-1" viewBox="0 0 20 4"><line x1="0" y1="2" x2="16" y2="2" stroke="#c8c0b8" strokeWidth="1" /><polygon points="14 0, 20 2, 14 4" fill="#9a928a" /></svg>
              <span className="font-sans text-[9px] text-ink-muted">Flow</span>
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-5 h-1" viewBox="0 0 20 4"><line x1="0" y1="2" x2="16" y2="2" stroke="#7c2d2d" strokeWidth="2" /><polygon points="14 0, 20 2, 14 4" fill="#7c2d2d" /></svg>
              <span className="font-sans text-[9px] text-ink-muted">Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BA-STYLE NODE COMPONENT ────────────────────────────────────────────

interface BANodeProps {
  node: NodeDef
  liveValue: number | null
  isHighlighted: boolean
  isDimmed: boolean
  isActive: boolean
  valColor: (val: number | null, isScore?: boolean) => string
  valBg: (val: number | null) => string
  onClick: () => void
}

const BANode = forwardRef<HTMLDivElement, BANodeProps>(function BANode(
  { node, liveValue, isHighlighted, isDimmed, isActive, valColor, valBg, onClick },
  ref
) {
  const formatted = liveValue !== null
    ? (node.liveFormatter ? node.liveFormatter(liveValue) : liveValue.toFixed(2))
    : null

  // ─── Output node (centered score) ───
  if (node.type === 'output') {
    const color = valColor(liveValue, true)
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`bg-white border-2 rounded-sm px-3 py-4 cursor-pointer transition-all duration-200 text-center ${
          isActive ? 'border-burgundy shadow-md' : isHighlighted ? 'border-burgundy/60' : 'border-rule'
        } ${isDimmed ? 'opacity-15' : ''}`}
      >
        <p className="font-mono text-[9px] text-ink-muted mb-1 uppercase tracking-[1px]">{node.symbol}</p>
        <p className={`font-mono text-[28px] font-bold leading-none ${color}`}>
          {liveValue !== null ? liveValue.toFixed(1) : '—'}
        </p>
        <p className="font-serif text-[9px] text-ink-muted mt-1.5">{node.sublabel || node.label}</p>
      </div>
    )
  }

  // ─── Operator node (formula box) ───
  if (node.type === 'operator') {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`bg-white border border-dashed rounded-sm px-3 py-1.5 cursor-pointer transition-all duration-200 ${
          isActive ? 'border-burgundy shadow-sm' : isHighlighted ? 'border-burgundy/60' : 'border-rule'
        } ${isDimmed ? 'opacity-15' : ''}`}
      >
        <p className="font-serif text-[9px] font-semibold text-ink">{node.label}</p>
        {node.sublabel && (
          <p className="font-mono text-[8px] text-ink-muted leading-snug">{node.sublabel}</p>
        )}
      </div>
    )
  }

  // ─── Component node (scored metric with value badge) ───
  if (node.type === 'component') {
    const color = valColor(liveValue)
    const bg = valBg(liveValue)
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`bg-white border rounded-sm px-2 py-1.5 cursor-pointer transition-all duration-200 flex items-center gap-2 ${
          isActive ? 'border-burgundy shadow-sm border-2' : isHighlighted ? 'border-burgundy/60' : 'border-rule'
        } ${isDimmed ? 'opacity-15' : ''}`}
      >
        {/* Score badge */}
        <div className={`${bg} border border-rule-light rounded-sm px-1.5 py-0.5 min-w-[36px] text-center shrink-0`}>
          <p className={`font-mono text-[11px] font-bold ${color}`}>
            {formatted ?? '—'}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {node.symbol && (
              <span className={`font-mono text-[9px] font-bold ${isHighlighted || isActive ? 'text-burgundy' : 'text-ink'}`}>
                {node.symbol}
              </span>
            )}
            <span className="font-serif text-[9px] font-medium text-ink truncate">{node.label}</span>
          </div>
        </div>
        {node.navigateTo && (
          <svg className="w-2.5 h-2.5 text-ink-faint shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    )
  }

  // ─── Standard node (input, api, data, state, ui) ───
  const typeAccents: Record<string, { icon: string; border: string }> = {
    input: { icon: 'text-ink-muted', border: 'border-rule' },
    api: { icon: 'text-amber-ink', border: 'border-amber-ink/20' },
    data: { icon: 'text-amber-ink', border: 'border-amber-ink/20' },
    state: { icon: 'text-green-ink', border: 'border-green-ink/20' },
    ui: { icon: 'text-burgundy', border: 'border-burgundy/20' },
  }
  const accent = typeAccents[node.type] || typeAccents.input

  // Show sublabel only for non-input types (api, data, state, ui)
  const showSub = node.type !== 'input'

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`bg-white border rounded-sm px-2 py-1 cursor-pointer transition-all duration-200 ${
        isActive ? 'border-burgundy shadow-sm border-2' : isHighlighted ? `${accent.border} border-burgundy/40` : accent.border
      } ${isDimmed ? 'opacity-15' : ''}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            {node.symbol && (
              <span className={`font-mono text-[9px] font-bold ${isHighlighted || isActive ? 'text-burgundy' : accent.icon}`}>
                {node.symbol}
              </span>
            )}
            <span className="font-serif text-[9px] font-medium text-ink truncate">{node.label}</span>
          </div>
          {showSub && node.sublabel && (
            <p className="font-sans text-[8px] text-ink-muted">{node.sublabel}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {formatted !== null && (
            <span className={`font-mono text-[9px] font-semibold ${valColor(liveValue)}`}>
              {formatted}
            </span>
          )}
          {node.navigateTo && (
            <svg className="w-2.5 h-2.5 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
})
