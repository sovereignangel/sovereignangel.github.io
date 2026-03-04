'use client'

import { useState, useEffect } from 'react'
import type { SprintItem, SprintItemType, SprintItemStatus } from '@/lib/alamo-bernal/types'
import {
  getSprintItems,
  saveSprintItem,
  updateSprintItem,
  deleteSprintItem,
} from '@/lib/alamo-bernal/firestore'
import { SPRINT_ITEMS } from '@/lib/alamo-bernal/seed-data'

const TYPE_BADGE: Record<SprintItemType, { label: string; color: string }> = {
  feature: { label: 'Feature', color: 'text-green-ink bg-green-bg border-green-ink/20' },
  bug: { label: 'Bug', color: 'text-red-ink bg-forest-bg border-red-ink/20' },
  task: { label: 'Task', color: 'text-ink-muted bg-forest-surface border-rule' },
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-ink',
  medium: 'bg-amber-ink',
  low: 'bg-ink-faint',
}

const STATUS_OPTIONS: { key: SprintItemStatus; label: string; color: string }[] = [
  { key: 'sprint', label: 'To Do', color: 'text-ink-muted bg-forest-cream border-rule' },
  { key: 'review', label: 'For Review', color: 'text-forest bg-forest-bg border-forest/20' },
  { key: 'done', label: 'Completed', color: 'text-green-ink bg-green-bg border-green-ink/20' },
]

