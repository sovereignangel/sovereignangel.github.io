'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Block, Masthead, Meta, Stat, useSheetState } from '@/components/complexecon/tearsheet'
import ModelChart from '@/components/complexecon/ModelChart'
import {
  MODELS,
  MODELS_FRAMING,
  defaultParams,
  type ModelParam,
  type ModelSpec,
  type Readout,
} from '@/lib/complexecon/models'
import { CE_PAPERS } from '@/lib/complexecon/roadmap'
import { LIBRARY } from '@/lib/complexecon/pathway'

const PARAMS_KEY = 'complexecon-models-params'
const SELECTED_KEY = 'complexecon-models-selected'
const BLOCK_IDS = ['blk-premise']

const FIDELITY_LABEL = { faithful: 'Faithful', simplified: 'Simplified' } as const
const FIDELITY_CLASS = {
  faithful: 'bg-green-bg text-green-ink border-green-ink/30',
  simplified: 'bg-amber-bg text-amber-ink border-amber-ink/30',
} as const

type ParamState = Record<string, Record<string, number>>

/**
 * Slider values per model, remembered per browser — so a model reopens with
 * the parameters it was left at, however many others were visited in between.
 */
function useParams() {
  const [state, setState] = useState<ParamState>({})
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PARAMS_KEY)
      if (raw) setState(JSON.parse(raw) as ParamState)
    } catch {
      // corrupted storage — start from the defaults
    }
    setLoaded(true)
  }, [])
  const set = useCallback((modelId: string, next: Record<string, number> | null) => {
    setState(prev => {
      const copy = { ...prev }
      if (next === null) delete copy[modelId]
      else copy[modelId] = next
      try {
        localStorage.setItem(PARAMS_KEY, JSON.stringify(copy))
      } catch {
        // storage unavailable — the page still works for the session
      }
      return copy
    })
  }, [])
  return { state, set, loaded }
}

