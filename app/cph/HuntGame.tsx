'use client'

import { useState, useEffect } from 'react'

// ── Game config (Copenhagen = UTC+2 in summer) ───────────────────────────────
// The hunt opens when it is unlocked from the /cpht console, and freezes at
// REAL_END Copenhagen time regardless of when it opened.
export const REAL_END = { hour: 19, minute: 0 } // 7:00 pm Copenhagen — screens freeze, winner declared

export const fmtHM = (t: { hour: number; minute: number }) =>
  `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`

function getCphTime() {
  const now = new Date()
  return new Date(now.getTime() + 2 * 60 * 60 * 1000)
}
export function isFrozenNow() {
  const t = getCphTime()
  const h = t.getUTCHours(), m = t.getUTCMinutes()
  return h > REAL_END.hour || (h === REAL_END.hour && m >= REAL_END.minute)
}
function formatCphTime(iso: string) {
  const d = new Date(iso)
  const cph = new Date(d.getTime() + 2 * 60 * 60 * 1000)
  return cph.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'UTC' })
}

// ── Environments ─────────────────────────────────────────────────────────────
// 'live' is the real game at /cph. 'test' is the sandbox at /cpht — same code,
// separate Firestore docs, so testing never touches the real scores.
export type Env = 'live' | 'test'
export const teamKeyFor = (env: Env, base: string) => (env === 'test' ? `t_${base}` : base)
export const cfgDoc = (env: Env) => (env === 'test' ? 't_cph_config' : 'cph_config')

export async function readConfig(env: Env): Promise<Record<string, string>> {
  try {
    const r = await fetch(`/api/cph-hunt?team=${cfgDoc(env)}`, { cache: 'no-store' })
    const d = await r.json()
    return d.checks || {}
  } catch {
    return {}
  }
}
export async function writeConfig(env: Env, key: string, value: string | null) {
  await fetch('/api/cph-hunt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamKey: cfgDoc(env), itemId: key, timestamp: value }),
  })
}
export async function resetTeam(env: Env, base: string) {
  await fetch('/api/cph-hunt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamKey: teamKeyFor(env, base), reset: true }),
  })
}

// --- SVG Icons ---
const icons: Record<string, (c?: string) => JSX.Element> = {
  tower: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M9 21V8l3-4 3 4v13" /><path d="M6 21h12" /><path d="M9 12h6" /><path d="M12 4V2" />
    </svg>
  ),
  people: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M17 14a4 4 0 0 1 4 4v3" />
    </svg>
  ),
  run: (c = '#7c2d2d') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="14" cy="4" r="2" /><path d="M10 22l2-7 3 3v6" /><path d="M6 13l4-2 3 3" /><path d="M18 9l-5 2" />
    </svg>
  ),
}

export interface Team { name: string; accent: string; members: string[]; storageKey: string; tab: string }

