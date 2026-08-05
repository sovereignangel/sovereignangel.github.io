'use client'

import { useState, useEffect, useRef } from 'react'

// ── Game config (Copenhagen = UTC+2 in summer) ───────────────────────────────
// EDIT THESE BEFORE THE GAME: start/end times and team member names below.
// FLIP USE_TEST_END TO true FOR TESTING THE LOCK SCREEN
const USE_TEST_END = false
const TEST_END = { hour: 12, minute: 5 }
const GAME_START = { hour: 15, minute: 0 }  // 3:00 pm
const REAL_END = { hour: 19, minute: 0 }    // 7:00 pm Copenhagen — screens freeze, winner declared

const fmtHM = (t: { hour: number; minute: number }) => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`

function getCphTime() {
  const now = new Date()
  return new Date(now.getTime() + 2 * 60 * 60 * 1000)
}
function isGameLocked() {
  const t = getCphTime()
  const h = t.getUTCHours(), m = t.getUTCMinutes()
  const end = USE_TEST_END ? TEST_END : REAL_END
  return h > end.hour || (h === end.hour && m >= end.minute)
}
function formatCphTime(iso: string) {
  const d = new Date(iso)
  const cph = new Date(d.getTime() + 2 * 60 * 60 * 1000)
  return cph.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'UTC' })
}

// --- SVG Icons ---
const icons: Record<string, (c?: string) => JSX.Element> = {
  wave: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M2 12c2-2 4-3 6-3s4 2 6 2 4-2 6-2" />
      <path d="M2 17c2-2 4-3 6-3s4 2 6 2 4-2 6-2" />
    </svg>
  ),
  tower: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M9 21V8l3-4 3 4v13" /><path d="M6 21h12" /><path d="M9 12h6" /><path d="M12 4V2" />
    </svg>
  ),
  bike: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="6" cy="16" r="4" /><circle cx="18" cy="16" r="4" /><path d="M6 16l4-8h5l3 8" /><path d="M10 8l-1.5-3H6" />
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

interface Team { name: string; accent: string; members: string[]; storageKey: string; tab: string }

// Two starting formats — the group picks one on the start screen.
// Rosters start empty on purpose — add hunter names to `members` once teams are chosen.
type Mode = 'pairs' | 'trios'
const MODES: Record<Mode, { label: string; teams: Team[] }> = {
  pairs: {
    label: '3 Teams of 2',
    teams: [
      { name: 'NYHAVN NAVY', accent: '#2d4a6f', members: [], storageKey: 'cph_team_navy', tab: 'NN' },
      { name: 'TIVOLI TWISTERS', accent: '#7c2d2d', members: [], storageKey: 'cph_team_tivoli', tab: 'TT' },
      { name: 'SMØRREBRØD SQUAD', accent: '#8a6d2f', members: [], storageKey: 'cph_team_smor', tab: 'SS' },
    ],
  },
  trios: {
    label: '2 Teams of 3',
    teams: [
      { name: 'NYHAVN NAVY', accent: '#2d4a6f', members: [], storageKey: 'cph_team_navy', tab: 'NN' },
      { name: 'TIVOLI TWISTERS', accent: '#7c2d2d', members: [], storageKey: 'cph_team_tivoli', tab: 'TT' },
    ],
  },
}

interface Challenge { id: number; text: string; pts: number; proof: string; opt?: boolean }
interface Category { category: string; icon: string; items: Challenge[] }

// `opt: true` = tied to a specific location, so it's an OPTIONAL bonus —
// extra points for teams that make the trip, never required to compete.
const CHALLENGES: Category[] = [
  {
    category: 'Landmarks & Icons', icon: 'tower',
    items: [
      { id: 1, text: 'Team photo recreating the Little Mermaid pose next to the statue', pts: 15, proof: 'photo', opt: true },
      { id: 2, text: 'Climb the Round Tower (Rundetårn) — video walking briskly up the spiral ramp', pts: 15, proof: 'video', opt: true },
      { id: 3, text: 'Photo with a Royal Guard at Amalienborg. Respectful distance — no touching, no mocking.', pts: 10, proof: 'photo', opt: true },
      { id: 4, text: 'Team jump photo in front of the colored houses of Nyhavn — everyone mid-air', pts: 10, proof: 'photo', opt: true },
      { id: 5, text: 'Climb the golden spiral stairs of the Church of Our Saviour — photo from the outside staircase', pts: 20, proof: 'photo', opt: true },
      { id: 6, text: 'Photo at the Gefion Fountain with one teammate imitating the ox-driving pose', pts: 10, proof: 'photo', opt: true },
      { id: 7, text: 'Find the windmill inside Kastellet', pts: 10, proof: 'photo', opt: true },
    ],
  },
  {
    category: 'Harbor & Water', icon: 'wave',
    items: [
      { id: 8, text: 'Team photo with everyone\'s bare feet dangling over the harbor edge', pts: 5, proof: 'photo' },
      { id: 9, text: 'One teammate takes a full dip at an official harbor bath (Islands Brygge or Sandkaj). Designated swim zones only.', pts: 20, proof: 'video' },
      { id: 10, text: 'Team photo on a bridge with a boat passing underneath', pts: 10, proof: 'photo' },
      { id: 11, text: 'Get everyone aboard a passing GoBoat or canal tour to wave back at you', pts: 10, proof: 'video' },
      { id: 12, text: 'Photo of a swan. +5 bonus if it is swimming next to a wooden boat.', pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'Physical & Endurance', icon: 'run',
    items: [
      { id: 13, text: 'Run 3 km — any route, any teammate. Must show smartwatch tracking as proof.', pts: 20, proof: 'screenshot' },
      { id: 14, text: 'Whole team planks simultaneously for 60 seconds in a park or square', pts: 10, proof: 'video' },
      { id: 15, text: 'Wheelbarrow race 20 meters in any park or square. +5 bonus in Kongens Have (King\'s Garden).', pts: 10, proof: 'video' },
      { id: 16, text: 'One teammate does 15 burpees in under 60 seconds in front of any landmark', pts: 10, proof: 'video' },
      { id: 17, text: 'Leapfrog all the way across a public square', pts: 10, proof: 'video' },
      { id: 18, text: 'Shoulder-sit photo: one teammate on the other\'s shoulders. +5 bonus in front of Christiansborg.', pts: 15, proof: 'photo' },
    ],
  },
  {
    category: 'Food & Drink', icon: 'glass',
    items: [
      { id: 19, text: 'Every teammate eats a piece of salt licorice (salmiak) — reactions on camera', pts: 15, proof: 'video' },
      { id: 20, text: 'Buy and split a kanelsnegl (cinnamon roll) — rate it out of 10 on camera', pts: 10, proof: 'video' },
      { id: 21, text: 'Eat a hot dog from a pølsevogn (street cart) — must have remoulade and crispy onions', pts: 10, proof: 'photo' },
      { id: 22, text: 'Share one smørrebrød. Most photogenic smørrebrød across all teams gets +5 bonus — group votes at the end.', pts: 15, proof: 'photo' },
      { id: 23, text: 'Cheers with a Carlsberg or Tuborg and toast in Danish: "Skål!"', pts: 10, proof: 'video' },
      { id: 24, text: 'Find and photograph a flødebolle (chocolate-covered marshmallow dome)', pts: 5, proof: 'photo' },
      { id: 25, text: 'Get a free sample of anything, anywhere', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Danes & Danish', icon: 'people',
    items: [
      { id: 26, text: 'Get a Dane to teach you to say "rødgrød med fløde" — your attempt plus their verdict on camera', pts: 20, proof: 'video' },
      { id: 27, text: 'Ask a local what "hygge" really means — then explain it back on camera in your own words', pts: 10, proof: 'video' },
      { id: 28, text: 'Learn a Danish phrase from a local (not "hej" or "tak") and use it on a second local', pts: 15, proof: 'video' },
      { id: 29, text: 'Photo with a local plus their name and one fact about them', pts: 10, proof: 'photo + fact' },
      { id: 30, text: 'Get a local\'s restaurant recommendation — write it down for the group dinner', pts: 10, proof: 'written' },
      { id: 31, text: 'Get a Dane to teach you a dance move — perform it together on camera', pts: 15, proof: 'video' },
    ],
  },
  {
    category: 'Bikes & Streets', icon: 'bike',
    items: [
      { id: 32, text: 'Photo of the whole team with bikes (rented, borrowed with permission, or city bikes)', pts: 10, proof: 'photo' },
      { id: 33, text: 'Photo of a cargo bike carrying kids, a dog, or groceries', pts: 10, proof: 'photo' },
      { id: 34, text: 'Photo of a bike rack holding 20+ bikes', pts: 5, proof: 'photo' },
      { id: 35, text: 'Team photo mid-crossing on any harbor bridge. +5 bonus on Inderhavnsbroen (the Kissing Bridge) or beside Cykelslangen.', pts: 10, proof: 'photo' },
      { id: 36, text: 'Find a street sign containing æ, ø, or å', pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'Creative & Performance', icon: 'palette',
    items: [
      { id: 37, text: 'DANISH DANCE-OFF: Choreograph a 30-second team dance to a Danish act (Aqua counts) in a public square. Group votes at the end — winner gets +15 bonus.', pts: 20, proof: 'video' },
      { id: 38, text: 'Write and perform a 30-second team anthem. Must include every teammate\'s name.', pts: 15, proof: 'video' },
      { id: 39, text: 'Recreate a famous painting or movie scene using a Copenhagen backdrop', pts: 15, proof: 'video' },
      { id: 40, text: 'Compose a haiku about Copenhagen and recite it dramatically. +5 bonus at a fountain.', pts: 10, proof: 'video' },
      { id: 41, text: 'One teammate impersonates someone else on the trip. The group must guess who at the end.', pts: 10, proof: 'video' },
      { id: 42, text: 'Pose as a statue in a busy square for 2 minutes without breaking. Bonus +5 if a stranger takes a photo of you.', pts: 15, proof: 'video' },
    ],
  },
  {
    category: 'Brain & Puzzle', icon: 'brain',
    items: [
      { id: 43, text: 'Long division by hand on paper, filmed, no calculator: 9,376 divided by 23 (to 2 decimal places)', pts: 15, proof: 'video' },
      { id: 44, text: 'Name 15 countries in 30 seconds — filmed, no repeats', pts: 10, proof: 'video' },
      { id: 45, text: 'Count the colored facades on the sunny side of Nyhavn — submit your number with photo evidence. Closest team wins the points.', pts: 15, proof: 'photo + number', opt: true },
      { id: 46, text: 'Find the year the Round Tower was completed — from a plaque or inscription on site, not Google', pts: 10, proof: 'photo of plaque', opt: true },
      { id: 47, text: 'Name 5 famous Danes in 20 seconds — filmed', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'The Riddle', icon: 'puzzle',
    items: [
      { id: 48, text: 'Solve this riddle. First team to submit the correct answer to the WhatsApp group wins 30 pts. All others get 0.\n\n"The more of me you take, the more you leave behind. What am I?"', pts: 30, proof: 'written answer' },
    ],
  },
  {
    category: 'Find These Things', icon: 'search',
    items: [
      { id: 49, text: 'A Dannebrog (Danish flag) flying from a building or mast', pts: 5, proof: 'photo' },
      { id: 50, text: 'Anything LEGO', pts: 10, proof: 'photo' },
      { id: 51, text: 'A crown symbol on a building, manhole cover, or lamppost', pts: 5, proof: 'photo' },
      { id: 52, text: 'The Stork Fountain (Storkespringvandet) on Strøget', pts: 10, proof: 'photo', opt: true },
      { id: 53, text: 'The most beautiful doorway in the city — team must agree', pts: 5, proof: 'photo' },
      { id: 54, text: 'A living creature other than a human, dog, or bird', pts: 10, proof: 'photo' },
      { id: 55, text: 'Something red and something white — Danish flag colors, both found in the wild', pts: 5, proof: 'photo' },
      { id: 56, text: 'A wooden ship moored in Nyhavn', pts: 5, proof: 'photo', opt: true },
      { id: 57, text: 'A busker mid-performance — leave a coin and get a photo', pts: 10, proof: 'photo' },
    ],
  },
]

const totalPossible = CHALLENGES.reduce((s, c) => s + c.items.reduce((a, i) => a + i.pts, 0), 0)
const totalCount = CHALLENGES.reduce((s, c) => s + c.items.length, 0)

// Checks map: { [itemId]: ISO timestamp string }
type ChecksMap = Record<number, string>

const earnedFrom = (checks: ChecksMap) =>
  CHALLENGES.reduce((s, c) => s + c.items.reduce((a, i) => a + (checks[i.id] ? i.pts : 0), 0), 0)

function useTeamChecks(teamKey: string): [ChecksMap, (id: number) => void, boolean] {
  const [checks, setChecks] = useState<ChecksMap>({})
  const [loaded, setLoaded] = useState(false)

  // Load from Firestore on mount
  useEffect(() => {
    fetch(`/api/cph-hunt?team=${teamKey}`)
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
    fetch('/api/cph-hunt', {
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

function RulesPage({ teams, modeLabel, onChangeMode }: { teams: Team[]; modeLabel: string; onChangeMode: () => void }) {
  return (
    <div>
      <SectionHead>The Format</SectionHead>
      <P>4 hours. {totalCount} challenges. {modeLabel}. One winner. Total possible: <Mono>{totalPossible} pts</Mono></P>
      <P>Game runs <Mono>{fmtHM(GAME_START)}</Mono> to <Mono>{fmtHM(REAL_END)}</Mono>. At <Mono>{fmtHM(REAL_END)}</Mono> the screens freeze, the points are final, and the winner is declared on every phone. Late arrivals at the meeting point lose <Mono>5 pts/min</Mono>.</P>
      <Rule />
      <SectionHead>The Teams</SectionHead>
      {teams.map(t => (
        <div key={t.name} style={{ borderLeft: `3px solid ${t.accent}`, padding: '5px 12px', marginBottom: 5, background: `${t.accent}08` }}>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 14, fontWeight: 700, color: t.accent }}>{t.name}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: t.members.length ? '#2a2522' : '#9a928a', fontWeight: 500, fontStyle: t.members.length ? 'normal' : 'italic' }}>
            {t.members.length ? t.members.join(' & ') : 'Roster to be chosen'}
          </div>
        </div>
      ))}
      <button
        onClick={onChangeMode}
        style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a', background: 'none', border: '1px solid #d8d0c8', borderRadius: 2, padding: '4px 10px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
      >
        Change team format
      </button>
      <Rule />
      <SectionHead>Rules of Engagement</SectionHead>
      {[
        'Complete challenges in any order. Route strategy wins games — Copenhagen is bigger than it looks.',
        'Challenges marked "optional · location bonus" are tied to a specific spot — pure extra points, never required. Everything else can be done anywhere in the city.',
        'Teammates can split up for independent challenges, but team photos need everyone (ask a stranger or use a timer).',
        'Proof required as marked — photo, video, screenshot, or written. No proof, no points.',
        'Running challenges require smartwatch tracking (Garmin, Apple Watch, etc.).',
        'Walking, running, bikes, and metro are all allowed. No taxis or cars.',
        'Respect the city: no trespassing, no traffic dodging, swim only in designated harbor bath zones.',
        'Strangers must consent before appearing in your proof shots.',
        'Submit all proof to the WhatsApp group as you go. Tag your team name. Timestamp is your receipt.',
        'Disputes are settled by group vote at the meeting point. Majority rules.',
        'Bonus votes at the end: "Most Creative Proof" (+10) and "Best Team Spirit" (+10).',
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
      <SectionHead>Suggested Kit</SectionHead>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#5c5550', lineHeight: 1.6 }}>
        charged phone · rejsekort or metro app · small cash for buskers &amp; snacks · towel (harbor dip) · pen &amp; paper · smartwatch
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

const catId = (category: string) => 'cat-' + category.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function TeamCard({ team, allTeams }: { team: Team; allTeams: Team[] }) {
  const [checks, toggle, loaded] = useTeamChecks(team.storageKey)
  const [locked, setLocked] = useState(isGameLocked())
  const [rivalBest, setRivalBest] = useState<number | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(CHALLENGES.map(c => [c.category, true]))
  )

  // Re-check lock every 30s
  useEffect(() => {
    const id = setInterval(() => setLocked(isGameLocked()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Poll rival teams' scores so the "behind #1" gap stays live
  useEffect(() => {
    let alive = true
    const rivals = allTeams.filter(t => t.storageKey !== team.storageKey)
    const load = () => {
      Promise.all(rivals.map(r =>
        fetch(`/api/cph-hunt?team=${r.storageKey}`)
          .then(res => res.json())
          .then(d => earnedFrom(d.checks || {}))
          .catch(() => 0)
      )).then(scores => {
        if (alive) setRivalBest(scores.length ? Math.max(...scores) : 0)
      })
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { alive = false; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.storageKey])

  const earned = earnedFrom(checks)
  const done = Object.keys(checks).length
  const total = CHALLENGES.reduce((s, c) => s + c.items.length, 0)
  const behind = rivalBest === null ? null : Math.max(0, rivalBest - earned)

  // At freeze time: pull every team's final score, declare the winner, and
  // save the result to Firestore (checks are already persisted as they go).
  const [standings, setStandings] = useState<{ name: string; score: number }[] | null>(null)
  useEffect(() => {
    if (!locked) return
    Promise.all(allTeams.map(t =>
      fetch(`/api/cph-hunt?team=${t.storageKey}`)
        .then(r => r.json())
        .then(d => ({ name: t.name, score: earnedFrom(d.checks || {}) }))
        .catch(() => ({ name: t.name, score: 0 }))
    )).then(rows => {
      rows.sort((a, b) => b.score - a.score)
      setStandings(rows)
      fetch('/api/cph-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamKey: 'cph_config',
          itemId: 'final',
          timestamp: JSON.stringify({ decidedAt: new Date().toISOString(), standings: rows }),
        }),
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked])

  const scrollToCat = (category: string) => {
    setOpen(p => ({ ...p, [category]: true }))
    setTimeout(() => {
      document.getElementById(catId(category))?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }, 0)
  }

  const winners = standings && standings.length ? standings.filter(s => s.score === standings[0].score) : []

  return (
    <div>
      {locked && (
        <div style={{ background: '#8c2d2d', color: '#faf8f4', textAlign: 'center', padding: '12px 16px', marginBottom: 14, borderRadius: 2 }}>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>TIME&apos;S UP</div>
          {standings === null && (
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, opacity: 0.8, marginTop: 2 }}>Points are frozen. Tallying final scores…</div>
          )}
          {standings !== null && (
            <>
              <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {winners.length > 1
                  ? `Tie — ${winners.map(w => w.name).join(' & ')} at ${winners[0].score} pts`
                  : `${winners[0]?.name} wins — ${winners[0]?.score} pts`}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, opacity: 0.85, marginTop: 4, lineHeight: 1.6 }}>
                {standings.map((s, i) => (
                  <div key={s.name}>{i + 1}. {s.name} · {s.score} pts</div>
                ))}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, opacity: 0.7, marginTop: 4 }}>Scores are saved. Get to the meeting point.</div>
            </>
          )}
        </div>
      )}

      {!loaded && (
        <div style={{ textAlign: 'center', padding: '8px 0', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>
          Loading…
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 22, fontWeight: 700, color: team.accent, margin: '0 0 2px', letterSpacing: 1 }}>{team.name}</h2>
        {team.members.length > 0 && (
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#5c5550' }}>{team.members.join(' & ')}</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '10px 0', borderTop: `2px solid ${team.accent}`, borderBottom: '1px solid #d8d0c8', marginBottom: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: behind === null ? '#c8c0b8' : behind > 0 ? '#8c2d2d' : '#2d5f3f' }}>
            {behind === null ? '· · ·' : behind > 0 ? `−${behind} behind #1` : 'top team'}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 700, color: team.accent, lineHeight: 1.1 }}>{earned}</div>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 9, fontStyle: 'italic', color: '#9a928a', textTransform: 'uppercase', letterSpacing: 2 }}>{earned} / {totalPossible} points</div>
        </div>
        <div style={{ width: 1, background: '#d8d0c8' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#c8c0b8' }}>&nbsp;</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 700, color: '#2a2522', lineHeight: 1.1 }}>{done}</div>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 9, fontStyle: 'italic', color: '#9a928a', textTransform: 'uppercase', letterSpacing: 2 }}>of {total} tasks</div>
        </div>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#f5f1ea', borderBottom: `2px solid ${team.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', marginBottom: 8 }}>
        {CHALLENGES.map(cat => {
          const catAllDone = cat.items.every(i => !!checks[i.id])
          return (
            <button
              key={cat.category}
              onClick={() => scrollToCat(cat.category)}
              aria-label={cat.category}
              title={cat.category}
              style={{ flex: 1, background: catAllDone ? `${team.accent}14` : 'none', border: 'none', borderRadius: 2, padding: '6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitTapHighlightColor: 'transparent' }}
            >
              <CategoryIcon name={cat.icon} color={team.accent} />
            </button>
          )
        })}
      </div>

      {CHALLENGES.map(cat => {
        const isOpen = open[cat.category]
        const catDone = cat.items.filter(i => !!checks[i.id]).length
        const catPts = cat.items.reduce((s, i) => s + (checks[i.id] ? i.pts : 0), 0)
        return (
        <div key={cat.category} id={catId(cat.category)} style={{ marginBottom: 6, border: '1px solid #e8e2da', borderRadius: 2, overflow: 'hidden', scrollMarginTop: 46 }}>
          <div
            onClick={() => setOpen(p => ({ ...p, [cat.category]: !p[cat.category] }))}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#faf8f4', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
            <CategoryIcon name={cat.icon} color={team.accent} />
            <h3 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: '#2a2522', margin: 0, flex: 1 }}>{cat.category}</h3>
            {catDone > 0 && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: team.accent }}>{catPts}pt · {catDone}/{cat.items.length}</span>
            )}
            {catDone === 0 && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#c8c0b8' }}>{cat.items.length}</span>
            )}
            <span style={{ fontSize: 10, color: '#9a928a', marginLeft: 2, transition: 'transform 0.15s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          </div>
          {isOpen && <div style={{ padding: '4px 8px 6px' }}>
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
                    {item.opt && (
                      <span style={{ color: '#8a6d2f', fontWeight: 600 }}>optional · location bonus</span>
                    )}
                    {isDone && ts && (
                      <span style={{ color: team.accent, fontWeight: 600 }}>✓ {formatCphTime(ts)}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          </div>}
        </div>
        )
      })}

      <div style={{ position: 'sticky', bottom: 0, background: '#f5f1ea', borderTop: '2px solid #d8d0c8', padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>{done}/{total} complete</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: behind === null ? '#c8c0b8' : behind > 0 ? '#8c2d2d' : '#2d5f3f' }}>
            {behind === null ? '' : behind > 0 ? `−${behind} vs #1` : '#1'}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color: team.accent }}>{earned} pts</span>
        </span>
      </div>
    </div>
  )
}

