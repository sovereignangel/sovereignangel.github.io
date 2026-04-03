'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  type RoadmapDomain,
  type RoadmapQuarter,
  type RoadmapItemStatus,
  type RoadmapItem,
  type TextbookEntry,
  INITIAL_ITEMS,
  INITIAL_TEXTBOOKS,
  getCurrentQuarter,
  getCurrentWeekInQuarter,
} from '@/lib/roadmap-data'

// ─── Constants ──────────────────────────────────────────────────────────

const DOMAINS: { key: RoadmapDomain; label: string; bgColor: string; borderColor: string }[] = [
  { key: 'complexity', label: 'Complexity', bgColor: 'bg-burgundy-bg', borderColor: 'border-burgundy/20' },
  { key: 'ai', label: 'AI', bgColor: 'bg-green-bg', borderColor: 'border-green-ink/20' },
  { key: 'quant', label: 'Quant', bgColor: 'bg-amber-bg', borderColor: 'border-amber-ink/20' },
  { key: 'markets', label: 'Markets', bgColor: 'bg-cream', borderColor: 'border-rule' },
  { key: 'neuro', label: 'Neuro', bgColor: 'bg-cream', borderColor: 'border-rule' },
]

const STATUS_ICON: Record<RoadmapItemStatus, string> = {
  not_started: '\u25CB',
  in_progress: '\u25D0',
  complete: '\u2713',
}

const STATUS_COLOR: Record<RoadmapItemStatus, string> = {
  not_started: 'text-ink-faint',
  in_progress: 'text-amber-ink',
  complete: 'text-green-ink',
}

