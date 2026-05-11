'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  type BudgetItem,
  type BudgetCategory,
  type WeekN,
  subscribeBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  seedDefaults,
  wipeBudget,
} from './firestore'

const T = {
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  paperDeep: '#e0d6bb',
  sand: '#d6c89e',
  sun: '#d89248',
  sunDeep: '#b86d2c',
  coral: '#c0533a',
  sea: '#1d4a6b',
  bronze: '#7a5a2e',
  green: '#3d6a4a',
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

const WEEK_LABELS: Record<WeekN, string> = {
  I: 'Hyères',
  II: 'Camargue',
  III: 'Le Barcarès',
  IV: 'Leucate',
}

const CATS: { value: BudgetCategory; label: string }[] = [
  { value: 'lodging', label: 'Lodging' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'atmosphere', label: 'Atmosphere' },
  { value: 'media', label: 'Media' },
  { value: 'kits', label: 'Kits' },
  { value: 'admin', label: 'Admin' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'contingency', label: 'Contingency' },
  { value: 'other', label: 'Other' },
]

const usd = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })

type Filter = 'all' | 'overall' | WeekN | 'pending' | 'charged'

export function BudgetView() {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const unsub = subscribeBudget((next) => {
      setItems(next)
      setLoaded(true)
    })
    return unsub
  }, [])

  // Auto-seed on first load if the collection is empty (one attempt only)
  const [seeding, setSeeding] = useState(false)
  const [seedAttempted, setSeedAttempted] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)
  useEffect(() => {
    if (loaded && items.length === 0 && !seeding && !seedAttempted) {
      setSeeding(true)
      setSeedAttempted(true)
      seedDefaults()
        .catch((e) => setSeedError(e instanceof Error ? e.message : String(e)))
        .finally(() => setSeeding(false))
    }
  }, [loaded, items.length, seeding, seedAttempted])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'overall') return items.filter((i) => i.weeks.length === 0)
    if (filter === 'pending') return items.filter((i) => !i.charged)
    if (filter === 'charged') return items.filter((i) => i.charged)
    return items.filter((i) => i.weeks.includes(filter as WeekN))
  }, [items, filter])

  const totals = useMemo(() => {
    const total = items.reduce((s, i) => s + (i.amount || 0), 0)
    const charged = items.filter((i) => i.charged).reduce((s, i) => s + (i.amount || 0), 0)
    return { total, charged, remaining: total - charged }
  }, [items])

  const filterChip = (key: Filter, label: string) => (
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
      {label}
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
            <Stat label="Total" value={usd(totals.total)} />
            <Stat label="Charged" value={usd(totals.charged)} accent={T.green} />
            <Stat label="Remaining" value={usd(totals.remaining)} accent={T.coral} />
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
          {filterChip('all', 'All')}
          {filterChip('overall', 'Overall')}
          {(['I', 'II', 'III', 'IV'] as WeekN[]).map((w) =>
            filterChip(w, `Week ${w} · ${WEEK_LABELS[w]}`),
          )}
          {filterChip('pending', 'Pending')}
          {filterChip('charged', 'Charged')}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: 16 }}>
        {!loaded || (items.length === 0 && seeding) ? (
          <SkeletonRows count={6} />
        ) : items.length === 0 && seedError ? (
          <div
            style={{
              padding: 16,
              border: `1px solid ${T.coral}`,
              background: T.coral + '11',
              fontFamily: T.serif,
              fontSize: 14,
              color: T.ink,
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em', color: T.coral, marginBottom: 8 }}>
              SEED FAILED
            </div>
            <div>{seedError}</div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
              This is most likely a Firestore rules issue. Allow authenticated read/write on
              <code style={{ fontFamily: T.mono, marginLeft: 4 }}>
                arete_mistral_budget
              </code>{' '}
              and{' '}
              <code style={{ fontFamily: T.mono }}>arete_mistral_planning</code> in the Firebase console.
            </div>
            <button
              onClick={() => {
                setSeedError(null)
                setSeedAttempted(false)
              }}
              style={{
                marginTop: 12,
                background: T.ink,
                color: T.cream,
                border: 'none',
                padding: '10px 14px',
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <Empty msg="No items match this filter." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                expanded={expanded === item.id}
                onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}

        {/* Wipe & reseed — visible when items exist, double-tap to confirm */}
        {loaded && items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <button
              onClick={async () => {
                if (!confirmReset) {
                  setConfirmReset(true)
                  setTimeout(() => setConfirmReset(false), 4000)
                  return
                }
                await wipeBudget()
                await seedDefaults()
                setConfirmReset(false)
              }}
              style={{
                background: confirmReset ? T.coral : 'transparent',
                color: confirmReset ? T.cream : T.ink,
                border: `1px solid ${confirmReset ? T.coral : T.ink + '33'}`,
                padding: '10px 16px',
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                opacity: 0.85,
              }}
            >
              {confirmReset ? 'Tap again — wipes all items' : 'Reset to defaults'}
            </button>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAdding(true)}
        aria-label="Add budget item"
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
            padding: '14px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: 1 - i * 0.12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, background: T.ink, opacity: 0.08, width: '60%', marginBottom: 8 }} />
            <div style={{ height: 8, background: T.ink, opacity: 0.06, width: '35%' }} />
          </div>
          <div style={{ width: 70, height: 16, background: T.ink, opacity: 0.08 }} />
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

function scopeLabel(weeks: WeekN[]): string {
  if (weeks.length === 0) return 'Overall'
  if (weeks.length === 4) return 'All weeks'
  return weeks.map((w) => `W${w}`).join(' · ')
}

function ItemRow({
  item,
  expanded,
  onToggle,
}: {
  item: BudgetItem
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div
      style={{
        background: T.paper,
        border: `1px solid ${T.ink}22`,
        borderLeft: `3px solid ${item.charged ? T.green : T.coral}`,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: T.serif,
              fontSize: 17,
              color: T.ink,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              marginTop: 4,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: 0.55,
              }}
            >
              {scopeLabel(item.weeks)}
            </span>
            <span style={{ opacity: 0.3, fontSize: 10 }}>·</span>
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: 0.55,
              }}
            >
              {item.category}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 16,
              fontWeight: 500,
              color: T.ink,
            }}
          >
            {usd(item.amount)}
          </div>
          <ChargedChip
            charged={item.charged}
            onClick={(e) => {
              e.stopPropagation()
              updateBudgetItem(item.id, {
                charged: !item.charged,
                chargedDate: !item.charged ? new Date().toISOString().slice(0, 10) : '',
              })
            }}
          />
        </div>
      </button>

      {expanded && <ItemEditor item={item} onClose={() => onToggle()} />}
    </div>
  )
}

function ChargedChip({ charged, onClick }: { charged: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 4,
        padding: '3px 8px',
        background: charged ? T.green : 'transparent',
        color: charged ? T.cream : T.coral,
        border: `1px solid ${charged ? T.green : T.coral}`,
        fontFamily: T.mono,
        fontSize: 8,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {charged ? '✓ Charged' : 'Pending'}
    </button>
  )
}

function ItemEditor({ item, onClose }: { item: BudgetItem; onClose: () => void }) {
  const [name, setName] = useState(item.name)
  const [amount, setAmount] = useState(String(item.amount))
  const [category, setCategory] = useState<BudgetCategory>(item.category)
  const [weeks, setWeeks] = useState<WeekN[]>(item.weeks)
  const [scope, setScope] = useState<'overall' | 'weeks'>(item.weeks.length === 0 ? 'overall' : 'weeks')
  const [notes, setNotes] = useState(item.notes || '')
  const [chargedBy, setChargedBy] = useState(item.chargedBy || '')
  const [chargedDate, setChargedDate] = useState(item.chargedDate || '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const toggleWeek = (w: WeekN) => {
    setWeeks((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort()))
  }

  const save = async () => {
    await updateBudgetItem(item.id, {
      name: name.trim() || 'Untitled',
      amount: Number(amount) || 0,
      category,
      weeks: scope === 'overall' ? [] : weeks,
      notes,
      chargedBy: item.charged ? chargedBy : '',
      chargedDate: item.charged ? chargedDate : '',
    })
    onClose()
  }

  const remove = async () => {
    await deleteBudgetItem(item.id)
  }

  return (
    <div style={{ padding: '0 14px 16px', borderTop: `1px solid ${T.ink}22` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>
        <Input label="Name" value={name} onChange={setName} />
        <Input label="Amount (USD)" value={amount} onChange={setAmount} type="number" />

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BudgetCategory)}
            style={selectStyle}
          >
            {CATS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Scope">
          <div style={{ display: 'flex', gap: 6 }}>
            <ScopePill active={scope === 'overall'} onClick={() => setScope('overall')} label="Overall" />
            <ScopePill active={scope === 'weeks'} onClick={() => setScope('weeks')} label="Per week" />
          </div>
        </Field>

        {scope === 'weeks' && (
          <Field label="Which weeks">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {(['I', 'II', 'III', 'IV'] as WeekN[]).map((w) => (
                <button
                  key={w}
                  onClick={() => toggleWeek(w)}
                  style={{
                    padding: '10px 12px',
                    background: weeks.includes(w) ? T.ink : 'transparent',
                    color: weeks.includes(w) ? T.cream : T.ink,
                    border: `1px solid ${weeks.includes(w) ? T.ink : T.ink + '33'}`,
                    fontFamily: T.mono,
                    fontSize: 11,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  W{w} · {WEEK_LABELS[w]}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Optional context"
          />
        </Field>

        {item.charged && (
          <>
            <Input label="Charged by" value={chargedBy} onChange={setChargedBy} placeholder="Lori / Dave" />
            <Input label="Charged date" value={chargedDate} onChange={setChargedDate} type="date" />
          </>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
              if (confirmDelete) remove()
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

function ScopePill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: 10,
        background: active ? T.ink : 'transparent',
        color: active ? T.cream : T.ink,
        border: `1px solid ${active ? T.ink : T.ink + '33'}`,
        fontFamily: T.mono,
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: T.sans,
  fontSize: 14,
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

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={type === 'number' ? 'decimal' : undefined}
        style={inputStyle}
      />
    </Field>
  )
}

function AddSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BudgetCategory>('other')
  const [scope, setScope] = useState<'overall' | 'weeks'>('overall')
  const [weeks, setWeeks] = useState<WeekN[]>([])
  const [notes, setNotes] = useState('')

  const toggleWeek = (w: WeekN) =>
    setWeeks((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort()))

  const submit = async () => {
    if (!name.trim() || !amount) return
    await addBudgetItem({
      name: name.trim(),
      amount: Number(amount) || 0,
      category,
      weeks: scope === 'overall' ? [] : weeks,
      notes,
      charged: false,
    })
    onClose()
  }

  return (
    <Sheet onClose={onClose} title="New budget item">
      <Input label="Name" value={name} onChange={setName} placeholder="e.g. Sunset boat dinner" />
      <Input label="Amount (USD)" value={amount} onChange={setAmount} type="number" placeholder="0" />

      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as BudgetCategory)}
          style={selectStyle}
        >
          {CATS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Scope">
        <div style={{ display: 'flex', gap: 6 }}>
          <ScopePill active={scope === 'overall'} onClick={() => setScope('overall')} label="Overall" />
          <ScopePill active={scope === 'weeks'} onClick={() => setScope('weeks')} label="Per week" />
        </div>
      </Field>

      {scope === 'weeks' && (
        <Field label="Which weeks">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {(['I', 'II', 'III', 'IV'] as WeekN[]).map((w) => (
              <button
                key={w}
                onClick={() => toggleWeek(w)}
                style={{
                  padding: '10px 12px',
                  background: weeks.includes(w) ? T.ink : 'transparent',
                  color: weeks.includes(w) ? T.cream : T.ink,
                  border: `1px solid ${weeks.includes(w) ? T.ink : T.ink + '33'}`,
                  fontFamily: T.mono,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                W{w} · {WEEK_LABELS[w]}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Optional"
        />
      </Field>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
          disabled={!name.trim() || !amount}
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
            opacity: !name.trim() || !amount ? 0.5 : 1,
          }}
        >
          Add
        </button>
      </div>
    </Sheet>
  )
}

export function Sheet({
  onClose,
  title,
  children,
}: {
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,24,21,0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: T.cream,
          borderTop: `2px solid ${T.ink}`,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px 16px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 8,
            borderBottom: `1px solid ${T.ink}22`,
          }}
        >
          <div
            style={{
              fontFamily: T.serif,
              fontStyle: 'italic',
              fontSize: 22,
              color: T.bronze,
            }}
          >
            {title}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: T.serif,
              fontSize: 26,
              color: T.ink,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
