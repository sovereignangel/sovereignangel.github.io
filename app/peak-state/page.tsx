'use client'

import { useState } from 'react'

// ── Itinerary data ──────────────────────────────────────────────────────────
const ITINERARY = [
  { day: 0, date: 'Fri, Aug 7',  label: 'Arrive',   route: 'Fly into Naples, transfer to Sorrento',         miles: null, sleep: 'Sorrento',  icon: '✈️', highlight: false },
  { day: 1, date: 'Sat, Aug 8',  label: 'Day 1',    route: 'Sorrento → Positano — coastal cliffs, first big views', miles: 22,   sleep: 'Positano',  icon: '🚴', highlight: false },
  { day: 2, date: 'Sun, Aug 9',  label: 'Day 2',    route: 'Positano → Amalfi — the iconic cliffside road',   miles: 12,   sleep: 'Amalfi',    icon: '🚴', highlight: false },
  { day: 3, date: 'Mon, Aug 10', label: 'Rest Day',  route: 'Explore Amalfi — Valle dei Mulini hike, swim, lemon groves', miles: 0, sleep: 'Amalfi', icon: '🌊', highlight: true },
  { day: 4, date: 'Tue, Aug 11', label: 'Day 3',    route: 'Amalfi → Ravello — steep climb rewarded with panoramic views', miles: 10, sleep: 'Ravello', icon: '🚴', highlight: false },
  { day: 5, date: 'Wed, Aug 12', label: 'Birthday!', route: 'Ravello → Salerno — long descent into the city, birthday dinner', miles: 25, sleep: 'Salerno', icon: '🎂', highlight: true },
  { day: 6, date: 'Thu, Aug 13', label: 'Day 5',    route: 'Salerno → Agropoli — enter the wild Cilento coast', miles: 28, sleep: 'Agropoli',  icon: '🚴', highlight: false },
  { day: 7, date: 'Fri, Aug 14', label: 'Day 6',    route: 'Agropoli → Acciaroli — quiet fishing village, Hemingway vibes', miles: 22, sleep: 'Acciaroli', icon: '🚴', highlight: false },
  { day: 8, date: 'Sat, Aug 15', label: 'Day 7',    route: 'Acciaroli → Palinuro — dramatic cape & sea caves', miles: 28, sleep: 'Palinuro',  icon: '🚴', highlight: false },
  { day: 9, date: 'Sun, Aug 16', label: 'Depart',   route: 'Morning farewell, transfer to Naples airport',    miles: null, sleep: null,         icon: '👋', highlight: false },
]

const DETAILS = [
  { label: 'When', value: 'Aug 7 – 16, 2026' },
  { label: 'Where', value: 'Sorrento → Palinuro, Italy' },
  { label: 'Distance', value: '~20–28 mi/day (e-bikes available)' },
  { label: 'Style', value: 'Point A to B, new town each night' },
  { label: 'Remote work', value: '9am–5pm ET friendly (ride mornings, work afternoons)' },
]

type RsvpStatus = 'yes' | 'maybe' | 'no' | null

