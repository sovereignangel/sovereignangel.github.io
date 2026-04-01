'use client'

import { useState } from 'react'

// Colors as constants for inline styles
const C = {
  moss: '#4a6741',
  mossDark: '#2d4228',
  mossLight: 'rgba(74, 103, 65, 0.08)',
  stone: '#8a8178',
  stoneLight: 'rgba(138, 129, 120, 0.08)',
  chalk: '#f2efe8',
  linen: '#f8f6f1',
  graphite: '#2a2a28',
  muted: '#6b6860',
  faint: '#b0aba4',
  rule: '#d4cfc6',
  ember: '#b85c38',
}

export default function StillPointPage() {
  return (
    <div className="max-w-[680px] mx-auto px-6 py-16 font-serif">
      {/* Hero */}
      <header className="mb-20">
        <h1
          className="text-[28px] font-semibold tracking-tight leading-tight mb-6"
          style={{ color: C.moss }}
        >
          Still Point
        </h1>
        <p className="text-[13px] uppercase tracking-[1.5px] mb-12" style={{ color: C.stone }}>
          A weekend for inner work
        </p>

        {/* Keynes quote */}
        <blockquote className="border-l-2 pl-6 my-10" style={{ borderColor: C.moss }}>
          <p className="text-[17px] leading-relaxed italic" style={{ color: C.graphite }}>
            &ldquo;One&rsquo;s prime objects in life were love, the creation and enjoyment of aesthetic experience
            and the pursuit of knowledge. Of these love came a long way first.&rdquo;
          </p>
          <cite className="block mt-3 text-[12px] not-italic" style={{ color: C.stone }}>
            — John Maynard Keynes, <em>My Early Beliefs</em> (1938)
          </cite>
        </blockquote>
      </header>

      {/* The Still Point */}
      <section className="mb-16">
        <blockquote className="text-center py-10">
          <p className="text-[15px] leading-loose italic" style={{ color: C.muted }}>
            At the still point of the turning world. Neither flesh nor fleshless;<br />
            Neither from nor towards; at the still point, there the dance is,<br />
            But neither arrest nor movement. And do not call it fixity,<br />
            Where past and future are gathered. Neither movement from nor towards,<br />
            Neither ascent nor decline. Except for the point, the still point,<br />
            There would be no dance, and there is only the dance.
          </p>
          <cite className="block mt-4 text-[11px] not-italic" style={{ color: C.faint }}>
            — T.S. Eliot, <em>Burnt Norton</em> (1935)
          </cite>
        </blockquote>
      </section>

      <Divider />

      {/* The Premise */}
      <section className="mb-16">
        <SectionTitle>The Premise</SectionTitle>
        <p className="text-[14px] leading-relaxed mb-4" style={{ color: C.graphite }}>
          A small group. The right people. Two and a half days upstate.
        </p>
        <p className="text-[14px] leading-relaxed mb-4" style={{ color: C.muted }}>
          Everyone arrives with something real they&rsquo;re working through — not a curated version, not the
          LinkedIn summary. The actual thing. The pattern you keep running. The conversation you keep avoiding.
          The part of you that you manage instead of meet.
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
          The format is structured transparency: pre-work before you arrive, facilitated 1:1 sessions
          during the weekend, and group work where the room holds what you can&rsquo;t hold alone.
          Everything is grounded in the best research we have on how humans actually change.
        </p>
      </section>

      <Divider />

      {/* The Framework */}
      <section className="mb-16">
        <SectionTitle>The Framework</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-8" style={{ color: C.muted }}>
          Four layers. Each one builds on the last. Each one is backed by decades
          of clinical research — not pop psychology.
        </p>

        <Layer
          number="I"
          title="See"
          subtitle="Awareness"
          researcher="Richard Schwartz, PhD"
          method="Internal Family Systems"
          description="We all carry parts — protectors, exiles, managers — that developed for good reasons but may no longer serve us. The inner critic that drives you to overwork. The part that goes numb in conflict. The one that performs competence to avoid being seen as weak. IFS maps these parts, understands their intentions, and creates the conditions for you to lead from Self — the calm, curious, compassionate center that was never broken."
          prework="Map your parts. What&rsquo;s the voice that says &lsquo;you&rsquo;re not enough&rsquo;? What&rsquo;s the one that overworks to prove it wrong? What does the protector look like? Name them. Write to them."
        />

        <Layer
          number="II"
          title="Feel"
          subtitle="Somatic"
          researcher="Peter Levine, PhD &middot; Stephen Porges, PhD"
          method="Somatic Experiencing &middot; Polyvagal Theory"
          description="The body keeps the score before the mind writes it down. Trauma and patterns don&rsquo;t live in your thoughts — they live in your nervous system. Porges identified three states: ventral vagal (safe, social, grounded), sympathetic (fight or flight), and dorsal vagal (freeze, collapse, shutdown). Most of us spend years in sympathetic without knowing it. This layer teaches you to read your own nervous system — and to complete the stress cycles your body has been holding."
          prework="Track your nervous system state three times a day for one week. Morning, midday, evening. When do you feel grounded? When do you brace? When do you go numb? No judgment — just data."
        />

        <Layer
          number="III"
          title="Speak"
          subtitle="Relational"
          researcher="Sue Johnson, PhD &middot; Brad Blanton, PhD"
          method="Emotionally Focused Therapy &middot; Radical Honesty"
          description="The patterns you can&rsquo;t see in yourself become visible in relationship. This is why solo work has a ceiling — you need a mirror. Facilitated 1:1 dyads: one person shares what they&rsquo;re working through, the other witnesses without fixing. Then switch. Group sessions surface the collective pattern — the ways we all manage, perform, and hide in similar ways. The method is simple and hard: say what&rsquo;s actually happening."
          prework="Write three things you&rsquo;re currently avoiding saying to someone in your life. Not the diplomatic version. The real one. You don&rsquo;t have to send it. But you have to write it."
        />

        <Layer
          number="IV"
          title="Integrate"
          subtitle="Meaning"
          researcher="Steven Hayes, PhD &middot; Viktor Frankl"
          method="Acceptance &amp; Commitment Therapy &middot; Logotherapy"
          description="Insight without integration is entertainment. You can understand your patterns perfectly and still run them on Monday. ACT doesn&rsquo;t ask you to fix your thoughts — it asks you to clarify your values and commit to action that serves them, even when it&rsquo;s uncomfortable. Frankl discovered that meaning isn&rsquo;t found — it&rsquo;s made, in the gap between stimulus and response. The final layer is the question: now that you&rsquo;ve seen it, what will you do?"
          prework="Write your eulogy. Not what you hope people will say — what would actually be true if you died tomorrow. Then write the version you want to be true. The gap between them is your work."
        />
      </section>

      <Divider />

      {/* The Weekend */}
      <section className="mb-16">
        <SectionTitle>The Weekend</SectionTitle>

        <DayBlock
          label="Friday Evening"
          title="Arrive & Ground"
          items={[
            'Travel upstate. Settle in. Leave the city behind.',
            'Dinner together — no agenda, no structure.',
            'Opening circle: each person states what they&rsquo;re bringing to the weekend.',
            'Keynes reading. Intention setting. Early rest.',
          ]}
        />

        <DayBlock
          label="Saturday"
          title="The Deep Work"
          items={[
            'Morning — Layer I (See): IFS parts mapping. Solo work, then group share.',
            'Midday — Layer II (Feel): Somatic work. Breathwork. Nervous system mapping.',
            'Afternoon — Layer III (Speak): Facilitated 1:1 dyads. Rotated pairs.',
            'Evening — Group session: structured vulnerability circle. What&rsquo;s real.',
          ]}
        />

        <DayBlock
          label="Sunday"
          title="Integration & Close"
          items={[
            'Morning — Layer IV (Integrate): Values clarification. Commitments.',
            'Closing circle: what I&rsquo;m taking home. What I&rsquo;m leaving behind.',
            'Lunch together. Depart.',
          ]}
        />
      </section>

      <Divider />

      {/* The Pre-Work */}
      <section className="mb-16">
        <SectionTitle>Pre-Work</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Everyone completes this before arriving. The weekend assumes you&rsquo;ve done the work to show up ready.
        </p>

        <PreWorkItem
          number="01"
          title="Map Your Parts"
          description="Identify 3-5 inner voices that run your life. The critic. The performer. The people-pleaser. The one that checks out. Give them names. Write a letter to the loudest one."
          timeline="2 weeks before"
        />
        <PreWorkItem
          number="02"
          title="Track Your Nervous System"
          description="Three times daily for one week: note your state (grounded / activated / numb). What triggered the shift? No fixing — just noticing."
          timeline="1 week before"
        />
        <PreWorkItem
          number="03"
          title="The Unsaid"
          description="Write three things you&rsquo;re avoiding saying to someone in your life. The unmanaged version. You won&rsquo;t be asked to share these — but you need to have written them."
          timeline="1 week before"
        />
        <PreWorkItem
          number="04"
          title="Two Eulogies"
          description="Write the eulogy that would be true if you died tomorrow. Then write the one you want to be true. Bring both."
          timeline="3 days before"
        />
      </section>

      <Divider />

      {/* The Research */}
      <section className="mb-16">
        <SectionTitle>The Research</SectionTitle>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Every element of this weekend is grounded in peer-reviewed clinical research.
          These are the foundational texts.
        </p>

        <ReadingList />
      </section>

      <Divider />

      {/* Footer */}
      <footer className="text-center py-10">
        <p className="text-[12px]" style={{ color: C.faint }}>
          Upstate New York &middot; 2.5 days &middot; Small group
        </p>
        <p className="text-[11px] mt-2" style={{ color: C.faint }}>
          By invitation only
        </p>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[12px] font-semibold uppercase tracking-[2px] mb-6"
      style={{ color: C.moss }}
    >
      {children}
    </h2>
  )
}

