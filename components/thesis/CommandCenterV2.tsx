'use client'

import { useState } from 'react'

// ─── Section Label ──────────────────────────────────────────────────

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted whitespace-nowrap">{children}</span>
      <span className="flex-1 h-px bg-rule" />
    </div>
  )
}

// ─── Priority Card ──────────────────────────────────────────────────

type CardPriority = 'urgent' | 'important' | 'defer' | 'done'

function PriorityCard({ priority, tag, tagDot, title, children, due }: {
  priority: CardPriority
  tag: string
  tagDot: 'red' | 'gold' | 'green' | 'gray'
  title: string
  children: React.ReactNode
  due?: string
}) {
  const borderLeft = {
    urgent: 'border-l-[3px] border-l-red-ink',
    important: 'border-l-[3px] border-l-amber-ink',
    defer: 'border-l-[3px] border-l-ink-muted opacity-70',
    done: 'opacity-40 line-through',
  }
  const dotColor = {
    red: 'bg-red-ink',
    gold: 'bg-amber-ink',
    green: 'bg-green-ink',
    gray: 'bg-ink-muted',
  }

  return (
    <div className={`bg-white/45 border border-rule p-3.5 ${borderLeft[priority]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${dotColor[tagDot]}`} />
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink-muted">{tag}</span>
      </div>
      <div className="font-serif text-[16px] font-semibold leading-tight mb-1.5">{title}</div>
      <div className="text-[10px] text-ink/80 leading-relaxed">{children}</div>
      {due && (
        <div className="mt-2 pt-1.5 border-t border-rule text-[9px] text-ink-muted">
          {due}
        </div>
      )}
    </div>
  )
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-amber-ink/40 bg-amber-ink/[0.06] px-3 py-2 mt-2 text-[10px] text-ink/80 leading-relaxed">
      <strong className="font-serif text-[13px] font-semibold text-ink block mb-0.5">{title}</strong>
      {children}
    </div>
  )
}

// ─── Risk Card ──────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

function RiskCard({ title, level, description, gates }: {
  title: string
  level: RiskLevel
  description: string
  gates: { label: string; content: React.ReactNode }[]
}) {
  const levelStyle = {
    critical: 'text-red-ink border-red-ink bg-red-ink/[0.07]',
    high: 'text-amber-ink border-amber-ink bg-amber-ink/[0.07]',
    medium: 'text-green-ink border-green-ink bg-green-ink/[0.07]',
    low: 'text-ink-muted border-ink-muted bg-ink-muted/[0.07]',
  }

  return (
    <div className="border border-rule bg-white/45 p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="font-serif text-[17px] font-semibold">{title}</div>
        <span className={`text-[8px] tracking-[0.14em] uppercase px-1.5 py-0.5 border ${levelStyle[level]}`}>
          {level}
        </span>
      </div>
      <div className="text-[10px] text-ink/80 leading-relaxed">{description}</div>
      {gates.map((gate, i) => (
        <div key={i} className="mt-2 p-2 bg-ink/[0.03] border border-rule text-[10px] text-ink/80 leading-relaxed">
          <div className="text-[8px] uppercase tracking-[0.12em] text-ink-muted mb-0.5">{gate.label}</div>
          {gate.content}
        </div>
      ))}
    </div>
  )
}

// ─── Gantt Row ──────────────────────────────────────────────────────

