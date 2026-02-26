import type {
  DebtItem, DebtPayoffStrategy, ScenarioParams, ScenarioMonth, ScenarioProjection,
  CapitalPosition, FinancialHealthScore, HealthGrade, CapitalAlert, SensitivityResult,
  AllocationTarget, FreedCascadeStep, DeathSpiralMonth,
  DecisionRule, StressScenario,
  IncomeBreakdown, ExpenseBreakdown,
  CorporateMetrics,
} from './types'

// ─── HELPERS ────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function getEffectiveApr(debt: DebtItem, currentDate: Date): number {
  if (debt.introAprExpiry) {
    const expiry = new Date(debt.introAprExpiry)
    if (currentDate < expiry) return 0
    return debt.postIntroApr ?? debt.apr
  }
  return debt.apr
}

// ─── INTEREST CALCULATION ───────────────────────────────────────────

export function monthlyInterestCost(debts: DebtItem[], currentDate: Date = new Date()): number {
  return debts
    .filter(d => d.isActive && d.balance > 0)
    .reduce((sum, d) => {
      const apr = getEffectiveApr(d, currentDate)
      return sum + d.balance * (apr / 12)
    }, 0)
}

// ─── DEBT PAYOFF SIMULATION ─────────────────────────────────────────

interface DebtMonthSnapshot {
  month: number
  totalBalance: number
  totalInterest: number
  totalPayment: number
  balances: Record<string, number> // debt name -> remaining balance
}

export function simulateDebtPayoff(
  debts: DebtItem[],
  monthlyExtra: number,
  strategy: DebtPayoffStrategy,
  months: number = 24,
  startDate: Date = new Date()
): { snapshots: DebtMonthSnapshot[]; debtFreeMonth: number | null; totalInterestPaid: number } {
  // Clone balances
  const balances = new Map<string, number>()
  const items = debts.filter(d => d.isActive && d.balance > 0)
  items.forEach(d => balances.set(d.name, d.balance))

  const snapshots: DebtMonthSnapshot[] = []
  let totalInterestPaid = 0
  let debtFreeMonth: number | null = null

  for (let m = 0; m < months; m++) {
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    let monthInterest = 0
    let monthPayment = 0

    // 1. Accrue interest
    for (const debt of items) {
      const bal = balances.get(debt.name) || 0
      if (bal <= 0) continue
      const apr = getEffectiveApr(debt, currentDate)
      const interest = bal * (apr / 12)
      balances.set(debt.name, bal + interest)
      monthInterest += interest
    }

    // 2. Pay minimums
    for (const debt of items) {
      const bal = balances.get(debt.name) || 0
      if (bal <= 0) continue
      const payment = Math.min(debt.minimumPayment, bal)
      balances.set(debt.name, bal - payment)
      monthPayment += payment
    }

    // 3. Apply extra payment based on strategy
    if (strategy !== 'minimum_only') {
      let remaining = monthlyExtra
      const active = items
        .filter(d => (balances.get(d.name) || 0) > 0)
        .sort((a, b) => {
          if (strategy === 'avalanche') {
            return getEffectiveApr(b, currentDate) - getEffectiveApr(a, currentDate)
          }
          // snowball: smallest balance first
          return (balances.get(a.name) || 0) - (balances.get(b.name) || 0)
        })

      for (const debt of active) {
        if (remaining <= 0) break
        const bal = balances.get(debt.name) || 0
        const payment = Math.min(remaining, bal)
        balances.set(debt.name, bal - payment)
        remaining -= payment
        monthPayment += payment
      }
    }

    totalInterestPaid += monthInterest

    const totalBalance = Array.from(balances.values()).reduce((s, v) => s + Math.max(0, v), 0)

    const balanceRecord: Record<string, number> = {}
    balances.forEach((v, k) => { balanceRecord[k] = Math.max(0, v) })

    snapshots.push({
      month: m,
      totalBalance,
      totalInterest: monthInterest,
      totalPayment: monthPayment,
      balances: balanceRecord,
    })

    if (totalBalance <= 0.01 && debtFreeMonth === null) {
      debtFreeMonth = m
    }
  }

  return { snapshots, debtFreeMonth, totalInterestPaid }
}

