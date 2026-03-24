'use client'

import { useState, useEffect, useRef } from 'react'

// ── Time lock config (Aruba = UTC-4) ─────────────────────────────────────────
// FLIP USE_TEST_END TO false FOR THE REAL GAME
const USE_TEST_END = false
const TEST_END  = { hour: 17, minute: 5 } // 5:05 pm — for testing
const REAL_END  = { hour: 20, minute: 0 } // 8:00 pm — real game

function getArubaTime() {
  const now = new Date()
  return new Date(now.getTime() - 4 * 60 * 60 * 1000)
}
function isGameLocked() {
  const t = getArubaTime()
  const h = t.getUTCHours(), m = t.getUTCMinutes()
  const end = USE_TEST_END ? TEST_END : REAL_END
  return h > end.hour || (h === end.hour && m >= end.minute)
}
function formatArubaTime(iso: string) {
  const d = new Date(iso)
  const aruba = new Date(d.getTime() - 4 * 60 * 60 * 1000)
  return aruba.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })
}

// --- SVG Icons ---
const icons: Record<string, (c?: string) => JSX.Element> = {
  wave: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M2 12c2-2 4-3 6-3s4 2 6 2 4-2 6-2" />
      <path d="M2 17c2-2 4-3 6-3s4 2 6 2 4-2 6-2" />
    </svg>
  ),
  pool: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><path d="M8 14c1-1 2.5-1.5 4-1.5s3 .5 4 1.5" /><circle cx="12" cy="9" r="2" />
    </svg>
  ),
  muscle: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M4 15l3-3 2 2 4-4 3 3 4-4" /><path d="M4 15v4h16v-4" />
    </svg>
  ),
  palette: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><circle cx="9" cy="9" r="1.5" fill={c} /><circle cx="15" cy="9" r="1.5" fill={c} /><circle cx="8" cy="14" r="1.5" fill={c} />
    </svg>
  ),
  brain: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7l3 4 3-4c2-1.5 4-4 4-7a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="2" />
    </svg>
  ),
  search: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  glass: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M8 2l-1 10c0 2.5 2 4.5 5 4.5s5-2 5-4.5L16 2" /><path d="M12 16.5V22" /><path d="M8 22h8" />
    </svg>
  ),
  cake: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M4 18v-4a8 8 0 0 1 16 0v4" /><rect x="2" y="18" width="20" height="4" rx="1" /><path d="M12 4v4" /><circle cx="12" cy="3" r="1" fill={c} />
    </svg>
  ),
  run: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="14" cy="4" r="2" /><path d="M10 22l2-7 3 3v6" /><path d="M6 13l4-2 3 3" /><path d="M18 9l-5 2" />
    </svg>
  ),
  people: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M17 14a4 4 0 0 1 4 4v3" />
    </svg>
  ),
  puzzle: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M4 8h2a2 2 0 1 0 0-4h0V4h4v2a2 2 0 1 0 4 0V4h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H8v-4H6a2 2 0 1 0 0-4z" />
    </svg>
  ),
}

const TEAMS = [
  { name: 'BIRTHDAY VIBES', accent: '#8a6d2f', members: ['Imgesu', 'Dave'], storageKey: 'hunt_team_bday' },
  { name: 'WBURG HIPSTERS', accent: '#7c2d2d', members: ['Aidas', 'Lori'], storageKey: 'hunt_team_wburg' },
  { name: 'TRIPLE THREAT', accent: '#2d4a6f', members: ['Alyssa', 'Rodrigo', 'Alberto'], storageKey: 'hunt_team_triple' },
]

