import type {
  FundMetrics,
  Meeting,
  ProposalPhase,
  FinancialScenario,
  Risk,
  ScalingMilestone,
  AgreementClause,
  ActionItem,
} from './types'

// ── Fund Metrics ────────────────────────────────────────────────
export const FUND_METRICS: FundMetrics = {
  aum: 1_500_000,
  targetAum: 3_000_000,
  monthlyDividendRevenue: { low: 80_000, high: 104_000 },
  targetMonthlyRevenue: 250_000,
  seanTakePercent: 10,
  investorReturnRange: { low: 11, high: 14 },
  lockupMonths: 18,
  stockUniverse: 2_700,
  dailyHours: { low: 2, high: 3 },
  collateralType: 'U.S. Treasury Bonds',
  strategyName: 'Dividend Capture',
}

// ── Meetings ────────────────────────────────────────────────────
export const MEETINGS: Meeting[] = [
  {
    id: 'meeting-2026-02-26',
    date: '2026-02-26',
    title: 'Partnership Exploration & Fund Deep Dive',
    participants: ['Lori Corpuz', 'Sean Becker'],
    duration: '45 min',
    summary:
      'First deep operational dive into Alamo Bernal\'s dividend capture strategy. Covered fund structure (treasury bond collateral, line of credit leverage), daily workflow (Fidelity screening → manual selection → buy before ex-dividend → sell next morning), current AUM ($1.5M), revenue ($80-104K/month), and scaling targets ($3M AUM, $250K/month). Discussed technology automation opportunities, fundraising needs, and potential partnership structure.',
    insights: [
      {
        category: 'workflow',
        text: 'Sean screens stocks 1-2x/week using Fidelity filters (price, dividend yield 3-9%, NYSE/NASDAQ, no Puerto Rico withholding). Filters ~2,700 stocks down to 3-15 daily candidates.',
        confidence: 'high',
      },
      {
        category: 'workflow',
        text: 'Daily execution: Buy in last 10 minutes before market close → hold overnight → sell at market open via limit order capped at 50% dividend loss.',
        confidence: 'high',
      },
      {
        category: 'strategy',
        text: 'Alpha persists because the strategy is labor-intensive and not what institutional investors are paid to do. Professional finance focuses on finding "the next big thing" or preserving wealth in bonds.',
        confidence: 'medium',
      },
      {
        category: 'structure',
        text: 'Fund is fully de-risked via treasury bond collateral. All investor capital buys treasuries, trading done on line of credit proceeds. Not disclosed to all investors due to complexity.',
        confidence: 'high',
      },
      {
        category: 'structure',
        text: 'Investor returns structured like bonds: fixed quarterly payments (11-14% annualized), not tied to fund performance. Principal returned at end of term. 18-month lockup.',
        confidence: 'high',
      },
      {
        category: 'risk',
        text: 'Tax complexity is critical: Section 475 election required to offset dividend income with stock losses. Without it, tax burden would kill the strategy.',
        confidence: 'high',
      },
      {
        category: 'risk',
        text: 'Scaling bottleneck: large AUM makes it difficult to buy/sell small-cap dividend stocks with sufficient volume. $5M+ stake in small stocks would face liquidity issues.',
        confidence: 'medium',
      },
      {
        category: 'ambition',
        text: 'Sean\'s exit number: $250K/month dividend revenue → $25K/month personal take (10%) → quit law firm. Currently at $80-104K/month, needs ~$3M AUM.',
        confidence: 'high',
      },
      {
        category: 'opportunity',
        text: 'Three collaboration angles: (1) technology automation, (2) capital raising ($220M+ Lori experience), (3) long-term R&D for new strategies with frontier AI.',
        confidence: 'high',
      },
      {
        category: 'opportunity',
        text: 'AI could analyze historical ex-dividend price behavior across years of data to identify stocks that don\'t crash too much — the core risk mitigation need.',
        confidence: 'high',
      },
      {
        category: 'strategy',
        text: 'Margin trading amplifies returns but introduces additional risk. Sean uses margin on Fidelity to increase position sizes on high-conviction plays.',
        confidence: 'medium',
      },
    ],
    nextSteps: [
      'Lori: Research Series 7 requirements and legal constraints on securities advisory',
      'Lori: Review Sean\'s subscription agreement and federal disclosures',
      'Sean: Reflect on minimum comfortable lockup period (current: 18 months)',
      'Sean: Consider if lockup period would change if operating full-time',
      'Both: Schedule follow-up call for March 4, 2026 (Thursday)',
      'Lori: Think through fundraising positioning and investor pitch structure',
      'Lori: Assess technology build feasibility for stock screening automation',
    ],
    tags: ['strategy', 'structure', 'technology', 'fundraising'],
  },
]

