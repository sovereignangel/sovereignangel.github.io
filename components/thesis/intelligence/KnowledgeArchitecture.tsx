'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getKnowledgeItems, saveKnowledgeItem, deleteKnowledgeItem } from '@/lib/firestore'
import type { KnowledgeItem, KnowledgeType, KnowledgeStatus, ThesisPillar } from '@/lib/types'

const TYPE_TABS: { key: KnowledgeType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'book', label: 'Books' },
  { key: 'paper', label: 'Research' },
  { key: '10k_filing', label: '10-K' },
  { key: 'article', label: 'Articles' },
  { key: 'course', label: 'Courses' },
]

const STATUS_COLORS: Record<KnowledgeStatus, string> = {
  queued: 'text-ink-faint bg-cream border-rule-light',
  in_progress: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  completed: 'text-green-ink bg-green-bg border-green-ink/20',
  abandoned: 'text-red-ink bg-red-bg border-red-ink/20',
}

export default function KnowledgeArchitecture() {
  const { user } = useAuth()
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<KnowledgeType | 'all'>('all')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [type, setType] = useState<KnowledgeType>('book')
  const [source, setSource] = useState('')
  const [pillars, setPillars] = useState<ThesisPillar[]>([])
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getKnowledgeItems(user.uid)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const handleSave = async () => {
    if (!user || !title.trim()) return
    setSaving(true)
    await saveKnowledgeItem(user.uid, {
      title: title.trim(),
      author: author.trim(),
      type,
      source: source.trim(),
      thesisPillars: pillars,
      tags: [],
      keyTakeaways: [],
      linkedSignalIds: [],
      linkedPrincipleIds: [],
    })
    setTitle('')
    setAuthor('')
    setSource('')
    setPillars([])
    setSaving(false)
    setShowForm(false)
    await refresh()
  }

  const updateStatus = async (item: KnowledgeItem, status: KnowledgeStatus) => {
    if (!user || !item.id) return
    const updates: Partial<KnowledgeItem> = { status }
    if (status === 'in_progress' && !item.startDate) {
      updates.startDate = new Date().toISOString().split('T')[0]
    }
    if (status === 'completed') {
      updates.completionDate = new Date().toISOString().split('T')[0]
    }
    await saveKnowledgeItem(user.uid, updates, item.id)
    await refresh()
  }

  const filtered = filterType === 'all' ? items : items.filter(i => i.type === filterType)

  const counts = {
    total: items.length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    completed: items.filter(i => i.status === 'completed').length,
  }

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-rule-light/40 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Knowledge Architecture
          </h3>
          <span className="font-mono text-[8px] text-ink-muted">
            {counts.total} items · {counts.inProgress} active · {counts.completed} done
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-0.5 mb-2">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
              filterType === tab.key
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="mb-2 p-2 border border-rule rounded-sm bg-white space-y-1.5">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
            placeholder="Title"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
              placeholder="Author"
            />
            <select
              value={type}
              onChange={e => setType(e.target.value as KnowledgeType)}
              className="font-sans text-[9px] bg-cream border border-rule rounded-sm px-1 py-1 focus:outline-none focus:border-burgundy"
            >
              <option value="book">Book</option>
              <option value="paper">Paper</option>
              <option value="10k_filing">10-K Filing</option>
              <option value="article">Article</option>
              <option value="lecture">Lecture</option>
              <option value="course">Course</option>
            </select>
          </div>
          <input
            value={source}
            onChange={e => setSource(e.target.value)}
            className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
            placeholder="Source URL or reference"
          />
          <div className="flex items-center gap-1">
            <span className="font-serif text-[8px] text-ink-muted uppercase">Pillars:</span>
            {(['ai', 'markets', 'mind'] as ThesisPillar[]).map(p => (
              <button
                key={p}
                onClick={() => setPillars(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border transition-colors ${
                  pillars.includes(p)
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-1">
            <button onClick={() => setShowForm(false)} className="font-serif text-[8px] px-2 py-0.5 text-ink-muted">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-serif text-[11px] text-ink-muted">No knowledge items yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-1.5 border border-rule rounded-sm bg-white group">
              <select
                value={item.status}
                onChange={e => updateStatus(item, e.target.value as KnowledgeStatus)}
                className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${STATUS_COLORS[item.status]}`}
              >
                <option value="queued">Queued</option>
                <option value="in_progress">Active</option>
                <option value="completed">Done</option>
                <option value="abandoned">Drop</option>
              </select>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[10px] font-medium text-ink truncate">{item.title}</p>
                <div className="flex items-center gap-1">
                  <span className="font-sans text-[8px] text-ink-muted">{item.author}</span>
                  <span className="font-mono text-[7px] text-ink-faint uppercase">{item.type.replace('_', ' ')}</span>
                  {item.thesisPillars.map(p => (
                    <span key={p} className="font-mono text-[6px] uppercase px-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              {item.impactRating && (
                <span className="font-mono text-[9px] font-semibold text-ink shrink-0">{item.impactRating}/5</span>
              )}
              <button
                onClick={() => item.id && user && deleteKnowledgeItem(user.uid, item.id).then(refresh)}
                className="font-mono text-[9px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