function StartScreen({ onChoose }: { onChoose: (m: Mode) => void }) {
  return (
    <div style={{ padding: '28px 4px', textAlign: 'center' }}>
      <SectionHead>Choose Your Format</SectionHead>
      <P>Six hunters. Pick how you split before the clock starts — the choice syncs to every phone.</P>
      {(Object.keys(MODES) as Mode[]).map(m => (
        <button
          key={m}
          onClick={() => onChoose(m)}
          style={{ display: 'block', width: '100%', margin: '12px 0', padding: '16px 12px', background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: 2, cursor: 'pointer', textAlign: 'center', WebkitTapHighlightColor: 'transparent' }}
        >
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#7c2d2d', letterSpacing: 1 }}>{MODES[m].label}</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#9a928a', marginTop: 4 }}>{MODES[m].teams.map(t => t.name).join(' · ')}</div>
        </button>
      ))}
    </div>
  )
}

export default function CphPage() {
  const [tab, setTab] = useState<string>('rules')
  const [mode, setMode] = useState<Mode | null>(null)
  const [modeLoaded, setModeLoaded] = useState(false)

  // The chosen format is stored in Firestore under a pseudo-team doc
  // (cph_config → checks.mode) so every phone sees the same team split.
  useEffect(() => {
    fetch('/api/cph-hunt?team=cph_config')
      .then(r => r.json())
      .then(data => {
        const m = data.checks?.mode
        if (m === 'pairs' || m === 'trios') setMode(m)
        setModeLoaded(true)
      })
      .catch(() => setModeLoaded(true))
  }, [])

  const persistMode = (m: Mode | null) => {
    fetch('/api/cph-hunt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamKey: 'cph_config', itemId: 'mode', timestamp: m }),
    })
  }
  const chooseMode = (m: Mode) => {
    setMode(m)
    setTab('rules')
    persistMode(m)
  }
  const clearMode = () => {
    setMode(null)
    setTab('rules')
    persistMode(null)
  }

  const teams = mode ? MODES[mode].teams : []
  const tabs = [
    { key: 'rules', label: 'Rules', accent: '#7c2d2d' },
    ...teams.map((t, i) => ({ key: `team${i}`, label: t.tab, accent: t.accent })),
  ]

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#f5f1ea', color: '#2a2522' }}>
      <div style={{ borderBottom: '1px solid #d8d0c8', background: '#faf8f4' }}>
        <div style={{ textAlign: 'center', padding: '12px 16px 4px' }}>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#2a2522', letterSpacing: 1, margin: 0, lineHeight: 1.1 }}>
            The Copenhagen Scavenger Hunt
          </h1>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 10, fontStyle: 'italic', color: '#9a928a', marginTop: 2, marginBottom: 6 }}>
            København · {mode ? MODES[mode].label : 'Six Hunters'} · {fmtHM(GAME_START)}–{fmtHM(REAL_END)}
          </div>
        </div>
        {mode && (
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
        )}
      </div>

      <div style={{ padding: '14px 16px 80px' }}>
        {!modeLoaded && (
          <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>
            Loading…
          </div>
        )}
        {modeLoaded && mode === null && <StartScreen onChoose={chooseMode} />}
        {modeLoaded && mode !== null && tab === 'rules' && (
          <RulesPage teams={teams} modeLabel={MODES[mode].label} onChangeMode={clearMode} />
        )}
        {modeLoaded && mode !== null && teams.map((t, i) => (
          tab === `team${i}` ? <TeamCard key={`${mode}-${t.storageKey}`} team={t} allTeams={teams} /> : null
        ))}
      </div>
    </div>
  )
}