function GanttRow({ label, dot, barColor, barStart, barWidth, milestone }: {
  label: string
  dot: 'red' | 'gold' | 'green' | 'gray'
  barColor: string
  barStart: string
  barWidth: string
  milestone?: string
}) {
  const dotColor = { red: 'bg-red-ink', gold: 'bg-amber-ink', green: 'bg-green-ink', gray: 'bg-ink-muted' }

  return (
    <div className="grid grid-cols-[200px_1fr] border-b border-rule last:border-b-0 min-h-[36px]">
      <div className="px-3 py-2 text-[10px] text-ink/80 border-r border-rule flex items-center gap-1.5 leading-snug">
        <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${dotColor[dot]}`} />
        {label}
      </div>
      <div className="relative grid grid-cols-8 items-center">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-full border-r border-rule/10 last:border-r-0" />
        ))}
        <div
          className={`absolute h-[10px] rounded-[1px] top-1/2 -translate-y-1/2 ${barColor}`}
          style={{ left: barStart, width: barWidth }}
        />
        {milestone && (
          <div
            className="absolute w-2 h-2 border-2 border-red-ink rotate-45 top-1/2 -translate-y-1/2 bg-cream"
            style={{ left: milestone }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Go Bag Item ────────────────────────────────────────────────────

function BagItem({ label, disabled }: { label: string; disabled?: boolean }) {
  const [checked, setChecked] = useState(false)
  return (
    <label className={`flex items-start gap-2 text-[10px] text-ink/80 py-1 px-2 border border-rule bg-white/45 cursor-pointer select-none transition-all ${checked ? 'opacity-40 line-through bg-ink/[0.03]' : 'hover:bg-white/70'} ${disabled ? 'opacity-40 cursor-default' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => !disabled && setChecked(!checked)}
        disabled={disabled}
        className="mt-0.5 flex-shrink-0 accent-ink"
      />
      {label}
    </label>
  )
}

// ─── Relationship Card ──────────────────────────────────────────────