const TYPE_BADGE: Record<string, string> = {
  course: 'text-green-ink bg-green-bg border-green-ink/20',
  book: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  project: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  milestone: 'text-ink bg-cream border-rule',
  paper: 'text-ink-muted bg-cream border-rule',
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekKey(): string {
  const d = new Date()
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

// ─── Types ──────────────────────────────────────────────────────────────

interface DailyFocusItem {
  id: string
  text: string
  domain: RoadmapDomain
  roadmapItemId?: string
  done: boolean
}

interface WeeklyGoal {
  id: string
  text: string
  domain: RoadmapDomain
  roadmapItemId?: string
  done: boolean
}

// ─── Component ──────────────────────────────────────────────────────────

export default function RoadmapFocus() {
  const { user } = useAuth()
  const currentQ = getCurrentQuarter()
  const currentWeek = getCurrentWeekInQuarter()
  const today = getToday()
  const weekKey = getWeekKey()

  // Load roadmap items from localStorage (shared with RoadmapView)
  const [items, setItems] = useState<RoadmapItem[]>(INITIAL_ITEMS)
  const [textbooks] = useState<TextbookEntry[]>(INITIAL_TEXTBOOKS)

  const storageKeyItems = user?.uid ? `roadmap-items-${user.uid}` : null

  useEffect(() => {
    if (!storageKeyItems) return
    const saved = localStorage.getItem(storageKeyItems)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { id: string; status: RoadmapItemStatus }[]
        setItems(INITIAL_ITEMS.map(item => {
          const s = parsed.find(p => p.id === item.id)
          return s ? { ...item, status: s.status } : item
        }))
      } catch { /* ignore */ }
    }
  }, [storageKeyItems])

  const cycleStatus = (id: string) => {
    const order: RoadmapItemStatus[] = ['not_started', 'in_progress', 'complete']
    const updated = items.map(item => {
      if (item.id !== id) return item
      return { ...item, status: order[(order.indexOf(item.status) + 1) % order.length] }
    })
    setItems(updated)
    if (storageKeyItems) {
      localStorage.setItem(storageKeyItems, JSON.stringify(updated.map(i => ({ id: i.id, status: i.status }))))
    }
  }

  // Active items for this week
  const activeThisWeek = items.filter(i =>
    i.quarter === currentQ &&
    i.status !== 'complete' &&
    (i.weekStart || 1) <= currentWeek &&
    (i.weekEnd || 13) >= currentWeek
  )

  // Active textbooks
  const activeBooks = textbooks.filter(t => t.quarter === currentQ && t.status !== 'complete')

  // Lagging
  const lagging = items.filter(i => {
    if (i.status === 'complete') return false
    if (i.quarter < currentQ) return true
    if (i.quarter === currentQ && i.weekEnd && i.weekEnd < currentWeek && i.status === 'not_started') return true
    return false
  })

  // Daily focus state
  const dailyKey = user?.uid ? `roadmap-focus-${user.uid}-daily-${today}` : null
  const weeklyKey = user?.uid ? `roadmap-focus-${user.uid}-weekly-${weekKey}` : null

  const [dailyItems, setDailyItems] = useState<DailyFocusItem[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])
  const [newDaily, setNewDaily] = useState('')
  const [newDailyDomain, setNewDailyDomain] = useState<RoadmapDomain>('ai')
  const [newWeekly, setNewWeekly] = useState('')
  const [newWeeklyDomain, setNewWeeklyDomain] = useState<RoadmapDomain>('ai')

  useEffect(() => {
    if (!dailyKey) return
    const saved = localStorage.getItem(dailyKey)
    if (saved) { try { setDailyItems(JSON.parse(saved)) } catch { /* */ } }
  }, [dailyKey])

  useEffect(() => {
    if (!weeklyKey) return
    const saved = localStorage.getItem(weeklyKey)
    if (saved) { try { setWeeklyGoals(JSON.parse(saved)) } catch { /* */ } }
  }, [weeklyKey])

  const persistDaily = useCallback((updated: DailyFocusItem[]) => {
    setDailyItems(updated)
    if (dailyKey) localStorage.setItem(dailyKey, JSON.stringify(updated))
  }, [dailyKey])

  const persistWeekly = useCallback((updated: WeeklyGoal[]) => {
    setWeeklyGoals(updated)
    if (weeklyKey) localStorage.setItem(weeklyKey, JSON.stringify(updated))
  }, [weeklyKey])

  const addDaily = () => {
    if (!newDaily.trim()) return
    persistDaily([...dailyItems, { id: `d-${Date.now()}`, text: newDaily.trim(), domain: newDailyDomain, done: false }])
    setNewDaily('')
  }

  const addWeekly = () => {
    if (!newWeekly.trim()) return
    persistWeekly([...weeklyGoals, { id: `w-${Date.now()}`, text: newWeekly.trim(), domain: newWeeklyDomain, done: false }])
    setNewWeekly('')
  }

  const toggleDaily = (id: string) => persistDaily(dailyItems.map(d => d.id === id ? { ...d, done: !d.done } : d))
  const removeDaily = (id: string) => persistDaily(dailyItems.filter(d => d.id !== id))
  const toggleWeekly = (id: string) => persistWeekly(weeklyGoals.map(w => w.id === id ? { ...w, done: !w.done } : w))
  const removeWeekly = (id: string) => persistWeekly(weeklyGoals.filter(w => w.id !== id))

  const addFromRoadmap = (item: RoadmapItem, target: 'daily' | 'weekly') => {
    if (target === 'daily') {
      persistDaily([...dailyItems, { id: `d-${Date.now()}`, text: item.title, domain: item.domain, roadmapItemId: item.id, done: false }])
    } else {
      persistWeekly([...weeklyGoals, { id: `w-${Date.now()}`, text: item.title, domain: item.domain, roadmapItemId: item.id, done: false }])
    }
  }

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <div className="space-y-3">
      {/* Today's Focus */}
      <div className="bg-white border border-burgundy/20 rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Today &middot; {dayOfWeek}
          </h4>
          <span className="font-mono text-[9px] text-ink-muted">2&ndash;4 hrs deep work</span>
        </div>

        {dailyItems.length === 0 && (
          <p className="font-sans text-[10px] text-ink-muted mb-2">
            What should you learn today? Add from roadmap items below or type your own.
          </p>
        )}

        <div className="space-y-0.5 mb-2">
          {dailyItems.map(d => {
            const domainMeta = DOMAINS.find(dm => dm.key === d.domain)
            return (
              <div key={d.id} className="flex items-center gap-1.5 py-0.5 group">
                <button onClick={() => toggleDaily(d.id)} className={`font-mono text-[10px] shrink-0 ${d.done ? 'text-green-ink' : 'text-ink-faint'}`}>
                  {d.done ? '\u2713' : '\u25CB'}
                </button>
                <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainMeta?.bgColor} ${domainMeta?.borderColor}`}>
                  {d.domain.slice(0, 4)}
                </span>
                <span className={`font-sans text-[10px] flex-1 ${d.done ? 'text-ink-muted line-through' : 'text-ink'}`}>{d.text}</span>
                <button onClick={() => removeDaily(d.id)} className="font-mono text-[9px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity shrink-0">&times;</button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-1">
          <select value={newDailyDomain} onChange={e => setNewDailyDomain(e.target.value as RoadmapDomain)} className="font-mono text-[9px] px-1 py-0.5 rounded-sm border border-rule bg-cream text-ink">
            {DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <input type="text" value={newDaily} onChange={e => setNewDaily(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDaily()} placeholder="What to learn today..." className="flex-1 font-sans text-[10px] px-1.5 py-0.5 rounded-sm border border-rule bg-white text-ink placeholder:text-ink-faint" />
          <button onClick={addDaily} className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy">Add</button>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">This Week</h4>
          <span className="font-mono text-[9px] text-ink-muted">{currentQ} &middot; W{currentWeek}</span>
        </div>

        {weeklyGoals.length === 0 && (
          <p className="font-sans text-[10px] text-ink-muted mb-2">Set high-level goals for the week.</p>
        )}

        <div className="space-y-0.5 mb-2">
          {weeklyGoals.map(w => {
            const domainMeta = DOMAINS.find(dm => dm.key === w.domain)
            return (
              <div key={w.id} className="flex items-center gap-1.5 py-0.5 group">
                <button onClick={() => toggleWeekly(w.id)} className={`font-mono text-[10px] shrink-0 ${w.done ? 'text-green-ink' : 'text-ink-faint'}`}>
                  {w.done ? '\u2713' : '\u25CB'}
                </button>
                <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainMeta?.bgColor} ${domainMeta?.borderColor}`}>
                  {w.domain.slice(0, 4)}
                </span>
                <span className={`font-sans text-[10px] flex-1 ${w.done ? 'text-ink-muted line-through' : 'text-ink'}`}>{w.text}</span>
                <button onClick={() => removeWeekly(w.id)} className="font-mono text-[9px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity shrink-0">&times;</button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-1">
          <select value={newWeeklyDomain} onChange={e => setNewWeeklyDomain(e.target.value as RoadmapDomain)} className="font-mono text-[9px] px-1 py-0.5 rounded-sm border border-rule bg-cream text-ink">
            {DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <input type="text" value={newWeekly} onChange={e => setNewWeekly(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWeekly()} placeholder="Goal for the week..." className="flex-1 font-sans text-[10px] px-1.5 py-0.5 rounded-sm border border-rule bg-white text-ink placeholder:text-ink-faint" />
          <button onClick={addWeekly} className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy">Add</button>
        </div>
      </div>

      {/* Active Roadmap Items */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1.5 border-b-2 border-rule">
          Active This Week &middot; {currentQ} W{currentWeek}
        </h4>
        <div className="space-y-0.5">
          {activeThisWeek.map(item => {
            const domainMeta = DOMAINS.find(d => d.key === item.domain)
            return (
              <div key={item.id} className="flex items-center gap-1.5 py-0.5">
                <button onClick={() => cycleStatus(item.id)} className={`font-mono text-[10px] shrink-0 ${STATUS_COLOR[item.status]}`}>
                  {STATUS_ICON[item.status]}
                </button>
                <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainMeta?.bgColor} ${domainMeta?.borderColor}`}>
                  {item.domain.slice(0, 4)}
                </span>
                <span className="font-sans text-[10px] text-ink flex-1">{item.title}</span>
                <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${TYPE_BADGE[item.type]}`}>{item.type}</span>
                <button onClick={() => addFromRoadmap(item, 'daily')} className="font-mono text-[8px] px-1 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-burgundy hover:border-burgundy/30 transition-colors shrink-0">+D</button>
                <button onClick={() => addFromRoadmap(item, 'weekly')} className="font-mono text-[8px] px-1 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-burgundy hover:border-burgundy/30 transition-colors shrink-0">+W</button>
              </div>
            )
          })}
          {activeThisWeek.length === 0 && <p className="font-sans text-[10px] text-ink-muted">No active items this week.</p>}
        </div>
      </div>

      {/* Active textbooks */}
      {activeBooks.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">Reading This Quarter</h4>
          <div className="space-y-0.5">
            {activeBooks.map(tb => {
              const domainMeta = DOMAINS.find(d => d.key === tb.domain)
              const pct = Math.round((tb.chaptersRead / tb.chaptersTotal) * 100)
              return (
                <div key={tb.id} className="flex items-center gap-1.5 py-0.5">
                  <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainMeta?.bgColor} ${domainMeta?.borderColor}`}>{tb.domain.slice(0, 4)}</span>
                  <span className="font-sans text-[10px] text-ink flex-1">{tb.title}</span>
                  <div className="w-[40px] h-1 bg-cream rounded-sm overflow-hidden shrink-0">
                    <div className={`h-full rounded-sm ${pct > 0 ? 'bg-amber-ink' : 'bg-rule'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-mono text-[9px] text-ink-muted shrink-0">{tb.chaptersRead}/{tb.chaptersTotal}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lagging */}
      {lagging.length > 0 && (
        <div className="bg-amber-bg border border-amber-ink/20 rounded-sm p-2">
          <span className="font-mono text-[10px] font-semibold text-amber-ink">{lagging.length} item{lagging.length > 1 ? 's' : ''} behind schedule</span>
          <div className="space-y-0.5 mt-1">
            {lagging.slice(0, 3).map(item => {
              const domainMeta = DOMAINS.find(d => d.key === item.domain)
              return (
                <div key={item.id} className="flex items-center gap-1.5">
                  <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${domainMeta?.bgColor} ${domainMeta?.borderColor}`}>{item.domain.slice(0, 4)}</span>
                  <span className="font-sans text-[10px] text-ink">{item.title}</span>
                  <button onClick={() => addFromRoadmap(item, 'weekly')} className="font-mono text-[8px] px-1 py-0.5 rounded-sm border border-amber-ink/20 text-amber-ink hover:bg-amber-bg transition-colors shrink-0 ml-auto">+W</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
