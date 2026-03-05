'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAlphaExperiments } from '@/hooks/useAlphaExperiments'
import type { AlphaExperimentDomain } from '@/lib/types'

const DOMAINS: { value: AlphaExperimentDomain; label: string }[] = [
  { value: 'financial', label: 'Financial' },
  { value: 'indie_hacker', label: 'Indie Hacker' },
  { value: 'career', label: 'Career' },
  { value: 'knowledge', label: 'Knowledge' },
]

export default function AlphaLabView() {
  const { user } = useAuth()
  const { designing, save, remove } = useAlphaExperiments(user?.uid)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [thesis, setThesis] = useState('')
  const [domain, setDomain] = useState<AlphaExperimentDomain>('financial')
  const [strategy, setStrategy] = useState('')
  const [expectedOutcome, setExpectedOutcome] = useState('')
  const [killCriteria, setKillCriteria] = useState<string[]>([''])
  const [timeHorizonDays, setTimeHorizonDays] = useState(30)
  const [investmentDescription, setInvestmentDescription] = useState('')

  const resetForm = () => {
    setTitle('')
    setThesis('')
    setDomain('financial')
    setStrategy('')
    setExpectedOutcome('')
    setKillCriteria([''])
    setTimeHorizonDays(30)
    setInvestmentDescription('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!title.trim() || !thesis.trim()) return
    await save({
      title: title.trim(),
      thesis: thesis.trim(),
      domain,
      strategy: strategy.trim(),
      expectedOutcome: expectedOutcome.trim(),
      killCriteria: killCriteria.filter(k => k.trim()),
      timeHorizonDays,
      investmentDescription: investmentDescription.trim(),
      status: 'design',
      linkedSignalIds: [],
      linkedHypothesisIds: [],
      logEntries: [],
    }, editingId || undefined)
    resetForm()
  }

  const handleLaunch = async (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    await save({ status: 'live', startDate: today }, id)
  }

  const handleEdit = (exp: typeof designing[0]) => {
    setTitle(exp.title)
    setThesis(exp.thesis)
    setDomain(exp.domain)
    setStrategy(exp.strategy)
    setExpectedOutcome(exp.expectedOutcome)
    setKillCriteria(exp.killCriteria.length > 0 ? exp.killCriteria : [''])
    setTimeHorizonDays(exp.timeHorizonDays)
    setInvestmentDescription(exp.investmentDescription)
    setEditingId(exp.id!)
    setShowForm(true)
  }

  const addKillCriterion = () => setKillCriteria([...killCriteria, ''])
  const updateKillCriterion = (i: number, v: string) => {
    const next = [...killCriteria]
    next[i] = v
    setKillCriteria(next)
  }
  const removeKillCriterion = (i: number) => setKillCriteria(killCriteria.filter((_, j) => j !== i))

  const domainColor = (d: string) => {
    switch (d) {
      case 'financial': return 'text-green-ink bg-green-bg border-green-ink/20'
      case 'indie_hacker': return 'text-burgundy bg-burgundy-bg border-burgundy/20'
      case 'career': return 'text-amber-ink bg-amber-bg border-amber-ink/20'
      default: return 'text-ink-muted bg-cream border-rule'
    }
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Strategy Lab
          </h3>
          <p className="font-sans text-[9px] text-ink-muted mt-0.5">
            Design experiments with kill criteria — launch when ready
          </p>
        </div>
        <button
          onClick={() => { showForm ? resetForm() : setShowForm(true) }}
          className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
            showForm
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
          }`}
        >
          {showForm ? 'Cancel' : '+ Experiment'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-rule rounded-sm p-3 space-y-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Experiment title..."
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
          />
          <textarea
            value={thesis}
            onChange={e => setThesis(e.target.value)}
            placeholder="I believe that..."
            rows={2}
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy resize-none"
          />
          <div className="flex gap-2">
            <select
              value={domain}
              onChange={e => setDomain(e.target.value as AlphaExperimentDomain)}
              className="font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-burgundy"
            >
              {DOMAINS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={timeHorizonDays}
              onChange={e => setTimeHorizonDays(Number(e.target.value))}
              className="w-20 font-mono text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-burgundy"
            />
            <span className="font-sans text-[10px] text-ink-muted self-center">days</span>
          </div>
          <textarea
            value={strategy}
            onChange={e => setStrategy(e.target.value)}
            placeholder="Strategy — what are you doing to test this?"
            rows={2}
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy resize-none"
          />
          <input
            value={expectedOutcome}
            onChange={e => setExpectedOutcome(e.target.value)}
            placeholder="Expected outcome — what does success look like?"
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
          />
          <input
            value={investmentDescription}
            onChange={e => setInvestmentDescription(e.target.value)}
            placeholder="Investment — what are you risking? (time, money, reputation)"
            className="w-full font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1.5 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
          />

          {/* Kill Criteria */}
          <div>
            <span className="font-sans text-[10px] text-ink-muted block mb-1">Kill Criteria</span>
            {killCriteria.map((k, i) => (
              <div key={i} className="flex gap-1 mb-1">
                <input
                  value={k}
                  onChange={e => updateKillCriterion(i, e.target.value)}
                  placeholder={`Kill criterion ${i + 1}...`}
                  className="flex-1 font-sans text-[11px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
                />
                {killCriteria.length > 1 && (
                  <button
                    onClick={() => removeKillCriterion(i)}
                    className="font-mono text-[10px] text-ink-muted hover:text-red-ink px-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addKillCriterion}
              className="font-sans text-[9px] text-ink-muted hover:text-ink"
            >
              + add criterion
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim() || !thesis.trim()}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40"
          >
            {editingId ? 'Update' : 'Save Draft'}
          </button>
        </div>
      )}

      {/* Designing Experiments */}
      {designing.length === 0 && !showForm ? (
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <p className="font-sans text-[10px] text-ink-muted">No experiments in design. Create one or promote a thesis.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {designing.map(exp => (
            <div key={exp.id} className="bg-white border border-rule rounded-sm p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="font-sans text-[11px] font-semibold text-ink">{exp.title}</span>
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${domainColor(exp.domain)}`}>
                      {exp.domain.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-sans text-[9px] text-ink-muted">{exp.thesis}</p>
                  {exp.strategy && (
                    <p className="font-sans text-[9px] text-ink mt-0.5">Strategy: {exp.strategy}</p>
                  )}
                  {exp.killCriteria.length > 0 && (
                    <div className="mt-1">
                      <span className="font-mono text-[8px] text-ink-muted">Kill if: </span>
                      {exp.killCriteria.map((k, i) => (
                        <span key={i} className="font-mono text-[8px] text-red-ink">
                          {i > 0 && ' · '}{k}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[9px] text-ink-muted">{exp.timeHorizonDays}d horizon</span>
                    {exp.investmentDescription && (
                      <span className="font-mono text-[9px] text-ink-muted">Risk: {exp.investmentDescription}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleLaunch(exp.id!)}
                    className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border bg-green-ink text-paper border-green-ink"
                  >
                    Launch
                  </button>
                  <button
                    onClick={() => handleEdit(exp)}
                    className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => exp.id && remove(exp.id)}
                    className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border bg-transparent text-red-ink border-red-ink/30 hover:bg-burgundy-bg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
