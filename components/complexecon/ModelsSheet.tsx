'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Block,
  FlatRow,
  Masthead,
  Meta,
  Row,
  SheetHead,
  Stat,
  useSheetState,
} from '@/components/complexecon/tearsheet'
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
const BLOCK_IDS = ['blk-premise', 'blk-models', 'blk-index']

const FIDELITY_LABEL = { faithful: 'Faithful', simplified: 'Simplified' } as const
const FIDELITY_CLASS = {
  faithful: 'bg-green-bg text-green-ink border-green-ink/30',
  simplified: 'bg-amber-bg text-amber-ink border-amber-ink/30',
} as const

type ParamState = Record<string, Record<string, number>>

/** Slider values per model, remembered per browser so a page reopens as it was left. */
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
    <p className="text-[16px] leading-relaxed text-ink-muted">
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
    <span className={`rounded-sm border px-1 py-px font-mono text-[11px] uppercase tracking-[0.5px] ${FIDELITY_CLASS[model.fidelity]}`}>
      {FIDELITY_LABEL[model.fidelity]}
    </span>
  )
}

function ModelBody({
  model,
  params,
  onChange,
}: {
  model: ModelSpec
  params: Record<string, number>
  onChange: (next: Record<string, number> | null) => void
}) {
  const [seed, setSeed] = useState(7)
  const result = useMemo(() => model.simulate(params, seed), [model, params, seed])
  const onRoadmap = model.paper.roadmapId ? CE_PAPERS.find(p => p.id === model.paper.roadmapId) : undefined
  const onShelf = model.paper.libraryId
    ? LIBRARY.flatMap(t => t.items).find(i => i.id === model.paper.libraryId)
    : undefined
  const changed = model.params.some(p => Math.abs(params[p.key] - p.default) > 1e-9)
  // The bifurcation panel marks the current β; other dot fields have no marker.
  const markX = model.id === 'brock-hommes' ? params.beta : undefined

  return (
    <>
      <p className="mb-2 font-serif text-[18px] italic leading-snug text-ink">{model.answer}</p>

      <div className="grid grid-cols-1 gap-x-5 gap-y-3 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside>
          <div className="flex items-baseline justify-between gap-2 border-b border-rule pb-1">
            <SubHead>Parameters</SubHead>
            <span className="flex gap-1">
              <button
                onClick={() => setSeed(s => s + 1)}
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
              <p className="text-[16px] leading-relaxed text-ink">
                <Meta tone="amber">Verdict · </Meta>
                {result.verdict}
              </p>
            </div>
          )}
          <Readouts items={result.readouts} />
          {model.charts.map(c => (
            <ModelChart key={c.id} spec={c} data={result.data[c.id] ?? []} markX={c.kind === 'dots' ? markX : undefined} />
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
          <li key={w} className="flex gap-2 text-[15px] leading-relaxed text-ink-light">
            <span className="shrink-0 text-burgundy">→</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 border-t border-rule-light pt-1.5">
        <p className="text-[15px] leading-relaxed text-ink-light">
          <Meta tone="burgundy">Paper · </Meta>
          <span className="font-semibold text-ink">{model.paper.cite}.</span> {model.paper.title}.{' '}
          <span className="text-ink-muted">{model.paper.venue}.</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {model.paper.url && (
            <a
              href={model.paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
            >
              Paper →
            </a>
          )}
          {model.paper.code?.map(c => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
            >
              Code · {c.label} →
            </a>
          ))}
          {onRoadmap && (
            <Link
              href="/complexecon/roadmap"
              className="font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
            >
              On the roadmap top-30{onRoadmap.reproduce ? ' · reproduce' : ''} →
            </Link>
          )}
          {onShelf && (
            <Link
              href="/complexecon"
              className="font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted underline decoration-rule underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
            >
              On the shelf →
            </Link>
          )}
          <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
            <FidelityChip model={model} />
            {model.fidelityNote}
          </span>
        </div>
      </div>
    </>
  )
}

export default function ModelsSheet() {
  const { openRows, closedBlocks, toggleRow, toggleBlock, expandAll, collapseAll } = useSheetState({
    storageKey: 'complexecon-models',
    blockIds: BLOCK_IDS,
    defaultRows: [MODELS[0].id],
  })
  const { state, set, loaded } = useParams()

  const faithful = MODELS.filter(m => m.fidelity === 'faithful').length
  const paramCount = MODELS.reduce((n, m) => n + m.params.length, 0)
  const chartCount = MODELS.reduce((n, m) => n + m.charts.length, 0)
  const onRoadmap = MODELS.filter(m => m.paper.roadmapId && CE_PAPERS.some(p => p.id === m.paper.roadmapId)).length
  const allRowIds = MODELS.map(m => m.id)

  const paramsFor = (m: ModelSpec) => {
    const saved = state[m.id]
    const base = defaultParams(m)
    if (!saved) return base
    // A saved key that no longer exists, or a new parameter, falls back to the default.
    for (const k of Object.keys(base)) if (typeof saved[k] === 'number') base[k] = saved[k]
    return base
  }

  return (
    <main className="min-h-screen text-ink" style={{ background: '#f5f1ea' }}>
      <div className="mx-auto max-w-[1320px] px-3 py-5 md:px-5 md:py-7">
        <Masthead
          kicker="Lori Corpuz · Paper Reproductions"
          title={MODELS_FRAMING.title}
          meta="Ten papers, rebuilt with their parameters on sliders"
          active="models"
        />

        <SheetHead
          question={MODELS_FRAMING.question}
          subline="Move a parameter · watch the result · read the paper"
          openCount={openRows.size}
          onExpandAll={() => expandAll(allRowIds)}
          onCollapseAll={collapseAll}
          stats={
            <>
              <Stat value={MODELS.length} label="Models" />
              <Stat value={faithful} label="Faithful" />
              <Stat muted value={MODELS.length - faithful} label="Simplified" />
              <Stat muted value={paramCount} label="Parameters" />
              <Stat muted value={chartCount} label="Charts" />
              <Stat muted value={onRoadmap} label="On the top-30" />
            </>
          }
        />

        <div className="mb-3 space-y-3">
          <Block
            label="The Premise"
            meta="Framing"
            open={!closedBlocks.has('blk-premise')}
            onToggle={() => toggleBlock('blk-premise')}
          >
            <FlatRow>
              <p className="font-serif text-[18px] leading-relaxed text-ink">{MODELS_FRAMING.statement}</p>
            </FlatRow>
          </Block>

          <Block
            label="The Models"
            meta={`I–${MODELS[MODELS.length - 1].numeral} · in reading order`}
            open={!closedBlocks.has('blk-models')}
            onToggle={() => toggleBlock('blk-models')}
          >
            {MODELS.map(model => (
              <Row
                key={model.id}
                open={openRows.has(model.id)}
                onToggle={() => toggleRow(model.id)}
                head={
                  <span className="flex flex-col gap-px">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-serif text-[17px] font-semibold text-ink-faint">{model.numeral}</span>
                      <span className="font-serif text-[19px] font-semibold leading-snug text-ink">{model.question}</span>
                    </span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">{model.paper.cite}</span>
                  </span>
                }
                meta={<FidelityChip model={model} />}
              >
                {loaded && <ModelBody model={model} params={paramsFor(model)} onChange={next => set(model.id, next)} />}
              </Row>
            ))}
          </Block>

          <Block
            label="The Index"
            meta="§ · one line each"
            open={!closedBlocks.has('blk-index')}
            onToggle={() => toggleBlock('blk-index')}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="px-3 py-1.5 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">№</th>
                    <th className="px-3 py-1.5 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">Paper</th>
                    <th className="px-3 py-1.5 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">What it decides</th>
                    <th className="px-3 py-1.5 text-right font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">Params</th>
                    <th className="px-3 py-1.5 text-left font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">Fidelity</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map(m => (
                    <tr key={m.id} className="border-b border-rule-light align-top last:border-b-0">
                      <td className="px-3 py-1.5 font-serif text-[15px] font-semibold text-ink-faint">{m.numeral}</td>
                      <td className="px-3 py-1.5">
                        <button onClick={() => toggleRow(m.id)} className="text-left font-serif text-[16px] font-semibold text-ink hover:text-burgundy">
                          {m.paper.cite}
                        </button>
                        <span className="block text-[13px] text-ink-muted">{m.paper.title}</span>
                      </td>
                      <td className="px-3 py-1.5 text-[14px] leading-snug text-ink-light">{m.question}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-[14px] text-ink">{m.params.length}</td>
                      <td className="px-3 py-1.5">
                        <FidelityChip model={m} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>
        </div>

        <footer className="flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2">
          <p className="font-serif text-[16px] italic text-ink-muted">
            A model you cannot move is a diagram; a parameter you cannot name is a guess.
          </p>
          <p className="font-mono text-[12px] uppercase tracking-[2px] text-ink-faint">
            loricorpuz.com/complexecon/models · paper reproductions
          </p>
        </footer>
      </div>
    </main>
  )
}
