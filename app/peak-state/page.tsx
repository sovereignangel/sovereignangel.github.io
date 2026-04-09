'use client'

import { useState } from 'react'

// ── SVG Icons ───────────────────────────────────────────────────────────────
const Icon = {
  plane: (c = '#7c2d2d') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.8 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.5-.6.4-1.1z"/>
    </svg>
  ),
  bike: (c = '#7c2d2d') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 100-2 1 1 0 000 2zM12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  ),
  wave: (c = '#7c2d2d') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 12c2-2 4-3 6-3s4 2 6 2 4-2 6-2"/><path d="M2 17c2-2 4-3 6-3s4 2 6 2 4-2 6-2"/>
    </svg>
  ),
  cake: (c = '#7c2d2d') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18v-4a8 8 0 0116 0v4"/><rect x="2" y="18" width="20" height="4" rx="1"/><path d="M12 4v4"/><circle cx="12" cy="3" r="1" fill={c}/>
    </svg>
  ),
  hand: (c = '#7c2d2d') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 00-4 0v5"/><path d="M14 10V4a2 2 0 00-4 0v6"/><path d="M10 10.5V6a2 2 0 00-4 0v8"/><path d="M18 8a2 2 0 014 0v6a8 8 0 01-8 8H9a8 8 0 01-3-1"/>
    </svg>
  ),
  bolt: (c = '#7c2d2d') => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  suitcase: (c = '#7c2d2d') => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  ),
  utensils: (c = '#7c2d2d') => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  ),
  compass: (c = '#7c2d2d') => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  coins: (c = '#7c2d2d') => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7"/><path d="M15.4 9.5a7 7 0 11-5.9 5.9"/>
    </svg>
  ),
  sun: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  ),
  monitor: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  glass: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l-1 10c0 2.5 2 4.5 5 4.5s5-2 5-4.5L16 2"/><path d="M12 16.5V22"/><path d="M8 22h8"/>
    </svg>
  ),
  check: (c = '#2d5f3f') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  question: (c = '#8a6d2f') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill={c}/>
    </svg>
  ),
  x: (c = '#9a928a') => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  star: (c = '#7c2d2d') => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
}

// ── Data ────────────────────────────────────────────────────────────────────
type IconKey = keyof typeof Icon

const ITINERARY: { day: number; date: string; label: string; route: string; miles: number | null; sleep: string | null; icon: IconKey; highlight: boolean }[] = [
  { day: 0, date: 'Fri, Aug 7',  label: 'Arrive',   route: 'Fly into Naples, transfer to Sorrento',         miles: null, sleep: 'Sorrento',  icon: 'plane', highlight: false },
  { day: 1, date: 'Sat, Aug 8',  label: 'Day 1',    route: 'Sorrento → Positano — coastal cliffs, first big views', miles: 22,   sleep: 'Positano',  icon: 'bike', highlight: false },
  { day: 2, date: 'Sun, Aug 9',  label: 'Day 2',    route: 'Positano → Amalfi — the iconic cliffside road',   miles: 12,   sleep: 'Amalfi',    icon: 'bike', highlight: false },
  { day: 3, date: 'Mon, Aug 10', label: 'Rest Day',  route: 'Explore Amalfi — Valle dei Mulini hike, swim, lemon groves', miles: 0, sleep: 'Amalfi', icon: 'wave', highlight: true },
  { day: 4, date: 'Tue, Aug 11', label: 'Day 3',    route: 'Amalfi → Ravello — steep climb rewarded with panoramic views', miles: 10, sleep: 'Ravello', icon: 'bike', highlight: false },
  { day: 5, date: 'Wed, Aug 12', label: 'Birthday',  route: 'Ravello → Salerno — long descent into the city, birthday dinner', miles: 25, sleep: 'Salerno', icon: 'cake', highlight: true },
  { day: 6, date: 'Thu, Aug 13', label: 'Day 5',    route: 'Salerno → Agropoli — enter the wild Cilento coast', miles: 28, sleep: 'Agropoli',  icon: 'bike', highlight: false },
  { day: 7, date: 'Fri, Aug 14', label: 'Day 6',    route: 'Agropoli → Acciaroli — quiet fishing village, Hemingway vibes', miles: 22, sleep: 'Acciaroli', icon: 'bike', highlight: false },
  { day: 8, date: 'Sat, Aug 15', label: 'Day 7',    route: 'Acciaroli → Palinuro — dramatic cape & sea caves', miles: 28, sleep: 'Palinuro',  icon: 'bike', highlight: false },
  { day: 9, date: 'Sun, Aug 16', label: 'Depart',   route: 'Morning farewell, transfer to Naples airport',    miles: null, sleep: null,         icon: 'hand', highlight: false },
]

const DETAILS = [
  { label: 'When', value: 'Aug 7 – 16, 2026' },
  { label: 'Where', value: 'Sorrento → Palinuro, Italy' },
  { label: 'Distance', value: '~20–28 mi/day (e-bikes available)' },
  { label: 'Style', value: 'Point A to B, new town each night' },
  { label: 'Remote work', value: '9am–5pm ET friendly (ride mornings, work afternoons)' },
]