// Two starting formats — the group picks one before the hunt opens.
// Rosters start empty on purpose — add hunter names to `members` once teams are chosen.
export type Mode = 'pairs' | 'trios'
export const MODES: Record<Mode, { label: string; teams: Team[] }> = {
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
export const ALL_TEAM_KEYS = Array.from(
  new Set(Object.values(MODES).flatMap(m => m.teams.map(t => t.storageKey)))
)

// ── Challenges ───────────────────────────────────────────────────────────────
// Three mutually exclusive groups, one question each:
//   THE CITY  — is the subject a place or object in Copenhagen?
//   THE DANES — does it need a Dane to take part?
//   THE TEAM  — is it your own bodies and wits?
// Flags: opt = optional location bonus · req = required to place · perUnit = extra pts per counted unit
export interface Challenge { id: number; text: string; pts: number; proof: string; opt?: boolean; req?: boolean; perUnit?: number }
export interface Category { category: string; icon: string; blurb: string; items: Challenge[] }

export const REQUIRED_ID = 100

export const CHALLENGES: Category[] = [
  {
    category: 'The City', icon: 'tower',
    blurb: 'Places and objects. Find it, climb it, photograph it.',
    items: [
      { id: REQUIRED_ID, text: 'THE COPENHAGEN THREE: pick an object that is unmistakably Copenhagen — your team decides what qualifies — and collect three of them. Final photo must show all three together, held up by the team. Required to place in the standings.', pts: 25, proof: 'photo', req: true },
      { id: 1, text: 'Team photo recreating the Little Mermaid pose next to the statue', pts: 15, proof: 'photo', opt: true },
      { id: 2, text: 'Climb the Round Tower (Rundetårn) — video walking briskly up the spiral ramp', pts: 15, proof: 'video', opt: true },
      { id: 3, text: 'Photo with a Royal Guard at Amalienborg. Respectful distance — no touching, no mocking.', pts: 10, proof: 'photo', opt: true },
      { id: 4, text: 'Team jump photo in front of the colored houses of Nyhavn — everyone mid-air', pts: 10, proof: 'photo', opt: true },
      { id: 5, text: 'Climb the golden spiral stairs of the Church of Our Saviour — photo from the outside staircase', pts: 20, proof: 'photo', opt: true },
      { id: 6, text: 'Photo at the Gefion Fountain with one teammate imitating the ox-driving pose', pts: 10, proof: 'photo', opt: true },
      { id: 7, text: 'Find the windmill inside Kastellet', pts: 10, proof: 'photo', opt: true },
      { id: 45, text: 'Count the colored facades on the sunny side of Nyhavn — submit your number with photo evidence. Closest team wins the points.', pts: 15, proof: 'photo + number', opt: true },
      { id: 46, text: 'Find the year the Round Tower was completed — from a plaque or inscription on site, not Google', pts: 10, proof: 'photo of plaque', opt: true },
      { id: 52, text: 'The Stork Fountain (Storkespringvandet) on Strøget', pts: 10, proof: 'photo', opt: true },
      { id: 56, text: 'A wooden ship moored in Nyhavn', pts: 5, proof: 'photo', opt: true },
      { id: 8, text: 'Team photo with everyone\'s bare feet dangling over the harbor edge', pts: 5, proof: 'photo' },
      { id: 9, text: 'One teammate takes a full dip at an official harbor bath (Islands Brygge or Sandkaj). Designated swim zones only.', pts: 20, proof: 'video' },
      { id: 10, text: 'Team photo on a bridge with a boat passing underneath', pts: 10, proof: 'photo' },
      { id: 12, text: 'Photo of a swan. +5 bonus if it is swimming next to a wooden boat.', pts: 10, proof: 'photo' },
      { id: 32, text: 'Photo of the whole team with bikes (rented, borrowed with permission, or city bikes)', pts: 10, proof: 'photo' },
      { id: 33, text: 'Photo of a cargo bike carrying kids, a dog, or groceries', pts: 10, proof: 'photo' },
      { id: 34, text: 'Photo of a bike rack holding 20+ bikes', pts: 5, proof: 'photo' },
      { id: 35, text: 'Team photo mid-crossing on any harbor bridge. +5 bonus on Inderhavnsbroen (the Kissing Bridge) or beside Cykelslangen.', pts: 10, proof: 'photo' },
      { id: 36, text: 'Find a street sign containing æ, ø, or å', pts: 10, proof: 'photo' },
      { id: 49, text: 'A Dannebrog (Danish flag) flying from a building or mast', pts: 5, proof: 'photo' },
      { id: 50, text: 'Anything LEGO', pts: 10, proof: 'photo' },
      { id: 51, text: 'A crown symbol on a building, manhole cover, or lamppost', pts: 5, proof: 'photo' },
      { id: 53, text: 'The most beautiful doorway in the city — team must agree', pts: 5, proof: 'photo' },
      { id: 54, text: 'A living creature other than a human, dog, or bird', pts: 10, proof: 'photo' },
      { id: 55, text: 'Something red and something white — Danish flag colors, both found in the wild', pts: 5, proof: 'photo' },
      { id: 57, text: 'A busker mid-performance — leave a coin and get a photo', pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'The Danes', icon: 'people',
    blurb: 'Anything that needs a willing Dane. Ask first, always.',
    items: [
      { id: 101, text: 'SELFIE WITH A DANE. One Dane scores the base points; every extra Dane in the same shot adds more. Take your biggest group selfie, then enter how many Danes are in it. Everyone must be willing and know they are in the photo.', pts: 10, perUnit: 5, proof: 'photo + count' },
      { id: 26, text: 'Get a Dane to teach you to say "rødgrød med fløde" — your attempt plus their verdict on camera', pts: 20, proof: 'video' },
      { id: 27, text: 'Ask a local what "hygge" really means — then explain it back on camera in your own words', pts: 10, proof: 'video' },
      { id: 28, text: 'Learn a Danish phrase from a local (not "hej" or "tak") and use it on a second local', pts: 15, proof: 'video' },
      { id: 31, text: 'Get a Dane to teach you a dance move — perform it together on camera', pts: 15, proof: 'video' },
      { id: 30, text: 'Get a local\'s restaurant recommendation — write it down for the group dinner', pts: 10, proof: 'written' },
      { id: 11, text: 'Get everyone aboard a passing GoBoat or canal tour to wave back at you', pts: 10, proof: 'video' },
      { id: 25, text: 'Get a free sample of anything, anywhere', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'The Team', icon: 'run',
    blurb: 'Your bodies, your stomachs, your wits. No locals required.',
    items: [
      { id: 13, text: 'Run 3 km — any route, any teammate. Must show smartwatch tracking as proof.', pts: 20, proof: 'screenshot' },
      { id: 14, text: 'Whole team planks simultaneously for 60 seconds in a park or square', pts: 10, proof: 'video' },
      { id: 15, text: 'Wheelbarrow race 20 meters in any park or square. +5 bonus in Kongens Have (King\'s Garden).', pts: 10, proof: 'video' },
      { id: 16, text: 'One teammate does 15 burpees in under 60 seconds in front of any landmark', pts: 10, proof: 'video' },
      { id: 17, text: 'Leapfrog all the way across a public square', pts: 10, proof: 'video' },
      { id: 18, text: 'Shoulder-sit photo: one teammate on the other\'s shoulders. +5 bonus in front of Christiansborg.', pts: 15, proof: 'photo' },
      { id: 19, text: 'Every teammate eats a piece of salt licorice (salmiak) — reactions on camera', pts: 15, proof: 'video' },
      { id: 20, text: 'Buy and split a kanelsnegl (cinnamon roll) — rate it out of 10 on camera', pts: 10, proof: 'video' },
      { id: 21, text: 'Eat a hot dog from a pølsevogn (street cart) — must have remoulade and crispy onions', pts: 10, proof: 'photo' },
      { id: 22, text: 'Share one smørrebrød. Most photogenic smørrebrød across all teams gets +5 bonus — group votes at the end.', pts: 15, proof: 'photo' },
      { id: 23, text: 'Cheers with a Carlsberg or Tuborg and toast in Danish: "Skål!"', pts: 10, proof: 'video' },
      { id: 24, text: 'Find and photograph a flødebolle (chocolate-covered marshmallow dome)', pts: 5, proof: 'photo' },
      { id: 37, text: 'DANISH DANCE-OFF: Choreograph a 30-second team dance to a Danish act (Aqua counts) in a public square. Group votes at the end — winner gets +15 bonus.', pts: 20, proof: 'video' },
      { id: 38, text: 'Write and perform a 30-second team anthem. Must include every teammate\'s name.', pts: 15, proof: 'video' },
      { id: 39, text: 'Recreate a famous painting or movie scene using a Copenhagen backdrop', pts: 15, proof: 'video' },
      { id: 40, text: 'Compose a haiku about Copenhagen and recite it dramatically. +5 bonus at a fountain.', pts: 10, proof: 'video' },
      { id: 41, text: 'One teammate impersonates someone else on the trip. The group must guess who at the end.', pts: 10, proof: 'video' },
      { id: 42, text: 'Pose as a statue in a busy square for 2 minutes without breaking. Bonus +5 if a stranger takes a photo of you.', pts: 15, proof: 'video' },
      { id: 43, text: 'Long division by hand on paper, filmed, no calculator: 9,376 divided by 23 (to 2 decimal places)', pts: 15, proof: 'video' },
      { id: 44, text: 'Name 15 countries in 30 seconds — filmed, no repeats', pts: 10, proof: 'video' },
      { id: 47, text: 'Name 5 famous Danes in 20 seconds — filmed', pts: 10, proof: 'video' },
      { id: 48, text: 'Solve this riddle. First team to submit the correct answer to the WhatsApp group wins 30 pts. All others get 0.\n\n"The more of me you take, the more you leave behind. What am I?"', pts: 30, proof: 'written answer' },
    ],
  },
]

const totalPossible = CHALLENGES.reduce((s, c) => s + c.items.reduce((a, i) => a + i.pts, 0), 0)
const totalCount = CHALLENGES.reduce((s, c) => s + c.items.length, 0)

type ChecksMap = Record<number, string>
type CountsMap = Record<number, number>

const itemPoints = (item: Challenge, checks: ChecksMap, counts: CountsMap) => {
  if (!checks[item.id]) return 0
  if (!item.perUnit) return item.pts
  const n = Math.max(1, counts[item.id] || 1)
  return item.pts + item.perUnit * (n - 1)
}
export const earnedFrom = (checks: ChecksMap, counts: CountsMap) =>
  CHALLENGES.reduce((s, c) => s + c.items.reduce((a, i) => a + itemPoints(i, checks, counts), 0), 0)

function useTeamChecks(teamKey: string, frozen: boolean) {
  const [checks, setChecks] = useState<ChecksMap>({})
  const [counts, setCounts] = useState<CountsMap>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/cph-hunt?team=${teamKey}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setChecks(data.checks || {})
        setCounts(data.counts || {})
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [teamKey])

  const toggle = (id: number) => {
    if (frozen) return
    const ts = checks[id] ? null : new Date().toISOString()
    setChecks(prev => {
      const next = { ...prev }
      if (ts === null) delete next[id]
      else next[id] = ts
      return next
    })
    fetch('/api/cph-hunt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamKey, itemId: String(id), timestamp: ts }),
    })
  }

  const setCount = (id: number, n: number) => {
    if (frozen) return
    const clamped = Math.max(1, Math.min(99, n))
    setCounts(prev => ({ ...prev, [id]: clamped }))
    fetch('/api/cph-hunt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamKey, itemId: String(id), count: clamped }),
    })
  }

  return { checks, counts, toggle, setCount, loaded }
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
export function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 3, color: '#2a2522', marginBottom: 6, marginTop: 0 }}>
      {children}
    </h2>
  )
}
export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.5, color: '#5c5550', margin: '0 0 5px' }}>{children}</p>
}
function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#2a2522' }}>{children}</span>
}