function Divider() {
  return (
    <div className="flex justify-center my-12">
      <div className="w-[40px] h-[1px]" style={{ backgroundColor: C.rule }} />
    </div>
  )
}

function Layer({
  number, title, subtitle, researcher, method, description, prework,
}: {
  number: string
  title: string
  subtitle: string
  researcher: string
  method: string
  description: string
  prework: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left group"
      >
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-[11px] font-mono" style={{ color: C.faint }}>
            {number}
          </span>
          <h3 className="text-[18px] font-semibold" style={{ color: C.graphite }}>
            {title}
          </h3>
          <span className="text-[12px]" style={{ color: C.stone }}>
            {subtitle}
          </span>
          <span className="text-[11px] ml-auto" style={{ color: C.faint }}>
            {open ? '−' : '+'}
          </span>
        </div>
        <p className="text-[11px] ml-6" style={{ color: C.stone }}>
          {researcher} &middot; {method}
        </p>
      </button>

      {open && (
        <div className="ml-6 mt-4">
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: C.muted }}>
            {description}
          </p>
          <div className="border-l-2 pl-4 mt-4" style={{ borderColor: C.moss }}>
            <p className="text-[10px] uppercase tracking-[1px] mb-1" style={{ color: C.moss }}>
              Pre-work
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
              {prework}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function DayBlock({
  label, title, items,
}: {
  label: string
  title: string
  items: string[]
}) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-[10px] uppercase tracking-[1px]" style={{ color: C.moss }}>
          {label}
        </span>
        <span className="text-[15px] font-semibold" style={{ color: C.graphite }}>
          {title}
        </span>
      </div>
      <div className="ml-0 space-y-2">
        {items.map((item, i) => (
          <p key={i} className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

function PreWorkItem({
  number, title, description, timeline,
}: {
  number: string
  title: string
  description: string
  timeline: string
}) {
  return (
    <div className="mb-6 flex gap-4">
      <span className="text-[11px] font-mono shrink-0 pt-0.5" style={{ color: C.faint }}>
        {number}
      </span>
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <h4 className="text-[14px] font-semibold" style={{ color: C.graphite }}>
            {title}
          </h4>
          <span className="text-[10px]" style={{ color: C.stone }}>
            {timeline}
          </span>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
          {description}
        </p>
      </div>
    </div>
  )
}

function ReadingList() {
  const books = [
    { author: 'Richard Schwartz', title: 'No Bad Parts', year: '2021', layer: 'See' },
    { author: 'Richard Schwartz', title: 'Internal Family Systems Therapy', year: '1995', layer: 'See' },
    { author: 'Peter Levine', title: 'Waking the Tiger', year: '1997', layer: 'Feel' },
    { author: 'Stephen Porges', title: 'The Polyvagal Theory', year: '2011', layer: 'Feel' },
    { author: 'Bessel van der Kolk', title: 'The Body Keeps the Score', year: '2014', layer: 'Feel' },
    { author: 'Sue Johnson', title: 'Hold Me Tight', year: '2008', layer: 'Speak' },
    { author: 'Brad Blanton', title: 'Radical Honesty', year: '1996', layer: 'Speak' },
    { author: 'Steven Hayes', title: 'A Liberated Mind', year: '2019', layer: 'Integrate' },
    { author: 'Viktor Frankl', title: 'Man\u2019s Search for Meaning', year: '1946', layer: 'Integrate' },
    { author: 'Gabor Mat\u00e9', title: 'The Myth of Normal', year: '2022', layer: 'All' },
  ]

  return (
    <div className="space-y-3">
      {books.map((book, i) => (
        <div key={i} className="flex items-baseline gap-3">
          <span className="text-[10px] font-mono shrink-0" style={{ color: C.faint }}>
            {book.layer}
          </span>
          <div>
            <span className="text-[13px]" style={{ color: C.graphite }}>
              {book.author}
            </span>
            <span className="text-[13px] italic" style={{ color: C.muted }}>
              {' '}&mdash; {book.title}
            </span>
            <span className="text-[11px]" style={{ color: C.faint }}>
              {' '}({book.year})
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
