'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getSalesAssessment,
  getRecentSalesAssessments,
  saveSalesAssessment,
} from '@/lib/firestore'
import { BELT_COLORS, BELT_BG_COLORS } from '@/lib/constants'
import type { SalesAssessment, SalesBelt, LayerScores, RuinConditions } from '@/lib/types'
import { BELT_ORDER, BELT_LABELS, getSystemState, SYSTEM_STATE_COLORS } from '@/lib/types'

const LAYER_KEYS: { key: keyof LayerScores; label: string }[] = [
  { key: 'intros', label: 'Intros' },
  { key: 'understanding', label: 'Understanding' },
  { key: 'trust', label: 'Trust' },
  { key: 'allies', label: 'Allies' },
  { key: 'asks', label: 'Asks' },
  { key: 'rhythm', label: 'Rhythm' },
  { key: 'cohort', label: 'Cohort' },
]

const RUIN_CONDITIONS: { key: keyof RuinConditions; label: string; fix: string }[] = [
  {
    key: 'fragmented',
    label: 'Network fragmented \u2014 all 30 weak',
    fix: 'Fix: Focus on 5 highest-potential contacts this week. Deliver value to each one.',
  },
  {
    key: 'unclear',
    label: 'Message unclear \u2014 people don\'t get it',
    fix: 'Fix: Test your one-liner with 5 new people. Track which version gets the best response.',
  },
  {
    key: 'noValue',
    label: 'No value flowing \u2014 all asks, no gives',
    fix: 'Fix: Send 3 value-first touches this week (intros, articles, insights) with zero ask.',
  },
]

const DEFAULT_LAYERS: LayerScores = {
  intros: 5,
  understanding: 5,
  trust: 5,
  allies: 5,
  asks: 5,
  rhythm: 5,
  cohort: 5,
}

const DEFAULT_RUIN: RuinConditions = {
  fragmented: false,
  unclear: false,
  noValue: false,
}