const CHALLENGES = [
  {
    category: 'Ocean & Water', icon: 'wave',
    items: [
      { id: 1, text: 'Full team ocean submersion at the same time — everyone under', pts: 5, proof: 'photo' },
      { id: 2, text: 'One teammate paddles the SUP board 50m out and back without falling', pts: 15, proof: 'video' },
      { id: 3, text: 'Kayak relay — paddle to a visible landmark and back. Every teammate must go.', pts: 15, proof: 'video' },
      { id: 4, text: 'Goggle swim race: two teammates race from the rock formation at the edge of the property near sunset to the point rock formation. Loser does 10 pushups.', pts: 15, proof: 'video' },
      { id: 5, text: 'Catch anything alive in the water (crab, fish, anything) and release it', pts: 20, proof: 'video' },
      { id: 6, text: 'Underwater handshake — all team members submerge and shake hands with goggles on', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Pool', icon: 'pool',
    items: [
      { id: 7, text: 'Biggest cannonball splash — judged by group applause. Winning splash gets +10 bonus pts.', pts: 10, proof: 'video' },
      { id: 8, text: 'Longest underwater breath hold — timed on video', pts: 15, proof: 'video' },
      { id: 9, text: 'Pool relay: swim a full lap and tag your teammate. Fastest team gets bonus 5 pts.', pts: 10, proof: 'video' },
      { id: 10, text: 'Underwater dance move with goggles — filmed from above', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Physical & Endurance', icon: 'run',
    items: [
      { id: 11, text: 'Run 3 miles — any route, any teammate(s). Must show smartwatch tracking as proof.', pts: 25, proof: 'screenshot' },
      { id: 12, text: 'Run to Chow Supermarket and buy a dessert for the group. Must show smartwatch tracking for the run and receipt for the purchase.', pts: 25, proof: 'screenshot + receipt' },
      { id: 14, text: 'Team plank hold — everyone planks simultaneously for 60 seconds', pts: 10, proof: 'video' },
      { id: 15, text: 'Wheelbarrow race — from the cement to the wood sunset chairs', pts: 10, proof: 'video' },
      { id: 16, text: 'One teammate does 15 burpees in under 60 seconds', pts: 10, proof: 'video' },
      { id: 17, text: 'Leapfrog relay — from the wood sunset chairs to the rock formations at the end of the beach', pts: 10, proof: 'video' },
      { id: 18, text: 'Human pyramid — hold 5 seconds. OR: get a photo of you standing/sitting on top of your teammate.', pts: 15, proof: 'photo' },
    ],
  },
  {
    category: 'Creative & Performance', icon: 'palette',
    items: [
      { id: 19, text: 'KOKOMO DANCE-OFF: Choreograph a team dance routine to "Kokomo" by The Beach Boys. Carlos (concierge) judges all teams. Winner gets 25 bonus pts.', pts: 20, proof: 'video + Carlos verdict' },
      { id: 20, text: 'Write and perform a 30-second team anthem. Must include all teammates\' names.', pts: 15, proof: 'video' },
      { id: 21, text: 'Recreate a famous movie scene using only beach props + kimonos', pts: 15, proof: 'video' },
      { id: 22, text: 'Kimono fashion show — style each teammate differently. Walk the runway.', pts: 15, proof: 'video' },
      { id: 23, text: 'Draw a portrait of someone from another team in the sand (must be recognizable)', pts: 10, proof: 'photo' },
      { id: 24, text: 'Sunset yoga pose — most creative group silhouette against the sunset', pts: 10, proof: 'photo' },
      { id: 25, text: 'One teammate impersonates someone else on the trip. Others must guess who.', pts: 10, proof: 'video' },
      { id: 27, text: 'Kite hat + sunglasses + kimono — most absurd outfit, modeled with a straight face', pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'Brain & Puzzle', icon: 'brain',
    items: [
      { id: 28, text: 'Long division by hand on a piece of paper, filmed on camera, no calculator: 7,463 ÷ 17 (to 2 decimal places)', pts: 15, proof: 'video' },
      { id: 29, text: 'Multiply by hand on a piece of paper, filmed on camera: 847 × 293. Show all work.', pts: 15, proof: 'video' },
      { id: 30, text: 'Convert 7/13 to a decimal by hand on a piece of paper, filmed — at least 4 decimal places', pts: 20, proof: 'video' },
      { id: 31, text: 'Calculate the square root of 1,849 by hand on a piece of paper, filmed. Show your method.', pts: 20, proof: 'video' },
      { id: 32, text: 'Name 15 countries in 30 seconds — filmed, no repeats', pts: 10, proof: 'video' },
      { id: 33, text: 'Identify 3 plants or trees near the house by name (Google for verification only)', pts: 10, proof: 'photo + names' },
      { id: 34, text: 'Board game speed round — play and finish one full round in 15 min or less', pts: 10, proof: 'video' },
      { id: 66, text: 'Each team creates a nickname for every person on the trip. Write them on paper and present to the group.', pts: 15, proof: 'photo + video' },
      { id: 67, text: 'Pick a book from the house. Have Carlos pick his favorite — photo with Carlos holding the book.', pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'The Riddle', icon: 'puzzle',
    items: [
      { id: 36, text: 'Solve this riddle. First team to submit the correct answer to the WhatsApp group wins 30 pts. All others get 0.\n\n"I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?"', pts: 30, proof: 'written answer' },
    ],
  },
  {
    category: 'Find These Things', icon: 'search',
    items: [
      { id: 37, text: 'Team photo with a divi-divi tree', pts: 10, proof: 'photo' },
      { id: 38, text: 'Something that floats that isn\'t wood', pts: 5, proof: 'photo' },
      { id: 39, text: 'A piece of sea glass', pts: 10, proof: 'photo' },
      { id: 40, text: 'A rock that looks like a face', pts: 10, proof: 'photo' },
      { id: 41, text: 'The most beautiful thing within walking distance — team must agree', pts: 10, proof: 'photo' },
      { id: 42, text: 'A living creature other than a human, dog, or bird', pts: 10, proof: 'photo' },
      { id: 43, text: 'Something red, something yellow, something blue — all natural', pts: 10, proof: 'photo' },
      { id: 45, text: 'Build a sandcastle at least 1 foot tall with a moat', pts: 10, proof: 'photo' },
      { id: 46, text: 'Spell your team name using objects found on the beach', pts: 10, proof: 'photo' },
      { id: 64, text: 'Find a conch shell', pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'Locals & Culture', icon: 'people',
    items: [
      { id: 47, text: 'Learn a phrase in Papiamento from a local and say it on camera', pts: 10, proof: 'video' },
      { id: 48, text: 'Get a local to teach you a dance move — perform it together on camera', pts: 15, proof: 'video' },
      { id: 49, text: 'Take a photo with a local and learn their name and one fact about them', pts: 10, proof: 'photo + fact' },
      { id: 50, text: 'Find out the name of the nearest neighborhood or landmark from a local (not Google)', pts: 10, proof: 'video' },
      { id: 51, text: 'Get a local\'s restaurant recommendation — write it down for the group', pts: 10, proof: 'written' },
    ],
  },
  {
    category: 'Consumption', icon: 'glass',
    items: [
      { id: 52, text: 'Entire team takes a shot simultaneously — must cheers to Imgesu first', pts: 5, proof: 'video' },
      { id: 53, text: 'One teammate shotguns a beer (or chugs a full drink of choice)', pts: 10, proof: 'video' },
      { id: 54, text: 'Make a cocktail from whatever\'s in the kitchen — name it after your team. Everyone drinks.', pts: 15, proof: 'video' },
      { id: 55, text: 'One teammate eats something spicy (hot sauce, pepper, anything) — reaction on camera', pts: 10, proof: 'video' },
      { id: 56, text: 'Entire team finishes a drink together — last one done does 10 pushups', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Birthday & Personal', icon: 'cake',
    items: [
      { id: 57, text: 'Serenade Imgesu with a birthday song — must include her name at least 3 times', pts: 10, proof: 'video' },
      { id: 58, text: 'One teammate DJs a 60-second set using only mouth sounds. Rest of team dances.', pts: 15, proof: 'video' },
      { id: 59, text: 'One teammate creates a vegan snack from kitchen ingredients — team rates it 1-10', pts: 15, proof: 'video' },
      { id: 60, text: 'One teammate delivers a 30-second brutally honest review of the sunset', pts: 10, proof: 'video' },
      { id: 61, text: 'Stack 10 household items into a tower in under 2 minutes', pts: 10, proof: 'video' },
      { id: 62, text: 'Team photo where everyone is mid-air (jumping)', pts: 10, proof: 'photo' },
      { id: 63, text: 'Compose a haiku about Aruba and recite it dramatically at sunset', pts: 10, proof: 'video' },
    ],
  },
]

const totalPossible = CHALLENGES.reduce((s, c) => s + c.items.reduce((a, i) => a + i.pts, 0), 0)

// Checks map: { [itemId]: ISO timestamp string }
type ChecksMap = Record<number, string>

function useTeamChecks(teamKey: string): [ChecksMap, (id: number) => void, boolean] {
  const [checks, setChecks] = useState<ChecksMap>({})
  const [loaded, setLoaded] = useState(false)
  const pendingRef = useRef<Record<number, string | null>>({})

  // Load from Firestore on mount
  useEffect(() => {
    fetch(`/api/aruba-hunt?team=${teamKey}`)
      .then(r => r.json())
      .then(data => {
        setChecks(data.checks || {})
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [teamKey])

  const toggle = (id: number) => {
    if (isGameLocked()) return
    const ts = checks[id] ? null : new Date().toISOString()
    // Optimistic update
    setChecks(prev => {
      const next = { ...prev }
      if (ts === null) delete next[id]
      else next[id] = ts
      return next
    })
    // Persist to Firestore
    fetch('/api/aruba-hunt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamKey, itemId: String(id), timestamp: ts }),
    })
  }

  return [checks, toggle, loaded]
}

function Rule() {
  return <div style={{ borderBottom: '1px solid #d8d0c8', margin: '14px 0' }} />
}
function DoubleRule() {
  return (
    <div style={{ margin: '18px 0' }}>
      <div style={{ borderBottom: '2px solid #7c2d2d', marginBottom: 2 }} />
      <div style={{ borderBottom: '1px solid #d8d0c8' }} />
    </div>
  )
}
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 3, color: '#2a2522', marginBottom: 6, marginTop: 0 }}>
      {children}
    </h2>
  )
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.5, color: '#5c5550', margin: '0 0 5px' }}>{children}</p>
}
function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#2a2522' }}>{children}</span>
}

function RulesPage() {
  return (
    <div>
      <SectionHead>The Format</SectionHead>
      <P>2 hours. 63 challenges. 3 teams. One winner. Total possible: <Mono>{totalPossible} pts</Mono></P>
      <P>At <Mono>20:00</Mono> sharp, all teams return to the mansion. Late arrivals lose <Mono>5 pts/min</Mono>. Scores tallied. Proof reviewed. Champions crowned.</P>
      <Rule />
      <SectionHead>The Teams</SectionHead>
      {TEAMS.map(t => (
        <div key={t.name} style={{ borderLeft: `3px solid ${t.accent}`, padding: '5px 12px', marginBottom: 5, background: `${t.accent}08` }}>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 14, fontWeight: 700, color: t.accent }}>{t.name}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#2a2522', fontWeight: 500 }}>{t.members.join(' & ')}</div>
        </div>
      ))}
      <Rule />
      <SectionHead>Rules of Engagement</SectionHead>
      {[
        'Complete challenges in any order. Strategy is encouraged.',
        'Team members can execute challenges independently — you don\'t all need to be together for every task.',
        'Proof required as marked — photo, video, screenshot, or written. No proof, no points.',
        'All running challenges require smartwatch tracking (Garmin, Apple Watch, etc.).',
        'SUP, kayak, and goggles are shared resources. First come, first served.',
        'Stay within walking/running distance. No vehicles (except for the Chow run).',
        'Disputes? Birthday girl Imgesu is the final arbiter.',
        'Submit all proof to the WhatsApp group. Timestamp is your receipt.',
        'Bonus votes at 20:00: "Most Creative Proof" (+10) and "Best Team Spirit" (+10).',
        'The Kokomo Dance-Off will be judged by Carlos (concierge). His decision is final.',
      ].map((rule, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#7c2d2d', fontSize: 11, minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: '#5c5550', lineHeight: 1.4 }}>{rule}</span>
        </div>
      ))}
      <Rule />
      <SectionHead>Proof Submission</SectionHead>
      <P>All photos, videos, and screenshots go to the WhatsApp group. Tag your team name. Timestamp = receipt.</P>
      <Rule />
      <SectionHead>Shared Equipment</SectionHead>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#5c5550', lineHeight: 1.6 }}>
        1 kayak · 1 SUP · 2 goggles · speakers · board games · kimonos · kite hats · sunglasses · kitchen scale
      </div>
      <DoubleRule />
      <div style={{ textAlign: 'center', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>
        Clarity in complexity. Confidence in conviction.
      </div>
    </div>
  )
}

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const fn = icons[name]
  return fn ? fn(color) : null
}

function TeamCard({ team }: { team: typeof TEAMS[0] }) {
  const [checks, toggle, loaded] = useTeamChecks(team.storageKey)
  const [locked, setLocked] = useState(isGameLocked())

  // Re-check lock every 30s
  useEffect(() => {
    const id = setInterval(() => setLocked(isGameLocked()), 30_000)
    return () => clearInterval(id)
  }, [])

  const earned = CHALLENGES.reduce((s, c) => s + c.items.reduce((a, i) => a + (checks[i.id] ? i.pts : 0), 0), 0)
  const done = Object.keys(checks).length
  const total = CHALLENGES.reduce((s, c) => s + c.items.length, 0)

  return (
    <div>
      {locked && (
        <div style={{ background: '#8c2d2d', color: '#faf8f4', textAlign: 'center', padding: '10px 16px', marginBottom: 14, borderRadius: 2 }}>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>TIME&apos;S UP</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, opacity: 0.8, marginTop: 2 }}>Checkboxes are locked. Submit proof to WhatsApp.</div>
        </div>
      )}

      {!loaded && (
        <div style={{ textAlign: 'center', padding: '8px 0', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>
          Loading…
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 22, fontWeight: 700, color: team.accent, margin: '0 0 2px', letterSpacing: 1 }}>{team.name}</h2>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#5c5550' }}>{team.members.join(' & ')}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '10px 0', borderTop: `2px solid ${team.accent}`, borderBottom: '1px solid #d8d0c8', marginBottom: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 700, color: team.accent }}>{earned}</div>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 9, fontStyle: 'italic', color: '#9a928a', textTransform: 'uppercase', letterSpacing: 2 }}>Points</div>
        </div>
        <div style={{ width: 1, background: '#d8d0c8' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 700, color: '#2a2522' }}>{done}</div>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 9, fontStyle: 'italic', color: '#9a928a', textTransform: 'uppercase', letterSpacing: 2 }}>of {total}</div>
        </div>
      </div>

      {CHALLENGES.map(cat => (
        <div key={cat.category} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #d8d0c8', paddingBottom: 3, marginBottom: 3 }}>
            <CategoryIcon name={cat.icon} color={team.accent} />
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: '#2a2522', margin: 0 }}>{cat.category}</h3>
          </div>
          {cat.items.map(item => {
            const ts = checks[item.id]
            const isDone = !!ts
            return (
              <div key={item.id} onClick={() => { if (!locked) toggle(item.id) }} style={{ display: 'flex', gap: 7, padding: '4px 4px', borderRadius: 2, cursor: locked ? 'default' : 'pointer', background: isDone ? `${team.accent}0a` : 'transparent', opacity: locked && !isDone ? 0.5 : 1, WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ width: 16, height: 16, minWidth: 16, marginTop: 2, borderRadius: 2, border: isDone ? `2px solid ${team.accent}` : '1.5px solid #c8c0b8', background: isDone ? team.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#faf8f4', fontWeight: 700 }}>
                  {isDone && '✓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.3, color: isDone ? '#9a928a' : '#2a2522', textDecoration: isDone ? 'line-through' : 'none', whiteSpace: 'pre-line' }}>{item.text}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5 }}>
                    <span style={{ fontWeight: 600, color: isDone ? team.accent : '#9a928a' }}>{item.pts} pts</span>
                    <span style={{ color: '#c8c0b8' }}>{item.proof}</span>
                    {isDone && ts && (
                      <span style={{ color: team.accent, fontWeight: 600 }}>✓ {formatArubaTime(ts)}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <div style={{ position: 'sticky', bottom: 0, background: '#f5f1ea', borderTop: '2px solid #d8d0c8', padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>{done}/{total} complete</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color: team.accent }}>{earned} pts</span>
      </div>
    </div>
  )
}

export default function ArubaPage() {
  const [tab, setTab] = useState<string>('rules')

  const tabs = [
    { key: 'rules', label: 'Rules', accent: '#7c2d2d' },
    { key: 'team0', label: 'I · D', accent: TEAMS[0].accent },
    { key: 'team1', label: 'A · L', accent: TEAMS[1].accent },
    { key: 'team2', label: 'A · R · A', accent: TEAMS[2].accent },
  ]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#f5f1ea', color: '#2a2522' }}>
      <div style={{ borderBottom: '1px solid #d8d0c8', background: '#faf8f4' }}>
        <div style={{ textAlign: 'center', padding: '12px 16px 4px' }}>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#2a2522', letterSpacing: 1, margin: 0, lineHeight: 1.1 }}>
            The Aruba Scavenger Hunt
          </h1>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 10, fontStyle: 'italic', color: '#9a928a', marginTop: 2, marginBottom: 6 }}>
            Savaneta Beach · Imgesu&apos;s Birthday Edition · 18:00–20:00
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #e8e2da' }}>
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '9px 4px', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 12, fontWeight: active ? 700 : 400, fontStyle: active ? 'normal' : 'italic', color: active ? t.accent : '#9a928a', background: active ? '#f5f1ea' : 'transparent', border: 'none', borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '14px 16px 80px' }}>
        {tab === 'rules' && <RulesPage />}
        {tab === 'team0' && <TeamCard team={TEAMS[0]} />}
        {tab === 'team1' && <TeamCard team={TEAMS[1]} />}
        {tab === 'team2' && <TeamCard team={TEAMS[2]} />}
      </div>
    </div>
  )
}