// ─── SCENARIO PROJECTION ───────────────────────────────────────────

export function projectScenario(
  params: ScenarioParams,
  position: CapitalPosition,
  months: number = 24,
  startDate: Date = new Date()
): ScenarioProjection {
  const debts = position.debtItems.filter(d => d.isActive && d.balance > 0)
  const debtSim = simulateDebtPayoff(debts, params.extraDebtPayment, params.debtStrategy, months, startDate)

  const expenses = params.monthlyExpenseOverride ?? position.monthlyExpenses
  let runningNetWorth = position.netWorth
  const scenarioMonths: ScenarioMonth[] = []
  let breakEvenMonth: number | null = null

  for (let m = 0; m < months; m++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
    const label = formatMonthLabel(monthDate)

    // Income with ramp
    const rampFactor = params.rampUpMonths > 0
      ? clamp(m / params.rampUpMonths, 0, 1)
      : 1
    const netIncome = params.monthlyGrossIncome * (1 - params.effectiveTaxRate) * rampFactor

    const debtSnapshot = debtSim.snapshots[m]
    const debtPayment = debtSnapshot?.totalPayment ?? 0
    const interestCost = debtSnapshot?.totalInterest ?? 0
    const debtBalance = debtSnapshot?.totalBalance ?? 0

    const cashflow = netIncome - expenses - debtPayment
    runningNetWorth += cashflow

    const runway = expenses > 0 ? Math.max(0, runningNetWorth / expenses) : Infinity

    scenarioMonths.push({
      month: m,
      label,
      income: netIncome,
      expenses,
      debtPayment,
      debtBalance,
      interestCost,
      cashflow,
      liquidNetWorth: runningNetWorth,
      runway: isFinite(runway) ? runway : 999,
    })

    if (runningNetWorth >= 0 && breakEvenMonth === null && position.netWorth < 0) {
      breakEvenMonth = m
    }
  }

  return {
    params,
    months: scenarioMonths,
    debtFreeMonth: debtSim.debtFreeMonth,
    breakEvenMonth,
    totalInterestPaid: debtSim.totalInterestPaid,
    endingNetWorth: runningNetWorth,
  }
}

// ─── SCENARIO COMPARISON ────────────────────────────────────────────

export function compareScenarios(
  projections: ScenarioProjection[]
): { bestDebtFree: ScenarioProjection | null; bestNetWorth: ScenarioProjection | null } {
  const withDebtFree = projections.filter(p => p.debtFreeMonth !== null)
  const bestDebtFree = withDebtFree.length > 0
    ? withDebtFree.reduce((a, b) => (a.debtFreeMonth! < b.debtFreeMonth! ? a : b))
    : null

  const bestNetWorth = projections.reduce((a, b) =>
    a.endingNetWorth > b.endingNetWorth ? a : b
  )

  return { bestDebtFree, bestNetWorth }
}

// ─── INTELLIGENCE LAYER ─────────────────────────────────────────────