// ── Proposal Phases ─────────────────────────────────────────────
export const PROPOSAL_PHASES: ProposalPhase[] = [
  {
    id: 'phase-1',
    phase: 1,
    title: 'Technology Build',
    status: 'proposed',
    timeline: 'Months 1-3',
    description:
      'Build core technology infrastructure: automated stock screening, historical dividend/price analysis, AI-driven buy/sell signals. Lori learns the strategy inside-out while building tools that immediately reduce Sean\'s daily workload.',
    deliverables: [
      'Automated dividend stock screener (NYSE + NASDAQ, 2,700+ stocks)',
      'Historical ex-dividend price behavior database (3+ years)',
      'AI model: predict post-ex-dividend price drops by stock',
      'Daily candidate ranking dashboard with risk scores',
      'Limit order optimization engine (dynamic 50% threshold)',
      'Portfolio tracking dashboard (positions, P&L, dividends)',
    ],
    valueMetrics: [
      { label: 'Daily screening time', before: '2-3 hours', after: '15 minutes', impact: '85-92% time reduction' },
      { label: 'Stock universe coverage', before: '3-15 stocks/day (manual)', after: '2,700 stocks/day (automated)', impact: '180x coverage increase' },
      { label: 'Historical crash analysis', before: 'None (gut feel)', after: 'Full 3-year backtest per stock', impact: 'Data-driven risk scoring' },
      { label: 'Signal accuracy', before: 'Manual heuristics', after: 'ML-scored candidates', impact: 'Measurable hit rate' },
    ],
    loriValue: 'Full-stack engineering + AI/ML expertise + financial markets experience',
    seanCommitment: 'Provide domain knowledge, strategy details, historical trade data, daily feedback on tool utility',
    financialTerms: 'Monthly retainer (TBD) for dedicated technology development',
    gateToNext: 'Tools deployed and actively reducing Sean\'s daily workflow by 50%+. Lori has deep understanding of dividend capture mechanics.',
  },
  {
    id: 'phase-2',
    phase: 2,
    title: 'Strategy Comfort & Capital Raising',
    status: 'future',
    timeline: 'Months 4-8',
    description:
      'With technology proven and strategy deeply understood, shift focus to fundraising. Leverage Lori\'s $220M+ capital raising experience across startups and funds to accelerate AUM growth from $1.5M toward $3M+.',
    deliverables: [
      'Investor pitch deck with technology-backed performance data',
      'Fundraising CRM and pipeline management',
      'Investor reporting dashboard (quarterly statements, performance metrics)',
      'Due diligence materials package',
      'Warm introductions to qualified investors',
      'Refined investor structure (lockup terms, redemption windows)',
    ],
    valueMetrics: [
      { label: 'AUM raised', before: '$1.5M (current)', after: '$3M+ target', impact: '$1.5M+ new capital' },
      { label: 'Investor pipeline', before: 'Friends & family only', after: 'Structured pipeline with CRM', impact: 'Scalable fundraising process' },
      { label: 'Investor conversion', before: 'Ad hoc (word of mouth)', after: 'Tracked funnel with materials', impact: 'Measurable conversion rate' },
      { label: 'Time to close', before: 'Months (informal)', after: 'Weeks (structured process)', impact: 'Faster capital deployment' },
    ],
    loriValue: '$220M+ fundraising experience, investor network, pitch strategy, materials creation',
    seanCommitment: 'Investor meetings, relationship management, legal/compliance decisions',
    financialTerms: 'Retainer + % of capital raised (TBD)',
    gateToNext: 'AUM reaches $3M+. Fund generating $250K/month. Sean can consider leaving law firm.',
  },
  {
    id: 'phase-3',
    phase: 3,
    title: 'Alpha Generation & New Strategies',
    status: 'future',
    timeline: 'Month 9+',
    description:
      'With stable AUM and proven technology, expand into research & development of new trading strategies. Apply frontier AI to discover novel alpha, enhance risk management, and build portfolio of complementary strategies.',
    deliverables: [
      'Strategy backtesting framework (multi-factor, multi-timeframe)',
      'New strategy candidates identified and backtested',
      'Enhanced risk management (dynamic stop-losses, correlation monitoring)',
      'Options strategy overlay (covered calls, protective puts)',
      'Macro signal integration for market regime detection',
      'Automated trade execution (with human approval gates)',
    ],
    valueMetrics: [
      { label: 'Strategies backtested', before: '1 (dividend capture)', after: '5+ candidates tested', impact: 'Strategy diversification' },
      { label: 'Risk-adjusted return (Sharpe)', before: 'Unknown (not measured)', after: 'Quantified per strategy', impact: 'Professional risk metrics' },
      { label: 'Max drawdown', before: 'Unmanaged (ad hoc sells)', after: 'Systematic risk limits', impact: 'Reduced tail risk' },
      { label: 'Revenue from new strategies', before: '$0', after: 'TBD based on backtest results', impact: 'Additional revenue streams' },
    ],
    loriValue: 'AI/ML research, strategy development, quantitative analysis, frontier technology',
    seanCommitment: 'Capital allocation decisions, strategy approval, risk oversight',
    financialTerms: 'Equity stake / revenue share in new strategies (TBD)',
    gateToNext: 'N/A — this is the long-term vision of a full technology partnership',
  },
]