function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export default function AuditView() {
  const { user } = useAuth()
  const monthKey = getCurrentMonthKey()

  const [assessment, setAssessment] = useState<Partial<SalesAssessment> | null>(null)
  const [recentAssessments, setRecentAssessments] = useState<SalesAssessment[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Form state
  const [oneLiner, setOneLiner] = useState('')
  const [oneLinerClarityScore, setOneLinerClarityScore] = useState(3)
  const [coldResponseRate, setColdResponseRate] = useState(0)
  const [warmIntroRate, setWarmIntroRate] = useState(0)
  const [warmConversionRate, setWarmConversionRate] = useState(0)
  const [testimonialsCount, setTestimonialsCount] = useState(0)
  const [contentPublished, setContentPublished] = useState(0)
  const [inboundInquiriesMonth, setInboundInquiriesMonth] = useState(0)
  const [ruinConditions, setRuinConditions] = useState<RuinConditions>(DEFAULT_RUIN)
  const [layerScores, setLayerScores] = useState<LayerScores>(DEFAULT_LAYERS)
  const [currentBelt, setCurrentBelt] = useState<SalesBelt>('white')
  const [beltProgress, setBeltProgress] = useState(0)
  const [nextMonthFocus, setNextMonthFocus] = useState('')

  const loadData = useCallback(async () => {
    if (!user) return
    const [existing, recent] = await Promise.all([
      getSalesAssessment(user.uid, monthKey),
      getRecentSalesAssessments(user.uid, 6),
    ])
    setRecentAssessments(recent)

    if (existing) {
      setAssessment(existing)
      populateForm(existing)
      setIsEditing(false)
    } else {
      setAssessment(null)
      setIsEditing(true)
    }
  }, [user, monthKey])

  useEffect(() => { loadData() }, [loadData])

  const populateForm = (data: Partial<SalesAssessment>) => {
    setOneLiner(data.oneLiner || '')
    setOneLinerClarityScore(data.oneLinerClarityScore || 3)
    setColdResponseRate(data.coldResponseRate || 0)
    setWarmIntroRate(data.warmIntroRate || 0)
    setWarmConversionRate(data.warmConversionRate || 0)
    setTestimonialsCount(data.testimonialsCount || 0)
    setContentPublished(data.contentPublished || 0)
    setInboundInquiriesMonth(data.inboundInquiriesMonth || 0)
    setRuinConditions(data.ruinConditions || DEFAULT_RUIN)
    setLayerScores(data.layerScores || DEFAULT_LAYERS)
    setCurrentBelt(data.currentBelt || 'white')
    setBeltProgress(data.beltProgress || 0)
    setNextMonthFocus(data.nextMonthFocus || '')
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const data: Partial<SalesAssessment> = {
      oneLiner,
      oneLinerClarityScore,
      coldResponseRate,
      warmIntroRate,
      warmConversionRate,
      testimonialsCount,
      contentPublished,
      inboundInquiriesMonth,
      ruinConditions,
      layerScores,
      currentBelt,
      beltProgress,
      nextMonthFocus,
    }
    await saveSalesAssessment(user.uid, monthKey, data)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
    setAssessment(data)
    setIsEditing(false)
    // Reload recent
    const recent = await getRecentSalesAssessments(user.uid, 6)
    setRecentAssessments(recent)
  }

  const updateLayer = (key: keyof LayerScores, value: number) => {
    setLayerScores(prev => ({ ...prev, [key]: value }))
  }

  const toggleRuin = (key: keyof RuinConditions) => {
    setRuinConditions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const showForm = isEditing || !assessment

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Monthly Audit
          </h4>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-ink-muted">
              {monthKey.slice(0, 7)}
            </span>
            {assessment && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-burgundy hover:text-burgundy transition-colors"
              >
                Edit
              </button>
            )}
            <span className="font-mono text-[9px] text-ink-muted">
              {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
            </span>
          </div>
        </div>

        {showForm ? (
          <div className="space-y-3">
            {/* 1. Message Clarity */}
            <div className="border-b border-rule-light pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Message Clarity
              </h5>
              <div className="mb-1.5">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Your one-liner
                </label>
                <textarea
                  value={oneLiner}
                  onChange={(e) => setOneLiner(e.target.value)}
                  className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[36px] resize-y"
                  placeholder="I help [who] achieve [what] by [how]..."
                />
              </div>
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Clarity Score
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setOneLinerClarityScore(n)}
                      className={`font-mono text-[9px] font-medium w-7 h-7 rounded-sm border transition-colors ${
                        oneLinerClarityScore === n
                          ? 'bg-burgundy text-paper border-burgundy'
                          : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Pattern Recognition */}
            <div className="border-b border-rule-light pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Pattern Recognition
              </h5>
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Cold Response Rate (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={coldResponseRate || ''}
                  onChange={(e) => setColdResponseRate(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 3. Network Health */}
            <div className="border-b border-rule-light pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Network Health
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                    Warm Intro Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={warmIntroRate || ''}
                    onChange={(e) => setWarmIntroRate(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                    Warm Conversion (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={warmConversionRate || ''}
                    onChange={(e) => setWarmConversionRate(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* 4. Credibility */}
            <div className="border-b border-rule-light pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Credibility
              </h5>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                    Testimonials
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={testimonialsCount || ''}
                    onChange={(e) => setTestimonialsCount(parseInt(e.target.value) || 0)}
                    className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                    Content Published
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={contentPublished || ''}
                    onChange={(e) => setContentPublished(parseInt(e.target.value) || 0)}
                    className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                    Inbound
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={inboundInquiriesMonth || ''}
                    onChange={(e) => setInboundInquiriesMonth(parseInt(e.target.value) || 0)}
                    className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* 5. Ruin Check */}
            <div className="border-b border-rule-light pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Ruin Check
              </h5>
              <div className="space-y-1.5">
                {RUIN_CONDITIONS.map(({ key, label, fix }) => (
                  <div key={key}>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ruinConditions[key]}
                        onChange={() => toggleRuin(key)}
                        className="w-3 h-3 mt-0.5 rounded-sm accent-red-ink"
                      />
                      <span className={`font-mono text-[10px] ${
                        ruinConditions[key] ? 'text-red-ink font-semibold' : 'text-ink'
                      }`}>
                        {label}
                      </span>
                    </label>
                    {ruinConditions[key] && (
                      <p className="font-serif text-[9px] italic text-red-ink ml-5 mt-0.5">
                        {fix}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Belt Verdict */}
            <div className="border-b border-rule-light pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Belt Verdict
              </h5>
              <div className="mb-1.5">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Current Belt
                </label>
                <select
                  value={currentBelt}
                  onChange={(e) => setCurrentBelt(e.target.value as SalesBelt)}
                  className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                >
                  {BELT_ORDER.map(belt => (
                    <option key={belt} value={belt}>{BELT_LABELS[belt]}</option>
                  ))}
                </select>
              </div>
              <div className="mb-1.5">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Progress ({beltProgress}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={beltProgress}
                  onChange={(e) => setBeltProgress(parseInt(e.target.value))}
                  className="w-full h-1.5 accent-burgundy"
                />
              </div>
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                  Next month focus
                </label>
                <textarea
                  value={nextMonthFocus}
                  onChange={(e) => setNextMonthFocus(e.target.value)}
                  className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
                  placeholder="Primary focus for next month..."
                />
              </div>
            </div>

            {/* 7-Layer Stack */}
            <div className="border-b border-rule-light pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                7-Layer Stack
              </h5>
              <div className="space-y-1.5">
                {LAYER_KEYS.map(({ key, label }) => {
                  const value = layerScores[key]
                  const state = getSystemState(value / 10)
                  const colors = SYSTEM_STATE_COLORS[state]
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-ink-muted w-20 shrink-0">{label}</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={value}
                        onChange={(e) => updateLayer(key, Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-10 font-mono text-[10px] text-center bg-cream border border-rule rounded-sm py-0.5 focus:outline-none focus:border-burgundy"
                      />
                      <div className="flex-1 h-2 bg-rule-light rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all"
                          style={{
                            width: `${value * 10}%`,
                            backgroundColor: state === 'NOMINAL' ? '#2d5f3f' : state === 'WATCH' ? '#9a928a' : state === 'CAUTION' ? '#8a6d2f' : '#8c2d2d',
                          }}
                        />
                      </div>
                      <span className={`font-mono text-[7px] w-14 text-right ${colors.text}`}>
                        {state}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Belt Progression Bar */}
            <div className="pb-2.5">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Belt Progression
              </h5>
              <div className="flex items-center gap-2 mb-1.5">
                {BELT_ORDER.map((belt, i) => {
                  const currentIdx = BELT_ORDER.indexOf(currentBelt)
                  const isFilled = i <= currentIdx
                  return (
                    <div key={belt} className="flex flex-col items-center gap-0.5">
                      <div className={`w-4 h-4 rounded-sm border ${
                        isFilled
                          ? `${BELT_BG_COLORS[belt]} ${BELT_COLORS[belt]} border-current`
                          : 'bg-rule-light border-rule'
                      }`} />
                      <span className={`font-mono text-[6px] capitalize ${
                        isFilled ? BELT_COLORS[belt] : 'text-ink-faint'
                      }`}>
                        {belt}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Progress within current belt */}
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[8px] ${BELT_COLORS[currentBelt]}`}>
                  {BELT_LABELS[currentBelt]}
                </span>
                <div className="flex-1 h-1 bg-rule-light rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm bg-burgundy transition-all"
                    style={{ width: `${beltProgress}%` }}
                  />
                </div>
                <span className="font-mono text-[8px] text-ink-muted">{beltProgress}%</span>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-1.5 font-serif text-[9px] font-semibold uppercase tracking-[1px] text-paper bg-burgundy rounded-sm hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        ) : (
          /* Read-only view when assessment exists and not editing */
          <ReadOnlyAssessment assessment={assessment} />
        )}
      </div>

      {/* Historical Assessments */}
      {recentAssessments.length > 0 && (
        <div className="bg-paper border border-rule rounded-sm p-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
            History
          </h4>
          <div className="space-y-1.5">
            {recentAssessments.map((a) => (
              <div key={a.date} className="flex items-center justify-between py-1 border-b border-rule-light/50">
                <span className="font-mono text-[10px] text-ink">{a.date.slice(0, 7)}</span>
                <span className={`font-mono text-[9px] font-medium ${BELT_COLORS[a.currentBelt]}`}>
                  {BELT_LABELS[a.currentBelt]}
                </span>
                <span className="font-mono text-[8px] text-ink-muted">
                  Clarity: {a.oneLinerClarityScore}/5
                </span>
                <span className="font-mono text-[8px] text-ink-muted">
                  Warm: {a.warmIntroRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReadOnlyAssessment({ assessment }: { assessment: Partial<SalesAssessment> | null }) {
  if (!assessment) return null

  const layers = assessment.layerScores || {
    intros: 0, understanding: 0, trust: 0, allies: 0, asks: 0, rhythm: 0, cohort: 0,
  }

  return (
    <div className="space-y-2.5">
      {/* One-liner */}
      <div>
        <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">One-liner</p>
        <p className="font-mono text-[11px] text-ink">{assessment.oneLiner || '\u2014'}</p>
        <p className="font-mono text-[9px] text-ink-muted mt-0.5">Clarity: {assessment.oneLinerClarityScore}/5</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="border border-rule-light rounded-sm p-1.5 text-center">
          <p className="font-serif text-[7px] italic uppercase text-ink-muted">Cold Response</p>
          <p className="font-mono text-[13px] font-bold text-ink">{assessment.coldResponseRate || 0}%</p>
        </div>
        <div className="border border-rule-light rounded-sm p-1.5 text-center">
          <p className="font-serif text-[7px] italic uppercase text-ink-muted">Warm Intro</p>
          <p className="font-mono text-[13px] font-bold text-ink">{assessment.warmIntroRate || 0}%</p>
        </div>
        <div className="border border-rule-light rounded-sm p-1.5 text-center">
          <p className="font-serif text-[7px] italic uppercase text-ink-muted">Conversion</p>
          <p className="font-mono text-[13px] font-bold text-ink">{assessment.warmConversionRate || 0}%</p>
        </div>
      </div>

      {/* Belt */}
      <div className="flex items-center gap-2">
        <span className={`font-mono text-[11px] font-semibold ${BELT_COLORS[assessment.currentBelt || 'white']}`}>
          {BELT_LABELS[assessment.currentBelt || 'white']}
        </span>
        <div className="flex-1 h-1.5 bg-rule-light rounded-sm overflow-hidden">
          <div className="h-full bg-burgundy rounded-sm" style={{ width: `${assessment.beltProgress || 0}%` }} />
        </div>
        <span className="font-mono text-[8px] text-ink-muted">{assessment.beltProgress || 0}%</span>
      </div>

      {/* Layer stack summary */}
      <div className="space-y-1">
        {LAYER_KEYS.map(({ key, label }) => {
          const value = layers[key]
          const state = getSystemState(value / 10)
          const colors = SYSTEM_STATE_COLORS[state]
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-ink-muted w-16 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-rule-light rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${value * 10}%`,
                    backgroundColor: state === 'NOMINAL' ? '#2d5f3f' : state === 'WATCH' ? '#9a928a' : state === 'CAUTION' ? '#8a6d2f' : '#8c2d2d',
                  }}
                />
              </div>
              <span className={`font-mono text-[7px] w-4 text-right ${colors.text}`}>{value}</span>
            </div>
          )
        })}
      </div>

      {/* Ruin conditions */}
      {assessment.ruinConditions && Object.values(assessment.ruinConditions).some(v => v) && (
        <div className="bg-red-bg border border-red-ink/20 rounded-sm p-2">
          <p className="font-serif text-[8px] font-semibold uppercase text-red-ink mb-1">Active Ruin Conditions</p>
          {RUIN_CONDITIONS.filter(r => assessment.ruinConditions?.[r.key]).map(r => (
            <p key={r.key} className="font-mono text-[9px] text-red-ink">{r.label}</p>
          ))}
        </div>
      )}

      {/* Next month focus */}
      {assessment.nextMonthFocus && (
        <div>
          <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">Next Month Focus</p>
          <p className="font-mono text-[10px] text-ink">{assessment.nextMonthFocus}</p>
        </div>
      )}
    </div>
  )
}
