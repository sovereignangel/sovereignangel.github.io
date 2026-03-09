// ─── Strategic Priorities ───────────────────────────────────────────────
// Shared data for Surface Area view + Command Center KPI strip.
// Dalio: "Record reasoning at decision time." Simons: "Track the signal."
// One aggregate momentum score, 5 pillars, each with weighted importance.

export interface Activity {
  id: string
  label: string
  status: 'not_started' | 'active' | 'complete'
}

export interface StrategicPillar {
  key: string
  title: string
  weight: number  // % of total momentum (must sum to 100)
  description: string
  activities: Activity[]
}

export interface Venture {
  name: string
  status: 'active' | 'backlog' | 'killed'
  note: string
}

export const VENTURES: Venture[] = [
  { name: 'Armstrong', status: 'active', note: 'Platform you\'re building: CQL, paper trading, IB automation, strategy reverse-engineering.' },
  { name: 'Alamo Bernal', status: 'active', note: 'Prospective client. Close the partnership.' },
  { name: 'Arc (consumer)', status: 'active', note: 'Thesis Engine → consumer. arc.loricorpuz.com' },
  { name: 'Deep Tech Fund', status: 'backlog', note: 'Parked. Revisit after Armstrong + Bernal.' },
  { name: 'Manifold', status: 'backlog', note: 'Deprioritized. May revisit.' },
]

// 5 pillars, weighted by strategic importance
export const strategicPillars: StrategicPillar[] = [
  {
    key: 'alpha',
    title: 'Alpha & Capital',
    weight: 35,
    description: 'Build Armstrong + close clients. Sales → income is the #1 priority. Bernal is first, then more HF/FO.',
    activities: [
      { id: 'a1', label: 'IB paper trading automation (CQL → IB pipeline)', status: 'active' },
      { id: 'a2', label: 'Reverse-engineer & document CQL strategy logic', status: 'active' },
      { id: 'a3', label: 'Automate paper trades end-to-end', status: 'not_started' },
      { id: 'a4', label: 'Compute Sharpe / tearsheet on 300+ position history', status: 'not_started' },
      { id: 'a5', label: 'Close Alamo Bernal partnership', status: 'active' },
      { id: 'a6', label: 'Build HF/FO target list + outreach', status: 'not_started' },
    ],
  },
  {
    key: 'product',
    title: 'Product & Engineering',
    weight: 25,
    description: 'Arc consumer product + Thesis Engine. Ship artifacts that demonstrate capability.',
    activities: [
      { id: 'p1', label: 'Arc MVP scope + onboarding flow', status: 'not_started' },
      { id: 'p2', label: 'Arc landing page with clear value prop', status: 'active' },
      { id: 'p3', label: 'Get 5 beta users outside yourself', status: 'not_started' },
      { id: 'p4', label: 'Thesis Engine → consumer translation (ongoing)', status: 'active' },
    ],
  },
  {
    key: 'career',
    title: 'Career Safety Net',
    weight: 15,
    description: 'Fallback if client revenue takes time. Applied AI Eng / Product Owner roles in fintech.',
    activities: [
      { id: 'c1', label: 'Resume: emphasize Thesis Engine + Armstrong + AI stack', status: 'not_started' },
      { id: 'c2', label: 'Apply to 5 Applied AI Eng roles (fintech focus)', status: 'not_started' },
      { id: 'c3', label: 'Apply to 5 Product Owner / PM roles', status: 'not_started' },
      { id: 'c4', label: 'System design + product case interview prep', status: 'not_started' },
    ],
  },
  {
    key: 'muscle',
    title: 'Core Muscles',
    weight: 15,
    description: 'Research, finance, venture observation, philosophy/taste. The underlying capabilities.',
    activities: [
      { id: 'm1', label: 'Weekly research deep-dive (quant, market, or tech)', status: 'active' },
      { id: 'm2', label: 'Process intelligence feeds daily', status: 'active' },
      { id: 'm3', label: 'Maintain hypothesis ledger with conviction updates', status: 'active' },
      { id: 'm4', label: 'Weekly value observation log (market gaps, broken workflows)', status: 'active' },
      { id: 'm5', label: 'Daily journal → beliefs → decisions → principles', status: 'active' },
      { id: 'm6', label: 'Anki: reactivate actuarial/ME math foundations', status: 'not_started' },
    ],
  },
  {
    key: 'distribution',
    title: 'Distribution',
    weight: 10,
    description: 'X posts, research publishing, Saturday engineering pitches. Be visible.',
    activities: [
      { id: 'd1', label: 'Weekly X post (research, market take, or build update)', status: 'not_started' },
      { id: 'd2', label: 'Saturday engineering group pitch (weekly)', status: 'active' },
      { id: 'd3', label: 'Publish 1 research piece / month', status: 'not_started' },
    ],
  },
]

// ─── Momentum computation ──────────────────────────────────────────────

export interface PillarScore {
  key: string
  title: string
  weight: number
  score: number  // 0-100
  complete: number
  active: number
  total: number
}

export function computeMomentum(pillars: StrategicPillar[]): { score: number; pillarScores: PillarScore[] } {
  const pillarScores: PillarScore[] = pillars.map(p => {
    const total = p.activities.length
    const complete = p.activities.filter(a => a.status === 'complete').length
    const active = p.activities.filter(a => a.status === 'active').length
    // Complete = 100%, Active = 30% credit (you're doing it but haven't finished)
    const score = total > 0 ? Math.round(((complete + active * 0.3) / total) * 100) : 0
    return { key: p.key, title: p.title, weight: p.weight, score, complete, active, total }
  })

  // Weighted aggregate
  const score = Math.round(
    pillarScores.reduce((sum, ps) => sum + ps.score * (ps.weight / 100), 0)
  )

  return { score, pillarScores }
}