function RulesPage({ teams, modeLabel }: { teams: Team[]; modeLabel: string }) {
  return (
    <div>
      <SectionHead>The Format</SectionHead>
      <P>{totalCount} challenges in three groups. {modeLabel}. One winner. Total possible: <Mono>{totalPossible} pts</Mono>, plus <Mono>+5</Mono> for every extra Dane in your selfie.</P>
      <P>The hunt runs from the moment it opens until <Mono>{fmtHM(REAL_END)}</Mono> sharp. At <Mono>{fmtHM(REAL_END)}</Mono> the screens freeze, the points are final, and the winner is declared on every phone. Late arrivals at the meeting point lose <Mono>5 pts/min</Mono>.</P>
      <Rule />
      <SectionHead>One Requirement</SectionHead>
      <div style={{ border: '1px solid #7c2d2d', background: '#7c2d2d08', borderRadius: 2, padding: '8px 10px', marginBottom: 6 }}>
        <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 13, fontWeight: 700, color: '#7c2d2d', marginBottom: 2 }}>THE COPENHAGEN THREE</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: '#5c5550', lineHeight: 1.4 }}>
          Pick an object that is unmistakably Copenhagen and collect three of them. No team places in the standings without it. Everything else is yours to choose.
        </div>
      </div>
      <Rule />
      <SectionHead>The Three Groups</SectionHead>
      {CHALLENGES.map(c => (
        <div key={c.category} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
          <div style={{ marginTop: 1 }}>{icons[c.icon]('#7c2d2d')}</div>
          <div>
            <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 13, fontWeight: 700, color: '#2a2522' }}>{c.category.toUpperCase()} · {c.items.length}</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#5c5550' }}>{c.blurb}</div>
          </div>
        </div>
      ))}
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
      <Rule />
      <SectionHead>Rules of Engagement</SectionHead>
      {[
        'Complete challenges in any order. Route strategy wins games — Copenhagen is bigger than it looks.',
        'The Copenhagen Three is the one required challenge. Without it your points do not place.',
        'Challenges marked "optional · location bonus" are tied to a specific spot — pure extra points, never required. Everything else can be done anywhere in the city.',
        'The Dane selfie is counted: check it off, then enter how many willing Danes are in your best shot. More Danes, more points.',
        'Teammates can split up for independent challenges, but team photos need everyone (ask a stranger or use a timer).',
        'Proof required as marked — photo, video, screenshot, or written. No proof, no points.',
        'Anyone appearing in your proof must know about it and agree. No sneaking shots of strangers.',
        'Walking, running, bikes, and metro are all allowed. No taxis or cars.',
        'Respect the city: no trespassing, no traffic dodging, swim only in designated harbor bath zones.',
        'Submit all proof to the WhatsApp group as you go. Tag your team name. Timestamp is your receipt.',
        'Disputes are settled by group vote at the meeting point. Bonus votes at the end: "Most Creative Proof" (+10) and "Best Team Spirit" (+10).',
      ].map((rule, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#7c2d2d', fontSize: 11, minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: '#5c5550', lineHeight: 1.4 }}>{rule}</span>
        </div>
      ))}
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

