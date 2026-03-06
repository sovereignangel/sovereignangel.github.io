'use client'

import { useState } from 'react'

const DIMENSIONS = [
  {
    name: 'Energy',
    description: 'Sleep, recovery, nervous system. The foundation everything else runs on.',
    example: 'Syncs with Garmin, Whoop, or Apple Health automatically.',
  },
  {
    name: 'Growth',
    description: 'What you are learning, who you are talking to, what you are reading.',
    example: 'AI scans research papers and articles matched to your interests overnight.',
  },
  {
    name: 'Output',
    description: 'Deep work hours, things shipped, revenue generated.',
    example: 'Connects to your calendar, GitHub, and Stripe.',
  },
  {
    name: 'Direction',
    description: 'Are your daily actions aligned with what you say matters?',
    example: 'Journal freely. Arc extracts your beliefs, patterns, and decision tendencies.',
  },
]

export default function ArcPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="max-w-[640px] mx-auto px-6 py-16">
      {/* Hero */}
      <header className="mb-16">
        <h1 className="font-serif text-[28px] font-semibold text-ink tracking-tight mb-3">
          Arc
        </h1>
        <p className="text-[18px] text-ink leading-relaxed mb-6">
          Know your trajectory.
        </p>
        <p className="text-[14px] text-ink-muted leading-relaxed">
          One daily score that tells you if you are actually getting closer
          to the life you want. Think Garmin for your whole life — not just
          your body, but your mind, your work, your growth, your direction.
        </p>
      </header>

      {/* The Problem */}
      <section className="mb-14">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
          The Problem
        </h2>
        <p className="text-[13px] text-ink leading-relaxed mb-3">
          You track your sleep on one app, your workouts on another, your habits
          in a third, your finances in a spreadsheet, and your goals in a notebook.
        </p>
        <p className="text-[13px] text-ink leading-relaxed mb-3">
          None of them talk to each other. You have more data than ever but
          no honest answer to the only question that matters:
        </p>
        <p className="text-[15px] text-ink font-medium italic">
          Am I actually making progress on the life I want?
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-14">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
          How It Works
        </h2>
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => (
            <div key={dim.name} className="border border-rule rounded-sm p-3 bg-white">
              <div className="font-serif text-[12px] font-semibold text-ink mb-1">
                {dim.name}
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed mb-1.5">
                {dim.description}
              </p>
              <p className="text-[10px] text-burgundy">
                {dim.example}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Overnight Agents */}
      <section className="mb-14">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
          While You Sleep
        </h2>
        <p className="text-[13px] text-ink leading-relaxed mb-3">
          Every night, Arc runs AI agents that scan research, market signals,
          and your own journal entries. By morning, you wake up to a briefing:
        </p>
        <div className="border border-rule rounded-sm p-3 bg-white space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-burgundy font-semibold mt-0.5">1.</span>
            <span className="text-[11px] text-ink">What shifted overnight — beliefs that got stronger or weaker based on new evidence</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-burgundy font-semibold mt-0.5">2.</span>
            <span className="text-[11px] text-ink">Connections you would have missed — patterns across different areas of your life</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-burgundy font-semibold mt-0.5">3.</span>
            <span className="text-[11px] text-ink">Where to focus today — based on your energy, your priorities, and what the world just told you</span>
          </div>
        </div>
      </section>

      {/* Who It Is For */}
      <section className="mb-14">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
          Who This Is For
        </h2>
        <p className="text-[13px] text-ink leading-relaxed mb-3">
          Arc is for people who already track things and want them to mean
          something. Founders who want to know if they are building the right
          life, not just the right company. Investors who think about risk across
          every dimension, not just their portfolio. Athletes who know that
          performance is a whole-life game.
        </p>
        <p className="text-[13px] text-ink-muted leading-relaxed">
          If you have ever looked at your Garmin data and wished you had the
          same clarity about the rest of your life — this is for you.
        </p>
      </section>

      {/* Waitlist */}
      <section className="mb-14">
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
          Early Access
        </h2>
        {submitted ? (
          <div className="border border-rule rounded-sm p-3 bg-white">
            <p className="text-[12px] text-green-ink font-medium">
              You are on the list. We will reach out when Arc is ready for you.
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && email.includes('@')) setSubmitted(true)
              }}
              className="flex-1 font-sans text-[12px] bg-white border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-burgundy"
              placeholder="your@email.com"
            />
            <button
              onClick={() => { if (email.includes('@')) setSubmitted(true) }}
              disabled={!email.includes('@')}
              className="bg-burgundy text-paper font-serif text-[11px] font-semibold rounded-sm px-4 py-2 hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              Get Early Access
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-rule pt-4">
        <p className="text-[10px] text-ink-muted">
          Arc is built by Lori Corpuz. Currently in daily use. Coming to early access soon.
        </p>
      </footer>
    </div>
  )
}