function RelCard({ name, tag, body, nextAction }: {
  name: string
  tag: string
  body: React.ReactNode
  nextAction: string
}) {
  return (
    <div className="border border-rule bg-white/45 p-3.5 mb-2">
      <div className="flex justify-between items-start mb-2">
        <div className="font-serif text-[17px] font-semibold">{name}</div>
        <span className="text-[8px] tracking-[0.12em] uppercase px-1.5 py-0.5 border border-rule text-ink-muted">{tag}</span>
      </div>
      <div className="text-[10px] text-ink/80 leading-relaxed">{body}</div>
      <div className="mt-2 py-1.5 px-2 bg-green-ink/[0.06] border border-green-ink/20 text-[10px] text-green-ink">
        <span className="text-[8px] tracking-[0.12em] font-medium">NEXT ACTION &rarr; </span>
        {nextAction}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// PANELS
// ═══════════════════════════════════════════════════════════════════════

export function PrioritiesPanel() {
  return (
    <div>
      <SecLabel>Tonight — Next 6 Hours</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <PriorityCard priority="urgent" tag="Housing · Do Now" tagDot="red" title="Close the Sublet" due="Due: before Sunday boarding">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>Sublet tour happening now — goal &ge;$4,000/mo</li>
            <li>Covers Mar 22 &rarr; Jun 30 fully + potential surplus</li>
            <li>Lock subletter before boarding Sunday</li>
            <li>Mailroom: pick up unemployment questionnaire</li>
            <li>Confirm building access stays for you (sauna, gym)</li>
          </ul>
          <Callout title="The math in one line">
            Sublet at $4k = you pay $0 rent. Move to HomeBrew FiDi at $1,500 = 4.5mo runway vs. 2.1mo crisis.
          </Callout>
        </PriorityCard>

        <PriorityCard priority="urgent" tag="Learning · Tonight" tagDot="red" title="AI Event — World Models" due="Tonight — light prep only, don't spiral">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>Attend tonight — world models focus</li>
            <li>Prepare 2-min &quot;brain topology &rarr; world models&quot; framing to share</li>
            <li>Goal: one interesting connection worth a short post</li>
            <li>Network: anyone useful for Latent Space dinner list?</li>
            <li>Aidas is there — observe, don&apos;t decide anything</li>
          </ul>
        </PriorityCard>
      </div>

      <SecLabel>Saturday</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <PriorityCard priority="important" tag="Pitch · Saturday" tagDot="gold" title="Dave Deck (5 slides max)" due="Due: Saturday EOD — before you pack">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>Backtest results — even 80% complete is enough</li>
            <li>1-page performance tearsheet (Sharpe, drawdown, return)</li>
            <li>Ops overview — his load is minimal, yours is the technical work</li>
            <li>Regulatory path — paper trading = zero legal surface area</li>
            <li>The ask slide — see Options A/B/C below</li>
          </ul>
          <Callout title="Options A / B / C — Know These Cold">
            <p className="mb-1"><strong>Option A (lead):</strong> Dave commits as equal partner. $3k/month starting April 1. Equal equity in fund entity, joint strategy decisions, path to exiting Shell.</p>
            <p className="mb-1"><strong>Option B (fallback):</strong> He introduces his friend&apos;s $50k. You manage it at 2% AUM = $1k/year. First external check is the hardest.</p>
            <p className="mb-1"><strong>Option C (lowest barrier):</strong> No money changes hands now. You both commit to the structure, start the 6-month paper trade clock, revisit capital raise in October.</p>
            <p>Lead A. If he hesitates, land on C. B is available if he wants something tangible without committing capital.</p>
          </Callout>
          <Callout title="Sequencing warning">
            Do NOT lead with rent/runway pressure. Make the ask first. Financial disclosure before the ask undermines your position.
          </Callout>
        </PriorityCard>

        <PriorityCard priority="important" tag="Housing · Saturday" tagDot="gold" title="Apartment Ready to Sublet" due="Due: Saturday EOD">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>Deep clean — make it look like the photos</li>
            <li>Stage: put away personal items, clear surfaces</li>
            <li>Pack go bag (see Go Bag tab for full checklist)</li>
            <li>Confirm HomeBrew FiDi move-in: Mar 28 or Apr 1?</li>
          </ul>
        </PriorityCard>
      </div>

      <SecLabel>Aruba — March 22–28</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <PriorityCard priority="urgent" tag="Primary Mission" tagDot="red" title="Dave Verbal Commitment">
          Lead with Option A. Land on Option C if needed. Option B as fallback. You don&apos;t need a signed term sheet from a beach chair. You need him to say yes to the <em>direction</em> before you fly home.
        </PriorityCard>
        <PriorityCard priority="important" tag="Personal" tagDot="gold" title="Imgesu Birthday + Kiteboarding">
          4 hrs deep work daily — non-negotiable. Kiteboarding morning block. Be fully present for Imgesu&apos;s birthday. Introduce Dave and Aidas — you think they&apos;ll connect well.
        </PriorityCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        <PriorityCard priority="important" tag="Open Question · Aruba" tagDot="gold" title="Daily Deep Work: What Moves the Needle Most?">
          Given 4 hrs/day of protected work time in Aruba — what is the single highest-leverage thing you can accomplish each day?
          <Callout title="Candidates to decide between">
            Backtest progress (directly feeds Dave pitch + tearsheet) · Stanford RL study · Sean prep (Tuesday retainer conversation) · Relationship outreach · Written post from world models event · Armstrong UI improvements for Dave demo
          </Callout>
          <p className="mt-1.5">Answer: <strong>Backtest progress every day first.</strong> Everything else is secondary.</p>
        </PriorityCard>
        <PriorityCard priority="defer" tag="Background Only" tagDot="gray" title="Aidas">
          Observe. Don&apos;t decide anything from the beach. Come back to Brooklyn to process. Emotional activation running in background costs you hours on what matters. Note what you notice — write it down privately — decide nothing.
        </PriorityCard>
      </div>

      <SecLabel>Tuesday March 25 — Sean Conversation</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <PriorityCard priority="urgent" tag="Prep Before Aruba" tagDot="red" title="Sean: Retainer + Limit Order Optimization" due="Prep by: Sunday before boarding · Call: Tuesday Mar 25">
          <ul className="list-disc pl-3 space-y-0.5">
            <li><strong>What&apos;s on the table:</strong> Sean retainer deal — scope TBD. Limit order optimization is the technical ask.</li>
            <li><strong>What you need to clarify before the call:</strong> What exactly is he asking you to build?</li>
            <li><strong>Your ask:</strong> What is the retainer amount? Monthly or project-based? Deliverables and timeline?</li>
            <li><strong>Your leverage:</strong> You have Armstrong already built. You understand options + screener logic.</li>
            <li><strong>Positioning:</strong> You are a quant builder with live infrastructure — not a freelancer. Price accordingly.</li>
          </ul>
          <Callout title="Key question to answer before Tuesday">
            What is the minimum retainer that makes this worth your time vs. the backtest sprint? If it&apos;s under $3k/mo, the opportunity cost is probably too high unless the work directly feeds Armstrong.
          </Callout>
        </PriorityCard>
        <PriorityCard priority="important" tag="Limit Order Optimization" tagDot="gold" title="Technical Context">
          <p className="mb-1">Limit order optimization = deciding <em>when and at what price</em> to place limit orders to maximize fill probability while minimizing market impact and slippage.</p>
          <ul className="list-disc pl-3 space-y-0.5">
            <li>If Sean&apos;s ask is &quot;help me automate smarter entries&quot; &rarr; directly applicable to Armstrong</li>
            <li>If it&apos;s &quot;build a full execution algo&quot; &rarr; scope carefully, this is weeks of work</li>
            <li>If it&apos;s &quot;optimize my existing rules&quot; &rarr; 1-2 week project, clean retainer scope</li>
          </ul>
          <Callout title="Best outcome from Tuesday">
            $4–6k/month retainer, work that directly overlaps with Armstrong development, Sean as a reference client for future consulting pipeline.
          </Callout>
        </PriorityCard>
      </div>

      <SecLabel>April 1 &rarr; June 30 — The 3-Month Bet</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <PriorityCard priority="important" tag="North Star · P1" tagDot="green" title="Backtest → Tearsheet" due="Hard deadline: October 1">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>5–6 hrs/day — the spine of the whole plan</li>
            <li>Hard deadline: complete + documented by Oct 1</li>
            <li>Converts &quot;I have a strategy&quot; &rarr; &quot;I have evidence&quot;</li>
            <li>Unlocks: Dave capital, family offices, consulting pitch</li>
          </ul>
        </PriorityCard>
        <PriorityCard priority="important" tag="Revenue · P2" tagDot="green" title="First Consulting Client" due="First ask: April 1">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>2 revenue asks/day — logged, 30 min total</li>
            <li>Target: $3–8k/month quant or AI consulting</li>
            <li>One client at $3k/mo = runway becomes indefinite</li>
            <li>Alamo Bernal: counter with performance-linked structure, not flat $1k</li>
          </ul>
        </PriorityCard>
        <PriorityCard priority="important" tag="Credentialing · P3" tagDot="green" title="Stanford RL Coursework">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>2 hrs/day — parallel to backtest, non-negotiable</li>
            <li>Apply concepts directly into Armstrong as you go</li>
            <li>Builds AI research surface area for 24-month path</li>
          </ul>
        </PriorityCard>
        <PriorityCard priority="important" tag="Admin · April 15" tagDot="gold" title="Tax Filing + Fundraising Plan" due="Deadline: April 15">
          <ul className="list-disc pl-3 space-y-0.5">
            <li>Personal taxes due April 15 — options trading gains from 2025</li>
            <li>Pre-seed capital is <em>not</em> taxable (equity, not income)</li>
            <li>Action: 30-min CPA call this week to model tax liability vs. runway</li>
            <li>Williamsburg lease extension decision also due April 15</li>
          </ul>
        </PriorityCard>
      </div>

      <SecLabel>Defer / Delegate / Drop</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <PriorityCard priority="defer" tag="Defer" tagDot="gray" title="Latent Space Dinners">
          Post-Aruba, post-housing settled. Invitation artifact is the key touchpoint when ready. Logo intentionally deferred until after 3rd dinner.
        </PriorityCard>
        <PriorityCard priority="defer" tag="Defer" tagDot="gray" title="Armstrong RL Tinkering">
          Signal timing experiments, auto research tabs — valuable learning but zero priority until backtest is done.
        </PriorityCard>
        <PriorityCard priority="defer" tag="Drop" tagDot="gray" title="Thesis Engine B2B">
          Build for you as RL lab first. Do not productize until 3+ paying consulting clients are independently asking for it.
        </PriorityCard>
      </div>
    </div>
  )
}

export function RiskGatesPanel() {
  return (
    <div>
      <SecLabel>Khosla-Style Derisking — Each Gate Unlocks the Next</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <RiskCard
          title="Strategy Risk"
          level="critical"
          description="Does the strategy have real, systematic, repeatable edge — or is it luck?"
          gates={[
            { label: 'How you derisk it', content: <><p>Completed backtest with drawdown analysis, Sharpe ratio, and sample trades. Walk-forward validation on historical data.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: Dave capital, family office meetings, consulting pitch credibility</p></> },
            { label: 'Current status', content: '~80% complete. Backtest framework built. Yahoo Finance data loaded. No tearsheet yet.' },
            { label: 'Kill criteria', content: 'Backtest shows strategy underperforms market across boom/bust cycles with no explainable edge.' },
          ]}
        />
        <RiskCard
          title="Partner Risk"
          level="critical"
          description="Will Dave commit? Without a co-founder, you are CEO + quant researcher + sales simultaneously with no checks."
          gates={[
            { label: 'How you derisk it', content: <><p>Aruba conversation. Show the backtest. Make a clear ask. Sequence: Option A &rarr; Option C.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: fund entity formation, AUM from his network, shared ops burden</p></> },
            { label: 'Current status', content: 'Dave is engaged, intellectually excited, but cautious. Daydreaming about it. Has not committed.' },
            { label: 'Kill criteria', content: 'Dave says no to all options. Pivot: solo paper trading track record → different partner or solo raise in 12 months.' },
          ]}
        />
        <RiskCard
          title="Revenue Risk"
          level="high"
          description="Can you generate consulting income before runway runs out? Fund management fees are $0 until capital is raised."
          gates={[
            { label: 'How you derisk it', content: <><p>2 revenue asks per day starting April 1, logged. Target: $3–8k/month quant or AI consulting.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: psychological freedom, removes financial pressure from bet</p></> },
            { label: 'Kill criteria', content: '30 days of asks, zero traction. Reassess: is the consulting pitch wrong, or is the market wrong?' },
          ]}
        />
        <RiskCard
          title="Execution Risk"
          level="high"
          description="Can you maintain 5–6hr/day focus on the backtest for 6 months while also selling, studying, and managing housing/finances?"
          gates={[
            { label: 'How you derisk it', content: <><p>FiDi HomeBrew move eliminates commute + social overhead. $1,500/mo burn is sustainable. Deep work 5–6hr morning block is protected.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: backtest on track, RL study compounds, consulting pipeline builds in parallel</p></> },
            { label: 'Kill criteria', content: 'Backtest not 50% done by June 1. If so: ruthlessly cut RL hours, consulting asks, and all non-backtest activity.' },
          ]}
        />
        <RiskCard
          title="Capital Raise Risk"
          level="medium"
          description="Will investors (Dan Hussain, Neil Kapoor, Sam Cassett, Dave's network) actually write checks?"
          gates={[
            { label: 'How you derisk it', content: <><p>Tearsheet + 6-month paper trade log + Dave committed = credible package.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: AUM on books, external track record clock starts</p></> },
            { label: 'Timeline', content: 'Not a 6-month ask. First capital raise conversation appropriate Oct–Dec 2026 after tearsheet exists.' },
          ]}
        />
        <RiskCard
          title="Regulatory / Legal Risk"
          level="medium"
          description="Can you legally manage other people's money? RIA registration or fund entity required before accepting outside capital."
          gates={[
            { label: 'How you derisk it', content: <><p>Paper trading phase = zero regulatory surface area. Get 3 fund formation attorney quotes before raising. 3(c)(1) fund structure is the standard starting path.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: Dave&apos;s friend&apos;s $50k accepted compliantly</p></> },
            { label: 'Current status', content: 'No entity formed yet. Not needed until Dave commits. Delegate: get quotes in April, form entity in June.' },
          ]}
        />
        <RiskCard
          title="Identity / Verbal Risk"
          level="high"
          description="Known gap between written strategic clarity (sharp) and verbal executive communication (hedging, filler-heavy). Costs you in Dave pitch and every investor conversation."
          gates={[
            { label: 'How you derisk it', content: <><p>Pre-call written analysis documents are your strength — use them. Practice the Dave ask out loud before Aruba. No &quot;I gotta believe&quot; hedging. Lead with the evidence.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: Dave says yes, investor conversations land differently</p></> },
          ]}
        />
        <RiskCard
          title="Tax / Financial Risk"
          level="high"
          description="Options trading gains in 2025 may generate a significant personal tax liability due April 15."
          gates={[
            { label: 'How you derisk it', content: <><p>30-min CPA call this week. Model: what do you owe on 2025 gains? Can you set up a payment plan? Pre-seed capital is NOT taxable — it&apos;s equity.</p><p className="text-green-ink text-[9px] mt-1">&darr; Unlocks: no surprise bill in April, fundraising can proceed</p></> },
          ]}
        />
      </div>
    </div>
  )
}

export function TimelinePanel() {
  const months = ['Mar', 'Apr–May', 'Jun', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']

  return (
    <div>
      <SecLabel>Timeline — March 2026 &rarr; October 2026</SecLabel>
      <div className="overflow-x-auto">
        <div className="min-w-[700px] border border-rule">
          {/* Header */}
          <div className="grid grid-cols-[200px_1fr] border-b border-rule bg-ink/[0.03]">
            <div className="px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-ink-muted border-r border-rule">Initiative</div>
            <div className="grid grid-cols-8">
              {months.map((m, i) => (
                <div key={i} className={`py-2 px-1 text-[9px] uppercase tracking-[0.1em] text-center border-r border-rule last:border-r-0 ${i === 0 ? 'text-red-ink font-medium' : 'text-ink-muted'}`}>
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <GanttRow label="Sublet Williamsburg" dot="red" barColor="bg-red-ink" barStart="0%" barWidth="37.5%" />
          <GanttRow label="HomeBrew FiDi" dot="gold" barColor="bg-amber-ink" barStart="12%" barWidth="50%" />
          <GanttRow label="Aruba + Dave Pitch" dot="red" barColor="bg-red-ink" barStart="8%" barWidth="6%" milestone="14%" />
          <GanttRow label="Backtest Sprint (P1)" dot="green" barColor="bg-green-ink" barStart="12.5%" barWidth="87%" milestone="99%" />
          <GanttRow label="Consulting Revenue" dot="gold" barColor="bg-amber-ink" barStart="12.5%" barWidth="87%" />
          <GanttRow label="Stanford RL (2hr/day)" dot="green" barColor="bg-green-ink/50" barStart="12.5%" barWidth="87%" />
          <GanttRow label="Tax Filing (Apr 15)" dot="gold" barColor="bg-amber-ink" barStart="12.5%" barWidth="15%" milestone="27%" />
          <GanttRow label="Dave Commits (target)" dot="red" barColor="bg-transparent" barStart="0%" barWidth="0%" milestone="14%" />
          <GanttRow label="Live Paper Trading" dot="green" barColor="bg-green-ink/40" barStart="12.5%" barWidth="87%" />
          <GanttRow label="Capital Raise Convo" dot="gray" barColor="bg-ink-muted/50" barStart="87%" barWidth="13%" />
          <GanttRow label="3-Month Bet Checkpoint" dot="red" barColor="bg-transparent" barStart="0%" barWidth="0%" milestone="49.5%" />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-5 items-center text-[9px] text-ink-muted">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-red-ink" />Critical path</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-amber-ink" />Important</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-green-ink" />Ongoing sprint</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 border-2 border-red-ink rotate-45" />Milestone</span>
      </div>
    </div>
  )
}

export function GoBagPanel() {
  return (
    <div>
      <SecLabel>Go Bag — Pack Before Sunday · Check Off as You Go</SecLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-[14px] font-semibold text-ink/80 uppercase tracking-[0.1em] mb-2">Documents + Admin</h3>
            <div className="grid grid-cols-2 gap-1">
              {['Passport', 'ID / driver\'s license', 'Unemployment questionnaire (mailroom)', 'Tax documents (W-9 / 1099)', 'Health insurance card', 'Credit cards + debit card'].map(item => (
                <BagItem key={item} label={item} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[14px] font-semibold text-ink/80 uppercase tracking-[0.1em] mb-2">Tech</h3>
            <div className="grid grid-cols-2 gap-1">
              {['Laptop', 'Laptop charger', 'Phone charger', 'AirPods + case', 'External monitor (if needed at FiDi)', 'USB-C hub / dongles'].map(item => (
                <BagItem key={item} label={item} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[14px] font-semibold text-ink/80 uppercase tracking-[0.1em] mb-2">Aruba Specific</h3>
            <div className="grid grid-cols-2 gap-1">
              {['Kiteboarding gear / wetsuit', 'Swimwear (2–3 pieces)', 'Sunscreen SPF 50+', 'Sunglasses', 'Light layers (evenings)', 'One nicer outfit (birthday dinner)'].map(item => (
                <BagItem key={item} label={item} />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-[14px] font-semibold text-ink/80 uppercase tracking-[0.1em] mb-2">Clothes (FiDi + Daily)</h3>
            <div className="grid grid-cols-2 gap-1">
              {['Running outfits x 2', 'Casual everyday x 3–4', 'Business/smart casual x 2', 'Jacket x 3', 'Running shoes', 'Dance shoes', 'Prada shoes'].map(item => (
                <BagItem key={item} label={item} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[14px] font-semibold text-ink/80 uppercase tracking-[0.1em] mb-2">Health + Wellness</h3>
            <div className="grid grid-cols-2 gap-1">
              {['Supplements', 'Creatine', 'Protein powder', 'Vitamins / daily meds', 'Tums (stomach emergency kit)', 'Skincare essentials'].map(item => (
                <BagItem key={item} label={item} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-serif text-[14px] font-semibold text-ink/80 uppercase tracking-[0.1em] mb-2">Leave in Williamsburg (Retrieve Later)</h3>
            <div className="grid grid-cols-2 gap-1">
              {['All furniture', 'Books + non-essential decor', 'Winter clothes', 'Non-essential tech', 'Extra shoes / accessories', 'Kitchen gear'].map(item => (
                <BagItem key={item} label={item} disabled />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RelationshipsPanel() {
  return (
    <div>
      <SecLabel>Relationship CRM — People to Update + Track</SecLabel>

      <RelCard
        name="Dave Moss"
        tag="Prospective Cofounder · Strategy Partner"
        body={<>
          <p>Imgesu&apos;s boyfriend. Strategy originator. Shell employee daydreaming about leaving. Intellectually engaged with Armstrong. Cautious about reputation, operations, regulatory stress.</p>
          <ul className="list-disc pl-3 mt-1 space-y-0.5">
            <li>Concerns to address: reputation (paper trading phase protects), ops load (minimal), regulatory (zero surface area)</li>
            <li>Sequencing: Option A (equal partner) &rarr; Option C (yes to structure) &rarr; Option B (manage friend&apos;s $50k)</li>
          </ul>
        </>}
        nextAction="Aruba pitch conversation. Deck built before you board. One verbal yes before you fly home."
      />

      <RelCard
        name="Dan Hussain"
        tag="Prospective Investor · High Confidence"
        body="In the network. Prospective capital source. Update him post-Aruba on Dave commitment + backtest progress. Do not pitch without a tearsheet."
        nextAction="Post-Aruba update call. Keep in the loop. Full pitch after tearsheet exists (Oct–Dec)."
      />

      <RelCard
        name="Neil Kapoor"
        tag="Prospective Investor · Medium Confidence"
        body="Prospective allocator. Similar timing to Dan — relationship maintenance now, formal pitch post-tearsheet."
        nextAction="One touchpoint in April — share what you're building, no ask yet."
      />

      <RelCard
        name="Sam Cassett"
        tag="Prospective Investor · Varying Confidence"
        body="Third prospective investor in the network. Same play as Neil — maintain relationship, formal pitch deferred to post-tearsheet."
        nextAction="One touchpoint in April. Keep warm."
      />

      <RelCard
        name="Sean"
        tag="Prospective Client · Retainer Conversation"
        body="Tuesday March 25 call. Topic: retainer structure + limit order optimization. You are a quant builder with live infrastructure — not a freelancer. Price accordingly. Minimum bar: $3k/mo or the work directly feeds Armstrong."
        nextAction="Prep Sunday before boarding. Call Tuesday Mar 25 from Aruba."
      />

      <RelCard
        name="Aidas"
        tag="Close Friend · Romantic Interest"
        body="Strong feelings, not yet expressed directly. Will be in Aruba. Observe — don't decide anything from the beach. Come back to Brooklyn to process."
        nextAction="Observe in Aruba. Return to Brooklyn before any decisions."
      />

      <RelCard
        name="Imgesu"
        tag="Close Friend · Dave's Partner"
        body="Birthday in Aruba. Currently navigating tension in her relationship with Dave. You are effectively acting as COO on the birthday logistics. Be present for her."
        nextAction="Aruba: birthday celebration is primary. Be present and supportive."
      />
    </div>
  )
}

export function OpenQuestionsPanel() {
  const questions = [
    { num: 1, text: <><strong>HomeBrew FiDi move-in:</strong> March 28 or April 1? Confirm before boarding Sunday. Changes packing deadline and whether you move before or after Aruba.</> },
    { num: 2, text: <><strong>Williamsburg lease extension:</strong> What is the extension deadline? Leaning extend or clean break? If extend + keep HomeBrew, model whether sublet income reliably covers Williamsburg rent.</> },
    { num: 3, text: <><strong>Tax liability:</strong> What do you actually owe on 2025 options trading gains? Book a 30-min CPA call this week. Pre-seed capital is not taxable — model only your personal 2025 income.</> },
    { num: 4, text: <><strong>Unemployment questionnaire:</strong> What does it actually require? Is the mailroom visit time-sensitive or can it wait until you return from Aruba?</> },
    { num: 5, text: <><strong>Alamo Bernal:</strong> What is the quality of his strategy? Is it novel and systematizable (worth $1k/month as tuition) or basic (walk unless he accepts performance-linked structure)?</> },
    { num: 6, text: <><strong>Transcript / relationship logging:</strong> What tool are you using to log calls with Dave, investors, consulting leads? Needs to be set up before volume increases in April.</> },
    { num: 7, text: <><strong>Fundraising path:</strong> What are the derisking gates between now and a first capital raise? What is your ask when you pitch Dan / Neil / Sam? AUM target? Fund structure? Timeline?</> },
    { num: 8, text: <><strong>World models event Saturday:</strong> What time? What venue? Who else is going besides you and Aidas?</> },
    { num: 9, text: <><strong>Aidas:</strong> What do you want to say / not say in Aruba? What would make you regret the trip if it went unsaid?</> },
    { num: 10, text: <><strong>Single most avoided action:</strong> What one thing, if you stopped avoiding it, would most change your trajectory?</> },
  ]

  return (
    <div>
      <SecLabel>Open Questions — Resolve These Before / After Aruba</SecLabel>
      <ul className="space-y-1.5">
        {questions.map(q => (
          <li key={q.num} className="flex gap-2 p-2 px-3 border border-rule bg-white/45 text-[10px] text-ink/80 leading-relaxed">
            <span className="font-serif text-[15px] font-light text-ink-muted flex-shrink-0 leading-none">{q.num}</span>
            <div>{q.text}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TAB CONTAINER
// ═══════════════════════════════════════════════════════════════════════

const V2_TABS = [
  { id: 'priorities', label: 'Priorities' },
  { id: 'risks', label: 'Risk Gates' },
  { id: 'gantt', label: 'Timeline' },
  { id: 'gobag', label: 'Go Bag' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'open', label: 'Open Questions' },
] as const

type V2TabId = typeof V2_TABS[number]['id']

export default function CommandCenterV2() {
  const [activeTab, setActiveTab] = useState<V2TabId>('priorities')

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-0.5 mb-4 border-b border-ink pb-px">
        {V2_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'text-ink border-ink'
                : 'text-ink-muted border-transparent hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      {activeTab === 'priorities' && <PrioritiesPanel />}
      {activeTab === 'risks' && <RiskGatesPanel />}
      {activeTab === 'gantt' && <TimelinePanel />}
      {activeTab === 'gobag' && <GoBagPanel />}
      {activeTab === 'relationships' && <RelationshipsPanel />}
      {activeTab === 'open' && <OpenQuestionsPanel />}
    </div>
  )
}
