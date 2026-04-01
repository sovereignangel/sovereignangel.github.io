'use client'

import { useState } from 'react'

const C = {
  moss: '#4a6741',
  mossDark: '#2d4228',
  mossLight: 'rgba(74, 103, 65, 0.08)',
  stone: '#8a8178',
  chalk: '#f2efe8',
  linen: '#f8f6f1',
  graphite: '#2a2a28',
  muted: '#6b6860',
  faint: '#b0aba4',
  rule: '#d4cfc6',
  ember: '#b85c38',
}

type Tab = 'weekend' | 'prework' | 'framework' | 'research'

const TABS: { key: Tab; label: string }[] = [
  { key: 'weekend', label: 'The Weekend' },
  { key: 'prework', label: 'The Pre-Work' },
  { key: 'framework', label: 'The Framework' },
  { key: 'research', label: 'The Research' },
]

export default function StillPointPage() {
  const [tab, setTab] = useState<Tab>('weekend')

  return (
    <div className="max-w-[680px] mx-auto px-6 py-16 font-serif">
      {/* Hero — Eliot */}
      <header className="mb-16">
        <blockquote className="text-center py-6 mb-12">
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

        <h1 className="text-[28px] font-semibold tracking-tight leading-tight mb-6" style={{ color: C.moss }}>
          Still Point
        </h1>
        <p className="text-[13px] uppercase tracking-[1.5px]" style={{ color: C.stone }}>
          A weekend for inner work
        </p>
      </header>

      <Divider />

      {/* The Premise — always visible */}
      <section className="mb-12">
        <SectionTitle>The Premise</SectionTitle>
        <p className="text-[14px] leading-relaxed mb-4" style={{ color: C.graphite }}>
          A small group. The right people. Two and a half days upstate.
        </p>
        <p className="text-[14px] leading-relaxed mb-4" style={{ color: C.muted }}>
          Everyone arrives with something real they&rsquo;re working through — not a curated version, not the
          LinkedIn summary. The actual thing. The pattern you keep running. The conversation you keep avoiding.
          The part of you that you manage instead of meet.
        </p>
        <p className="text-[14px] leading-relaxed mb-4" style={{ color: C.muted }}>
          The format is structured transparency: pre-work before you arrive, facilitated 1:1 sessions
          during the weekend, and group work where the room holds what you can&rsquo;t hold alone.
          Everything is grounded in the best research we have on how humans actually change.
        </p>

        <blockquote className="border-l-2 pl-6 my-8" style={{ borderColor: C.moss }}>
          <p className="text-[15px] leading-relaxed italic" style={{ color: C.graphite }}>
            &ldquo;One&rsquo;s prime objects in life were love, the creation and enjoyment of aesthetic experience
            and the pursuit of knowledge. Of these love came a long way first.&rdquo;
          </p>
          <cite className="block mt-3 text-[12px] not-italic" style={{ color: C.stone }}>
            — John Maynard Keynes, <em>My Early Beliefs</em> (1938)
          </cite>
        </blockquote>

        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
          This weekend is built around that conviction. Love, beauty, knowledge — pursued not as
          abstractions but through the willingness to be honest about what&rsquo;s actually happening
          inside you, and to do that work in the company of people who are doing the same.
        </p>
      </section>

      {/* Tab nav */}
      <div className="flex gap-4 border-b mb-10" style={{ borderColor: C.rule }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="text-[13px] pb-2 transition-colors"
            style={{
              color: tab === t.key ? C.moss : C.stone,
              fontWeight: tab === t.key ? 600 : 400,
              borderBottom: tab === t.key ? `2px solid ${C.moss}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'weekend' && <WeekendTab />}
      {tab === 'prework' && <PreWorkTab />}
      {tab === 'framework' && <FrameworkTab />}
      {tab === 'research' && <ResearchTab />}

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

// ===========================================================================
// TABS
// ===========================================================================

function WeekendTab() {
  return (
    <div>
      <DayBlock
        label="Friday Evening"
        title="Arrive & Ground"
        items={[
          'Travel upstate. Settle in. Leave the city behind.',
          'Dinner together \u2014 no agenda, no structure.',
          'Opening circle: each person states what they\u2019re bringing to the weekend.',
          'Keynes reading. Intention setting. Early rest.',
        ]}
      />
      <DayBlock
        label="Saturday"
        title="The Deep Work"
        items={[
          'Morning \u2014 Layer I (See): IFS parts mapping. Solo work, then group share.',
          'Midday \u2014 Layer II (Feel): Somatic work. Breathwork. Nervous system mapping.',
          'Afternoon \u2014 Layer III (Speak): Facilitated 1:1 dyads. Rotated pairs.',
          'Evening \u2014 Group session: structured vulnerability circle. What\u2019s real.',
        ]}
      />
      <DayBlock
        label="Sunday"
        title="Integration & Close"
        items={[
          'Morning \u2014 Layer IV (Integrate): Values clarification. Commitments.',
          'Closing circle: what I\u2019m taking home. What I\u2019m leaving behind.',
          'Lunch together. Depart.',
        ]}
      />
    </div>
  )
}

function PreWorkTab() {
  return (
    <div>
      <p className="text-[13px] leading-relaxed mb-8" style={{ color: C.muted }}>
        Everyone completes this before arriving. The weekend assumes you&rsquo;ve done the work to show up ready.
      </p>
      <PreWorkItem
        number="01"
        title="Map Your Parts"
        description="Identify 3\u20135 inner voices that run your life. The critic. The performer. The people-pleaser. The one that checks out. Give them names. Write a letter to the loudest one."
        timeline="2 weeks before"
      />
      <PreWorkItem
        number="02"
        title="Track Your Nervous System"
        description="Three times daily for one week: note your state (grounded / activated / numb). What triggered the shift? No fixing \u2014 just noticing."
        timeline="1 week before"
      />
      <PreWorkItem
        number="03"
        title="The Unsaid"
        description="Write three things you\u2019re avoiding saying to someone in your life. The unmanaged version. You won\u2019t be asked to share these \u2014 but you need to have written them."
        timeline="1 week before"
      />
      <PreWorkItem
        number="04"
        title="Two Eulogies"
        description="Write the eulogy that would be true if you died tomorrow. Then write the one you want to be true. Bring both."
        timeline="3 days before"
      />
    </div>
  )
}

function FrameworkTab() {
  return (
    <div>
      <p className="text-[13px] leading-relaxed mb-8" style={{ color: C.muted }}>
        Four layers. Each one builds on the last. Each one is backed by decades
        of clinical research \u2014 not pop psychology.
      </p>
      <Layer
        number="I"
        title="See"
        subtitle="Awareness"
        researcher="Richard Schwartz, PhD"
        method="Internal Family Systems"
        description="We all carry parts \u2014 protectors, exiles, managers \u2014 that developed for good reasons but may no longer serve us. The inner critic that drives you to overwork. The part that goes numb in conflict. The one that performs competence to avoid being seen as weak. IFS maps these parts, understands their intentions, and creates the conditions for you to lead from Self \u2014 the calm, curious, compassionate center that was never broken."
        prework="Map your parts. What\u2019s the voice that says \u2018you\u2019re not enough\u2019? What\u2019s the one that overworks to prove it wrong? What does the protector look like? Name them. Write to them."
      />
      <Layer
        number="II"
        title="Feel"
        subtitle="Somatic"
        researcher="Peter Levine, PhD \u00b7 Stephen Porges, PhD"
        method="Somatic Experiencing \u00b7 Polyvagal Theory"
        description="The body keeps the score before the mind writes it down. Trauma and patterns don\u2019t live in your thoughts \u2014 they live in your nervous system. Porges identified three states: ventral vagal (safe, social, grounded), sympathetic (fight or flight), and dorsal vagal (freeze, collapse, shutdown). Most of us spend years in sympathetic without knowing it. This layer teaches you to read your own nervous system \u2014 and to complete the stress cycles your body has been holding."
        prework="Track your nervous system state three times a day for one week. Morning, midday, evening. When do you feel grounded? When do you brace? When do you go numb? No judgment \u2014 just data."
      />
      <Layer
        number="III"
        title="Speak"
        subtitle="Relational"
        researcher="Sue Johnson, PhD \u00b7 Brad Blanton, PhD"
        method="Emotionally Focused Therapy \u00b7 Radical Honesty"
        description="The patterns you can\u2019t see in yourself become visible in relationship. This is why solo work has a ceiling \u2014 you need a mirror. Facilitated 1:1 dyads: one person shares what they\u2019re working through, the other witnesses without fixing. Then switch. Group sessions surface the collective pattern \u2014 the ways we all manage, perform, and hide in similar ways. The method is simple and hard: say what\u2019s actually happening."
        prework="Write three things you\u2019re currently avoiding saying to someone in your life. Not the diplomatic version. The real one. You don\u2019t have to send it. But you have to write it."
      />
      <Layer
        number="IV"
        title="Integrate"
        subtitle="Meaning"
        researcher="Steven Hayes, PhD \u00b7 Viktor Frankl"
        method="Acceptance & Commitment Therapy \u00b7 Logotherapy"
        description="Insight without integration is entertainment. You can understand your patterns perfectly and still run them on Monday. ACT doesn\u2019t ask you to fix your thoughts \u2014 it asks you to clarify your values and commit to action that serves them, even when it\u2019s uncomfortable. Frankl discovered that meaning isn\u2019t found \u2014 it\u2019s made, in the gap between stimulus and response. The final layer is the question: now that you\u2019ve seen it, what will you do?"
        prework="Write your eulogy. Not what you hope people will say \u2014 what would actually be true if you died tomorrow. Then write the version you want to be true. The gap between them is your work."
      />
    </div>
  )
}

function ResearchTab() {
  return (
    <div>
      <p className="text-[13px] leading-relaxed mb-8" style={{ color: C.muted }}>
        Every element of this weekend is grounded in clinical research.
        Here are the ideas that matter most, explained simply.
      </p>

      <ResearchEntry
        author="Richard Schwartz"
        title="No Bad Parts"
        year="2021"
        layer="See"
        bigIdea="Your mind isn&rsquo;t one thing. It&rsquo;s a committee. You have an inner critic, an inner child, a protector, a perfectionist &mdash; and they&rsquo;re all trying to help, just badly. The &lsquo;Self&rsquo; &mdash; calm, curious, compassionate &mdash; is always underneath. It was never damaged. The work isn&rsquo;t to fix yourself. It&rsquo;s to let Self lead."
        keyPassage="&ldquo;When I ask clients to focus inside on their inner critic and then ask that critic what it&rsquo;s afraid would happen if it stopped criticizing, the answer is almost always some version of: &lsquo;You&rsquo;d be worthless. You&rsquo;d never accomplish anything. People would see how flawed you really are.&rsquo; The critic isn&rsquo;t your enemy. It&rsquo;s a firefighter who never got the memo that the fire is out.&rdquo;"
        link="https://archive.org/search?query=no+bad+parts+schwartz"
      />

      <ResearchEntry
        author="Peter Levine"
        title="Waking the Tiger"
        year="1997"
        layer="Feel"
        bigIdea="Animals in the wild don&rsquo;t get PTSD. When a gazelle escapes a lion, it shakes violently for a few minutes, discharging the survival energy, then walks off fine. Humans interrupt that discharge &mdash; we &lsquo;hold it together,&rsquo; stay composed, push through. The energy stays trapped. Trauma isn&rsquo;t what happened to you. It&rsquo;s what your body never got to finish."
        keyPassage="&ldquo;Traumatic symptoms are not caused by the dangerous event itself. They arise when residual energy from the experience is not discharged from the body. This energy remains trapped in the nervous system where it can wreak havoc on our bodies and minds.&rdquo;"
        link="https://archive.org/search?query=waking+the+tiger+levine"
      />

      <ResearchEntry
        author="Stephen Porges"
        title="The Polyvagal Theory"
        year="2011"
        layer="Feel"
        bigIdea="Your nervous system has three modes, not two. Fight/flight (sympathetic) is the one everyone knows. But there&rsquo;s also freeze/collapse (dorsal vagal) &mdash; the shutdown response when fight or flight won&rsquo;t work. And there&rsquo;s safe/social (ventral vagal) &mdash; the state where you can connect, think clearly, and feel present. Most modern life keeps us oscillating between the first two. The work is learning to access the third."
        keyPassage="&ldquo;The nervous system is not asking &lsquo;Is this dangerous?&rsquo; It&rsquo;s asking &lsquo;Is this safe?&rsquo; The distinction is enormous. The absence of threat is not the same as the presence of safety.&rdquo;"
        link="https://archive.org/search?query=polyvagal+theory+porges"
      />

      <ResearchEntry
        author="Bessel van der Kolk"
        title="The Body Keeps the Score"
        year="2014"
        layer="Feel"
        bigIdea="The most important finding in trauma research in the last 30 years: the body remembers what the mind forgets. Talk therapy alone can&rsquo;t resolve what lives below language. The brain&rsquo;s alarm system (amygdala) doesn&rsquo;t respond to rational arguments. It responds to safety, rhythm, breath, and being witnessed by another regulated nervous system."
        keyPassage="&ldquo;As long as you keep secrets and suppress information, you are fundamentally at war with yourself. The critical issue is allowing yourself to know what you know. That takes an enormous amount of courage.&rdquo;"
        link="https://archive.org/search?query=the+body+keeps+the+score"
      />

      <ResearchEntry
        author="Sue Johnson"
        title="Hold Me Tight"
        year="2008"
        layer="Speak"
        bigIdea="Adult love is an attachment bond &mdash; the same mechanism that bonds infants to caregivers. When the bond feels threatened, we panic. Pursuers chase contact (criticism, demands). Withdrawers retreat (silence, logic). Both are doing the same thing: trying not to lose the connection. The exit from the cycle is seeing the pattern as the enemy, not each other."
        keyPassage="&ldquo;The message of attachment theory is that we need others &mdash; not as a sign of weakness but as a fundamental part of being human. The strongest among us are those who can reach for others.&rdquo;"
        link="https://archive.org/search?query=hold+me+tight+sue+johnson"
      />

      <ResearchEntry
        author="Brad Blanton"
        title="Radical Honesty"
        year="1996"
        layer="Speak"
        bigIdea="We are all liars. Not malicious ones &mdash; socially conditioned ones. We manage impressions, curate feelings, and call it politeness. The result is a life lived behind a performance. Blanton&rsquo;s claim is provocatively simple: most human suffering comes from withholding the truth. Not cruelty &mdash; just saying what&rsquo;s actually happening, in your body, right now, to the person in front of you."
        keyPassage="&ldquo;Telling the truth is not an act of aggression. It is an act of generosity. When you tell someone the truth, you give them the opportunity to deal with reality rather than with your performance of reality.&rdquo;"
        link="https://archive.org/search?query=radical+honesty+blanton"
      />

      <ResearchEntry
        author="Steven Hayes"
        title="A Liberated Mind"
        year="2019"
        layer="Integrate"
        bigIdea="Your mind is a word machine. It generates thoughts constantly &mdash; and then tells you those thoughts are you. ACT (Acceptance and Commitment Therapy) makes a radical move: you don&rsquo;t need to fix your thoughts, argue with them, or replace them. You need to notice them, hold them lightly, and ask: &lsquo;What would I do right now if this thought weren&rsquo;t running me?&rsquo; Then do that."
        keyPassage="&ldquo;The goal is not to feel better. The goal is to get better at feeling. When you stop running from discomfort and start moving toward what matters, something shifts. You become psychologically flexible &mdash; able to be present, open, and doing what matters, even when it&rsquo;s hard.&rdquo;"
        link="https://archive.org/search?query=a+liberated+mind+hayes"
      />

      <ResearchEntry
        author="Viktor Frankl"
        title="Man&rsquo;s Search for Meaning"
        year="1946"
        layer="Integrate"
        bigIdea="Frankl survived Auschwitz and emerged with one observation: the prisoners who survived were not the physically strongest. They were the ones who had a reason to live &mdash; a meaning that transcended the suffering. Between stimulus and response, there is a space. In that space is the freedom to choose. Meaning is not something you find. It&rsquo;s something you make, through how you meet what happens to you."
        keyPassage="&ldquo;Everything can be taken from a man but one thing: the last of the human freedoms &mdash; to choose one&rsquo;s attitude in any given set of circumstances, to choose one&rsquo;s own way.&rdquo;"
        link="https://archive.org/search?query=man%27s+search+for+meaning+frankl"
      />

      <ResearchEntry
        author="Gabor Mat\u00e9"
        title="The Myth of Normal"
        year="2022"
        layer="All"
        bigIdea="What we call &lsquo;normal&rsquo; in modern society &mdash; disconnection from our bodies, chronic stress, emotional suppression, addiction to productivity &mdash; is itself a trauma response operating at the cultural level. Mat\u00e9 argues that healing is not about returning to normal. It&rsquo;s about recognizing that &lsquo;normal&rsquo; was the problem. Authenticity &mdash; being who you actually are, not who you learned to be &mdash; is the medicine."
        keyPassage="&ldquo;Trauma is not what happens to you. Trauma is what happens inside you, as a result of what happens to you. It is not the blow on the head, but the concussion. Not the fire, but the burn.&rdquo;"
        link="https://archive.org/search?query=myth+of+normal+gabor+mate"
      />
    </div>
  )
}

// ===========================================================================
// SHARED COMPONENTS
// ===========================================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-semibold uppercase tracking-[2px] mb-6" style={{ color: C.moss }}>
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
  number: string; title: string; subtitle: string; researcher: string
  method: string; description: string; prework: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-8">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-[11px] font-mono" style={{ color: C.faint }}>{number}</span>
          <h3 className="text-[18px] font-semibold" style={{ color: C.graphite }}>{title}</h3>
          <span className="text-[12px]" style={{ color: C.stone }}>{subtitle}</span>
          <span className="text-[11px] ml-auto" style={{ color: C.faint }}>{open ? '\u2212' : '+'}</span>
        </div>
        <p className="text-[11px] ml-6" style={{ color: C.stone }}>
          {researcher} \u00b7 {method}
        </p>
      </button>
      {open && (
        <div className="ml-6 mt-4">
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: C.muted }}>{description}</p>
          <div className="border-l-2 pl-4 mt-4" style={{ borderColor: C.moss }}>
            <p className="text-[10px] uppercase tracking-[1px] mb-1" style={{ color: C.moss }}>Pre-work</p>
            <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>{prework}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function DayBlock({ label, title, items }: { label: string; title: string; items: string[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-[10px] uppercase tracking-[1px]" style={{ color: C.moss }}>{label}</span>
        <span className="text-[15px] font-semibold" style={{ color: C.graphite }}>{title}</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <p key={i} className="text-[13px] leading-relaxed" style={{ color: C.muted }}>{item}</p>
        ))}
      </div>
    </div>
  )
}

function PreWorkItem({ number, title, description, timeline }: {
  number: string; title: string; description: string; timeline: string
}) {
  return (
    <div className="mb-6 flex gap-4">
      <span className="text-[11px] font-mono shrink-0 pt-0.5" style={{ color: C.faint }}>{number}</span>
      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <h4 className="text-[14px] font-semibold" style={{ color: C.graphite }}>{title}</h4>
          <span className="text-[10px]" style={{ color: C.stone }}>{timeline}</span>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>{description}</p>
      </div>
    </div>
  )
}

function ResearchEntry({ author, title, year, layer, bigIdea, keyPassage, link }: {
  author: string; title: string; year: string; layer: string
  bigIdea: string; keyPassage: string; link: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[10px] font-mono shrink-0" style={{ color: C.faint }}>{layer}</span>
          <span className="text-[14px] font-semibold" style={{ color: C.graphite }}>{author}</span>
          <span className="text-[13px] italic" style={{ color: C.muted }}>&mdash; {title}</span>
          <span className="text-[11px]" style={{ color: C.faint }}>({year})</span>
          <span className="text-[11px] ml-auto" style={{ color: C.faint }}>{open ? '\u2212' : '+'}</span>
        </div>
      </button>
      {open && (
        <div className="ml-8 mt-3">
          {/* Big idea — Feynman style */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[1px] mb-1.5" style={{ color: C.moss }}>
              The idea in plain language
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: C.graphite }}
              dangerouslySetInnerHTML={{ __html: bigIdea }}
            />
          </div>

          {/* Key passage */}
          <blockquote className="border-l-2 pl-4 mb-4" style={{ borderColor: C.rule }}>
            <p className="text-[12px] leading-relaxed italic" style={{ color: C.muted }}
              dangerouslySetInnerHTML={{ __html: keyPassage }}
            />
          </blockquote>

          {/* Link */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] transition-colors"
            style={{ color: C.moss }}
          >
            Search on Archive.org &rarr;
          </a>
        </div>
      )}
    </div>
  )
}
