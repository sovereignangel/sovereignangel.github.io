'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import RewardProofModal from '@/components/thesis/RewardProofModal'
import ArchitecturePanel from '@/components/thesis/ArchitecturePanel'
import MasteryTreeModal from '@/components/thesis/MasteryTreeModal'
import GuidebookModal from '@/components/thesis/guidebooks/GuidebookModal'
import { DECISION_QUALITY_GUIDE } from '@/lib/guidebooks/decision-quality'
import { WEEKLY_SYNTHESIS_GUIDE } from '@/lib/guidebooks/weekly-synthesis'
import { CADENCE_PROTOCOL_GUIDE } from '@/lib/guidebooks/cadence-protocol'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showProof, setShowProof] = useState(false)
  const [showArchitecture, setShowArchitecture] = useState(false)
  const [showMastery, setShowMastery] = useState(false)
  const [showGuide, setShowGuide] = useState<'decisions' | 'synthesis' | 'cadence' | null>(null)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || ''}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-navy text-paper flex items-center justify-center font-mono text-[11px]">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
        <span className="font-mono text-[10px] text-ink-muted hidden sm:inline">
          {user.email}
        </span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 bg-paper border border-rule rounded-sm shadow-sm z-20 min-w-[180px]">
            <button
              onClick={() => { setShowProof(true); setShowMenu(false) }}
              className="w-full text-left px-4 py-2.5 font-serif text-[12px] text-ink-light hover:bg-cream transition-colors flex items-center gap-2 border-b border-rule-light"
            >
              <span className="font-mono text-[11px] text-navy font-semibold">g*</span>
              <span>Reward Function</span>
            </button>
            <button
              onClick={() => { setShowArchitecture(true); setShowMenu(false) }}
              className="w-full text-left px-4 py-2.5 font-serif text-[12px] text-ink-light hover:bg-cream transition-colors flex items-center gap-2 border-b border-rule-light"
            >
              <svg className="w-3.5 h-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span>Reward Flow</span>
            </button>
            <button
              onClick={() => { setShowMastery(true); setShowMenu(false) }}
              className="w-full text-left px-4 py-2.5 font-serif text-[12px] text-ink-light hover:bg-cream transition-colors flex items-center gap-2 border-b border-rule-light"
            >
              <svg className="w-3.5 h-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <span>Belt Hierarchy</span>
            </button>
            <div className="border-b border-rule-light">
              <span className="block px-4 pt-2 pb-1 font-mono text-[8px] text-ink-faint uppercase tracking-wider">Guidebooks</span>
              <button
                onClick={() => { setShowGuide('decisions'); setShowMenu(false) }}
                className="w-full text-left px-4 py-1.5 font-serif text-[11px] text-ink-muted hover:text-ink hover:bg-cream transition-colors"
              >
                Decision Quality
              </button>
              <button
                onClick={() => { setShowGuide('synthesis'); setShowMenu(false) }}
                className="w-full text-left px-4 py-1.5 font-serif text-[11px] text-ink-muted hover:text-ink hover:bg-cream transition-colors"
              >
                Weekly Synthesis
              </button>
              <button
                onClick={() => { setShowGuide('cadence'); setShowMenu(false) }}
                className="w-full text-left px-4 py-1.5 pb-2 font-serif text-[11px] text-ink-muted hover:text-ink hover:bg-cream transition-colors"
              >
                Cadence Protocol
              </button>
            </div>
            <Link
              href="/thesis/settings"
              onClick={() => setShowMenu(false)}
              className="block w-full text-left px-4 py-2.5 font-serif text-[12px] text-ink-light hover:bg-cream transition-colors no-underline border-b border-rule-light"
            >
              Settings
            </Link>
            <button
              onClick={() => { signOut(); setShowMenu(false) }}
              className="w-full text-left px-4 py-2.5 font-serif text-[12px] text-ink-light hover:bg-cream transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}

      {showProof && <RewardProofModal onClose={() => setShowProof(false)} />}
      {showArchitecture && <ArchitecturePanel onClose={() => setShowArchitecture(false)} />}
      {showMastery && <MasteryTreeModal onClose={() => setShowMastery(false)} />}
      {showGuide === 'decisions' && (
        <GuidebookModal title={DECISION_QUALITY_GUIDE.title} sections={DECISION_QUALITY_GUIDE.sections} onClose={() => setShowGuide(null)} />
      )}
      {showGuide === 'synthesis' && (
        <GuidebookModal title={WEEKLY_SYNTHESIS_GUIDE.title} sections={WEEKLY_SYNTHESIS_GUIDE.sections} onClose={() => setShowGuide(null)} />
      )}
      {showGuide === 'cadence' && (
        <GuidebookModal title={CADENCE_PROTOCOL_GUIDE.title} sections={CADENCE_PROTOCOL_GUIDE.sections} onClose={() => setShowGuide(null)} />
      )}
    </div>
  )
}
