'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/auth/UserMenu'
import { format } from 'date-fns'

const navItems = [
  { href: '/thesis', label: 'Dashboard' },
  { href: '/thesis/daily-log', label: 'Daily Log' },
  { href: '/thesis/projects', label: 'Projects' },
  { href: '/thesis/signals', label: 'Signals' },
  { href: '/thesis/weekly', label: 'Weekly' },
  { href: '/thesis/settings', label: 'Settings' },
]

export default function ThesisNav() {
  const pathname = usePathname()

  return (
    <header className="bg-paper border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-[22px] font-bold text-ink tracking-tight">
              Thesis Engine
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-serif text-[11px] italic text-ink-muted hidden sm:inline">
              {format(new Date(), 'MMMM d, yyyy')}
            </span>
            <UserMenu />
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/thesis' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-serif text-[13px] font-medium px-4 py-2 rounded-t-sm border border-transparent no-underline transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'text-navy border-navy bg-navy-bg border-b-paper -mb-px'
                    : 'text-ink-light hover:text-ink hover:bg-cream'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