interface StandingRow { name: string; score: number; eligible: boolean }

function TeamCard({ team, allTeams, env, frozen }: { team: Team; allTeams: Team[]; env: Env; frozen: boolean }) {
  const storeKey = teamKeyFor(env, team.storageKey)
  const { checks, counts, toggle, setCount, loaded } = useTeamChecks(storeKey, frozen)
  const [rivalBest, setRivalBest] = useState<number | null>(null)
  const [standings, setStandings] = useState<StandingRow[] | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(CHALLENGES.map(c => [c.category, true]))
  )

  // Poll rival teams' scores so the "behind #1" gap stays live
  useEffect(() => {
    let alive = true
    const rivals = allTeams.filter(t => t.storageKey !== team.storageKey)
    const load = () => {
      Promise.all(rivals.map(r =>
        fetch(`/api/cph-hunt?team=${teamKeyFor(env, r.storageKey)}`, { cache: 'no-store' })
          .then(res => res.json())
          .then(d => earnedFrom(d.checks || {}, d.counts || {}))
          .catch(() => 0)
      )).then(scores => {
        if (alive) setRivalBest(scores.length ? Math.max(...scores) : 0)
      })
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { alive = false; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.storageKey, env])

  // At freeze: tally every team, declare the winner, and save the result
  useEffect(() => {
    if (!frozen) return
    Promise.all(allTeams.map(t =>
      fetch(`/api/cph-hunt?team=${teamKeyFor(env, t.storageKey)}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(d => ({
          name: t.name,
          score: earnedFrom(d.checks || {}, d.counts || {}),
          eligible: !!(d.checks || {})[REQUIRED_ID],
        }))
        .catch(() => ({ name: t.name, score: 0, eligible: false }))
    )).then(rows => {
      rows.sort((a, b) => (Number(b.eligible) - Number(a.eligible)) || (b.score - a.score))
      setStandings(rows)
      if (env === 'live') {
        writeConfig('live', 'final', JSON.stringify({ decidedAt: new Date().toISOString(), standings: rows }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frozen, env])

  const earned = earnedFrom(checks, counts)
  const done = Object.keys(checks).length
  const behind = rivalBest === null ? null : Math.max(0, rivalBest - earned)
  const requirementMet = !!checks[REQUIRED_ID]

  const scrollToCat = (category: string) => {
    setOpen(p => ({ ...p, [category]: true }))
    setTimeout(() => {
      document.getElementById(catId(category))?.scrollIntoView({ behavior: 'auto', block: 'start' })
    }, 0)
  }

  const eligibleRows = standings?.filter(s => s.eligible) ?? []
  const pool = eligibleRows.length ? eligibleRows : standings ?? []
  const winners = pool.length ? pool.filter(s => s.score === pool[0].score) : []

  return (
    <div>
      {frozen && (
        <div style={{ background: '#8c2d2d', color: '#faf8f4', textAlign: 'center', padding: '12px 16px', marginBottom: 14, borderRadius: 2 }}>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>TIME&apos;S UP</div>
          {standings === null && (
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, opacity: 0.8, marginTop: 2 }}>Points are frozen. Tallying final scores…</div>
          )}
          {standings !== null && (
            <>
              <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                {winners.length === 0
                  ? 'No team met the requirement'
                  : winners.length > 1
                    ? `Tie — ${winners.map(w => w.name).join(' & ')} at ${winners[0].score} pts`
                    : `${winners[0].name} wins — ${winners[0].score} pts`}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, opacity: 0.85, marginTop: 4, lineHeight: 1.6 }}>
                {standings.map((s, i) => (
                  <div key={s.name}>{i + 1}. {s.name} · {s.score} pts{s.eligible ? '' : ' · requirement unmet'}</div>
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

      {loaded && !requirementMet && !frozen && (
        <div
          onClick={() => scrollToCat(CHALLENGES[0].category)}
          style={{ border: '1px solid #7c2d2d', background: '#7c2d2d0d', borderRadius: 2, padding: '7px 10px', marginBottom: 10, cursor: 'pointer' }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: '#7c2d2d', letterSpacing: 1 }}>REQUIREMENT OUTSTANDING</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#5c5550', lineHeight: 1.35, marginTop: 1 }}>
            Collect three of one unmistakably Copenhagen object. Your points do not place until this is done.
          </div>
        </div>
      )}

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
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, color: requirementMet ? '#2d5f3f' : '#8c2d2d' }}>
            {requirementMet ? 'qualified' : 'not qualified'}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 700, color: '#2a2522', lineHeight: 1.1 }}>{done}</div>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 9, fontStyle: 'italic', color: '#9a928a', textTransform: 'uppercase', letterSpacing: 2 }}>of {totalCount} tasks</div>
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
              style={{ flex: 1, background: catAllDone ? `${team.accent}14` : 'none', border: 'none', borderRadius: 2, padding: '6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, WebkitTapHighlightColor: 'transparent' }}
            >
              <CategoryIcon name={cat.icon} color={team.accent} />
              <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: team.accent }}>
                {cat.category.replace('The ', '')}
              </span>
            </button>
          )
        })}
      </div>

      {CHALLENGES.map(cat => {
        const isOpen = open[cat.category]
        const catDone = cat.items.filter(i => !!checks[i.id]).length
        const catPts = cat.items.reduce((s, i) => s + itemPoints(i, checks, counts), 0)
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
            const n = Math.max(1, counts[item.id] || 1)
            return (
              <div
                key={item.id}
                onClick={() => { if (!frozen) toggle(item.id) }}
                style={{
                  display: 'flex', gap: 7, padding: item.req ? '6px 5px' : '4px 4px', borderRadius: 2,
                  cursor: frozen ? 'default' : 'pointer',
                  background: item.req && !isDone ? '#7c2d2d0d' : isDone ? `${team.accent}0a` : 'transparent',
                  border: item.req ? '1px solid #7c2d2d40' : '1px solid transparent',
                  marginBottom: item.req ? 4 : 0,
                  opacity: frozen && !isDone ? 0.5 : 1, WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ width: 16, height: 16, minWidth: 16, marginTop: 2, borderRadius: 2, border: isDone ? `2px solid ${team.accent}` : '1.5px solid #c8c0b8', background: isDone ? team.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#faf8f4', fontWeight: 700 }}>
                  {isDone && '✓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.3, color: isDone ? '#9a928a' : '#2a2522', textDecoration: isDone ? 'line-through' : 'none', whiteSpace: 'pre-line' }}>{item.text}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: isDone ? team.accent : '#9a928a' }}>{itemPoints(item, checks, counts) || item.pts} pts</span>
                    <span style={{ color: '#c8c0b8' }}>{item.proof}</span>
                    {item.req && <span style={{ color: '#7c2d2d', fontWeight: 700 }}>required</span>}
                    {item.opt && <span style={{ color: '#8a6d2f', fontWeight: 600 }}>optional · location bonus</span>}
                    {item.perUnit && !isDone && <span style={{ color: '#8a6d2f', fontWeight: 600 }}>+{item.perUnit} per extra Dane</span>}
                    {isDone && ts && (
                      <span style={{ color: team.accent, fontWeight: 600 }}>✓ {formatCphTime(ts)}</span>
                    )}
                  </div>

                  {item.perUnit && isDone && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}
                    >
                      <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 10, fontStyle: 'italic', color: '#9a928a' }}>Danes in shot</span>
                      <button
                        onClick={() => setCount(item.id, n - 1)}
                        disabled={frozen || n <= 1}
                        style={{ width: 22, height: 22, borderRadius: 2, border: '1px solid #d8d0c8', background: '#faf8f4', color: '#2a2522', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1, cursor: frozen || n <= 1 ? 'default' : 'pointer', opacity: n <= 1 ? 0.4 : 1 }}
                      >−</button>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, color: team.accent, minWidth: 18, textAlign: 'center' }}>{n}</span>
                      <button
                        onClick={() => setCount(item.id, n + 1)}
                        disabled={frozen}
                        style={{ width: 22, height: 22, borderRadius: 2, border: '1px solid #d8d0c8', background: '#faf8f4', color: '#2a2522', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1, cursor: frozen ? 'default' : 'pointer' }}
                      >+</button>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: '#9a928a' }}>
                        {item.pts} + {item.perUnit} × {n - 1}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          </div>}
        </div>
        )
      })}

      <div style={{ position: 'sticky', bottom: 0, background: '#f5f1ea', borderTop: '2px solid #d8d0c8', padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>{done}/{totalCount} complete</span>
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

export function StartScreen({ onChoose }: { onChoose: (m: Mode) => void }) {
  return (
    <div style={{ padding: '28px 4px', textAlign: 'center' }}>
      <SectionHead>Choose Your Format</SectionHead>
      <P>Six hunters. Pick how you split before the hunt opens — the choice syncs to every phone.</P>
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

function WaitingScreen() {
  return (
    <div style={{ padding: '56px 12px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 21, fontWeight: 700, color: '#7c2d2d', lineHeight: 1.25, letterSpacing: 0.5 }}>
        Get ready for scavenging Copenhagen shortly!
      </div>
      <div style={{ borderBottom: '2px solid #7c2d2d', width: 60, margin: '16px auto' }} />
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: '#5c5550', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
        The challenges appear on this page the moment the hunt opens. Keep it loaded and stay close.
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9a928a', marginTop: 14, letterSpacing: 1 }}>
        SCREENS FREEZE {fmtHM(REAL_END)} SHARP
      </div>
    </div>
  )
}

// ── The game ─────────────────────────────────────────────────────────────────
// env='live' gates on the `started` flag written from the /cpht console and on
// the real 19:00 freeze. env='test' is always open and freezes only on demand.
export default function HuntGame({
  env,
  adminPanel,
  testFrozen = false,
}: {
  env: Env
  adminPanel?: React.ReactNode
  testFrozen?: boolean
}) {
  const [tab, setTab] = useState<string>(adminPanel ? 'admin' : 'rules')
  const [mode, setMode] = useState<Mode | null>(null)
  const [started, setStarted] = useState<string | null>(null)
  const [cfgLoaded, setCfgLoaded] = useState(false)
  const [clockFrozen, setClockFrozen] = useState(isFrozenNow())

  useEffect(() => {
    let alive = true
    const load = () => {
      readConfig(env).then(cfg => {
        if (!alive) return
        const m = cfg.mode
        setMode(m === 'pairs' || m === 'trios' ? m : null)
        setStarted(cfg.started || null)
        setCfgLoaded(true)
      })
    }
    load()
    // Live players poll so the hunt opens on their phone without a refresh
    const id = setInterval(load, env === 'live' ? 15_000 : 30_000)
    return () => { alive = false; clearInterval(id) }
  }, [env])

  useEffect(() => {
    const id = setInterval(() => setClockFrozen(isFrozenNow()), 30_000)
    return () => clearInterval(id)
  }, [])

  const chooseMode = (m: Mode) => {
    setMode(m)
    setTab('rules')
    writeConfig(env, 'mode', m)
  }

  const teams = mode ? MODES[mode].teams : []
  const frozen = env === 'test' ? testFrozen : clockFrozen
  const open = env === 'test' ? true : !!started

  const tabs = [
    ...(adminPanel ? [{ key: 'admin', label: 'Console', accent: '#7c2d2d' }] : []),
    { key: 'rules', label: 'Rules', accent: '#7c2d2d' },
    ...teams.map((t, i) => ({ key: `team${i}`, label: t.tab, accent: t.accent })),
  ]

  const showTabs = adminPanel ? true : open && mode !== null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#f5f1ea', color: '#2a2522' }}>
      {env === 'test' && (
        <div style={{ background: '#8a6d2f', color: '#faf8f4', textAlign: 'center', padding: '4px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>
          TEST ENVIRONMENT · SCORES ARE SANDBOXED
        </div>
      )}
      <div style={{ borderBottom: '1px solid #d8d0c8', background: '#faf8f4' }}>
        <div style={{ textAlign: 'center', padding: '12px 16px 4px' }}>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#2a2522', letterSpacing: 1, margin: 0, lineHeight: 1.1 }}>
            The Copenhagen Scavenger Hunt
          </h1>
          <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 10, fontStyle: 'italic', color: '#9a928a', marginTop: 2, marginBottom: 6 }}>
            København · {mode ? MODES[mode].label : 'Six Hunters'} · freezes {fmtHM(REAL_END)}
          </div>
        </div>
        {showTabs && (
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
        {!cfgLoaded && (
          <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 11, fontStyle: 'italic', color: '#9a928a' }}>
            Loading…
          </div>
        )}

        {cfgLoaded && tab === 'admin' && adminPanel}

        {cfgLoaded && tab !== 'admin' && !open && <WaitingScreen />}

        {cfgLoaded && tab !== 'admin' && open && mode === null && <StartScreen onChoose={chooseMode} />}

        {cfgLoaded && tab !== 'admin' && open && mode !== null && tab === 'rules' && (
          <RulesPage teams={teams} modeLabel={MODES[mode].label} />
        )}

        {cfgLoaded && tab !== 'admin' && open && mode !== null && teams.map((t, i) => (
          tab === `team${i}`
            ? <TeamCard key={`${env}-${mode}-${t.storageKey}`} team={t} allTeams={teams} env={env} frozen={frozen} />
            : null
        ))}
      </div>
    </div>
  )
}
