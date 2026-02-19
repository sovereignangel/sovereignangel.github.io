'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/auth/UserMenu'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { format } from 'date-fns'

const navItems = [
  { href: '/thesis', label: 'Energy', symbol: 'GE' },
  { href: '/thesis/execution', label: 'Execution', symbol: 'GVC+κ' },
  { href: '/thesis/intelligence', label: 'Intelligence', symbol: 'GI+O' },
  { href: '/thesis/alpe-dhuez', label: "Alpe d'Huez", symbol: 'Θ+$' },
]

function ScoreValue({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-mono text-[10px] text-ink-muted">{label}</span>
      <span className={`font-mono text-[12px] font-semibold ${color}`}>
        {value !== null ? value.toFixed(2) : '—'}
      </span>
    </span>
  )
}

export default function ThesisNav() {
  const pathname = usePathname()
  const { log } = useDailyLogContext()

  const reward = log.rewardScore
  const score = reward?.score ?? null
  const delta = reward?.delta ?? null
  const c = reward?.components

  const componentColor = (val: number | null) => {
    if (val === null) return 'text-ink-muted'
    if (val >= 0.7) return 'text-green-ink'
    if (val >= 0.4) return 'text-amber-ink'
    return 'text-red-ink'
  }

  const scoreColor = score === null ? 'text-ink-muted'
    : score >= 7 ? 'text-green-ink'
    : score >= 4 ? 'text-amber-ink'
    : 'text-red-ink'

  return (
    <header className="bg-paper border-b-2 border-ink shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-[22px] font-bold text-ink tracking-tight">
              Thesis Engine
            </h1>

            {/* Live score readout */}
            <div className="hidden sm:flex items-center gap-3 relative">
              <span className="flex items-baseline gap-1">
                <span className="font-mono text-[11px] text-ink-muted">g*</span>
                <span className={`font-mono text-[16px] font-bold ${scoreColor}`}>
                  {score !== null ? score.toFixed(1) : '—'}
                </span>
                {delta !== null && (
                  <span className={`font-mono text-[10px] ${delta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                )}
              </span>

              <div className="w-px h-4 bg-rule" />

              <ScoreValue label="GE" value={c?.ge ?? null} color={componentColor(c?.ge ?? null)} />
              <ScoreValue label="ĠI" value={c?.gi ?? null} color={componentColor(c?.gi ?? null)} />
              <ScoreValue label="ĠVC" value={c?.gvc ?? null} color={componentColor(c?.gvc ?? null)} />
              <ScoreValue label="κ" value={c?.kappa ?? null} color={componentColor(c?.kappa ?? null)} />
              <ScoreValue label="Θ" value={c?.theta ?? null} color={componentColor(c?.theta ?? null)} />


            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-4">
              <span className="font-serif text-[11px] italic text-ink-muted hidden sm:inline">
                {format(new Date(), 'MMMM d, yyyy')}
              </span>
              <UserMenu />
            </div>
            <p className="font-mono text-[9px] text-ink-faint hidden sm:block">
              g* = 𝔼[log GE + log ĠI + log ĠVC + log κ + log 𝒪] − 𝓕 + Θ
            </p>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex gap-1 -mb-px overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/thesis' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-baseline gap-1.5 font-serif text-[13px] font-medium px-4 py-1.5 rounded-t-sm border border-transparent no-underline transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'text-navy border-navy bg-navy-bg border-b-paper -mb-px'
                    : 'text-ink-light hover:text-ink hover:bg-cream'
                }`}
              >
                {item.label}
                <span className={`font-mono text-[9px] ${isActive ? 'text-navy/60' : 'text-ink-faint'}`}>
                  {item.symbol}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

    </header>
  )
}
