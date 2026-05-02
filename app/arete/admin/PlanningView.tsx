'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  type PlanningItem,
  type Priority,
  type WeekN,
  subscribePlanning,
  addPlanningItem,
  updatePlanningItem,
  deletePlanningItem,
} from './firestore'
import { Sheet } from './BudgetView'

const T = {
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  paperDeep: '#e0d6bb',
  sand: '#d6c89e',
  sun: '#d89248',
  sunDeep: '#b86d2c',
  coral: '#c0533a',
  bronze: '#7a5a2e',
  green: '#3d6a4a',
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

const PRIORITY_COLOR: Record<Priority, string> = {
  high: T.coral,
  medium: T.sun,
  low: T.bronze,
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

type Filter = 'open' | 'all' | 'done' | 'high'

export function PlanningView() {
  const [items, setItems] = useState<PlanningItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<Filter>('open')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const unsub = subscribePlanning((next) => {
      setItems(next)
      setLoaded(true)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => {
    let list = items
    if (filter === 'open') list = list.filter((i) => !i.done)
    else if (filter === 'done') list = list.filter((i) => i.done)
    else if (filter === 'high') list = list.filter((i) => i.priority === 'high' && !i.done)
    // sort: priority (high → low), then done last
    const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
    return [...list].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return order[a.priority] - order[b.priority]
    })
  }, [items, filter])

  const counts = useMemo(() => {
    return {
      open: items.filter((i) => !i.done).length,
      done: items.filter((i) => i.done).length,
      high: items.filter((i) => i.priority === 'high' && !i.done).length,
    }
  }, [items])

  const filterChip = (key: Filter, label: string, count?: number) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      style={{
        padding: '8px 14px',
        background: filter === key ? T.ink : 'transparent',
        color: filter === key ? T.cream : T.ink,
        border: `1px solid ${filter === key ? T.ink : T.ink + '33'}`,
        fontFamily: T.mono,
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}{typeof count === 'number' ? ` · ${count}` : ''}
    </button>
  )

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Sticky summary + filters — sits below the page header & tab control */}
      <div
        style={{
          position: 'sticky',
          top: 110,
          zIndex: 15,
          background: T.cream,
          borderBottom: `1px solid ${T.ink}22`,
        }}
      >
        <div style={{ padding: '14px 16px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <Stat label="Open" value={String(counts.open)} />
            <Stat label="Priority" value={String(counts.high)} accent={T.coral} />
            <Stat label="Done" value={String(counts.done)} accent={T.green} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '0 16px 12px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {filterChip('open', 'Open', counts.open)}
          {filterChip('high', 'High priority', counts.high)}
          {filterChip('all', 'All')}
          {filterChip('done', 'Done', counts.done)}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {!loaded ? (
          <SkeletonRows count={5} />
        ) : filtered.length === 0 ? (
          <Empty msg={items.length === 0 ? 'No items yet — tap + to add.' : 'Nothing here.'} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((item) => (
              <TodoRow
                key={item.id}
                item={item}
                expanded={expanded === item.id}
                onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setAdding(true)}
        aria-label="Add planning item"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: T.ink,
          color: T.cream,
          border: 'none',
          fontSize: 28,
          fontFamily: T.serif,
          fontWeight: 300,
          cursor: 'pointer',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.4)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        +
      </button>

      {adding && <AddSheet onClose={() => setAdding(false)} />}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          opacity: 0.55,
          color: T.ink,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.serif,
          fontSize: 22,
          fontStyle: 'italic',
          color: accent || T.ink,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: T.paper,
            border: `1px solid ${T.ink}22`,
            borderLeft: `3px solid ${T.ink}22`,
            padding: '12px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: 1 - i * 0.14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `1.5px solid ${T.ink}22`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, background: T.ink, opacity: 0.08, width: '70%', marginBottom: 8 }} />
            <div style={{ height: 8, background: T.ink, opacity: 0.06, width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <div
      style={{
        fontFamily: T.serif,
        fontStyle: 'italic',
        fontSize: 14,
        opacity: 0.55,
        textAlign: 'center',
        padding: 24,
      }}
    >
      {msg}
    </div>
  )
}

function TodoRow({
  item,
  expanded,
  onToggle,
}: {
  item: PlanningItem
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        background: T.paper,
        border: `1px solid ${T.ink}22`,
        borderLeft: `3px solid ${item.done ? T.green : PRIORITY_COLOR[item.priority]}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
        }}
      >
        <button
          onClick={() =>
            updatePlanningItem(item.id, { done: !item.done })
          }
          aria-label={item.done ? 'Mark undone' : 'Mark done'}
          style={{
            width: 28,
            height: 28,
            minWidth: 28,
            borderRadius: '50%',
            border: `1.5px solid ${item.done ? T.green : T.ink + '55'}`,
            background: item.done ? T.green : 'transparent',
            color: item.done ? T.cream : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontFamily: T.serif,
            padding: 0,
          }}
        >
          {item.done ? '✓' : ''}
        </button>
        <button
          onClick={onToggle}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: '4px 0',
          }}
        >
          <div
            style={{
              fontFamily: T.serif,
              fontSize: 16,
              color: T.ink,
              lineHeight: 1.3,
              textDecoration: item.done ? 'line-through' : 'none',
              opacity: item.done ? 0.55 : 1,
            }}
          >
            {item.text}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 8,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                padding: '2px 6px',
                background: PRIORITY_COLOR[item.priority] + '22',
                color: PRIORITY_COLOR[item.priority],
                border: `1px solid ${PRIORITY_COLOR[item.priority]}55`,
              }}
            >
              {PRIORITY_LABEL[item.priority]}
            </span>
            {item.weekScope && item.weekScope !== 'overall' && (
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 8,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  opacity: 0.55,
                }}
              >
                Week {item.weekScope}
              </span>
            )}
            {item.weekScope === 'overall' && (
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 8,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  opacity: 0.55,
                }}
              >
                Overall
              </span>
            )}
          </div>
        </button>
      </div>

      {expanded && <TodoEditor item={item} onClose={onToggle} />}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 12px',
  background: T.cream,
  border: `1px solid ${T.ink}33`,
  fontFamily: T.serif,
  fontSize: 16,
  color: T.ink,
  outline: 'none',
  WebkitAppearance: 'none',
  borderRadius: 0,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          opacity: 0.65,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

function PriorityPicker({ value, onChange }: { value: Priority; onChange: (v: Priority) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {(['high', 'medium', 'low'] as Priority[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            flex: 1,
            padding: 10,
            background: value === p ? PRIORITY_COLOR[p] : 'transparent',
            color: value === p ? T.cream : PRIORITY_COLOR[p],
            border: `1px solid ${PRIORITY_COLOR[p]}`,
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {PRIORITY_LABEL[p]}
        </button>
      ))}
    </div>
  )
}

function ScopePicker({
  value,
  onChange,
}: {
  value: WeekN | 'overall'
  onChange: (v: WeekN | 'overall') => void
}) {
  const opts: (WeekN | 'overall')[] = ['overall', 'I', 'II', 'III', 'IV']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            padding: '10px 4px',
            background: value === o ? T.ink : 'transparent',
            color: value === o ? T.cream : T.ink,
            border: `1px solid ${value === o ? T.ink : T.ink + '33'}`,
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {o === 'overall' ? 'All' : `W${o}`}
        </button>
      ))}
    </div>
  )
}

function TodoEditor({ item, onClose }: { item: PlanningItem; onClose: () => void }) {
  const [text, setText] = useState(item.text)
  const [priority, setPriority] = useState<Priority>(item.priority)
  const [weekScope, setWeekScope] = useState<WeekN | 'overall'>(item.weekScope || 'overall')
  const [notes, setNotes] = useState(item.notes || '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = async () => {
    await updatePlanningItem(item.id, {
      text: text.trim() || 'Untitled',
      priority,
      weekScope,
      notes,
    })
    onClose()
  }

  return (
    <div style={{ padding: '0 14px 16px', borderTop: `1px solid ${T.ink}22` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>
        <Field label="Text">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>
        <Field label="Priority">
          <PriorityPicker value={priority} onChange={setPriority} />
        </Field>
        <Field label="Scope">
          <ScopePicker value={weekScope} onChange={setWeekScope} />
        </Field>
        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Optional"
          />
        </Field>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={save}
            style={{
              flex: 2,
              padding: 14,
              background: T.ink,
              color: T.cream,
              border: 'none',
              fontFamily: T.mono,
              fontSize: 11,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              if (confirmDelete) deletePlanningItem(item.id)
              else setConfirmDelete(true)
            }}
            style={{
              flex: 1,
              padding: 14,
              background: confirmDelete ? T.coral : 'transparent',
              color: confirmDelete ? T.cream : T.coral,
              border: `1px solid ${T.coral}`,
              fontFamily: T.mono,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddSheet({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [weekScope, setWeekScope] = useState<WeekN | 'overall'>('overall')
  const [notes, setNotes] = useState('')

  const submit = async () => {
    if (!text.trim()) return
    await addPlanningItem({
      text: text.trim(),
      priority,
      done: false,
      weekScope,
      notes,
    })
    onClose()
  }

  return (
    <Sheet onClose={onClose} title="New planning item">
      <Field label="Text">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="What needs doing?"
          autoFocus
        />
      </Field>

      <Field label="Priority">
        <PriorityPicker value={priority} onChange={setPriority} />
      </Field>

      <Field label="Scope">
        <ScopePicker value={weekScope} onChange={setWeekScope} />
      </Field>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Optional"
        />
      </Field>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: 14,
            background: 'transparent',
            color: T.ink,
            border: `1px solid ${T.ink}33`,
            fontFamily: T.mono,
            fontSize: 11,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            flex: 2,
            padding: 14,
            background: T.ink,
            color: T.cream,
            border: 'none',
            fontFamily: T.mono,
            fontSize: 11,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            opacity: !text.trim() ? 0.5 : 1,
          }}
        >
          Add
        </button>
      </div>
    </Sheet>
  )
}
