'use client'

import { SightsColumn } from './SightsColumn'
import { CyclingColumn } from './CyclingColumn'
import { KitingColumn } from './KitingColumn'
import { TERRACOTTA, MUTED, RULE } from '../goals-theme'

export function CphView() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <div className="flex items-center gap-3 border-b-2 pb-4 mb-5" style={{ borderColor: RULE }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TERRACOTTA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21 L21 21" />
          <path d="M12 21 L12 3 L19 6.5 L12 10" />
          <path d="M6 21 L6 14 L12 14" />
        </svg>
        <div>
          <h1 className="font-serif text-[20px] font-semibold tracking-[0.5px]" style={{ color: TERRACOTTA }}>
            Copenhagen · Aug 8–9
          </h1>
          <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
            Lori & Aidas · maximize exploring, cycling & kiting in two days
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <SightsColumn />
        <CyclingColumn />
        <KitingColumn />
      </div>
    </div>
  )
}
