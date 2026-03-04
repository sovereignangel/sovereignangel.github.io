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

const COLUMNS: { key: SprintItemStatus; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'sprint', label: 'This Sprint' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
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

export default function SprintSection() {
  const [items, setItems] = useState<SprintItem[]>(SPRINT_ITEMS)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<SprintItemType>('task')
  const [newOwner, setNewOwner] = useState<'lori' | 'sean' | 'both'>('both')
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium')

  useEffect(() => {
    getSprintItems().then((data) => {
      if (data.length > 0) setItems(data)
    }).catch(() => {
      // Already using seed data
    })
  }, [])

  async function handleAdd() {
    if (!newTitle.trim()) return
    const item: SprintItem = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      type: newType,
      status: 'backlog',
      owner: newOwner,
      priority: newPriority,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    await saveSprintItem(item)
    setItems((prev) => [...prev, item])
    setNewTitle('')
    setShowAdd(false)
  }

  async function handleMove(id: string, to: SprintItemStatus) {
    await updateSprintItem(id, { status: to })
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: to } : i)))
  }

  async function handleDelete(id: string) {
    await deleteSprintItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
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
            {items.filter((i) => i.status !== 'done').length} open items
          </p>
        </div>
        <div className="flex gap-1">
          <a
            href="https://github.com/sovereignangel/sovereignangel.github.io/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[9px] px-2 py-1 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
          >
            GitHub Projects &rarr;
          </a>
          <button
            onClick={() => setShowAdd(true)}
            className="font-mono text-[9px] font-medium px-2 py-1 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-rule rounded-sm p-3 space-y-2">
          <input
            autoFocus
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full text-[11px] text-ink bg-transparent border-b border-rule pb-1 outline-none placeholder:text-ink-faint"
          />
          <div className="flex items-center gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SprintItemType)}
              className="text-[10px] text-ink-muted bg-paper border border-rule rounded-sm px-1.5 py-0.5"
            >
              <option value="task">Task</option>
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
            </select>
            <select
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value as 'lori' | 'sean' | 'both')}
              className="text-[10px] text-ink-muted bg-paper border border-rule rounded-sm px-1.5 py-0.5"
            >
              <option value="both">Both</option>
              <option value="sean">Sean</option>
              <option value="lori">Lori</option>
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
              onClick={() => setShowAdd(false)}
              className="text-[10px] text-ink-muted hover:text-ink px-2 py-0.5"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="text-[10px] font-medium text-paper bg-burgundy px-2 py-0.5 rounded-sm hover:bg-burgundy/90"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {COLUMNS.map((col) => {
          const colItems = items
            .filter((i) => i.status === col.key)
            .sort((a, b) => {
              const p = { high: 0, medium: 1, low: 2 }
              return p[a.priority] - p[b.priority]
            })

          return (
            <div key={col.key} className="bg-white border border-rule rounded-sm">
              <div className="px-2 py-1.5 border-b border-rule flex items-center justify-between">
                <span className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
                  {col.label}
                </span>
                <span className="font-mono text-[9px] text-ink-faint">{colItems.length}</span>
              </div>
              <div className="p-1.5 space-y-1 min-h-[80px]">
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-paper border border-rule rounded-sm p-2 group"
                  >
                    <div className="flex items-start gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${PRIORITY_DOT[item.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-ink leading-tight">{item.title}</p>
                        {item.description && (
                          <p className="text-[8px] text-ink-muted leading-snug mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`font-mono text-[8px] uppercase px-1 py-px rounded-sm border ${TYPE_BADGE[item.type].color}`}>
                            {TYPE_BADGE[item.type].label}
                          </span>
                          <span className="font-mono text-[8px] text-ink-faint capitalize">{item.owner}</span>
                        </div>
                      </div>
                    </div>
                    {/* Move buttons */}
                    <div className="flex items-center justify-between mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-0.5">
                        {PREV_STATUS[item.status] && (
                          <button
                            onClick={() => handleMove(item.id, PREV_STATUS[item.status]!)}
                            className="text-[8px] text-ink-muted hover:text-ink px-1 py-px border border-rule rounded-sm"
                          >
                            &larr;
                          </button>
                        )}
                        {NEXT_STATUS[item.status] && (
                          <button
                            onClick={() => handleMove(item.id, NEXT_STATUS[item.status]!)}
                            className="text-[8px] text-ink-muted hover:text-ink px-1 py-px border border-rule rounded-sm"
                          >
                            &rarr;
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[8px] text-ink-faint hover:text-red-ink px-1 py-px"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
                {colItems.length === 0 && (
                  <p className="text-[9px] text-ink-faint text-center py-3">Empty</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