export default function SprintSection() {
  const [items, setItems] = useState<SprintItem[]>(SPRINT_ITEMS)
  const [planning, setPlanning] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [backlogOpen, setBacklogOpen] = useState(false)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState<SprintItemType>('feature')
  const [newOwner, setNewOwner] = useState<'lori' | 'sean' | 'both'>('lori')
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium')

  useEffect(() => {
    getSprintItems().then((data) => {
      if (data.length > 0) setItems(data)
    }).catch(() => {})
  }, [])

  // Items in the current sprint (to do, review — NOT done/backlog)
  const sprintItems = items
    .filter((i) => i.status === 'sprint' || i.status === 'review')
    .sort((a, b) => {
      // In-progress items float to top, then by status, then priority
      if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1
      const s = { review: 0, sprint: 1 }
      const statusDiff = (s[a.status as keyof typeof s] ?? 2) - (s[b.status as keyof typeof s] ?? 2)
      if (statusDiff !== 0) return statusDiff
      const p = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })

  const backlogItems = items
    .filter((i) => i.status === 'backlog')
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return p[a.priority] - p[b.priority]
    })

  const completedItems = items.filter((i) => i.status === 'done')

  async function handleStatusChange(id: string, status: SprintItemStatus) {
    // Clear inProgress flag when moving to done
    const updates: Partial<SprintItem> = { status }
    if (status === 'done') updates.inProgress = false
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
    try { await updateSprintItem(id, updates) } catch {}
  }

  async function toggleInProgress(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, inProgress: !i.inProgress } : i)))
    const item = items.find((i) => i.id === id)
    try { await updateSprintItem(id, { inProgress: !(item?.inProgress) }) } catch {}
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try { await deleteSprintItem(id) } catch {}
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    const item: SprintItem = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      type: newType,
      status: 'backlog',
      owner: newOwner,
      priority: newPriority,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setItems((prev) => [...prev, item])
    setNewTitle('')
    setNewDesc('')
    setShowAdd(false)
    try { await saveSprintItem(item) } catch {}
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCloseSprint() {
    // Move completed (done) items stay done, move remaining sprint items back to backlog
    const updates = sprintItems.map((item) => ({
      id: item.id,
      status: 'backlog' as SprintItemStatus,
    }))
    setItems((prev) =>
      prev.map((i) => {
        if (i.status === 'sprint' || i.status === 'review') {
          return { ...i, status: 'backlog' as SprintItemStatus, inProgress: false }
        }
        return i
      })
    )
    setPlanning(true)
    for (const u of updates) {
      try { await updateSprintItem(u.id, { status: u.status }) } catch {}
    }
  }

  async function handleStartSprint() {
    // Move selected backlog items into sprint
    setItems((prev) =>
      prev.map((i) =>
        selected.has(i.id) ? { ...i, status: 'sprint' as SprintItemStatus } : i
      )
    )
    for (const id of selected) {
      try { await updateSprintItem(id, { status: 'sprint' }) } catch {}
    }
    setSelected(new Set())
    setPlanning(false)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest">
            Tech Development
          </h2>
          <p className="text-[10px] text-ink-muted mt-0.5">
            Sprint 1 &middot; {sprintItems.length} items
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAdd(true)}
            className="font-mono text-[9px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
          >
            + Add Item
          </button>
          {!planning && (
            <button
              onClick={handleCloseSprint}
              className="font-mono text-[9px] font-medium px-2 py-1 rounded-sm bg-forest text-paper border border-forest hover:bg-forest/90 transition-colors"
            >
              Close &amp; Plan Next Sprint
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-forest-surface border border-rule rounded-sm p-3 space-y-2">
          <input
            autoFocus
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full text-[11px] text-ink bg-transparent border-b border-rule pb-1 outline-none placeholder:text-ink-faint"
          />
          <input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full text-[10px] text-ink-muted bg-transparent border-b border-rule-light pb-1 outline-none placeholder:text-ink-faint"
          />
          <div className="flex items-center gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SprintItemType)}
              className="text-[10px] text-ink-muted bg-forest-surface border border-rule rounded-sm px-1.5 py-0.5"
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
            </select>
            <select
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value as 'lori' | 'sean' | 'both')}
              className="text-[10px] text-ink-muted bg-forest-surface border border-rule rounded-sm px-1.5 py-0.5"
            >
              <option value="lori">Lori</option>
              <option value="sean">Sean</option>
              <option value="both">Both</option>
            </select>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="text-[10px] text-ink-muted bg-forest-surface border border-rule rounded-sm px-1.5 py-0.5"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex-1" />
            <button
              onClick={() => { setShowAdd(false); setNewTitle(''); setNewDesc('') }}
              className="text-[10px] text-ink-muted hover:text-ink px-2 py-0.5"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="text-[10px] font-medium text-paper bg-forest px-2 py-0.5 rounded-sm hover:bg-forest/90"
            >
              Add to Backlog
            </button>
          </div>
        </div>
      )}

      {/* ── Planning mode ── */}
      {planning && (
        <div className="bg-forest-surface border-2 border-forest rounded-sm p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest">
                Plan Next Sprint
              </span>
              <p className="text-[9px] text-ink-muted mt-0.5">
                Select items from the backlog to include in the next sprint.
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => { setPlanning(false); setSelected(new Set()) }}
                className="text-[9px] text-ink-muted hover:text-ink px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSprint}
                disabled={selected.size === 0}
                className={`font-mono text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                  selected.size > 0
                    ? 'bg-forest text-paper border-forest hover:bg-forest/90'
                    : 'bg-forest-cream text-ink-faint border-rule cursor-not-allowed'
                }`}
              >
                Start Sprint ({selected.size} selected)
              </button>
            </div>
          </div>
          <div className="border-t border-rule pt-1">
            {backlogItems.length === 0 && (
              <p className="text-[9px] text-ink-faint text-center py-3">Backlog is empty</p>
            )}
            {backlogItems.map((item, idx) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 px-2 py-1.5 cursor-pointer hover:bg-forest-cream/30 transition-colors ${
                  idx < backlogItems.length - 1 ? 'border-b border-rule-light' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="shrink-0 accent-forest"
                />
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[item.priority]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-ink">{item.title}</span>
                    <span className={`font-mono text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${TYPE_BADGE[item.type].color}`}>
                      {TYPE_BADGE[item.type].label}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[8px] text-ink-muted leading-snug mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                </div>
                <span className="font-mono text-[8px] text-ink-faint uppercase shrink-0">
                  {item.owner === 'both' ? 'Both' : item.owner}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Current Sprint ── */}
      {!planning && (
        <div className="bg-forest-surface border border-rule rounded-sm">
          <div className="px-3 py-2 border-b border-rule">
            <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-forest">
              This Sprint
            </span>
          </div>
          {sprintItems.length === 0 && (
            <p className="text-[9px] text-ink-faint text-center py-6">
              No items in this sprint. Click &ldquo;Close &amp; Plan Next Sprint&rdquo; to add items from the backlog.
            </p>
          )}
          {sprintItems.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2 group hover:bg-forest-cream/30 transition-colors ${
                idx < sprintItems.length - 1 ? 'border-b border-rule-light' : ''
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[item.priority]}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium ${item.status === 'done' ? 'text-ink-muted line-through' : 'text-ink'}`}>
                    {item.title}
                  </span>
                  <span className={`font-mono text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${TYPE_BADGE[item.type].color}`}>
                    {TYPE_BADGE[item.type].label}
                  </span>
                </div>
                {item.description && (
                  <p className="text-[8px] text-ink-muted leading-snug mt-0.5 line-clamp-1">{item.description}</p>
                )}
              </div>

              {/* In Progress toggle */}
              <button
                onClick={() => toggleInProgress(item.id)}
                className={`font-mono text-[7px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 transition-colors ${
                  item.inProgress
                    ? 'text-amber-ink bg-amber-bg border-amber-ink/20'
                    : 'text-ink-faint bg-transparent border-rule-light opacity-0 group-hover:opacity-100'
                }`}
              >
                {item.inProgress ? 'In Progress' : 'Start'}
              </button>

              <span className="font-mono text-[8px] text-ink-faint uppercase shrink-0">
                {item.owner === 'both' ? 'Both' : item.owner}
              </span>

              {/* Status selector */}
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value as SprintItemStatus)}
                className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 appearance-none cursor-pointer ${
                  STATUS_OPTIONS.find((s) => s.key === item.status)?.color || ''
                }`}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>

              <button
                onClick={() => handleDelete(item.id)}
                className="text-[8px] text-ink-faint hover:text-red-ink px-1 py-px opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Backlog (collapsible) ── */}
      {!planning && (
        <div className="bg-forest-surface border border-rule rounded-sm">
          <button
            onClick={() => setBacklogOpen(!backlogOpen)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-forest-cream/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted">{backlogOpen ? '\u25BC' : '\u25B6'}</span>
              <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
                Backlog
              </span>
              <span className="font-mono text-[9px] text-ink-faint">{backlogItems.length}</span>
            </div>
          </button>
          {backlogOpen && (
            <div className="border-t border-rule">
              {backlogItems.length === 0 && (
                <p className="text-[9px] text-ink-faint text-center py-3">Empty</p>
              )}
              {backlogItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2 group hover:bg-forest-cream/30 transition-colors ${
                    idx < backlogItems.length - 1 ? 'border-b border-rule-light' : ''
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[item.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-ink">{item.title}</span>
                      <span className={`font-mono text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${TYPE_BADGE[item.type].color}`}>
                        {TYPE_BADGE[item.type].label}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[8px] text-ink-muted leading-snug mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <span className="font-mono text-[8px] text-ink-faint uppercase shrink-0">
                    {item.owner === 'both' ? 'Both' : item.owner}
                  </span>
                  <button
                    onClick={() => handleStatusChange(item.id, 'sprint')}
                    className="font-mono text-[8px] text-forest hover:underline opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    Add to Sprint
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-[8px] text-ink-faint hover:text-red-ink px-1 py-px opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Completed (collapsible) ── */}
      {!planning && completedItems.length > 0 && (
        <div className="bg-forest-surface border border-rule rounded-sm">
          <button
            onClick={() => setCompletedOpen(!completedOpen)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-forest-cream/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted">{completedOpen ? '\u25BC' : '\u25B6'}</span>
              <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
                Completed
              </span>
              <span className="font-mono text-[9px] text-ink-faint">{completedItems.length}</span>
            </div>
          </button>
          {completedOpen && (
            <div className="border-t border-rule">
              {completedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2 ${
                    idx < completedItems.length - 1 ? 'border-b border-rule-light' : ''
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[item.priority]}`} />
                  <span className="text-[10px] text-ink-muted line-through flex-1">{item.title}</span>
                  <span className={`font-mono text-[7px] uppercase px-1 py-px rounded-sm border shrink-0 ${TYPE_BADGE[item.type].color}`}>
                    {TYPE_BADGE[item.type].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