export function computeHealthScore(
  position: CapitalPosition,
  previousNetWorth?: number
): FinancialHealthScore {
  const { cashSavings, totalAssets, totalDebt, monthlyIncome, monthlyExpenses, monthlyInterestCost: interest, totalMinimumPayments } = position

  // Liquidity: cash covers 6 months of expenses
  const sixMonthTarget = monthlyExpenses * 6
  const liquidity = sixMonthTarget > 0 ? clamp((cashSavings / sixMonthTarget) * 100, 0, 100) : 0

  // Leverage: inverse of debt-to-asset ratio
  const leverage = totalAssets > 0
    ? clamp((1 - totalDebt / totalAssets) * 100, 0, 100)
    : totalDebt > 0 ? 0 : 50

  // Cash flow: free cash flow as % of income
  const freeCash = monthlyIncome - monthlyExpenses - totalMinimumPayments
  const cashflow = monthlyIncome > 0
    ? clamp((freeCash / monthlyIncome) * 100, 0, 100)
    : 0

  // Momentum: month-over-month net worth improvement
  let momentum = 50 // neutral default
  if (previousNetWorth !== undefined) {
    const delta = position.netWorth - previousNetWorth
    const pctChange = previousNetWorth !== 0 ? (delta / Math.abs(previousNetWorth)) * 100 : delta > 0 ? 100 : 0
    momentum = clamp(50 + pctChange * 2, 0, 100)
  }

  // Debt toxicity: weighted average APR penalty
  const activeDebts = position.debtItems.filter(d => d.isActive && d.balance > 0)
  const totalDebtBalance = activeDebts.reduce((s, d) => s + d.balance, 0)
  const weightedAPR = totalDebtBalance > 0
    ? activeDebts.reduce((s, d) => s + d.apr * d.balance, 0) / totalDebtBalance
    : 0
  const debtToxicity = clamp(100 - weightedAPR * 200, 0, 100)

  // Weighted overall score
  const overall = Math.round(
    liquidity * 0.20 +
    leverage * 0.20 +
    cashflow * 0.25 +
    momentum * 0.10 +
    debtToxicity * 0.25
  )

  const grade: HealthGrade = overall >= 80 ? 'A' : overall >= 65 ? 'B' : overall >= 50 ? 'C' : overall >= 35 ? 'D' : 'F'

  return {
    overall,
    components: { liquidity, leverage, cashflow, momentum, debtToxicity },
    grade,
    previousScore: previousNetWorth !== undefined ? undefined : undefined,
  }
}

export function generateAlerts(position: CapitalPosition): CapitalAlert[] {
  const alerts: CapitalAlert[] = []
  const { cashSavings, monthlyIncome, monthlyExpenses, monthlyInterestCost: interest, totalMinimumPayments, totalDebt, totalAssets, debtItems, runwayMonths } = position
  const freeCash = monthlyIncome - monthlyExpenses - totalMinimumPayments

  // Critical
  if (monthlyIncome === 0 && monthlyExpenses > 0) {
    alerts.push({
      severity: 'critical',
      title: 'Zero Revenue',
      detail: `Burning $${monthlyExpenses.toLocaleString()}/mo with no income stream. Runway is finite.`,
      metric: `${runwayMonths.toFixed(1)}mo runway`,
      action: 'Establish income source — corporate or indie — immediately.',
    })
  }
  if (runwayMonths > 0 && runwayMonths < 3) {
    alerts.push({
      severity: 'critical',
      title: 'Runway Critical',
      detail: `Cash reserves cover only ${runwayMonths.toFixed(1)} months at current burn rate.`,
      metric: `$${cashSavings.toLocaleString()} cash`,
      action: 'Cut non-essential expenses or accelerate revenue generation.',
    })
  }
  if (freeCash < 0 && monthlyIncome > 0) {
    alerts.push({
      severity: 'critical',
      title: 'Negative Free Cash Flow',
      detail: `Spending $${Math.abs(freeCash).toLocaleString()}/mo more than earning after debt service.`,
      metric: `-$${Math.abs(freeCash).toLocaleString()}/mo`,
      action: 'Reduce expenses or increase income to achieve positive cash flow.',
    })
  }

  // Warning
  const toxicDebts = debtItems.filter(d => d.isActive && d.apr > 0.20 && d.balance > 0)
  if (toxicDebts.length > 0) {
    const toxicBalance = toxicDebts.reduce((s, d) => s + d.balance, 0)
    const dailyCost = toxicDebts.reduce((s, d) => s + d.balance * d.apr / 365, 0)
    alerts.push({
      severity: 'warning',
      title: `${toxicDebts.length} Toxic Liabilities (>20% APR)`,
      detail: `$${toxicBalance.toLocaleString()} at predatory rates costing $${dailyCost.toFixed(2)}/day in interest.`,
      metric: `$${dailyCost.toFixed(2)}/day`,
      action: `Target ${toxicDebts[0].name} first (${(toxicDebts[0].apr * 100).toFixed(1)}% APR) with avalanche strategy.`,
    })
  }
  if (interest > 500) {
    alerts.push({
      severity: 'warning',
      title: 'Monthly Interest Exceeds $500',
      detail: `Paying $${interest.toFixed(0)}/mo in pure interest — capital that buys nothing.`,
      metric: `$${interest.toFixed(0)}/mo`,
      action: 'Every extra dollar toward high-APR debt reduces this bleed.',
    })
  }
  if (totalAssets > 0 && totalDebt / totalAssets > 1) {
    alerts.push({
      severity: 'warning',
      title: 'Negative Equity',
      detail: `Liabilities ($${totalDebt.toLocaleString()}) exceed assets ($${totalAssets.toLocaleString()}).`,
      metric: `${((totalDebt / totalAssets) * 100).toFixed(0)}% debt-to-asset`,
    })
  }

  // Positive
  if (runwayMonths >= 12) {
    alerts.push({
      severity: 'positive',
      title: 'Strong Runway',
      detail: `${runwayMonths.toFixed(0)} months of runway provides strategic flexibility.`,
      metric: `${runwayMonths.toFixed(0)}mo`,
    })
  }
  if (monthlyIncome > 0 && freeCash > 0) {
    const savingsRate = (freeCash / monthlyIncome) * 100
    if (savingsRate >= 30) {
      alerts.push({
        severity: 'positive',
        title: 'Strong Savings Rate',
        detail: `${savingsRate.toFixed(0)}% of income flows to wealth building after all obligations.`,
        metric: `${savingsRate.toFixed(0)}%`,
      })
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2, positive: 3 }
    return order[a.severity] - order[b.severity]
  })
}