// ── Financial Scenarios ─────────────────────────────────────────
export const FINANCIAL_SCENARIOS: FinancialScenario[] = [
  {
    id: 'scenario-1.5m',
    label: '$1.5M (Current)',
    aum: 1_500_000,
    monthlyDividendRevenue: 90_000,
    seanMonthlyTake: 9_000,
    loriMonthlyTake: 0,
    investorReturns: '11-14% annualized',
    operatingCosts: 2_000,
    netToFund: 79_000,
  },
  {
    id: 'scenario-3m',
    label: '$3M (Target)',
    aum: 3_000_000,
    monthlyDividendRevenue: 180_000,
    seanMonthlyTake: 18_000,
    loriMonthlyTake: 5_000,
    investorReturns: '11-14% annualized',
    operatingCosts: 5_000,
    netToFund: 152_000,
  },
  {
    id: 'scenario-5m',
    label: '$5M',
    aum: 5_000_000,
    monthlyDividendRevenue: 300_000,
    seanMonthlyTake: 30_000,
    loriMonthlyTake: 10_000,
    investorReturns: '11-14% annualized',
    operatingCosts: 10_000,
    netToFund: 250_000,
  },
  {
    id: 'scenario-10m',
    label: '$10M',
    aum: 10_000_000,
    monthlyDividendRevenue: 600_000,
    seanMonthlyTake: 60_000,
    loriMonthlyTake: 25_000,
    investorReturns: '11-14% annualized',
    operatingCosts: 20_000,
    netToFund: 495_000,
  },
]