const LOGISTICS: { icon: IconKey; title: string; desc: string }[] = [
  { icon: 'bolt', title: 'E-bikes recommended', desc: 'The Amalfi Coast has brutal climbs. E-bikes let everyone enjoy the views without suffering. We\'ll rent from Cycling Explorers in Sorrento.' },
  { icon: 'suitcase', title: 'Luggage transfers', desc: 'A service moves your bags hotel-to-hotel so you ride light with just a daypack.' },
  { icon: 'utensils', title: 'Food steward', desc: 'Each day, one person picks the group\'s lunch + dinner spot. You\'re encouraged to go off-script too.' },
  { icon: 'compass', title: 'Cilento is the secret', desc: 'Days 5–8 leave the crowded Amalfi Coast behind. The Cilento has the same beauty, zero crowds, and cheaper everything.' },
  { icon: 'coins', title: 'Cost breakdown below', desc: 'See the detailed estimate further down — conservative range with line-by-line breakdown.' },
]

const COST_BREAKDOWN = [
  { item: 'Round-trip flight (NYC → Naples)', low: 500, high: 800, note: 'Book early — summer prices climb fast' },
  { item: 'Hotels / Airbnb (9 nights)', low: 900, high: 1400, note: 'Shared rooms or modest hotels, ~$100–155/night' },
  { item: 'E-bike rental (9 days)', low: 250, high: 400, note: 'Group rate from Cycling Explorers, Sorrento' },
  { item: 'Food & drink (9 days)', low: 350, high: 550, note: '~$40–60/day — mix of trattorias and markets' },
  { item: 'Luggage transfer service', low: 80, high: 120, note: 'Split across group, bags moved daily' },
  { item: 'Airport transfers', low: 40, high: 70, note: 'Naples → Sorrento + Palinuro → Naples' },
  { item: 'Misc (tips, gelato, espresso)', low: 80, high: 150, note: 'Budget for spontaneous moments' },
]

type RsvpStatus = 'yes' | 'maybe' | 'no' | null