export function dailyCostOfCarry(debts: DebtItem[]): number {
  return debts
    .filter(d => d.isActive && d.balance > 0)
    .reduce((sum, d) => sum + d.balance * d.apr / 365, 0)
}

export function interestDeathSpiral(debts: DebtItem[], months: number = 60): DeathSpiralMonth[] {
  const items = debts.filter(d => d.isActive && d.balance > 0)
  const balances = new Map<string, number>()
  items.forEach(d => balances.set(d.name, d.balance))

  const result: DeathSpiralMonth[] = []

  for (let m = 0; m < months; m++) {
    let monthInterest = 0
    let monthPrincipal = 0

    // Accrue interest
    for (const debt of items) {
      const bal = balances.get(debt.name) || 0
      if (bal <= 0) continue
      const interest = bal * (debt.apr / 12)
      balances.set(debt.name, bal + interest)
      monthInterest += interest
    }

    // Pay minimums only
    for (const debt of items) {
      const bal = balances.get(debt.name) || 0
      if (bal <= 0) continue
      const payment = Math.min(debt.minimumPayment, bal)
      const principalPortion = Math.max(0, payment - bal * (debt.apr / 12))
      balances.set(debt.name, bal - payment)
      monthPrincipal += principalPortion
    }

    const totalBal = Array.from(balances.values()).reduce((s, v) => s + Math.max(0, v), 0)
    result.push({ month: m, principalPaid: monthPrincipal, interestPaid: monthInterest, totalBalance: totalBal })

    if (totalBal <= 0.01) break
  }

  return result
}

export function sensitivityAnalysis(
  params: ScenarioParams,
  position: CapitalPosition,
  variable: 'income' | 'expenses',
  deltas: number[] = [-0.50, -0.25, 0, 0.25, 0.50]
): SensitivityResult {
  const baseValue = variable === 'income' ? params.monthlyGrossIncome : (params.monthlyExpenseOverride ?? position.monthlyExpenses)

  const scenarios = deltas.map(delta => {
    const adjustedParams = { ...params }
    if (variable === 'income') {
      adjustedParams.monthlyGrossIncome = baseValue * (1 + delta)
    } else {
      adjustedParams.monthlyExpenseOverride = baseValue * (1 + delta)
    }
    const projection = projectScenario(adjustedParams, position, 24)
    return {
      delta,
      label: delta === 0 ? 'Base' : `${delta > 0 ? '+' : ''}${(delta * 100).toFixed(0)}%`,
      netWorthAt12: projection.months[11]?.liquidNetWorth ?? 0,
      debtFreeMonth: projection.debtFreeMonth,
    }
  })

  return {
    variable: variable === 'income' ? 'Monthly Income' : 'Monthly Expenses',
    baseValue,
    scenarios,
  }
}

