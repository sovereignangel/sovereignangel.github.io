import type { DebtItem, DebtPayoffStrategy, ScenarioParams, ScenarioMonth, ScenarioProjection, CapitalPosition } from './types'

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

// ─── BUILD CAPITAL POSITION ─────────────────────────────────────────

export function buildCapitalPosition(
  snapshot: { cashSavings: number; investments: number; crypto: number; totalAssets: number; totalDebt: number; netWorth: number; monthlyIncome: number; monthlyExpenses: number; runwayMonths: number } | null,
  debts: DebtItem[]
): CapitalPosition {
  const activeDebts = debts.filter(d => d.isActive)
  const totalMinimumPayments = activeDebts.reduce((s, d) => s + d.minimumPayment, 0)
  const interest = monthlyInterestCost(activeDebts)

  if (!snapshot) {
    return {
      cashSavings: 0,
      investments: 0,
      crypto: 0,
      totalAssets: 0,
      totalDebt: activeDebts.reduce((s, d) => s + d.balance, 0),
      netWorth: -activeDebts.reduce((s, d) => s + d.balance, 0),
      monthlyIncome: 0,
      monthlyExpenses: 0,
      runwayMonths: 0,
      debtItems: activeDebts,
      totalMinimumPayments: totalMinimumPayments,
      monthlyInterestCost: interest,
    }
  }

  return {
    cashSavings: snapshot.cashSavings,
    investments: snapshot.investments,
    crypto: snapshot.crypto,
    totalAssets: snapshot.totalAssets,
    totalDebt: snapshot.totalDebt,
    netWorth: snapshot.netWorth,
    monthlyIncome: snapshot.monthlyIncome,
    monthlyExpenses: snapshot.monthlyExpenses,
    runwayMonths: snapshot.runwayMonths,
    debtItems: activeDebts,
    totalMinimumPayments: totalMinimumPayments,
    monthlyInterestCost: interest,
  }
}
