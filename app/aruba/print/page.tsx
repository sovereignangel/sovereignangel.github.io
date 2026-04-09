import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Aruba Scavenger Hunt — Print',
  description: 'Printable challenge sheets',
}

const TEAMS = [
  { name: 'BIRTHDAY VIBES', accent: '#8a6d2f', members: ['Imgesu', 'Dave'] },
  { name: 'WBURG HIPSTERS', accent: '#7c2d2d', members: ['Aidas', 'Lori'] },
  { name: 'TRIPLE THREAT', accent: '#2d4a6f', members: ['Alyssa', 'Rodrigo', 'Alberto'] },
]

const CHALLENGES = [
  {
    category: 'Ocean & Water',
    items: [
      { id: 1, text: 'Full team ocean submersion at the same time — everyone under', pts: 5, proof: 'photo' },
      { id: 2, text: 'One teammate paddles the SUP board 50m out and back without falling', pts: 15, proof: 'video' },
      { id: 3, text: 'Kayak relay — every teammate kayaks from the point rock formation to the left rock wall on the property. Must all complete the route.', pts: 15, proof: 'video' },
      { id: 4, text: 'Goggle swim race: two teammates race from the rock formation on the right of the property to the point rock formation. Loser does 10 pushups.', pts: 15, proof: 'video' },
      { id: 5, text: 'Catch anything alive in the water (crab, fish, anything) and release it', pts: 20, proof: 'video' },
      { id: 6, text: 'Underwater handshake — all team members submerge and shake hands with goggles on', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Pool',
    items: [
      { id: 7, text: 'Biggest cannonball splash — judged by group applause. Winning splash gets +10 bonus pts.', pts: 10, proof: 'video' },
      { id: 8, text: 'Longest underwater breath hold — timed on video', pts: 15, proof: 'video' },
      { id: 9, text: 'Pool relay: swim a full lap and tag your teammate. Fastest team gets bonus 5 pts.', pts: 10, proof: 'video' },
      { id: 10, text: 'Underwater dance move with goggles — filmed from above', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Physical & Endurance',
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
    category: 'Creative & Performance',
    items: [
      { id: 19, text: 'KOKOMO DANCE-OFF: Choreograph a team dance routine to "Kokomo" by The Beach Boys. Carlos (concierge) judges all teams. Winner gets 25 bonus pts.', pts: 20, proof: 'video + Carlos verdict' },
      { id: 20, text: "Write and perform a 30-second team anthem. Must include all teammates' names.", pts: 15, proof: 'video' },
      { id: 21, text: 'Recreate a famous movie scene using only beach props + kimonos', pts: 15, proof: 'video' },
      { id: 22, text: 'Kimono fashion show — style each teammate differently. Walk the runway.', pts: 15, proof: 'video' },
      { id: 23, text: 'Draw a portrait of someone from another team in the sand (must be recognizable)', pts: 10, proof: 'photo' },
      { id: 24, text: 'Sunset yoga pose — most creative group silhouette against the sunset', pts: 10, proof: 'photo' },
      { id: 25, text: 'One teammate impersonates someone else on the trip. Others must guess who.', pts: 10, proof: 'video' },
      { id: 27, text: 'Kite hat + sunglasses + kimono — most absurd outfit, modeled with a straight face', pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'Brain & Puzzle',
    items: [
      { id: 28, text: 'Long division by hand on a piece of paper, filmed on camera, no calculator: 7,463 ÷ 17 (to 2 decimal places)', pts: 15, proof: 'video' },
      { id: 29, text: 'Multiply by hand on a piece of paper, filmed on camera: 847 × 293. Show all work.', pts: 15, proof: 'video' },
      { id: 30, text: 'Convert 7/13 to a decimal by hand on a piece of paper, filmed — at least 4 decimal places', pts: 20, proof: 'video' },
      { id: 31, text: 'Calculate the square root of 1,849 by hand on a piece of paper, filmed. Show your method.', pts: 20, proof: 'video' },
      { id: 32, text: 'Name 15 countries in 30 seconds — filmed, no repeats', pts: 10, proof: 'video' },
      { id: 33, text: 'Identify 3 plants or trees near the house by name (Google for verification only)', pts: 10, proof: 'photo + names' },
      { id: 34, text: 'Board game speed round — play and finish one full round in 15 min or less', pts: 10, proof: 'video' },
      { id: 66, text: 'Each team creates a nickname for every person on the trip. Write them on paper and present to the group.', pts: 15, proof: 'photo + video' },
      { id: 67, text: "Pick a book from the house. Have Carlos pick his favorite — photo with Carlos holding the book.", pts: 10, proof: 'photo' },
    ],
  },
  {
    category: 'The Riddle',
    items: [
      { id: 36, text: 'Solve this riddle. First team to submit the correct answer to the WhatsApp group wins 30 pts. All others get 0.\n\n"I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?"', pts: 30, proof: 'written answer' },
    ],
  },
  {
    category: 'Find These Things',
    items: [
      { id: 37, text: 'Team photo with a divi-divi tree', pts: 30, proof: 'photo' },
      { id: 38, text: "Something that floats that isn't wood", pts: 5, proof: 'photo' },
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
    category: 'Locals & Culture',
    items: [
      { id: 47, text: 'Learn a phrase in Papiamento from a local and say it on camera', pts: 10, proof: 'video' },
      { id: 48, text: 'Get a local to teach you a dance move — perform it together on camera', pts: 15, proof: 'video' },
      { id: 49, text: 'Take a photo with a local and learn their name and one fact about them', pts: 10, proof: 'photo + fact' },
      { id: 50, text: 'Find out the name of the nearest neighborhood or landmark from a local (not Google)', pts: 10, proof: 'video' },
      { id: 51, text: "Get a local's restaurant recommendation — write it down for the group", pts: 10, proof: 'written' },
    ],
  },
  {
    category: 'Consumption',
    items: [
      { id: 52, text: 'Entire team takes a shot simultaneously — must cheers to the birthday person first', pts: 5, proof: 'video' },
      { id: 53, text: 'One teammate shotguns a beer (or chugs a full drink of choice)', pts: 10, proof: 'video' },
      { id: 54, text: "Make a cocktail from whatever's in the kitchen — name it after your team. Everyone drinks.", pts: 15, proof: 'video' },
      { id: 55, text: 'One teammate eats something spicy (hot sauce, pepper, anything) — reaction on camera', pts: 10, proof: 'video' },
      { id: 56, text: 'Entire team finishes a drink together — last one done does 10 pushups', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Birthday & Personal',
    items: [
      { id: 57, text: 'Serenade the birthday person with a birthday song — must include their name at least 3 times', pts: 10, proof: 'video' },
      { id: 58, text: 'One teammate DJs a 60-second set using only mouth sounds. Rest of team dances.', pts: 15, proof: 'video' },
      { id: 59, text: 'One teammate creates a vegan snack from kitchen ingredients — team rates it 1-10', pts: 15, proof: 'video' },
      { id: 60, text: 'One teammate delivers a 30-second brutally honest review of the sunset', pts: 10, proof: 'video' },
      { id: 61, text: 'Stack 10 household items into a tower in under 2 minutes', pts: 10, proof: 'video' },
      { id: 62, text: 'Team photo where everyone is mid-air (jumping)', pts: 10, proof: 'photo' },
      { id: 63, text: 'Compose a haiku about the destination and recite it dramatically at sunset', pts: 10, proof: 'video' },
    ],
  },
  {
    category: 'Explore the Town',
    items: [
      { id: 68, text: 'Team photo in front of 3 different named buildings — all three in one submission', pts: 15, proof: 'photo' },
      { id: 69, text: 'Video of a cartwheel in front of a local landmark', pts: 10, proof: 'video' },
      { id: 70, text: 'Photo of you jumping into the ocean at a scenic spot', pts: 15, proof: 'photo' },
      { id: 71, text: 'Funniest/most creative photo in front of a local business. Winning team gets +10 bonus pts — group votes.', pts: 10, proof: 'photo' },
      { id: 72, text: 'Cartwheel in front of another local business', pts: 10, proof: 'video' },
      { id: 73, text: 'Team photo in front of local art', pts: 10, proof: 'photo' },
    ],
  },
]

const totalPossible = CHALLENGES.reduce((s, c) => s + c.items.reduce((a, i) => a + i.pts, 0), 0)

export default function ArubaPrint() {
  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      fontFamily: "'Crimson Pro', Georgia, serif",
      color: '#2a2522',
      background: '#fff',
      padding: '24px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,500&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        @media print {
          body { margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
        }
        @page { margin: 0.5in; }
      `}</style>

      {/* ── PAGE 1: Rules ── */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 2, margin: '0 0 4px', textTransform: 'uppercase' }}>
          The Aruba Scavenger Hunt
        </h1>
        <div style={{ fontSize: 12, fontStyle: 'italic', color: '#9a928a' }}>
          Savaneta Beach &middot; 18:45–20:45
        </div>
        <div style={{ borderBottom: '2px solid #7c2d2d', margin: '12px auto', width: 60 }} />
      </div>

      <Section title="The Format">
        <P>2 hours. 63 challenges. 3 teams. One winner. Total possible: <Mono>{totalPossible} pts</Mono></P>
        <P>At <Mono>20:45</Mono> sharp, all teams return. Late arrivals lose <Mono>5 pts/min</Mono>. Scores tallied. Proof reviewed. Champions crowned.</P>
      </Section>

      <Section title="The Teams">
        {TEAMS.map(t => (
          <div key={t.name} style={{ borderLeft: `3px solid ${t.accent}`, padding: '4px 12px', marginBottom: 4, background: `${t.accent}08` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>{t.name}</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#5c5550', marginLeft: 8 }}>{t.members.join(' & ')}</span>
          </div>
        ))}
      </Section>

      <Section title="Rules of Engagement">
        {[
          'Complete challenges in any order. Strategy is encouraged.',
          "Team members can execute challenges independently — you don't all need to be together for every task.",
          'Proof required as marked — photo, video, screenshot, or written. No proof, no points.',
          'All running challenges require smartwatch tracking (Garmin, Apple Watch, etc.).',
          'SUP, kayak, and goggles are shared resources. First come, first served.',
          'Stay within walking/running distance. No vehicles (except for supply runs).',
          'Disputes? Birthday person is the final arbiter.',
          'Submit all proof to the group chat. Timestamp is your receipt.',
          'Bonus votes at 20:45: "Most Creative Proof" (+10) and "Best Team Spirit" (+10).',
          'Dance-offs will be judged by the concierge. Their decision is final.',
        ].map((rule, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#7c2d2d', fontSize: 11, minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: '#5c5550', lineHeight: 1.4 }}>{rule}</span>
          </div>
        ))}
      </Section>

      <Section title="Shared Equipment">
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#5c5550', lineHeight: 1.6 }}>
          1 kayak · 1 SUP · 2 goggles · speakers · board games · kimonos · kite hats · sunglasses · kitchen scale
        </div>
      </Section>

      {/* ── CHALLENGE SHEETS (one per team) ── */}
      {TEAMS.map((team, ti) => (
        <div key={team.name} className="page-break">
          <div style={{ textAlign: 'center', marginBottom: 16, paddingTop: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: team.accent, letterSpacing: 2, margin: '0 0 2px', textTransform: 'uppercase' }}>
              {team.name}
            </h2>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#5c5550' }}>
              {team.members.join(' & ')}
            </div>
            <div style={{ borderBottom: `2px solid ${team.accent}`, margin: '8px auto', width: 40 }} />
          </div>

          {CHALLENGES.map(cat => (
            <div key={cat.category} className="no-break" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: team.accent, borderBottom: `1px solid ${team.accent}40`, paddingBottom: 2, marginBottom: 4 }}>
                {cat.category}
              </div>
              {cat.items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 6, marginBottom: 3, paddingLeft: 2 }}>
                  <div style={{
                    width: 13, height: 13, minWidth: 13, marginTop: 2,
                    border: `1.5px solid ${team.accent}60`, borderRadius: 2,
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: 1.3, color: '#2a2522', whiteSpace: 'pre-line' }}>{item.text}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#9a928a', marginLeft: 6 }}>
                      {item.pts}pts · {item.proof}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div style={{ borderTop: `2px solid ${team.accent}`, marginTop: 12, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#9a928a' }}>
              Total: _____ / {totalPossible} pts
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#9a928a' }}>
              Challenges: _____ / {CHALLENGES.reduce((s, c) => s + c.items.length, 0)}
            </span>
          </div>
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: 24, fontStyle: 'italic', color: '#9a928a', fontSize: 11 }}>
        Clarity in complexity. Confidence in conviction.
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 3, color: '#2a2522', marginBottom: 4, marginTop: 0 }}>
        {title}
      </h2>
      {children}
      <div style={{ borderBottom: '1px solid #d8d0c8', margin: '10px 0' }} />
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, lineHeight: 1.5, color: '#5c5550', margin: '0 0 4px' }}>{children}</p>
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: '#2a2522' }}>{children}</span>
}
