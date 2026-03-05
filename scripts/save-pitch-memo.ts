// Save Thesis Engine accelerator pitch memo to Firestore
// Run with: npx tsx scripts/save-pitch-memo.ts

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const saPath = resolve(process.cwd(), 'scripts/firebase-service-account.json')
const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'))
const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app)

const memo = {
  // Page 1 — Executive Summary
  companyPurpose: 'Thesis Engine applies hedge fund portfolio management to personal performance, giving ambitious builders a daily reward signal that measures whether they are compounding or fragmenting.',

  executiveSummary: 'Personal OS That Scores Your Life Like a Portfolio\n• Computes a daily 0–10 reward score from 8 weighted components: generative energy, intelligence growth, value creation, capture ratio, nervous system gate, coherence, fragmentation penalty, and optionality bonus\n• Built and dogfooded by a solo founder with 95%+ daily usage over 3+ months — every feature is pressure-tested against real human behavior\n• Integrates Telegram bot for real-time signal capture, AI-powered transcript processing (7 extraction templates), and automated Garmin health data sync\n• Revenue model: B2C subscription for ambitious founders and operators ($29–$79/mo) + B2B team tier for accelerators and executive coaching programs',

  keyMetrics: [
    { label: 'Daily Usage', value: '95%+', context: '3+ months sustained' },
    { label: 'Reward Components', value: '8', context: 'Mathematically weighted' },
    { label: 'AI Integrations', value: '3', context: 'Gemini + Claude + Garmin' },
    { label: 'Time to Log', value: '<5 min', context: 'Daily friction target' },
    { label: 'Ship Cadence', value: 'Weekly', context: 'Continuous deployment' },
    { label: 'Build Time', value: '3 mo', context: 'Solo founder, full-stack' },
  ],

  // Core Narrative
  problem: 'Knowledge Workers Fly Blind on What Compounds\n• Ambitious builders fragment across too many projects with no real-time signal on which efforts generate returns — they track tasks, not compounding\n• Decision-making degrades under stress with no systematic way to detect when nervous system state is hijacking strategy — the equivalent of trading while tilted\n• Existing tools (Notion, Todoist, journaling apps) track inputs without computing whether those inputs translate into meaningful output or coherent progress\n• Solo founders lack the institutional feedback loops — daily P&L, portfolio review, risk limits, drawdown alerts — that hedge funds use to maintain performance',

  solution: 'A Reward Function That Treats Your Life as a Portfolio\n• Daily reward score: 10 × gate × (GE^0.35 × GI^0.2 × GVC^0.2 × κ^0.25) × (1−frag) × optionality × θ — each component calibrated to specific behavioral inputs\n• Nervous system "gate" variable (0.3–1.0) acts as a circuit breaker: when emotionally spiked, the system enforces a 24-hour decision moratorium — like a trading halt\n• AI-powered signal capture via Telegram bot processes conversations and extracts hypotheses, decisions, contacts, and venture specs into structured data automatically\n• Coherence score (θ) penalizes misalignment between stated priorities and actual time allocation — the portfolio drift detector',

  whyNow: 'AI Makes Real-Time Life Portfolio Management Possible\n• LLM APIs (Gemini, Claude) enable automated extraction and synthesis that was impossible 2 years ago — raw conversations become structured data without manual tagging\n• Solo founder economy is exploding: 38M self-employed Americans, creator economy valued at $250B — these people need institutional-grade performance tools\n• Wearable data (Garmin, Oura, Whoop) is finally rich enough to serve as objective energy inputs to a reward function, not just fitness metrics\n• Remote work eliminated institutional structure — no manager, no office, no built-in feedback loop — creating a regulation gap that software must fill',

  insight: 'The Missing Piece Is a Reward Signal, Not More Tracking\n• Every failed personal dashboard makes the same error: tracking what you did without computing whether it compounded — like a fund that logs trades but never computes P&L\n• The breakthrough is applying reinforcement learning to human behavior: define a reward function, measure state transitions, optimize the policy over time\n• Nervous system regulation is not a wellness feature — it is the risk management layer; a fund manager trading while panicked loses money, a founder deciding while spiked fragments their portfolio\n• The system works because its builder lives inside it: dogfooding at 95%+ daily usage means every feature survives contact with real human behavior',

  // Market
  marketSize: 'Global productivity software ($102B TAM) narrowing to solo founders and ambitious operators ($8.2B SAM) with early focus on power users who already think in terms of compounding, optionality, and risk-adjusted returns ($200M SOM).',

  marketSizeTable: [
    { segment: 'TAM', size: '$102B', cagr: '13%', notes: 'Global productivity software' },
    { segment: 'SAM', size: '$8.2B', cagr: '18%', notes: 'Solo founders + ambitious operators' },
    { segment: 'SOM', size: '$200M', cagr: '25%', notes: 'Power users with portfolio mindset' },
  ],

  marketDynamics: 'Convergence of AI, Wearables, and the Solo Economy\n• AI-native tools replacing manual journaling — Notion AI, Lex, Reflect — but none compute a unified reward signal across energy, output, and coherence\n• Wearable data finally rich enough (sleep stages, HRV, training load) to serve as objective inputs, not just fitness metrics\n• The "life as portfolio" mental model resonates with finance-adjacent builders, quant traders, and operators who already think in compounding and risk-adjusted terms\n• Burnout epidemic ($300B/yr cost to employers) creating demand for performance systems that integrate regulation, not just productivity',

  // Competition
  competitiveLandscape: 'No existing tool combines a mathematical reward function, nervous system gating, AI signal extraction, and wearable integration into a single daily operating system.',

  competitorTable: [
    { feature: 'Daily reward score', us: 'Yes — 8-component model', competitors: { 'Notion': 'No', 'Sunsama': 'No', 'Superhuman': 'No' } },
    { feature: 'Nervous system gate', us: 'Yes — 24hr moratorium', competitors: { 'Notion': 'No', 'Sunsama': 'No', 'Superhuman': 'No' } },
    { feature: 'AI signal extraction', us: 'Telegram + transcripts', competitors: { 'Notion': 'Basic AI', 'Sunsama': 'No', 'Superhuman': 'Email-only AI' } },
    { feature: 'Wearable integration', us: 'Garmin (sleep, HRV)', competitors: { 'Notion': 'No', 'Sunsama': 'Calendar only', 'Superhuman': 'No' } },
    { feature: 'Venture pipeline', us: 'Spec → PRD → Memo', competitors: { 'Notion': 'Manual templates', 'Sunsama': 'No', 'Superhuman': 'No' } },
    { feature: 'Portfolio coherence', us: 'θ score, drift detection', competitors: { 'Notion': 'No', 'Sunsama': 'No', 'Superhuman': 'No' } },
  ],

  competitorNames: ['Notion', 'Sunsama', 'Superhuman'],

  defensibility: 'Behavioral Data Moat That Deepens With Daily Use\n• Longitudinal behavioral data (daily logs, decisions, signals, nervous system patterns) creates a personalized reward model that improves over time — switching cost increases every day\n• The reward function itself is proprietary IP: calibrated weights, gate mechanics, coherence scoring — each component refined through months of daily dogfooding\n• AI extraction templates (7 conversation types → structured data) encode domain expertise that requires deep personal performance context to replicate\n• Open architecture (Next.js + Firebase) enables rapid iteration; closed data model (user-scoped, encrypted) prevents competitors from reverse-engineering the system',

  // Business Model
  businessModel: 'Subscription SaaS with three tiers: Individual ($29/mo), Pro ($79/mo with AI coaching), and Team ($149/seat/mo for accelerator cohorts).',

  businessModelTable: [
    { lever: 'Individual', mechanism: '$29/mo personal OS', target: 'Solo founders, operators', marginProfile: '90%+' },
    { lever: 'Pro', mechanism: '$79/mo AI coaching + analytics', target: 'High-performers, fund managers', marginProfile: '85%+' },
    { lever: 'Team', mechanism: '$149/seat/mo cohort programs', target: 'Accelerators, exec coaching', marginProfile: '80%+' },
  ],

  goToMarket: 'Three-phase GTM from founder-led dogfooding to community growth to accelerator partnerships.',

  gtmPhases: [
    { phase: '0 → 10', strategy: 'Founder-led, dogfooding + content', channel: 'Twitter/X, indie hackers', milestone: '10 paid users, $290 MRR' },
    { phase: '10 → 100', strategy: 'Community + power user referrals', channel: 'Indie Hackers, HN, podcasts', milestone: '100 users, $2.9k MRR' },
    { phase: '100 → 1K', strategy: 'Accelerator partnerships + team tier', channel: 'YC/Techstars alumni, coaching', milestone: '1K users, $50k+ MRR' },
  ],

  // Founder
  founderAdvantage: 'Builder-Operator Who Lives Inside the Product\n• Solo-built the entire system — Next.js 14, Firebase, TypeScript, Telegram bot, AI extraction pipeline, reward function — while using it daily as primary operating system\n• Sits at the intersection of AI + capital markets: Stanford RL coursework, options analytics product (Armstrong), deep tech fund involvement as GP\n• Pieter Levels execution model: ship weekly, iterate in public, compound through speed — demonstrated with consistent weekly shipping cadence\n• Nervous system regulation as competitive advantage: Buddhist clarity practice integrated into product design as a risk management layer, not a wellness feature',

  relevantExperience: 'AI × Capital Markets × Behavioral Systems\n• Built Armstrong — production-grade options analytics dashboard for institutional traders, demonstrating ability to ship complex financial software\n• Stanford reinforcement learning curriculum — deep understanding of reward functions, policy optimization, and state transitions that form the theoretical backbone of Thesis Engine\n• GP involvement in deep tech fund — understands capital allocation, portfolio construction, and institutional decision frameworks from the inside\n• Full-stack product engineering — zero dependency on outside engineering; ships end-to-end features (backend, frontend, AI, infra) in days',

  // Financials
  financialProjection: 'Year 1: $50k revenue from 200 paid users. Year 2: $400k with team tier. Year 3: $2M with accelerator partnerships.',

  financialProjectionTable: [
    { year: 'Year 1', revenue: '$50k', customers: '200', burn: '$24k', keyAssumption: 'Founder-only, organic growth' },
    { year: 'Year 2', revenue: '$400k', customers: '1,500', burn: '$180k', keyAssumption: '2 hires, team tier launch' },
    { year: 'Year 3', revenue: '$2M', customers: '5,000', burn: '$600k', keyAssumption: 'Accelerator partnerships' },
  ],

  unitEconomics: 'Zero CAC today (organic), targeting $50 CAC at scale with 24x LTV/CAC and 90%+ gross margins.',

  unitEconomicsTable: [
    { metric: 'CAC', current: '$0 (organic)', target: '$50', benchmark: '$80 SaaS avg' },
    { metric: 'LTV', current: '$348 (12mo)', target: '$1,200 (36mo)', benchmark: '$900' },
    { metric: 'LTV/CAC', current: 'N/A', target: '24x', benchmark: '3–5x' },
    { metric: 'Payback', current: '0 months', target: '2 months', benchmark: '12 months' },
    { metric: 'Gross Margin', current: '95%', target: '90%+', benchmark: '80%' },
  ],

  // The Ask
  fundingAsk: '$500K Pre-Seed to Go From Dogfooding to Market\n• Seeking $500K to hire first engineer, launch team tier, and acquire first 200 paying users within 12 months\n• Product is fully functional with daily usage, live AI pipeline, and Telegram integration — the gap is distribution muscle and multi-user deployment\n• Accelerator value: network access to first 50 power-user customers (founders, operators) plus mentorship on B2B go-to-market motion',

  useOfFunds: '$500K allocated across engineering (40%), growth (30%), product (20%), and operations (10%).',

  useOfFundsTable: [
    { category: 'Engineering', allocation: '40%', amount: '$200K', rationale: 'First hire + multi-tenancy infra' },
    { category: 'Growth', allocation: '30%', amount: '$150K', rationale: 'Content, community, partnerships' },
    { category: 'Product', allocation: '20%', amount: '$100K', rationale: 'Mobile app, onboarding, UX research' },
    { category: 'Operations', allocation: '10%', amount: '$50K', rationale: 'Legal, hosting, admin' },
  ],

  milestones: [
    'Month 3: Public beta with 50 active users and 80%+ weekly retention',
    'Month 6: 200 paid users and $5k MRR',
    'Month 9: Team tier launched with 3 accelerator partnerships',
    'Month 12: 1K+ users, $50k MRR, Series A readiness',
  ],

  milestonesTable: [
    { timeline: 'Month 3', milestone: 'Public beta launch', successMetric: '50 users, 80%+ retention' },
    { timeline: 'Month 6', milestone: 'First revenue milestone', successMetric: '200 paid, $5k MRR' },
    { timeline: 'Month 9', milestone: 'Team tier + partnerships', successMetric: '3 accelerators, $15k MRR' },
    { timeline: 'Month 12', milestone: 'Series A readiness', successMetric: '1K+ users, $50k MRR' },
  ],

  version: 1,
  feedbackHistory: [],
}

async function save() {
  const docId = 'thesis-engine-pitch'

  await db.collection('public_memos').doc(docId).set({
    memo,
    ventureName: 'Thesis Engine',
    oneLiner: 'Personal performance OS with hedge fund-grade reward function',
    category: 'Personal OS',
    thesisPillars: ['AI', 'Markets', 'Mind'],
    uid: 'pitch',
    ventureId: docId,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  console.log(`\n✅ Pitch memo saved to public_memos/${docId}`)
  console.log(`📄 View at: https://loricorpuz.com/memo/${docId}`)
  console.log(`   or locally: http://localhost:3000/memo/${docId}`)
  process.exit(0)
}

save().catch(err => {
  console.error('Failed to save memo:', err)
  process.exit(1)
})