export function computeExpectedValue(
  projections: ScenarioProjection[]
): { name: string; ev12: number; ev24: number; probability: number }[] {
  // Assign probability weights based on scenario type
  const probabilities: Record<string, number> = {
    'Corporate ($200k)': 0.35,
    'Indie Conservative': 0.30,
    'Indie Moderate': 0.20,
    'Indie Liberal': 0.15,
  }

  return projections.map(p => {
    const prob = probabilities[p.params.name] ?? (1 / projections.length)
    return {
      name: p.params.name,
      ev12: (p.months[11]?.liquidNetWorth ?? 0) * prob,
      ev24: p.endingNetWorth * prob,
      probability: prob,
    }
  })
}

export function freedCapitalCascade(
  debts: DebtItem[],
  strategy: DebtPayoffStrategy,
  extraPayment: number,
  months: number = 60
): FreedCascadeStep[] {
  const items = debts.filter(d => d.isActive && d.balance > 0)
  if (items.length === 0) return []

  const balances = new Map<string, number>()
  items.forEach(d => balances.set(d.name, d.balance))

  const sorted = [...items].sort((a, b) => {
    if (strategy === 'avalanche') return b.apr - a.apr
    if (strategy === 'snowball') return a.balance - b.balance
    return 0
  })

  const steps: FreedCascadeStep[] = []
  let freedPool = extraPayment

  for (let m = 0; m < months; m++) {
    // Accrue interest
    for (const debt of items) {
      const bal = balances.get(debt.name) || 0
      if (bal <= 0) continue
      balances.set(debt.name, bal + bal * (debt.apr / 12))
    }

    // Pay minimums
    for (const debt of items) {
      const bal = balances.get(debt.name) || 0
      if (bal <= 0) continue
      const payment = Math.min(debt.minimumPayment, bal)
      balances.set(debt.name, bal - payment)
    }

    // Apply freed pool to highest priority active debt
    let remaining = freedPool
    const active = sorted.filter(d => (balances.get(d.name) || 0) > 0)
    for (const debt of active) {
      if (remaining <= 0) break
      const bal = balances.get(debt.name) || 0
      const payment = Math.min(remaining, bal)
      balances.set(debt.name, bal - payment)
      remaining -= payment
    }

    // Check for newly eliminated debts
    for (const debt of sorted) {
      const bal = balances.get(debt.name) || 0
      if (bal <= 0.01 && !steps.find(s => s.debtName === debt.name)) {
        const nextActive = sorted.filter(d => d.name !== debt.name && (balances.get(d.name) || 0) > 0.01)
        steps.push({
          debtName: debt.name,
          paidOffMonth: m,
          freedMinimum: debt.minimumPayment,
          acceleratesNext: nextActive[0]?.name ?? 'None — debt free!',
        })
        freedPool += debt.minimumPayment
      }
    }

    if (Array.from(balances.values()).every(v => v <= 0.01)) break
  }

  return steps
}

