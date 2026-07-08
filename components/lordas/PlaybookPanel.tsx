'use client'

import { useEffect, useRef, useState } from 'react'
import { TERRACOTTA, PAPER, INK, MUTED, RULE, SAGE, AMBER } from './goals-theme'

/**
 * "Playbook" dropdown in the Goals header: the goal structure and the
 * weekly operating rhythm, as a standing reference for both partners.
 */
export function PlaybookPanel() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-sm border text-[9px] font-serif font-semibold uppercase transition-colors flex-shrink-0"
        style={{
          backgroundColor: open ? TERRACOTTA : 'transparent',
          color: open ? PAPER : MUTED,
          borderColor: open ? TERRACOTTA : RULE,
        }}
      >
        {/* Open book */}
        <svg width="11" height="10" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 2.5 C5.5 1 3 1 1.5 1.5 V10 C3 9.5 5.5 9.5 7 11 C8.5 9.5 11 9.5 12.5 10 V1.5 C11 1 8.5 1 7 2.5 Z" />
          <path d="M7 2.5 V11" />
        </svg>
        Playbook
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-[min(92vw,420px)] max-h-[75vh] overflow-y-auto rounded-sm border shadow-lg p-4"
          style={{ backgroundColor: PAPER, borderColor: RULE }}
        >
          <div className="flex items-start justify-between mb-3 pb-2 border-b-2" style={{ borderColor: RULE }}>
            <div>
              <h3 className="font-serif text-[14px] font-semibold uppercase tracking-[0.5px]" style={{ color: TERRACOTTA }}>
                The Playbook
              </h3>
              <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
                Structure and rhythm — how we hold each other accountable
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1" style={{ color: MUTED }} title="Close">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M2 2 L10 10 M10 2 L2 10" />
              </svg>
            </button>
          </div>

          <Section title="The Goal Stack" color={TERRACOTTA}>
            <Item label="North Star">Identity statement per owner — who each of us is becoming. Reviewed rarely, changed almost never.</Item>
            <Item label="Summer Campaign">One overarching goal per owner, falsifiable on a date, with up to 5 KPIs that prove it was hit.</Item>
            <Item label="Weekly Sprint">Up to 3 needle-movers per owner, each with a success criterion checkable on Sunday, each locked by the other person.</Item>
          </Section>

          <Section title="Sunday Council · 45 min, same time weekly" color={SAGE}>
            <Item label="1 · Score (10m)">Mark every commitment's final status. Facts before feelings — the hit rate computes itself.</Item>
            <Item label="2 · Review (10m)">Each speaks one win and one lesson, then writes them in. Spoken first, written second.</Item>
            <Item label="3 · Partner note (5m)">One honest sentence each, said aloud before it is typed. Acknowledge the real or call the gap.</Item>
            <Item label="4 · Plan (15m)">Next week's needle-movers with success criteria, mapped to KPIs, checked against the actual calendar.</Item>
            <Item label="5 · Handshake (5m)">Lock each other's commitments — relationship goals first. A lock means: I believe in this and I will hold you to it.</Item>
          </Section>

          <Section title="Between Councils" color={AMBER}>
            <Item label="Wednesday pulse (2m)">Update status toggles only. No discussion — it keeps Sunday honest and surfaces at-risk items in time.</Item>
            <Item label="First Sunday monthly (+15m)">Update KPI currents, re-status milestones, and each answer one question the other asks: what are you pretending not to know?</Item>
          </Section>

          <Section title="The Rules" color={TERRACOTTA}>
            <Item label="Challenge the commitment, never the character">&ldquo;That goal was vague&rdquo; is coaching. &ldquo;You always overcommit&rdquo; is criticism — the first horseman.</Item>
            <Item label="Five to one">Over a month, acknowledgments should outnumber challenges roughly 5:1. If challenges dominate, the system is drifting.</Item>
            <Item label="Don't lock what you don't believe">Push back until the commitment is real and the hours for it exist. The calendar is the true budget.</Item>
            <Item label="Council material only">Hit rates and misses are never ammunition in an argument. Dashboard data stays in the Council.</Item>
            <Item label="A missed week is data, not debt">The question is what the week revealed — about the goal, the estimate, or the life around it. Never why did you fail.</Item>
            <Item label="Pre-agreed consequence, kept light">Whoever misses their week plans and books the next date night. Ritual, not punishment.</Item>
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5 pb-1 border-b" style={{ color, borderColor: RULE }}>
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.5px]" style={{ color: INK }}>
        {label}
      </p>
      <p className="text-[11px] leading-snug" style={{ color: MUTED }}>
        {children}
      </p>
    </div>
  )
}