export default function PeakStatePage() {
  const [name, setName] = useState('')
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
        body: JSON.stringify({ name: name.trim(), status: rsvp, constraints: constraints.trim() }),
      })

      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Try again?')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-peak-cream">
      {/* Hero */}
      <header className="relative overflow-hidden bg-peak-ink pt-16 pb-20 px-6 text-center">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23c4873a' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
        <div className="relative max-w-2xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-peak-ochre mb-4">
            Annual Birthday Adventure · Est. 2026
          </p>
          <h1 className="font-serif text-[42px] leading-[1.1] font-semibold text-peak-paper tracking-[-0.5px] mb-3">
            Peak State
          </h1>
          <div className="w-16 h-[2px] bg-peak-ochre mx-auto mb-4" />
          <p className="font-serif text-[18px] text-peak-ink-faint leading-relaxed max-w-lg mx-auto">
            Bike the Amalfi Coast & Cilento — Sorrento to Palinuro.
            <br />
            <span className="text-peak-ochre">10 days. 9 towns. 1 birthday.</span>
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Trip Details */}
        <section className="mb-10">
          <div className="bg-peak-paper border border-peak-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-peak-accent mb-3 pb-2 border-b-2 border-peak-rule">
              Trip Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DETAILS.map((d) => (
                <div key={d.label} className="flex gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[1px] text-peak-ink-muted w-24 shrink-0 pt-[2px]">
                    {d.label}
                  </span>
                  <span className="text-[12px] text-peak-ink font-medium leading-snug">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Daily Schedule */}
        <section className="mb-10">
          <div className="bg-peak-paper border border-peak-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-peak-accent mb-3 pb-2 border-b-2 border-peak-rule">
              Daily Rhythm
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-peak-cream rounded-sm border border-peak-rule-light">
                <p className="font-mono text-[10px] text-peak-ink-muted uppercase tracking-[1px] mb-1">Morning</p>
                <p className="text-[18px] mb-1">🚴</p>
                <p className="text-[11px] text-peak-ink font-medium">8am – 1pm</p>
                <p className="text-[10px] text-peak-ink-muted mt-0.5">Ride before the heat</p>
              </div>
              <div className="text-center p-3 bg-peak-cream rounded-sm border border-peak-rule-light">
                <p className="font-mono text-[10px] text-peak-ink-muted uppercase tracking-[1px] mb-1">Afternoon</p>
                <p className="text-[18px] mb-1">💻</p>
                <p className="text-[11px] text-peak-ink font-medium">3pm – 11pm</p>
                <p className="text-[10px] text-peak-ink-muted mt-0.5">9–5 ET work block</p>
              </div>
              <div className="text-center p-3 bg-peak-cream rounded-sm border border-peak-rule-light">
                <p className="font-mono text-[10px] text-peak-ink-muted uppercase tracking-[1px] mb-1">Evening</p>
                <p className="text-[18px] mb-1">🍷</p>
                <p className="text-[11px] text-peak-ink font-medium">9pm – late</p>
                <p className="text-[10px] text-peak-ink-muted mt-0.5">Italian dinner, together</p>
              </div>
            </div>
          </div>
        </section>

        {/* Itinerary */}
        <section className="mb-10">
          <div className="bg-peak-paper border border-peak-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-peak-accent mb-3 pb-2 border-b-2 border-peak-rule">
              Itinerary
            </h2>
            <div className="space-y-0">
              {ITINERARY.map((day, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-2.5 ${
                    i < ITINERARY.length - 1 ? 'border-b border-peak-rule-light' : ''
                  } ${day.highlight ? 'bg-peak-ochre-light -mx-2 px-2 rounded-sm' : ''}`}
                >
                  <span className="text-[16px] w-6 text-center shrink-0 pt-0.5">{day.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className={`font-serif text-[12px] font-semibold ${
                        day.highlight ? 'text-peak-accent' : 'text-peak-ink'
                      }`}>
                        {day.label}
                      </span>
                      <span className="font-mono text-[10px] text-peak-ink-muted">{day.date}</span>
                      {day.miles !== null && (
                        <span className="font-mono text-[10px] text-peak-ochre ml-auto shrink-0">
                          {day.miles === 0 ? 'Rest' : `${day.miles} mi`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-peak-ink-muted leading-snug">{day.route}</p>
                    {day.sleep && (
                      <p className="font-mono text-[10px] text-peak-ink-faint mt-0.5">
                        Sleep: {day.sleep}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3 pt-3 border-t-2 border-peak-rule flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-[1px] text-peak-ink-muted">
                Total riding distance
              </span>
              <span className="font-mono text-[13px] font-semibold text-peak-accent">
                ~147 mi
              </span>
            </div>
          </div>
        </section>

        {/* Logistics */}
        <section className="mb-10">
          <div className="bg-peak-paper border border-peak-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-peak-accent mb-3 pb-2 border-b-2 border-peak-rule">
              Good to Know
            </h2>
            <div className="space-y-2.5">
              {[
                { icon: '⚡', title: 'E-bikes recommended', desc: 'The Amalfi Coast has brutal climbs. E-bikes let everyone enjoy the views without suffering. We\'ll rent from Cycling Explorers in Sorrento.' },
                { icon: '🧳', title: 'Luggage transfers', desc: 'A service moves your bags hotel-to-hotel so you ride light with just a daypack.' },
                { icon: '🍝', title: 'Food steward', desc: 'Each day, one person picks the group\'s lunch + dinner spot. You\'re encouraged to go off-script too.' },
                { icon: '🏖️', title: 'Cilento is the secret', desc: 'Days 5–8 leave the crowded Amalfi Coast behind. The Cilento has the same beauty, zero crowds, and cheaper everything.' },
                { icon: '💰', title: 'Estimated cost', desc: 'Flights + hotels + e-bike rental + food ≈ $2,500–3,500 depending on hotel choices. We\'ll coordinate group rates.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-2.5">
                  <span className="text-[14px] shrink-0 pt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-peak-ink mb-0.5">{item.title}</p>
                    <p className="text-[11px] text-peak-ink-muted leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RSVP */}
        <section className="mb-16" id="rsvp">
          <div className="bg-peak-paper border border-peak-rule rounded-sm p-5">
            <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-peak-accent mb-1 pb-2 border-b-2 border-peak-rule">
              RSVP
            </h2>
            <p className="text-[11px] text-peak-ink-muted mb-4">
              Let me know if you&apos;re in. If you have dates that don&apos;t work, PTO constraints, or anything else — drop it below so I can plan around it.
            </p>

            {submitted ? (
              <div className="text-center py-8">
                <p className="text-[24px] mb-2">🎉</p>
                <p className="font-serif text-[16px] text-peak-accent font-semibold mb-1">
                  {rsvp === 'yes' ? 'You\'re in!' : rsvp === 'maybe' ? 'Noted — hope it works out!' : 'Got it — maybe next year!'}
                </p>
                <p className="text-[11px] text-peak-ink-muted">
                  Thanks, {name}. I&apos;ll be in touch with next steps.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[1px] text-peak-ink-muted block mb-1">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First name"
                    required
                    className="w-full bg-peak-cream border border-peak-rule rounded-sm px-3 py-2 text-[12px] text-peak-ink placeholder:text-peak-ink-faint focus:outline-none focus:border-peak-ochre transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[1px] text-peak-ink-muted block mb-2">
                    Can you make it?
                  </label>
                  <div className="flex gap-2">
                    {([
                      { value: 'yes', label: 'I\'m in', icon: '✅' },
                      { value: 'maybe', label: 'Maybe', icon: '🤔' },
                      { value: 'no', label: 'Can\'t make it', icon: '😢' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRsvp(option.value)}
                        className={`flex-1 py-2.5 px-2 rounded-sm border text-[11px] font-medium transition-all ${
                          rsvp === option.value
                            ? option.value === 'yes'
                              ? 'bg-peak-green text-peak-paper border-peak-green'
                              : option.value === 'maybe'
                              ? 'bg-peak-ochre text-peak-paper border-peak-ochre'
                              : 'bg-peak-ink-muted text-peak-paper border-peak-ink-muted'
                            : 'bg-peak-cream text-peak-ink-muted border-peak-rule hover:border-peak-ink-faint'
                        }`}
                      >
                        <span className="block text-[14px] mb-0.5">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                {rsvp && rsvp !== 'no' && (
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[1px] text-peak-ink-muted block mb-1">
                      Any constraints? (dates, PTO, budget, etc.)
                    </label>
                    <textarea
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="e.g. I can only do Aug 7–12, or I need to work all day Wednesday..."
                      rows={3}
                      className="w-full bg-peak-cream border border-peak-rule rounded-sm px-3 py-2 text-[12px] text-peak-ink placeholder:text-peak-ink-faint focus:outline-none focus:border-peak-ochre transition-colors resize-none"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-[11px] text-red-ink font-medium">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!name.trim() || !rsvp || submitting}
                  className="w-full py-2.5 rounded-sm font-serif text-[13px] font-semibold uppercase tracking-[0.5px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-peak-accent text-peak-paper hover:opacity-90"
                >
                  {submitting ? 'Sending...' : 'Submit RSVP'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-10">
          <div className="w-8 h-[1px] bg-peak-rule mx-auto mb-3" />
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-peak-ink-faint">
            Peak State · 2026
          </p>
        </footer>
      </main>
    </div>
  )
}