// ── Risks ───────────────────────────────────────────────────────
export const RISKS: Risk[] = [
  {
    id: 'risk-alpha-squeeze',
    title: 'Alpha Squeeze — Strategy Becomes Crowded',
    category: 'market',
    description:
      'As more participants adopt dividend capture strategies (especially via AI tools), the alpha may compress. Ex-dividend price drops could become more predictable and fully priced in.',
    probability: 2,
    impact: 5,
    mitigations: [
      'Monitor strategy returns monthly for degradation trends',
      'Diversify into complementary strategies (Phase 3)',
      'Build proprietary edge through better historical data and ML models',
      'Focus on small-cap stocks where institutional participation is lower',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-tech-overfit',
    title: 'Technology Overfitting — ML Models Fail Live',
    category: 'technology',
    description:
      'AI models trained on historical data may not generalize to live market conditions. Backtested performance may overestimate real-world results.',
    probability: 3,
    impact: 3,
    mitigations: [
      'Walk-forward validation on out-of-sample data',
      'Paper trade all models for 30+ days before live deployment',
      'Keep human approval gates on all trade recommendations',
      'Use ensemble methods to reduce single-model risk',
    ],
    owner: 'lori',
    status: 'open',
  },
  {
    id: 'risk-liquidity',
    title: 'Liquidity Crunch at Scale',
    category: 'operational',
    description:
      'As AUM grows, it becomes harder to take meaningful positions in small-cap dividend stocks. Volume may not support $5M+ trades in micro/small-cap names.',
    probability: 3,
    impact: 4,
    mitigations: [
      'Build position sizing algorithm that respects average daily volume',
      'Diversify across more stocks per day to reduce per-stock exposure',
      'Add mid-cap and large-cap dividend stocks to expand universe',
      'Implement gradual position building over multiple days',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-tax-structure',
    title: 'Section 475 Election Denied or Changed',
    category: 'regulatory',
    description:
      'The IRS could challenge the Section 475 election or change tax treatment of short-term dividends. This would dramatically increase the tax burden and potentially kill strategy economics.',
    probability: 2,
    impact: 5,
    mitigations: [
      'Maintain meticulous trading records for IRS compliance',
      'Engage specialized tax counsel for annual review',
      'Structure fund to maximize tax efficiency',
      'Monitor regulatory changes in dividend/securities taxation',
    ],
    owner: 'sean',
    status: 'open',
  },
  {
    id: 'risk-margin-call',
    title: 'Margin Call During Market Crash',
    category: 'market',
    description:
      'A severe market downturn could trigger margin calls on the line of credit, forcing liquidation of positions at the worst possible time.',
    probability: 2,
    impact: 4,
    mitigations: [
      'Treasury bond collateral provides natural buffer (flight to safety)',
      'Set conservative margin utilization limits (max 60%)',
      'Build automated position liquidation triggers before margin call levels',
      'Maintain cash reserve buffer for margin requirements',
    ],
    owner: 'sean',
    status: 'open',
  },
  {
    id: 'risk-single-person',
    title: 'Single Person Dependency (Sean)',
    category: 'operational',
    description:
      'All trading knowledge and investor relationships currently reside with Sean. If he is unable to trade for any reason, the fund has no backup operator.',
    probability: 2,
    impact: 5,
    mitigations: [
      'Document all trading procedures and decision frameworks',
      'Build technology that encodes trading logic (reduces bus factor)',
      'Lori learns strategy deeply in Phase 1 as backup operator',
      'Consider key-person insurance for fund continuity',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-tech-security',
    title: 'Technology Security — Trading System Compromise',
    category: 'technology',
    description:
      'Automated trading tools connected to brokerage accounts represent a cybersecurity risk. Unauthorized access could result in unauthorized trades or fund theft.',
    probability: 1,
    impact: 5,
    mitigations: [
      'Read-only API access for analysis tools (no automated execution in Phase 1)',
      'Multi-factor authentication on all brokerage and tool accounts',
      'Audit logging for all system access and trade recommendations',
      'Regular security reviews of all deployed tools',
    ],
    owner: 'lori',
    status: 'open',
  },
  {
    id: 'risk-ft-transition',
    title: 'Full-Time Transition Risk (Sean Leaves Law)',
    category: 'partnership',
    description:
      'If Sean leaves his law firm prematurely (before fund reaches stable $250K/month), personal financial pressure could lead to suboptimal trading decisions or forced strategy changes.',
    probability: 3,
    impact: 3,
    mitigations: [
      'Set clear financial milestones before full-time transition',
      'Build 6-month personal runway before leaving employment',
      'Ensure fund has 12+ months of operating capital',
      'Technology reduces daily time commitment, allowing gradual transition',
    ],
    owner: 'sean',
    status: 'open',
  },
  {
    id: 'risk-partnership-misalign',
    title: 'Partnership Misalignment on Direction',
    category: 'partnership',
    description:
      'Lori and Sean may have different views on risk tolerance, strategy direction, or technology investment priorities as the partnership evolves.',
    probability: 2,
    impact: 3,
    mitigations: [
      'Clear written agreement with decision-making framework',
      'Regular strategy alignment meetings (weekly during Phase 1)',
      'Defined roles: Sean = trading & investors, Lori = technology & research',
      'Exit clauses that protect both parties if alignment breaks down',
    ],
    owner: 'both',
    status: 'open',
  },
  {
    id: 'risk-regulatory-aum',
    title: 'Regulatory Requirements at $100M+ AUM',
    category: 'regulatory',
    description:
      'As the fund grows, SEC registration requirements kick in. Under $100M allows certain exemptions; above triggers full compliance requirements.',
    probability: 1,
    impact: 3,
    mitigations: [
      'Plan compliance infrastructure well before $100M threshold',
      'Engage fund administration and compliance counsel early',
      'Build reporting and audit capabilities into technology from the start',
      'Budget for compliance costs in financial model',
    ],
    owner: 'both',
    status: 'open',
  },
]

// ── Scaling Milestones ──────────────────────────────────────────
export const SCALING_MILESTONES: ScalingMilestone[] = [
  {
    id: 'milestone-3m',
    aumThreshold: '$3M',
    operationalNeeds: [
      'Sean transitions to full-time fund management',
      'Formalize investor communication cadence (quarterly reports)',
      'Set up dedicated fund bank accounts and accounting',
      'Establish formal record-keeping for all trades',
    ],
    infrastructureNeeds: [
      'Dedicated trading workstation with redundant internet',
      'Automated backup of all trading data and communications',
      'Cloud-hosted dashboard accessible from anywhere',
    ],
    complianceNeeds: [
      'Annual Section 475 election filing with IRS',
      'Quarterly investor statements with audited returns',
      'Update subscription agreement for new investors',
      'Review state-level fund registration requirements',
    ],
    teamNeeds: [
      'Sean: Full-time fund manager and primary trader',
      'Lori: Technology partner (part-time transitioning to more)',
      'Tax accountant: Quarterly filing and annual tax strategy',
      'Legal counsel: Fund structure review (annual)',
    ],
    technologyDeliverables: [
      'Automated screener live and reducing daily workload 80%+',
      'Historical analysis database covering 3+ years of ex-dividend data',
      'Investor reporting portal with quarterly performance data',
      'Risk monitoring dashboard with position-level alerts',
    ],
  },
  {
    id: 'milestone-5m',
    aumThreshold: '$5M',
    operationalNeeds: [
      'Diversify brokerage relationships (beyond Fidelity alone)',
      'Implement formal risk limits and position sizing rules',
      'Create operational manual documenting all procedures',
      'Set up systematic cash management and margin monitoring',
    ],
    infrastructureNeeds: [
      'Multi-broker execution capability',
      'Real-time P&L and risk dashboards',
      'Automated trade journaling and compliance logging',
      'Disaster recovery plan for trading systems',
    ],
    complianceNeeds: [
      'Consider fund audit by external accounting firm',
      'Review SEC exemption status and registration thresholds',
      'Implement anti-money laundering (AML) procedures',
      'Formalize insider trading policies',
    ],
    teamNeeds: [
      'Part-time operations/admin support',
      'Lori: Increased R&D time for new strategies',
      'Consider external fund administrator',
    ],
    technologyDeliverables: [
      'Multi-strategy backtesting framework',
      'Options overlay tooling (covered calls, protective puts)',
      'Advanced position sizing with volume-aware algorithms',
      'Macro regime detection for risk management',
    ],
  },
  {
    id: 'milestone-10m',
    aumThreshold: '$10M',
    operationalNeeds: [
      'Full institutional-grade operations',
      'Formal board or advisory committee',
      'Monthly performance attribution reporting',
      'Systematic investor onboarding process',
    ],
    infrastructureNeeds: [
      'Co-located or low-latency execution infrastructure',
      'Enterprise-grade security and access controls',
      'Automated compliance monitoring and reporting',
      'Multi-strategy portfolio management system',
    ],
    complianceNeeds: [
      'Annual third-party audit',
      'Formal compliance officer (part-time or outsourced)',
      'SEC Form ADV filing (if applicable)',
      'Disaster recovery and business continuity plan',
    ],
    teamNeeds: [
      'Sean: Chief Investment Officer',
      'Lori: Chief Technology Officer / Head of Research',
      'Full-time operations manager',
      'External fund administrator',
      'Compliance consultant (quarterly review)',
    ],
    technologyDeliverables: [
      'Fully automated trade execution with human approval gates',
      'Multi-strategy portfolio with correlation management',
      'Institutional-grade risk reporting',
      'AI-driven strategy discovery and optimization pipeline',
    ],
  },
]

// ── Agreement Clauses ───────────────────────────────────────────
export const AGREEMENT_CLAUSES: AgreementClause[] = [
  {
    id: 'clause-roles',
    section: 'Roles & Responsibilities',
    label: 'Role Definitions',
    terms:
      'Sean Becker: Fund Manager — responsible for all trading decisions, investor relations, and regulatory compliance. Lori Corpuz: Technology Partner — responsible for technology development, research & development, and fundraising support. All trading decisions require Sean\'s explicit approval.',
    status: 'draft',
    notes: 'Need to clarify decision-making authority for technology investments',
  },
  {
    id: 'clause-compensation-phase1',
    section: 'Compensation',
    label: 'Phase 1: Technology Build',
    terms:
      'Monthly retainer for dedicated technology development work. Amount TBD based on scope and time commitment. Retainer paid from fund operating budget, not investor capital.',
    status: 'needs_discussion',
    notes: 'Need to determine fair market rate and time commitment (full-time vs part-time)',
  },
  {
    id: 'clause-compensation-phase2',
    section: 'Compensation',
    label: 'Phase 2: Capital Raising',
    terms:
      'Retainer continues plus success fee on capital raised. Success fee structure TBD (% of new AUM raised). Critical constraint: Sean must still net 10% of dividend revenue ($25K/month at $250K target). Lori\'s compensation comes from incremental value created.',
    status: 'needs_discussion',
    notes: 'Model economics at multiple AUM levels to ensure Sean\'s take-home is preserved',
  },
  {
    id: 'clause-compensation-phase3',
    section: 'Compensation',
    label: 'Phase 3: Equity & Revenue Share',
    terms:
      'Equity stake in fund management company and/or revenue share on new strategies developed by Lori. Specific terms to be negotiated after Phase 2 success. Vesting schedule to be determined.',
    status: 'draft',
    notes: 'This is the long-term alignment mechanism. Needs careful structuring.',
  },
  {
    id: 'clause-ip',
    section: 'Intellectual Property',
    label: 'Technology & Strategy IP',
    terms:
      'Technology built by Lori is owned by the partnership/fund entity. If partnership dissolves, Lori retains rights to generic technology components (frameworks, tools) but fund-specific models and strategy IP remain with the fund. Sean retains full ownership of the dividend capture strategy and all trading knowledge.',
    status: 'draft',
  },
  {
    id: 'clause-investment',
    section: 'Capital Commitment',
    label: 'Lori\'s Investment (Skin in the Game)',
    terms:
      'Lori to invest personal capital into the fund on same terms as other investors. Amount TBD. This aligns incentives and demonstrates conviction to future investors. Subject to same lockup and return terms.',
    status: 'needs_discussion',
    notes: 'Need to determine amount and timing. Also need to verify Series 7/securities regulations.',
  },
  {
    id: 'clause-exit',
    section: 'Exit & Termination',
    label: 'Exit Clauses',
    terms:
      'Either party may terminate with 90 days written notice. Upon termination: (1) outstanding retainer fees are paid through notice period, (2) IP provisions apply per IP clause, (3) vested equity/revenue share continues per vesting schedule, (4) Lori provides 30-day transition support for technology handoff.',
    status: 'draft',
  },
  {
    id: 'clause-confidentiality',
    section: 'Confidentiality',
    label: 'Information Protection',
    terms:
      'Both parties agree to keep fund strategy details, investor information, and financial performance confidential. Technology architecture may be discussed in general terms for Lori\'s portfolio purposes. No disclosure of specific trading signals, models, or investor identities without written consent.',
    status: 'draft',
  },
]

// ── Action Items ────────────────────────────────────────────────
export const ACTION_ITEMS: ActionItem[] = [
  {
    id: 'action-series7',
    description: 'Research Series 7 requirements and legal constraints on securities advisory',
    owner: 'lori',
    dueDate: '2026-03-04',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-sub-agreement',
    description: 'Review Sean\'s subscription agreement and federal disclosures',
    owner: 'lori',
    dueDate: '2026-03-04',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-lockup',
    description: 'Reflect on minimum comfortable lockup period (current: 18 months) and whether it changes if operating full-time',
    owner: 'sean',
    dueDate: '2026-03-04',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-fundraising',
    description: 'Think through fundraising positioning and investor pitch structure',
    owner: 'lori',
    dueDate: '2026-03-11',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-tech-feasibility',
    description: 'Assess technology build feasibility for stock screening automation — scope, timeline, cost',
    owner: 'lori',
    dueDate: '2026-03-11',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-followup',
    description: 'Follow-up call — Thursday March 4, 2026',
    owner: 'both',
    dueDate: '2026-03-04',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
  {
    id: 'action-vc-intro',
    description: 'Introduce Sean to VC friend attending South by Southwest',
    owner: 'lori',
    dueDate: '2026-03-10',
    status: 'pending',
    meetingId: 'meeting-2026-02-26',
  },
]
