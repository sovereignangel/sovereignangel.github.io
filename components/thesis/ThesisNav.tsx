'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/auth/UserMenu'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import EnergyStatusDot from '@/components/thesis/nav/EnergyStatusDot'
import { format } from 'date-fns'

const navItems = [
  { href: '/thesis/execution', label: 'Execution', symbol: 'GVC+κ' },
  { href: '/thesis/intelligence', label: 'Intelligence', symbol: 'GI' },
  { href: '/thesis/capital', label: 'Capital', symbol: '$' },
  { href: '/thesis/network', label: 'Network', symbol: 'GN' },
  { href: '/thesis/boardroom', label: 'Board Room', symbol: 'J' },
]

function ScoreValue({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <span className="flex items-baseline gap-0.5">
      <span className="font-mono text-[9px] text-ink-muted">{label}</span>
      <span className={`font-mono text-[11px] font-semibold ${color}`}>
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-[20px] font-bold text-ink tracking-tight">
              Thesis Engine
            </h1>

            {/* Live score readout */}
            <div className="hidden sm:flex items-center gap-2 relative">
              <span className="flex items-baseline gap-1">
                <span className="font-mono text-[10px] text-ink-muted">g*</span>
                <span className={`font-mono text-[15px] font-bold ${scoreColor}`}>
                  {score !== null ? score.toFixed(1) : '—'}
                </span>
                {delta !== null && (
                  <span className={`font-mono text-[9px] ${delta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                )}
              </span>

              <div className="w-px h-3.5 bg-rule" />

              <ScoreValue label="GI" value={c?.gi ?? null} color={componentColor(c?.gi ?? null)} />
              <ScoreValue label="GVC" value={c?.gvc ?? null} color={componentColor(c?.gvc ?? null)} />
              <ScoreValue label="κ" value={c?.kappa ?? null} color={componentColor(c?.kappa ?? null)} />
              <ScoreValue label="GD" value={c?.gd ?? null} color={componentColor(c?.gd ?? null)} />
              <ScoreValue label="GN" value={c?.gn ?? null} color={componentColor(c?.gn ?? null)} />
              <ScoreValue label="J" value={c?.j ?? null} color={componentColor(c?.j ?? null)} />
              <ScoreValue label="Θ" value={c?.theta ?? null} color={componentColor(c?.theta ?? null)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Energy Status Dot */}
            <div className="hidden sm:block">
              <EnergyStatusDot />
            </div>

            <div className="flex flex-col items-end gap-0">
              <div className="flex items-center gap-3">
                <span className="font-serif text-[10px] italic text-ink-muted hidden sm:inline">
                  {format(new Date(), 'MMMM d, yyyy')}
                </span>
                <UserMenu />
              </div>
              <p className="font-mono text-[8px] text-ink-faint hidden sm:block">
                g* = (GE × GI × GVC × κ × 𝒪 × GD × GN × J)^(1/8) × Gate − 𝓕 + Θ
              </p>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex gap-0.5 -mb-px overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/thesis' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-baseline gap-1 font-serif text-[12px] font-medium px-3 py-1.5 rounded-t-sm border border-transparent no-underline transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'text-burgundy border-burgundy bg-burgundy-bg border-b-paper -mb-px font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-cream'
                }`}
              >
                {item.label}
                <span className={`font-mono text-[8px] ${isActive ? 'text-burgundy/60' : 'text-ink-faint'}`}>
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