export default function PeakStatePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [rsvp, setRsvp] = useState<RsvpStatus>(null)
  const [constraints, setConstraints] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !rsvp) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/peak-state/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          status: rsvp,
          constraints: constraints.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Try again?')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClasses = 'w-full bg-white border border-rule rounded-sm px-3 py-2 text-[12px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-burgundy transition-colors'

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <header className="relative overflow-hidden bg-ink pt-16 pb-20 px-6 text-center">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%237c2d2d' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
        <div className="relative max-w-2xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-ink-faint mb-4">
            Annual Birthday Adventure · Est. 2026
          </p>
          <h1 className="font-serif text-[42px] leading-[1.1] font-semibold text-paper tracking-[-0.5px] mb-3">
            Peak State
          </h1>
          <div className="w-16 h-[2px] bg-burgundy mx-auto mb-4" />
          <p className="font-serif text-[18px] text-ink-faint leading-relaxed max-w-lg mx-auto">
            Peak performance. Peak experiences.
            <br />
            <span className="text-paper">Amalfi Coast & Cilento — Sorrento to Palinuro.</span>
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* RSVP */}
        <section className="mb-10" id="rsvp">
          <div className="bg-white border border-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-2 border-b-2 border-rule">
              RSVP
            </h2>
            <p className="text-[11px] text-ink-muted mb-4">
              Let me know if you&apos;re in. If you have dates that don&apos;t work, PTO constraints, or anything else — drop it below so I can plan around it.
            </p>

            {submitted ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-3">{Icon.star()}</div>
                <p className="font-serif text-[16px] text-burgundy font-semibold mb-1">
                  {rsvp === 'yes' ? 'You\'re in.' : rsvp === 'maybe' ? 'Noted — hope it works out.' : 'Got it — maybe next year.'}
                </p>
                <p className="text-[11px] text-ink-muted">
                  Thanks, {name}. I&apos;ll be in touch with next steps.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted block mb-1">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" required className={inputClasses} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted block mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputClasses} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted block mb-1">Phone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputClasses} />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted block mb-2">Can you make it?</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'yes' as const, label: 'I\'m in', iconKey: 'check' as IconKey },
                      { value: 'maybe' as const, label: 'Maybe', iconKey: 'question' as IconKey },
                      { value: 'no' as const, label: 'Can\'t make it', iconKey: 'x' as IconKey },
                    ]).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRsvp(option.value)}
                        className={`flex-1 py-2.5 px-2 rounded-sm border text-[11px] font-medium transition-all ${
                          rsvp === option.value
                            ? option.value === 'yes'
                              ? 'bg-green-ink text-paper border-green-ink'
                              : option.value === 'maybe'
                              ? 'bg-amber-ink text-paper border-amber-ink'
                              : 'bg-ink-muted text-paper border-ink-muted'
                            : 'bg-white text-ink-muted border-rule hover:border-ink-faint'
                        }`}
                      >
                        <span className="flex justify-center mb-0.5">
                          {Icon[option.iconKey](rsvp === option.value ? '#faf8f4' : undefined)}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {rsvp && rsvp !== 'no' && (
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted block mb-1">
                      Any constraints? (dates, PTO, budget, etc.)
                    </label>
                    <textarea
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="e.g. I can only do Aug 7-12, or I need to work all day Wednesday..."
                      rows={3}
                      className={`${inputClasses} resize-none`}
                    />
                  </div>
                )}

                {error && <p className="text-[11px] text-red-ink font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={!name.trim() || !rsvp || submitting}
                  className="w-full py-2.5 rounded-sm font-serif text-[13px] font-semibold uppercase tracking-[0.5px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-burgundy text-paper hover:opacity-90"
                >
                  {submitting ? 'Sending...' : 'Submit RSVP'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Trip Details */}
        <section className="mb-10">
          <div className="bg-white border border-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-2 border-b-2 border-rule">
              Trip Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DETAILS.map((d) => (
                <div key={d.label} className="flex gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted w-24 shrink-0 pt-[2px]">
                    {d.label}
                  </span>
                  <span className="text-[12px] text-ink font-medium leading-snug">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Daily Rhythm */}
        <section className="mb-10">
          <div className="bg-white border border-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-2 border-b-2 border-rule">
              Daily Rhythm
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Morning', icon: Icon.sun, time: '8am – 1pm', desc: 'Ride before the heat' },
                { label: 'Afternoon', icon: Icon.monitor, time: '3pm – 11pm', desc: '9–5 ET work block' },
                { label: 'Evening', icon: Icon.glass, time: '9pm – late', desc: 'Italian dinner, together' },
              ].map((block) => (
                <div key={block.label} className="text-center p-3 bg-cream rounded-sm border border-rule-light">
                  <p className="font-mono text-[10px] text-ink-muted uppercase tracking-[1px] mb-1">{block.label}</p>
                  <div className="flex justify-center mb-1">{block.icon()}</div>
                  <p className="text-[11px] text-ink font-medium">{block.time}</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Itinerary */}
        <section className="mb-10">
          <div className="bg-white border border-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-2 border-b-2 border-rule">
              Itinerary
            </h2>
            <div className="space-y-0">
              {ITINERARY.map((day, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-2.5 ${
                    i < ITINERARY.length - 1 ? 'border-b border-rule-light' : ''
                  } ${day.highlight ? 'bg-burgundy-bg -mx-2 px-2 rounded-sm' : ''}`}
                >
                  <span className="w-6 flex justify-center shrink-0 pt-0.5">{Icon[day.icon]()}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className={`font-serif text-[12px] font-semibold ${
                        day.highlight ? 'text-burgundy' : 'text-ink'
                      }`}>
                        {day.label}
                      </span>
                      <span className="font-mono text-[10px] text-ink-muted">{day.date}</span>
                      {day.miles !== null && (
                        <span className="font-mono text-[10px] text-burgundy ml-auto shrink-0">
                          {day.miles === 0 ? 'Rest' : `${day.miles} mi`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-muted leading-snug">{day.route}</p>
                    {day.sleep && (
                      <p className="font-mono text-[10px] text-ink-faint mt-0.5">
                        Sleep: {day.sleep}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t-2 border-rule flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted">Total riding distance</span>
              <span className="font-mono text-[13px] font-semibold text-burgundy">~147 mi</span>
            </div>
          </div>
        </section>

        {/* Good to Know */}
        <section className="mb-10">
          <div className="bg-white border border-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-2 border-b-2 border-rule">
              Good to Know
            </h2>
            <div className="space-y-2.5">
              {LOGISTICS.map((item) => (
                <div key={item.title} className="flex gap-2.5">
                  <span className="shrink-0 pt-0.5">{Icon[item.icon]()}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-ink mb-0.5">{item.title}</p>
                    <p className="text-[11px] text-ink-muted leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="mb-10">
          <div className="bg-white border border-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-2 border-b-2 border-rule">
              Estimated Cost Per Person
            </h2>
            <p className="text-[10px] text-ink-muted mb-3">
              Conservative estimates — actual costs depend on booking timing, sharing rooms, and personal spending. All prices in USD.
            </p>
            <div className="space-y-0">
              {COST_BREAKDOWN.map((row, i) => (
                <div
                  key={row.item}
                  className={`flex items-start gap-3 py-2 ${
                    i < COST_BREAKDOWN.length - 1 ? 'border-b border-rule-light' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-ink">{row.item}</p>
                    <p className="text-[10px] text-ink-muted">{row.note}</p>
                  </div>
                  <span className="font-mono text-[11px] text-burgundy font-medium shrink-0">
                    ${row.low}–{row.high}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t-2 border-rule flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-muted">Estimated total</span>
              <span className="font-mono text-[13px] font-semibold text-burgundy">
                ${COST_BREAKDOWN.reduce((s, r) => s + r.low, 0).toLocaleString()}–${COST_BREAKDOWN.reduce((s, r) => s + r.high, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-10">
          <div className="w-8 h-[1px] bg-rule mx-auto mb-3" />
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-ink-faint">
            Peak State · 2026
          </p>
        </footer>
      </main>
    </div>
  )
}