/** The selected model: the URL hash first, then the last one opened here, then the first. */
function useSelected() {
  const [id, setId] = useState(MODELS[0].id)
  useEffect(() => {
    const fromHash = window.location.hash.slice(1)
    if (MODELS.some(m => m.id === fromHash)) {
      setId(fromHash)
      return
    }
    try {
      const saved = localStorage.getItem(SELECTED_KEY)
      if (saved && MODELS.some(m => m.id === saved)) setId(saved)
    } catch {
      // storage unavailable
    }
  }, [])
  // A hash typed into the URL, or back/forward across selections, switches the model too.
  useEffect(() => {
    const onHash = () => {
      const next = window.location.hash.slice(1)
      if (MODELS.some(m => m.id === next)) setId(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const select = useCallback((next: string) => {
    setId(next)
    try {
      localStorage.setItem(SELECTED_KEY, next)
      window.history.replaceState(null, '', `#${next}`)
    } catch {
      // storage or history unavailable
    }
  }, [])
  return { id, select }
}

function fmtValue(p: ModelParam, v: number): string {
  if (p.fmt) return p.fmt(v)
  if (p.step >= 1) return v.toFixed(0)
  if (p.step >= 0.1) return v.toFixed(1)
  if (p.step >= 0.01) return v.toFixed(2)
  return v.toFixed(3)
}

function Slider({ param, value, onChange }: { param: ModelParam; value: number; onChange: (v: number) => void }) {
  const changed = Math.abs(value - param.default) > 1e-9
  return (
    <label className="block border-b border-rule-light py-1.5 last:border-b-0">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] font-semibold leading-snug text-ink">{param.label}</span>
        <span className={`font-mono text-[13px] ${changed ? 'text-burgundy' : 'text-ink-light'}`}>{fmtValue(param, value)}</span>
      </span>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={param.label}
        className="mt-0.5 block h-[28px] w-full cursor-pointer"
        style={{ accentColor: '#7c2d2d' }}
      />
      <span className="block text-[13px] leading-snug text-ink-muted">{param.meaning}</span>
    </label>
  )
}

function Readouts({ items }: { items: Readout[] }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-rule-light border border-rule bg-white sm:grid-cols-4">
      {items.map(r => (
        <div key={r.label} className="px-2.5 py-1.5">
          <div className="font-mono text-[11px] uppercase leading-tight tracking-[0.5px] text-ink-muted">{r.label}</div>
          <div className="mt-0.5 break-words font-mono text-[16px] font-semibold leading-tight text-ink">{r.value}</div>
          {r.note && <div className="mt-0.5 text-[12px] leading-snug text-ink-muted">{r.note}</div>}
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed text-ink-muted">
      <Meta tone="amber">{label} · </Meta>
      {children}
    </p>
  )
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 mt-2.5 font-serif text-[15px] font-semibold uppercase tracking-[1px] text-burgundy first:mt-0">
      {children}
    </div>
  )
}

function FidelityChip({ model }: { model: ModelSpec }) {
  return (
    <span className={`shrink-0 rounded-sm border px-1 py-px font-mono text-[11px] uppercase tracking-[0.5px] ${FIDELITY_CLASS[model.fidelity]}`}>
      {FIDELITY_LABEL[model.fidelity]}
    </span>
  )
}

const LINK = 'font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40'

/** The selected model, filling the right pane: head, sliders, verdict, readouts, charts, then the reading. */
function ModelPane({
  model,
  params,
  onChange,
  seed,
  onReroll,
}: {
  model: ModelSpec
  params: Record<string, number>
  onChange: (next: Record<string, number> | null) => void
  seed: number
  onReroll: () => void
}) {
  const result = useMemo(() => model.simulate(params, seed), [model, params, seed])
  const onRoadmap = model.paper.roadmapId ? CE_PAPERS.find(p => p.id === model.paper.roadmapId) : undefined
  const onShelf = model.paper.libraryId ? LIBRARY.flatMap(t => t.items).find(i => i.id === model.paper.libraryId) : undefined
  const changed = model.params.some(p => Math.abs(params[p.key] - p.default) > 1e-9)
  const markX = model.id === 'brock-hommes' ? params.beta : undefined

  return (
    <div className="px-3 py-2.5 md:px-4">
      <div className="mb-2.5 border-b border-rule pb-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-serif text-[17px] font-semibold text-ink-faint">{model.numeral}</span>
          <h2 className="font-serif text-[21px] font-semibold leading-snug text-ink">{model.question}</h2>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Meta>{model.paper.cite}</Meta>
          <FidelityChip model={model} />
          <Meta>
            {model.params.length} parameters · {model.charts.length} charts
          </Meta>
        </div>
        <p className="mt-1.5 font-serif text-[17px] italic leading-snug text-ink">{model.answer}</p>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-3 lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside>
          <div className="flex items-baseline justify-between gap-2 border-b border-rule pb-1">
            <SubHead>Parameters</SubHead>
            <span className="flex gap-1">
              <button
                onClick={onReroll}
                className="rounded-sm border border-rule px-1.5 py-px font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
              >
                Re-roll
              </button>
              <button
                onClick={() => onChange(null)}
                disabled={!changed}
                className="rounded-sm border border-rule px-1.5 py-px font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted transition-colors hover:border-ink-faint hover:text-ink disabled:cursor-default disabled:opacity-40"
              >
                Reset
              </button>
            </span>
          </div>
          {model.params.map(p => (
            <Slider key={p.key} param={p} value={params[p.key]} onChange={v => onChange({ ...params, [p.key]: v })} />
          ))}
        </aside>

        <div className="min-w-0 space-y-3">
          {result.verdict && (
            <div className="border border-rule bg-cream px-2.5 py-1.5">
              <p className="text-[15px] leading-relaxed text-ink">
                <Meta tone="amber">Verdict · </Meta>
                {result.verdict}
              </p>
            </div>
          )}
          <Readouts items={result.readouts} />
          {model.charts.map(c => (
            <ModelChart key={`${model.id}-${c.id}`} spec={c} data={result.data[c.id] ?? []} markX={c.kind === 'dots' ? markX : undefined} />
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-x-6 border-t border-rule-light pt-1.5 md:grid-cols-2">
        <Field label="Mechanism">{model.mechanism}</Field>
        <Field label="Armstrong">{model.armstrong}</Field>
      </div>

      <SubHead>What to watch</SubHead>
      <ul className="space-y-0.5">
        {model.watch.map(w => (
          <li key={w} className="flex gap-2 text-[14px] leading-relaxed text-ink-light">
            <span className="shrink-0 text-burgundy">→</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 border-t border-rule-light pt-1.5">
        <p className="text-[14px] leading-relaxed text-ink-light">
          <Meta tone="burgundy">Paper · </Meta>
          <span className="font-semibold text-ink">{model.paper.cite}.</span> {model.paper.title}.{' '}
          <span className="text-ink-muted">{model.paper.venue}.</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {model.paper.url && (
            <a href={model.paper.url} target="_blank" rel="noopener noreferrer" className={LINK}>
              Paper →
            </a>
          )}
          {model.paper.code?.map(c => (
            <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" className={LINK}>
              Code · {c.label} →
            </a>
          ))}
          {onRoadmap && (
            <Link href="/complexecon/roadmap" className={LINK}>
              On the roadmap top-30{onRoadmap.reproduce ? ' · reproduce' : ''} →
            </Link>
          )}
          {onShelf && (
            <Link href="/complexecon" className={LINK}>
              On the shelf →
            </Link>
          )}
        </div>
        <p className="mt-1 flex items-start gap-1.5 text-[13px] leading-snug text-ink-muted">
          <FidelityChip model={model} />
          <span>{model.fidelityNote}</span>
        </p>
      </div>
    </div>
  )
}

/** Short label for the phone pills: "V · Summers". */
const shortCite = (m: ModelSpec) => `${m.numeral} · ${m.paper.cite.replace(/\s*\(\d{4}\)\s*$/, '')}`

export default function ModelsSheet() {
  const { closedBlocks, toggleBlock } = useSheetState({ storageKey: 'complexecon-models', blockIds: BLOCK_IDS })
  const { state, set, loaded } = useParams()
  const { id: selectedId, select } = useSelected()
  const [seeds, setSeeds] = useState<Record<string, number>>({})

  const model = MODELS.find(m => m.id === selectedId) ?? MODELS[0]
  const faithful = MODELS.filter(m => m.fidelity === 'faithful').length
  const paramCount = MODELS.reduce((n, m) => n + m.params.length, 0)
  const chartCount = MODELS.reduce((n, m) => n + m.charts.length, 0)
  const onRoadmap = MODELS.filter(m => m.paper.roadmapId && CE_PAPERS.some(p => p.id === m.paper.roadmapId)).length

  const paramsFor = (m: ModelSpec) => {
    const saved = state[m.id]
    const base = defaultParams(m)
    if (!saved) return base
    // A saved key that no longer exists, or a new parameter, falls back to the default.
    for (const k of Object.keys(base)) if (typeof saved[k] === 'number') base[k] = saved[k]
    return base
  }
  const touched = (m: ModelSpec) => {
    const saved = state[m.id]
    return !!saved && m.params.some(p => typeof saved[p.key] === 'number' && Math.abs(saved[p.key] - p.default) > 1e-9)
  }

  const premiseOpen = !closedBlocks.has('blk-premise')

  return (
    <main className="text-ink lg:h-[100dvh] lg:overflow-hidden" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto flex h-full max-w-[1320px] flex-col px-3 py-3 md:px-5 md:py-4">
        <Masthead
          kicker="Lori Corpuz · Paper Reproductions"
          title={MODELS_FRAMING.title}
          meta="Ten papers, rebuilt with their parameters on sliders"
          active="models"
        />

        {/* ─── The premise and the numbers: one row, folds away to give the dashboard the screen ─── */}
        <div className="mb-3">
          <Block
            label="The Premise"
            meta={`${MODELS.length} models · ${faithful} faithful · ${MODELS.length - faithful} simplified`}
            open={premiseOpen}
            onToggle={() => toggleBlock('blk-premise')}
          >
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 border-b border-rule px-4 py-2.5 lg:border-b-0 lg:border-r">
                <p className="font-serif text-[20px] italic leading-snug text-ink">&ldquo;{MODELS_FRAMING.question}&rdquo;</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-light">{MODELS_FRAMING.statement}</p>
              </div>
              <div className="grid grid-cols-3 gap-px bg-rule-light sm:grid-cols-6 lg:w-[360px] lg:shrink-0 lg:grid-cols-3">
                {[
                  [MODELS.length, 'Models', false],
                  [faithful, 'Faithful', false],
                  [MODELS.length - faithful, 'Simplified', true],
                  [paramCount, 'Parameters', true],
                  [chartCount, 'Charts', true],
                  [onRoadmap, 'On the top-30', true],
                ].map(([v, l, muted]) => (
                  <div key={String(l)} className="bg-white">
                    <Stat value={v as number} label={l as string} muted={muted as boolean} />
                  </div>
                ))}
              </div>
            </div>
          </Block>
        </div>

        {/* ─── Phone: the models as a strip of pills; desktop: the list on the left ─── */}
        <div className="-mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3 pb-1 lg:hidden" role="tablist" aria-label="Models">
          {MODELS.map(m => {
            const active = m.id === model.id
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={active}
                onClick={() => select(m.id)}
                className={`min-h-[36px] shrink-0 rounded-sm border px-2 font-mono text-[12px] uppercase tracking-[0.5px] transition-colors ${
                  active ? 'border-burgundy bg-burgundy text-paper' : 'border-rule bg-white text-ink-muted hover:border-ink-faint hover:text-ink'
                }`}
              >
                {shortCite(m)}
              </button>
            )
          })}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 border border-rule bg-white lg:flex lg:flex-col">
            <div className="flex items-baseline justify-between gap-2 border-b border-rule bg-cream px-3 py-1">
              <span className="whitespace-nowrap font-serif text-[16px] font-semibold uppercase tracking-[1.5px] text-burgundy">The Models</span>
              <Meta>I–{MODELS[MODELS.length - 1].numeral}</Meta>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Models">
              {MODELS.map(m => {
                const active = m.id === model.id
                return (
                  <button
                    key={m.id}
                    role="option"
                    aria-selected={active}
                    onClick={() => select(m.id)}
                    className={`block w-full border-b border-l-2 border-b-rule-light px-3 py-2 text-left transition-colors last:border-b-0 ${
                      active ? 'border-l-burgundy bg-burgundy-bg' : 'border-l-transparent hover:bg-paper'
                    }`}
                  >
                    <span className="flex items-baseline gap-x-2">
                      <span className="w-[24px] shrink-0 font-serif text-[15px] font-semibold text-ink-faint">{m.numeral}</span>
                      <span className={`min-w-0 flex-1 font-serif text-[16px] font-semibold leading-snug ${active ? 'text-burgundy' : 'text-ink'}`}>
                        {m.paper.cite}
                      </span>
                      {loaded && touched(m) && (
                        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.5px] text-amber-ink" title="Parameters moved from the paper’s defaults">
                          tuned
                        </span>
                      )}
                      <FidelityChip model={m} />
                    </span>
                    <span className="mt-0.5 line-clamp-2 block pl-[32px] text-[13px] leading-snug text-ink-muted">{m.question}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="min-h-0 min-w-0 border border-rule bg-white lg:overflow-y-auto" aria-live="polite">
            {loaded && (
              <ModelPane
                key={model.id}
                model={model}
                params={paramsFor(model)}
                onChange={next => set(model.id, next)}
                seed={seeds[model.id] ?? 7}
                onReroll={() => setSeeds(s => ({ ...s, [model.id]: (s[model.id] ?? 7) + 1 }))}
              />
            )}
          </section>
        </div>

        <footer className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-1.5">
          <p className="font-serif text-[14px] italic text-ink-muted">
            A model you cannot move is a diagram; a parameter you cannot name is a guess.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon/models · settings stay with each model
          </p>
        </footer>
      </div>
    </main>
  )
}