export function generateAllocationTargets(
  position: CapitalPosition
): AllocationTarget[] {
  const targets: AllocationTarget[] = []
  const sixMonthExpenses = position.monthlyExpenses * 6
  const toxicDebt = position.debtItems
    .filter(d => d.isActive && d.apr > 0.20 && d.balance > 0)
    .reduce((s, d) => s + d.balance, 0)
  const taxDebt = position.debtItems
    .filter(d => d.isActive && d.category === 'tax' && d.balance > 0)
    .reduce((s, d) => s + d.balance, 0)

  targets.push({
    category: 'emergency',
    label: 'Emergency Fund (6mo)',
    current: position.cashSavings,
    target: sixMonthExpenses,
    pct: sixMonthExpenses > 0 ? clamp(position.cashSavings / sixMonthExpenses * 100, 0, 100) : 0,
    rationale: 'Cash reserves covering 6 months of expenses provide strategic flexibility and prevent forced liquidation of assets at bad prices.',
  })

  if (toxicDebt > 0) {
    targets.push({
      category: 'toxic_debt',
      label: 'Toxic Debt Elimination (>20% APR)',
      current: toxicDebt,
      target: 0,
      pct: 0, // 0% progress toward elimination
      rationale: `Paying off high-APR debt is a guaranteed ${((position.debtItems.filter(d => d.apr > 0.20).sort((a, b) => b.apr - a.apr)[0]?.apr ?? 0.25) * 100).toFixed(1)}% return. No investment beats this risk-adjusted.`,
    })
  }

  if (taxDebt > 0) {
    targets.push({
      category: 'tax',
      label: 'Tax Obligations',
      current: taxDebt,
      target: 0,
      pct: 0,
      rationale: 'Unresolved tax obligations accrue penalties and restrict financial flexibility. IRS payment plans prevent escalation.',
    })
  }

  targets.push({
    category: 'growth',
    label: 'Growth Capital',
    current: position.investments + position.crypto,
    target: position.totalAssets * 0.5,
    pct: position.totalAssets > 0 ? clamp((position.investments + position.crypto) / (position.totalAssets * 0.5) * 100, 0, 100) : 0,
    rationale: 'After debt elimination, redirect freed cash flow to diversified investments. Target 50% of assets in growth positions.',
  })

  return targets
}

// ─── BUILD CAPITAL POSITION ─────────────────────────────────────────

export function buildCapitalPosition(
  snapshot: {
    cashSavings: number; investments: number; crypto: number;
    otherAssets?: number; totalAssets: number; totalDebt: number;
    netWorth: number; monthlyIncome: number; monthlyExpenses: number;
    runwayMonths: number;
    incomeBreakdown?: IncomeBreakdown; expenseBreakdown?: ExpenseBreakdown;
  } | null,
  debts: DebtItem[]
): CapitalPosition {
  const activeDebts = debts.filter(d => d.isActive)
  const totalMinimumPayments = activeDebts.reduce((s, d) => s + d.minimumPayment, 0)
  const interest = monthlyInterestCost(activeDebts)
  const daily = dailyCostOfCarry(activeDebts)

  if (!snapshot) {
    return {
      cashSavings: 0,
      investments: 0,
      crypto: 0,
      otherAssets: 0,
      liquidAssets: 0,
      totalAssets: 0,
      totalDebt: activeDebts.reduce((s, d) => s + d.balance, 0),
      netWorth: -activeDebts.reduce((s, d) => s + d.balance, 0),
      monthlyIncome: 0,
      monthlyExpenses: 0,
      runwayMonths: 0,
      debtItems: activeDebts,
      totalMinimumPayments,
      monthlyInterestCost: interest,
      dailyInterestCost: daily,
    }
  }

  const liquid = snapshot.cashSavings + snapshot.investments + snapshot.crypto
  const runway = snapshot.monthlyExpenses > 0 ? liquid / snapshot.monthlyExpenses : 0

  return {
    cashSavings: snapshot.cashSavings,
    investments: snapshot.investments,
    crypto: snapshot.crypto,
    otherAssets: snapshot.otherAssets ?? 0,
    liquidAssets: liquid,
    totalAssets: snapshot.totalAssets,
    totalDebt: snapshot.totalDebt,
    netWorth: snapshot.netWorth,
    monthlyIncome: snapshot.monthlyIncome,
    monthlyExpenses: snapshot.monthlyExpenses,
    incomeBreakdown: snapshot.incomeBreakdown,
    expenseBreakdown: snapshot.expenseBreakdown,
    runwayMonths: runway,
    debtItems: activeDebts,
    totalMinimumPayments,
    monthlyInterestCost: interest,
    dailyInterestCost: daily,
  }
}

// ─── ZERO DATE ───────────────────────────────────────────────────────
// When do liquid assets hit $0 at current burn rate?

export function computeZeroDate(position: CapitalPosition): Date | null {
  const monthlyBurn = position.monthlyExpenses + position.totalMinimumPayments
  if (monthlyBurn <= 0) return null
  if (position.liquidAssets <= 0) return new Date() // already at zero
  const monthsLeft = position.liquidAssets / monthlyBurn
  const zero = new Date()
  zero.setMonth(zero.getMonth() + Math.floor(monthsLeft))
  zero.setDate(zero.getDate() + Math.round((monthsLeft % 1) * 30))
  return zero
}

