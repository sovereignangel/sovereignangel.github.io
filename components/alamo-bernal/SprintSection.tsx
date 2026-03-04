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

const SECTIONS: { key: SprintItemStatus; label: string; defaultOpen: boolean }[] = [
  { key: 'in_progress', label: 'In Progress', defaultOpen: true },
  { key: 'sprint', label: 'This Sprint', defaultOpen: true },
  { key: 'backlog', label: 'Backlog', defaultOpen: false },
  { key: 'done', label: 'Done', defaultOpen: false },
]

const TYPE_BADGE: Record<SprintItemType, { label: string; color: string }> = {
  feature: { label: 'Feature', color: 'text-green-ink bg-green-bg border-green-ink/20' },
  bug: { label: 'Bug', color: 'text-red-ink bg-burgundy-bg border-red-ink/20' },
  task: { label: 'Task', color: 'text-ink-muted bg-paper border-rule' },
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-ink',
  medium: 'bg-amber-ink',
  low: 'bg-ink-faint',
}

const NEXT_STATUS: Record<SprintItemStatus, SprintItemStatus | null> = {
  backlog: 'sprint',
  sprint: 'in_progress',
  in_progress: 'done',
  done: null,
}

const PREV_STATUS: Record<SprintItemStatus, SprintItemStatus | null> = {
  backlog: null,
  sprint: 'backlog',
  in_progress: 'sprint',
  done: 'in_progress',
}

const NEXT_LABEL: Record<SprintItemStatus, string> = {
  backlog: 'Add to Sprint',
  sprint: 'Start',
  in_progress: 'Done',
  done: '',
}

export default function SprintSection() {
  const [items, setItems] = useState<SprintItem[]>(SPRINT_ITEMS)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    SECTIONS.forEach((s) => { init[s.key] = !s.defaultOpen })
    return init
  })
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

  function toggleSection(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))
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

  async function handleMove(id: string, to: SprintItemStatus) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: to } : i)))
    try { await updateSprintItem(id, { status: to }) } catch {}
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    try { await deleteSprintItem(id) } catch {}
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Sprint Board
          </h2>
          <p className="text-[10px] text-ink-muted mt-0.5">
            {items.filter((i) => i.status === 'sprint' || i.status === 'in_progress').length} active
            {' \u00B7 '}
            {items.filter((i) => i.status === 'backlog').length} backlog
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="font-mono text-[9px] font-medium px-2 py-1 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-rule rounded-sm p-3 space-y-2">
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
              className="text-[10px] text-ink-muted bg-paper border border-rule rounded-sm px-1.5 py-0.5"
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="task">Task</option>
            </select>
            <select
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value as 'lori' | 'sean' | 'both')}
              className="text-[10px] text-ink-muted bg-paper border border-rule rounded-sm px-1.5 py-0.5"
            >
              <option value="lori">Lori</option>
              <option value="sean">Sean</option>
              <option value="both">Both</option>
            </select>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="text-[10px] text-ink-muted bg-paper border border-rule rounded-sm px-1.5 py-0.5"
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
              className="text-[10px] font-medium text-paper bg-burgundy px-2 py-0.5 rounded-sm hover:bg-burgundy/90"
            >
              Add to Backlog
            </button>
          </div>
        </div>
      )}

      {/* Sections */}
      {SECTIONS.map((section) => {
        const sectionItems = items
          .filter((i) => i.status === section.key)
          .sort((a, b) => {
            const p = { high: 0, medium: 1, low: 2 }
            return p[a.priority] - p[b.priority]
          })
        const isCollapsed = !!collapsed[section.key]

        return (
          <div key={section.key} className="bg-white border border-rule rounded-sm">
            {/* Section header — click to collapse */}
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-cream/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-muted">{isCollapsed ? '\u25B6' : '\u25BC'}</span>
                <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  {section.label}
                </span>
                <span className="font-mono text-[9px] text-ink-faint">{sectionItems.length}</span>
              </div>
            </button>

            {/* Items */}
            {!isCollapsed && (
              <div className="border-t border-rule">
                {sectionItems.length === 0 && (
                  <p className="text-[9px] text-ink-faint text-center py-3">No items</p>
                )}
                {sectionItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2 group hover:bg-cream/30 transition-colors ${
                      idx < sectionItems.length - 1 ? 'border-b border-rule-light' : ''
                    }`}
                  >
                    {/* Priority dot */}
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[item.priority]}`} />

                    {/* Content */}
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

                    {/* Owner */}
                    <span className="font-mono text-[8px] text-ink-faint uppercase shrink-0 w-[30px] text-right">
                      {item.owner === 'both' ? 'Both' : item.owner}
                    </span>

                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {PREV_STATUS[item.status] && (
                        <button
                          onClick={() => handleMove(item.id, PREV_STATUS[item.status]!)}
                          className="text-[8px] text-ink-muted hover:text-ink px-1 py-px border border-rule rounded-sm"
                          title={`Move to ${PREV_STATUS[item.status]}`}
                        >
                          &larr;
                        </button>
                      )}
                      {NEXT_STATUS[item.status] && (
                        <button
                          onClick={() => handleMove(item.id, NEXT_STATUS[item.status]!)}
                          className="text-[8px] text-paper bg-burgundy hover:bg-burgundy/80 px-1.5 py-px rounded-sm"
                        >
                          {NEXT_LABEL[item.status]}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[8px] text-ink-faint hover:text-red-ink px-1 py-px"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