// ─── STRESS TESTS ────────────────────────────────────────────────────

export function computeStressTests(position: CapitalPosition): StressScenario[] {
  const { liquidAssets, monthlyExpenses, totalMinimumPayments, crypto, netWorth } = position
  const burn = monthlyExpenses + totalMinimumPayments

  const scenarios: StressScenario[] = [
    {
      label: 'Base',
      netWorth,
      runway: burn > 0 ? liquidAssets / burn : 0,
      description: 'Current position, no changes',
    },
    {
      label: 'Crypto -50%',
      netWorth: netWorth - crypto * 0.5,
      runway: burn > 0 ? (liquidAssets - crypto * 0.5) / burn : 0,
      description: 'Crypto holdings lose 50% value',
    },
    {
      label: 'Exp +20%',
      netWorth,
      runway: (monthlyExpenses * 1.2 + totalMinimumPayments) > 0
        ? liquidAssets / (monthlyExpenses * 1.2 + totalMinimumPayments) : 0,
      description: 'Monthly expenses increase 20%',
    },
    {
      label: 'Crypto -50% + Exp +20%',
      netWorth: netWorth - crypto * 0.5,
      runway: (monthlyExpenses * 1.2 + totalMinimumPayments) > 0
        ? (liquidAssets - crypto * 0.5) / (monthlyExpenses * 1.2 + totalMinimumPayments) : 0,
      description: 'Combined worst case',
    },
  ]

  return scenarios
}

// ─── DECISION RULES ──────────────────────────────────────────────────

export function evaluateDecisionRules(position: CapitalPosition): DecisionRule[] {
  const { monthlyIncome, monthlyExpenses, runwayMonths, debtItems, dailyInterestCost } = position
  const toxicDebts = debtItems.filter(d => d.isActive && d.apr > 0.20 && d.balance > 0)
  const prevToxicBalance = toxicDebts.reduce((s, d) => s + d.balance, 0)

  return [
    {
      key: 'income_positive',
      label: 'Income > Expenses',
      passed: monthlyIncome > monthlyExpenses,
      value: monthlyIncome > 0 ? `$${monthlyIncome.toLocaleString()}` : '$0',
      threshold: `> $${monthlyExpenses.toLocaleString()}`,
    },
    {
      key: 'runway_6mo',
      label: 'Runway > 6mo',
      passed: runwayMonths > 6,
      value: `${runwayMonths.toFixed(1)}mo`,
      threshold: '> 6mo',
    },
    {
      key: 'toxic_declining',
      label: 'Toxic Debt Declining',
      passed: prevToxicBalance === 0,
      value: prevToxicBalance > 0 ? `$${prevToxicBalance.toLocaleString()}` : '$0',
      threshold: '$0',
    },
    {
      key: 'interest_bleed',
      label: 'Daily Interest < $3',
      passed: dailyInterestCost < 3,
      value: `$${dailyInterestCost.toFixed(2)}/day`,
      threshold: '< $3/day',
    },
  ]
}

// ─── CORPORATE METRICS ──────────────────────────────────────────────

export function computeCorporateMetrics(position: CapitalPosition): CorporateMetrics {
  const annualIncome = position.monthlyIncome * 12
  const monthlyDebtService = position.totalMinimumPayments + position.monthlyInterestCost
  const freeCashFlow = position.monthlyIncome - position.monthlyExpenses - position.totalMinimumPayments

  return {
    debtToIncomeRatio: annualIncome > 0
      ? position.totalDebt / annualIncome
      : null,
    debtServiceCoverage: monthlyDebtService > 0
      ? position.monthlyIncome / monthlyDebtService
      : null,
    operatingMargin: position.monthlyIncome > 0
      ? (freeCashFlow / position.monthlyIncome) * 100
      : null,
    currentRatio: position.monthlyExpenses > 0
      ? position.liquidAssets / position.monthlyExpenses
      : null,
    leverageRatio: position.totalAssets > 0
      ? position.totalDebt / position.totalAssets
      : null,
  }
}
