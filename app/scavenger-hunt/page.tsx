'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface HuntEntry {
  id: string; description: string; createdAt: string; date: string; pointsValue: number; redeemed: boolean
}
interface Redemption {
  id: string; pointsRedeemed: number; description: string; createdAt: string; date: string
}

const GAME_DOC = 'aruba_2026'
const ARUBA_DATES = ['2026-03-22','2026-03-23','2026-03-24','2026-03-25','2026-03-26','2026-03-27','2026-03-28']
const DAY_LABELS = ['D1','D2','D3','D4','D5','D6','D7']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function getTodayAruba() {
  const now = new Date()
  const aruba = new Date(now.getTime() - 4 * 60 * 60 * 1000)
  return aruba.toISOString().slice(0, 10)
}

type Theme = 'A' | 'B' | 'C' | 'D'

interface GameData {
  entries: HuntEntry[]
  redemptions: Redemption[]
  totalPoints: number
  available: number
  totalRedeemed: number
  streak: number
  todayEntries: HuntEntry[]
  entriesByDay: Record<string, HuntEntry[]>
  selectedDay: string
  today: string
  setActiveDay: (d: string) => void
  showConfetti: boolean
}

export default function ScavengerHuntPage() {
  const [entries, setEntries] = useState<HuntEntry[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [prevCount, setPrevCount] = useState(0)
  const [theme, setTheme] = useState<Theme>('A')

  useEffect(() => {
    const gameRef = doc(db, 'scavenger_hunt', GAME_DOC)
    const q1 = query(collection(gameRef, 'entries'), orderBy('createdAt', 'desc'))
    const q2 = query(collection(gameRef, 'redemptions'), orderBy('createdAt', 'desc'))
    const u1 = onSnapshot(q1, snap => setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as HuntEntry))))
    const u2 = onSnapshot(q2, snap => setRedemptions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Redemption))))
    return () => { u1(); u2() }
  }, [])

  useEffect(() => {
    if (entries.length > prevCount && prevCount > 0) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2500)
    }
    setPrevCount(entries.length)
  }, [entries.length, prevCount])

  const totalPoints = entries.length
  const totalRedeemed = redemptions.reduce((s, r) => s + r.pointsRedeemed, 0)
  const available = totalPoints - totalRedeemed

  const entriesByDay: Record<string, HuntEntry[]> = {}
  ARUBA_DATES.forEach(d => { entriesByDay[d] = [] })
  entries.forEach(e => { if (entriesByDay[e.date]) entriesByDay[e.date].push(e) })

  const today = getTodayAruba()
  const todayEntries = entriesByDay[today] || []

  let streak = 0
  for (const date of [...ARUBA_DATES].reverse()) {
    if (date > today) continue
    if ((entriesByDay[date] || []).length > 0) streak++
    else break
  }

  const selectedDay = activeDay || today

  const gameData: GameData = {
    entries, redemptions, totalPoints, available, totalRedeemed,
    streak, todayEntries, entriesByDay, selectedDay, today,
    setActiveDay, showConfetti,
  }

  return (
    <div className="relative h-screen overflow-hidden select-none">
      {theme === 'A' && <ThemeA {...gameData} />}
      {theme === 'B' && <ThemeB {...gameData} />}
      {theme === 'C' && <ThemeC {...gameData} />}
      {theme === 'D' && <ThemeD {...gameData} />}

      {/* Floating theme switcher */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5">
        {(['A','B','C','D'] as Theme[]).map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`w-8 h-8 rounded-full text-[11px] font-black transition-all ${
              theme === t ? 'bg-white text-black scale-110' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-1 flex items-center text-[9px] text-white/40 font-medium">STYLE</div>
      </div>
    </div>
  )
}

// ─── THEME A: BANANAPALOOZA ───────────────────────────────────────────────────
// Duolingo × Popmart. Bright chartreuse, chunky outlined type, bubble characters.
function ThemeA(props: GameData) {
  const { totalPoints, available, totalRedeemed, streak, todayEntries,
    entriesByDay, selectedDay, today, setActiveDay, showConfetti } = props

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #7DC52E 0%, #4A9C1A 100%)' }}>
      {showConfetti && <Confetti />}

      {/* ── HEADER: title + characters ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        {/* Title block */}
        <div className="text-center mb-3">
          <div className="inline-block relative">
            <div
              className="text-[11px] font-black uppercase tracking-[3px] text-white/80 mb-0"
              style={{ textShadow: '0 1px 0 rgba(0,0,0,0.3)' }}
            >
              🌴 Lori and Aidas Take Aruba 🌴
            </div>
            <div
              className="text-[38px] leading-none font-black text-white"
              style={{
                fontFamily: "'Arial Black', 'Arial Bold', sans-serif",
                WebkitTextStroke: '3px #1a5c00',
                textShadow: '4px 4px 0 #1a5c00, 2px 2px 0 #1a5c00',
                letterSpacing: '-1px',
              }}
            >
              SCAVENGER
            </div>
            <div
              className="text-[38px] leading-none font-black"
              style={{
                fontFamily: "'Arial Black', 'Arial Bold', sans-serif",
                WebkitTextStroke: '3px #7c4800',
                color: '#FFD700',
                textShadow: '4px 4px 0 #7c4800, 2px 2px 0 #7c4800',
                letterSpacing: '-1px',
              }}
            >
              HUNT 🍌
            </div>
          </div>
        </div>

        {/* Character duo */}
        <div className="flex items-end justify-between px-2 -mt-1">
          {/* Aidas */}
          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-[20px] border-[3px] border-[#1a5c00] overflow-hidden bg-[#c8f07a] flex items-center justify-center relative"
              style={{ boxShadow: '3px 3px 0 #1a5c00' }}
            >
              <img src="/characters/aidas.png" alt="Aidas" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ display: 'none' }}>
                <span className="text-[36px]">🕵️</span>
              </div>
              <div className="text-[40px] flex items-center justify-center w-full h-full">🕵️</div>
            </div>
            <div className="mt-1 bg-white rounded-full px-2 py-0.5 border-2 border-[#1a5c00]" style={{ boxShadow: '2px 2px 0 #1a5c00' }}>
              <span className="text-[10px] font-black text-[#1a5c00]">AIDAS</span>
            </div>
          </div>

          {/* Score bubble */}
          <div className="flex flex-col items-center">
            <div
              className="w-24 h-24 rounded-full bg-[#FFD700] border-[4px] border-[#7c4800] flex flex-col items-center justify-center"
              style={{ boxShadow: '4px 4px 0 #7c4800' }}
            >
              <div className="text-[10px] font-black text-[#7c4800] uppercase leading-none">Bananas</div>
              <div className="text-[42px] font-black text-[#7c4800] leading-none">{totalPoints}</div>
              <div className="text-[9px] font-bold text-[#7c4800]">{available} min left</div>
            </div>
          </div>

          {/* Lori */}
          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-[20px] border-[3px] border-[#7c4800] overflow-hidden bg-[#FFE0B2] flex items-center justify-center"
              style={{ boxShadow: '3px 3px 0 #7c4800' }}
            >
              <div className="text-[40px] flex items-center justify-center w-full h-full">👸</div>
            </div>
            <div className="mt-1 bg-white rounded-full px-2 py-0.5 border-2 border-[#7c4800]" style={{ boxShadow: '2px 2px 0 #7c4800' }}>
              <span className="text-[10px] font-black text-[#7c4800]">LORI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="flex-shrink-0 px-4 py-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: '🔥', val: streak, label: 'Streak' },
            { emoji: '📅', val: todayEntries.length, label: 'Today' },
            { emoji: '🎁', val: totalRedeemed, label: 'Redeemed' },
          ].map(s => (
            <div key={s.label} className="bg-white/20 rounded-[12px] py-1.5 text-center border-2 border-white/30" style={{ boxShadow: '0 2px 0 rgba(0,0,0,0.2)' }}>
              <div className="text-[18px] leading-none">{s.emoji}</div>
              <div className="text-[20px] font-black text-white leading-none">{s.val}</div>
              <div className="text-[9px] font-bold text-white/80 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DAY PILLS ── */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {ARUBA_DATES.map((date, i) => {
            const count = (entriesByDay[date] || []).length
            const isToday = date === today
            const isSel = date === selectedDay
            const isFuture = date > today
            const d = new Date(date + 'T12:00:00')
            return (
              <button key={date} onClick={() => setActiveDay(date)} disabled={isFuture}
                className={`flex-shrink-0 rounded-[10px] px-3 py-1.5 text-center transition-all border-2 ${
                  isSel ? 'bg-[#FFD700] border-[#7c4800] scale-105' :
                  isFuture ? 'bg-white/10 border-white/10' :
                  'bg-white/20 border-white/20 hover:bg-white/30'
                }`}
                style={isSel ? { boxShadow: '2px 2px 0 #7c4800' } : {}}
              >
                <div className={`text-[9px] font-black uppercase ${isSel ? 'text-[#7c4800]' : isFuture ? 'text-white/30' : 'text-white'}`}>{DAY_LABELS[i]}</div>
                <div className={`text-[15px] font-black leading-none ${isSel ? 'text-[#7c4800]' : isFuture ? 'text-white/30' : 'text-white'}`}>{count || (isFuture ? '·' : '0')}</div>
                <div className={`text-[9px] ${isSel ? 'text-[#7c4800]' : isFuture ? 'text-white/20' : 'text-white/60'}`}>{DAY_NAMES[d.getDay()]}</div>
                {isToday && !isSel && <div className="text-[7px] font-black text-[#FFD700]">NOW</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── FINDS FEED ── */}
      <div className="flex-1 mx-4 mb-16 bg-white/15 rounded-[16px] border-2 border-white/30 overflow-hidden flex flex-col" style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-4 py-2 border-b-2 border-white/20 flex-shrink-0">
          <span className="text-[12px] font-black text-white uppercase">
            {(() => { const d = new Date(selectedDay + 'T12:00:00'); return `${DAY_NAMES[d.getDay()]} ${d.getDate()} · ${(entriesByDay[selectedDay]||[]).length} finds` })()}
          </span>
          <span className="text-[18px]">🍌</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(entriesByDay[selectedDay] || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <div className="text-[48px] mb-2">🔍</div>
              <p className="text-[14px] font-black text-white">{selectedDay > today ? 'Not yet!' : selectedDay === today ? 'Go find something!' : 'Nothing this day'}</p>
              {selectedDay === today && <p className="text-[11px] text-white/60 mt-1">/sh &lt;what you found&gt;</p>}
            </div>
          ) : (
            <div>
              {(entriesByDay[selectedDay] || []).map((e, i) => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-white/10">
                  <span className="text-[20px] flex-shrink-0">🍌</span>
                  <p className="flex-1 text-[13px] text-white font-semibold leading-snug">{e.description}</p>
                  <span className="text-[10px] font-black text-[#FFD700] flex-shrink-0 mt-0.5">{formatTime(e.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── THEME B: ARUBA SQUAD ────────────────────────────────────────────────────
// Brawl Stars × Beach Night. Dark navy, neon glow, metallic accents.
function ThemeB(props: GameData) {
  const { totalPoints, available, totalRedeemed, streak, todayEntries,
    entriesByDay, selectedDay, today, setActiveDay, showConfetti } = props

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1A2744 50%, #0D2B1A 100%)' }}>
      {showConfetti && <Confetti />}

      {/* Neon top bar */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(90deg, #FF6B35, #FFD700, #FF6B35)', height: '3px' }} />

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        {/* Title */}
        <div className="text-center mb-3">
          <div className="text-[10px] font-bold tracking-[4px] uppercase mb-1" style={{ color: '#FFD700', textShadow: '0 0 10px #FFD70088' }}>
            LORI AND AIDAS TAKE ARUBA
          </div>
          <div
            className="text-[40px] font-black leading-none tracking-tight"
            style={{
              fontFamily: "'Arial Black', sans-serif",
              background: 'linear-gradient(180deg, #FFD700 0%, #FF8C00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.5))',
            }}
          >
            SCAVENGER HUNT
          </div>
          <div style={{ color: '#58CC02', textShadow: '0 0 8px #58CC0288' }} className="text-[11px] font-bold tracking-widest">
            ★ MARCH 22 – 28 · ARUBA ★
          </div>
        </div>

        {/* Characters + score */}
        <div className="flex items-stretch gap-2">
          {/* Aidas card */}
          <div
            className="flex-1 rounded-[14px] p-2 flex flex-col items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #1E3A2F, #0D2B1A)', border: '2px solid #58CC02', boxShadow: '0 0 16px rgba(88,204,2,0.3), inset 0 0 8px rgba(88,204,2,0.05)' }}
          >
            <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#0D2B1A] border border-[#58CC02]/50 flex items-center justify-center">
              <span className="text-[32px]">🕵️</span>
            </div>
            <div>
              <div className="text-[9px] font-black tracking-wider text-center" style={{ color: '#58CC02' }}>AIDAS</div>
              <div className="text-[8px] text-center" style={{ color: '#58CC0288' }}>THE HUNTER</div>
            </div>
          </div>

          {/* Central score */}
          <div
            className="flex-[1.5] rounded-[14px] p-3 flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2A1A00, #3A2800)', border: '2px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.4)' }}
          >
            <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#FFD700' }}>Total</div>
            <div className="text-[52px] font-black leading-none" style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.8)' }}>{totalPoints}</div>
            <div className="text-[10px] font-bold" style={{ color: '#FFD70088' }}>🍌 bananas</div>
            <div className="mt-1 rounded-full px-2 py-0.5" style={{ background: '#58CC0220', border: '1px solid #58CC02' }}>
              <span className="text-[9px] font-black" style={{ color: '#58CC02' }}>{available} MIN AVAIL</span>
            </div>
          </div>

          {/* Lori card */}
          <div
            className="flex-1 rounded-[14px] p-2 flex flex-col items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #2A1500, #1A0D00)', border: '2px solid #FF6B35', boxShadow: '0 0 16px rgba(255,107,53,0.3)' }}
          >
            <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#1A0D00] border border-[#FF6B35]/50 flex items-center justify-center">
              <span className="text-[32px]">👸</span>
            </div>
            <div>
              <div className="text-[9px] font-black tracking-wider text-center" style={{ color: '#FF6B35' }}>LORI</div>
              <div className="text-[8px] text-center" style={{ color: '#FF6B3588' }}>THE PRIZE</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="flex-shrink-0 px-4 py-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '🔥', val: streak, label: 'STREAK', color: '#FF6B35' },
            { icon: '📅', val: todayEntries.length, label: 'TODAY', color: '#58CC02' },
            { icon: '🎁', val: totalRedeemed, label: 'SPENT', color: '#CE82FF' },
          ].map(s => (
            <div key={s.label} className="rounded-[10px] py-2 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${s.color}44` }}>
              <div className="text-[14px]">{s.icon}</div>
              <div className="text-[22px] font-black leading-none" style={{ color: s.color, textShadow: `0 0 10px ${s.color}66` }}>{s.val}</div>
              <div className="text-[8px] font-bold tracking-wider" style={{ color: `${s.color}88` }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DAY SELECTOR ── */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {ARUBA_DATES.map((date, i) => {
            const count = (entriesByDay[date] || []).length
            const isSel = date === selectedDay
            const isFuture = date > today
            const isToday = date === today
            const d = new Date(date + 'T12:00:00')
            return (
              <button key={date} onClick={() => setActiveDay(date)} disabled={isFuture}
                className="flex-shrink-0 rounded-[10px] px-3 py-1.5 text-center transition-all"
                style={{
                  background: isSel ? 'linear-gradient(135deg, #FFD700, #FF8C00)' : isFuture ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                  border: isSel ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.1)',
                  boxShadow: isSel ? '0 0 12px rgba(255,215,0,0.4)' : 'none',
                }}
              >
                <div className={`text-[9px] font-black ${isSel ? 'text-[#0D1B2A]' : isFuture ? 'text-white/20' : 'text-white/50'}`}>{DAY_LABELS[i]}</div>
                <div className={`text-[16px] font-black leading-none ${isSel ? 'text-[#0D1B2A]' : isFuture ? 'text-white/20' : 'text-white'}`}>{count || (isFuture ? '·' : '0')}</div>
                <div className={`text-[8px] ${isSel ? 'text-[#0D1B2A]/70' : isFuture ? 'text-white/15' : 'text-white/40'}`}>{DAY_NAMES[d.getDay()]}</div>
                {isToday && <div className="text-[7px] font-black" style={{ color: '#58CC02' }}>NOW</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── FEED ── */}
      <div className="flex-1 mx-4 mb-16 rounded-[16px] overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[11px] font-black tracking-wider" style={{ color: '#FFD700' }}>
            {(() => { const d = new Date(selectedDay + 'T12:00:00'); return `${DAY_NAMES[d.getDay()].toUpperCase()} ${d.getDate()} — ${(entriesByDay[selectedDay]||[]).length} FINDS` })()}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(entriesByDay[selectedDay] || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-6">
              <div className="text-[40px] mb-2" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }}>🔍</div>
              <p className="text-[13px] font-bold text-white/40">{selectedDay > today ? 'Coming soon' : 'Nothing yet'}</p>
            </div>
          ) : (
            (entriesByDay[selectedDay] || []).map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[18px] flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.6))' }}>🍌</span>
                <p className="flex-1 text-[12px] text-white/80 font-medium leading-snug">{e.description}</p>
                <span className="text-[9px] font-bold flex-shrink-0 mt-0.5" style={{ color: '#FFD70066' }}>{formatTime(e.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── THEME C: CARTOON SATURDAY ───────────────────────────────────────────────
// Classic Saturday morning cartoon. White + primary colors, thick black outlines, comic panels.
function ThemeC(props: GameData) {
  const { totalPoints, available, totalRedeemed, streak, todayEntries,
    entriesByDay, selectedDay, today, setActiveDay, showConfetti } = props

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#FFF8E7]">
      {showConfetti && <Confetti />}

      {/* ── TITLE CARD ── */}
      <div className="flex-shrink-0" style={{ background: '#FF3B30', borderBottom: '4px solid #000' }}>
        <div className="px-4 pt-3 pb-2 text-center">
          <div className="text-[10px] font-black tracking-[3px] text-white/80 uppercase">EPISODE 1 · ARUBA</div>
          <div
            className="text-[32px] font-black leading-none text-white"
            style={{
              fontFamily: "'Arial Black', sans-serif",
              WebkitTextStroke: '2px #000',
              textShadow: '3px 3px 0 #000',
              letterSpacing: '-1px',
            }}
          >
            SCAVENGER HUNT
          </div>
          <div className="text-[12px] font-black text-[#FFD700]" style={{ WebkitTextStroke: '0.5px #000', textShadow: '1px 1px 0 #000' }}>
            LORI AND AIDAS TAKE ARUBA
          </div>
        </div>
      </div>

      {/* ── COMIC PANEL: characters + score ── */}
      <div className="flex-shrink-0 flex" style={{ borderBottom: '4px solid #000' }}>
        {/* Aidas panel */}
        <div className="flex-1 bg-[#DCEEFF] p-3 flex flex-col items-center justify-center" style={{ borderRight: '3px solid #000' }}>
          <div className="w-16 h-16 rounded-full bg-[#A8D8FF] flex items-center justify-center" style={{ border: '3px solid #000', boxShadow: '3px 3px 0 #000' }}>
            <span className="text-[34px]">🕵️</span>
          </div>
          <div className="mt-1 bg-white rounded-sm px-2 py-0.5" style={{ border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>
            <span className="text-[10px] font-black">AIDAS</span>
          </div>
          <div className="text-[8px] font-bold text-[#1a6fbf] mt-0.5 uppercase tracking-wide">Banana Collector</div>
        </div>

        {/* Score panel — center */}
        <div className="flex-[1.2] bg-[#FFFDE7] p-3 flex flex-col items-center justify-center" style={{ borderRight: '3px solid #000' }}>
          {/* Speech bubble */}
          <div className="bg-white rounded-[12px] px-4 py-2 mb-1 relative" style={{ border: '3px solid #000', boxShadow: '3px 3px 0 #000' }}>
            <div className="text-[10px] font-black text-center text-black uppercase tracking-wide">Score</div>
            <div className="text-[48px] font-black leading-none text-center" style={{ fontFamily: "'Arial Black', sans-serif", WebkitTextStroke: '1px #000' }}>{totalPoints}</div>
            <div className="text-[9px] font-black text-center">🍌 BANANAS</div>
            {/* bubble tail */}
            <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #000' }} />
          </div>
          <div className="mt-2 bg-[#FFD700] rounded-sm px-3 py-0.5" style={{ border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>
            <span className="text-[10px] font-black">{available} MIN AVAIL</span>
          </div>
        </div>

        {/* Lori panel */}
        <div className="flex-1 bg-[#FFE8F5] p-3 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#FFBDE8] flex items-center justify-center" style={{ border: '3px solid #000', boxShadow: '3px 3px 0 #000' }}>
            <span className="text-[34px]">👸</span>
          </div>
          <div className="mt-1 bg-white rounded-sm px-2 py-0.5" style={{ border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>
            <span className="text-[10px] font-black">LORI</span>
          </div>
          <div className="text-[8px] font-bold text-[#bf1a6f] mt-0.5 uppercase tracking-wide">The Prize</div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="flex-shrink-0 flex" style={{ borderBottom: '3px solid #000', background: '#FFD700' }}>
        {[
          { icon: '🔥', val: streak, label: 'STREAK', bg: '#FF6B00' },
          { icon: '📅', val: todayEntries.length, label: 'TODAY', bg: '#58CC02' },
          { icon: '🎁', val: totalRedeemed, label: 'SPENT', bg: '#CE82FF' },
        ].map((s, i) => (
          <div key={s.label} className="flex-1 py-2 flex flex-col items-center justify-center"
            style={{ background: s.bg, borderRight: i < 2 ? '3px solid #000' : 'none' }}>
            <div className="text-[16px] leading-none">{s.icon}</div>
            <div className="text-[22px] font-black leading-none text-white" style={{ WebkitTextStroke: '1px #000', textShadow: '2px 2px 0 #000' }}>{s.val}</div>
            <div className="text-[8px] font-black text-white uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── DAY PILLS ── */}
      <div className="flex-shrink-0 px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {ARUBA_DATES.map((date, i) => {
            const count = (entriesByDay[date] || []).length
            const isSel = date === selectedDay
            const isFuture = date > today
            const d = new Date(date + 'T12:00:00')
            return (
              <button key={date} onClick={() => setActiveDay(date)} disabled={isFuture}
                className="flex-shrink-0 rounded-[6px] px-2.5 py-1.5 text-center transition-all"
                style={{
                  background: isSel ? '#FF3B30' : isFuture ? '#eee' : '#fff',
                  border: `2px solid ${isSel ? '#000' : '#999'}`,
                  boxShadow: isSel ? '2px 2px 0 #000' : '1px 1px 0 #ccc',
                }}
              >
                <div className={`text-[9px] font-black ${isSel ? 'text-white' : isFuture ? 'text-gray-300' : 'text-gray-500'}`}>{DAY_LABELS[i]}</div>
                <div className={`text-[14px] font-black leading-none ${isSel ? 'text-white' : isFuture ? 'text-gray-300' : 'text-black'}`}>{count || (isFuture ? '·' : '0')}</div>
                <div className={`text-[8px] font-bold ${isSel ? 'text-white/80' : isFuture ? 'text-gray-300' : 'text-gray-400'}`}>{DAY_NAMES[d.getDay()]}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── FEED (comic panel) ── */}
      <div className="flex-1 mx-3 mb-16 rounded-[10px] overflow-hidden flex flex-col" style={{ border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
        <div className="px-3 py-1.5 flex-shrink-0" style={{ background: '#58CC02', borderBottom: '3px solid #000' }}>
          <span className="text-[11px] font-black text-white uppercase">
            {(() => { const d = new Date(selectedDay + 'T12:00:00'); return `${DAY_NAMES[d.getDay()]} March ${d.getDate()} — ${(entriesByDay[selectedDay]||[]).length} Finds` })()}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          {(entriesByDay[selectedDay] || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <div className="text-[40px]">🔍</div>
              <p className="text-[13px] font-black text-gray-400">{selectedDay > today ? 'NOT YET!' : 'GO FIND SOMETHING!'}</p>
            </div>
          ) : (
            (entriesByDay[selectedDay] || []).map((e, i) => (
              <div key={e.id} className="flex items-start gap-2 px-3 py-2" style={{ borderBottom: '2px dashed #eee' }}>
                <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ border: '2px solid #000' }}>
                  <span className="text-[10px] font-black">{i + 1}</span>
                </div>
                <p className="flex-1 text-[12px] font-bold text-black leading-snug">{e.description}</p>
                <span className="text-[9px] font-bold text-gray-400 flex-shrink-0">{formatTime(e.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── THEME D: ISLAND ADVENTURE ───────────────────────────────────────────────
// Animal Crossing × Club Med. Sunset sky, warm palette, adventure map vibes.
function ThemeD(props: GameData) {
  const { totalPoints, available, totalRedeemed, streak, todayEntries,
    entriesByDay, selectedDay, today, setActiveDay, showConfetti } = props

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(170deg, #FF9A5C 0%, #FFCA6B 35%, #3DB8A0 65%, #1A8A78 100%)' }}>
      {showConfetti && <Confetti />}

      {/* Decorative clouds */}
      <div className="absolute top-2 left-4 text-[32px] opacity-30 pointer-events-none">☁️</div>
      <div className="absolute top-4 right-8 text-[24px] opacity-20 pointer-events-none">☁️</div>

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 relative z-10">
        {/* Title */}
        <div className="text-center mb-3">
          <div
            className="inline-block bg-white/90 rounded-[16px] px-5 py-2 relative"
            style={{ border: '3px solid #7B3F00', boxShadow: '0 4px 0 #7B3F00' }}
          >
            <div className="text-[9px] font-black uppercase tracking-[2px] text-[#7B3F00] mb-0.5">🌴 Lori and Aidas Take Aruba 🌴</div>
            <div
              className="text-[28px] font-black leading-none text-[#7B3F00]"
              style={{ fontFamily: "'Arial Black', sans-serif", letterSpacing: '-0.5px' }}
            >
              SCAVENGER HUNT
            </div>
          </div>
        </div>

        {/* Characters + score */}
        <div className="flex items-end gap-2">
          {/* Aidas */}
          <div className="flex flex-col items-center">
            <div
              className="w-[72px] h-[72px] rounded-[18px] bg-[#C8F5D8] flex items-center justify-center"
              style={{ border: '3px solid #7B3F00', boxShadow: '3px 3px 0 #7B3F00' }}
            >
              <span className="text-[36px]">🕵️</span>
            </div>
            <div className="mt-1 bg-[#FFE08A] rounded-[8px] px-2 py-0.5" style={{ border: '2px solid #7B3F00', boxShadow: '1px 1px 0 #7B3F00' }}>
              <span className="text-[9px] font-black text-[#7B3F00]">AIDAS</span>
            </div>
          </div>

          {/* Score */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-[18px] bg-white/90 py-2 px-3 flex flex-col items-center"
              style={{ border: '3px solid #7B3F00', boxShadow: '0 4px 0 #7B3F00' }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[30px]">🍌</span>
                <div>
                  <div className="text-[40px] font-black leading-none text-[#7B3F00]">{totalPoints}</div>
                </div>
              </div>
              <div className="flex gap-3 text-[9px] font-black text-[#7B3F00]/60">
                <span>🎯 {available} min avail</span>
                <span>🎁 {totalRedeemed} spent</span>
              </div>
            </div>
          </div>

          {/* Lori */}
          <div className="flex flex-col items-center">
            <div
              className="w-[72px] h-[72px] rounded-[18px] bg-[#FFD6E8] flex items-center justify-center"
              style={{ border: '3px solid #7B3F00', boxShadow: '3px 3px 0 #7B3F00' }}
            >
              <span className="text-[36px]">👸</span>
            </div>
            <div className="mt-1 bg-[#FFB3CE] rounded-[8px] px-2 py-0.5" style={{ border: '2px solid #7B3F00', boxShadow: '1px 1px 0 #7B3F00' }}>
              <span className="text-[9px] font-black text-[#7B3F00]">LORI</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="flex-shrink-0 px-4 py-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '🔥', val: streak, label: 'Streak', bg: '#FF6B00', border: '#7B3F00' },
            { icon: '📅', val: todayEntries.length, label: 'Today', bg: '#58CC02', border: '#1a5c00' },
            { icon: '⭐', val: totalPoints, label: 'Total', bg: '#FFD700', border: '#7B3F00' },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] py-2 text-center"
              style={{ background: s.bg, border: `2px solid ${s.border}`, boxShadow: `0 3px 0 ${s.border}` }}>
              <div className="text-[16px]">{s.icon}</div>
              <div className="text-[22px] font-black leading-none text-white" style={{ textShadow: `0 2px 0 ${s.border}` }}>{s.val}</div>
              <div className="text-[8px] font-black text-white/80 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DAY MAP ── */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="bg-white/30 backdrop-blur-sm rounded-[14px] p-2" style={{ border: '2px solid rgba(123,63,0,0.3)' }}>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide items-center">
            {ARUBA_DATES.map((date, i) => {
              const count = (entriesByDay[date] || []).length
              const isSel = date === selectedDay
              const isFuture = date > today
              const isPast = date < today
              const d = new Date(date + 'T12:00:00')
              return (
                <div key={date} className="flex items-center flex-shrink-0">
                  <button onClick={() => setActiveDay(date)} disabled={isFuture}
                    className="flex flex-col items-center rounded-[10px] px-2.5 py-1.5 transition-all"
                    style={{
                      background: isSel ? 'white' : isPast && count > 0 ? '#58CC02' : isFuture ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                      border: `2px solid ${isSel ? '#7B3F00' : isPast && count > 0 ? '#1a5c00' : 'rgba(123,63,0,0.2)'}`,
                      boxShadow: isSel ? '0 3px 0 #7B3F00' : 'none',
                    }}
                  >
                    <div className={`text-[8px] font-black ${isSel ? 'text-[#7B3F00]' : isFuture ? 'text-white/40' : isPast && count > 0 ? 'text-white' : 'text-[#7B3F00]/70'}`}>{DAY_LABELS[i]}</div>
                    <div className={`text-[18px] ${isFuture ? 'opacity-20' : ''}`}>{isPast && count > 0 ? '🍌' : isFuture ? '🔒' : date === today ? '📍' : '○'}</div>
                    <div className={`text-[8px] font-bold ${isSel ? 'text-[#7B3F00]' : isFuture ? 'text-white/30' : isPast && count > 0 ? 'text-white' : 'text-[#7B3F00]/60'}`}>{count > 0 ? `×${count}` : DAY_NAMES[d.getDay()]}</div>
                  </button>
                  {i < ARUBA_DATES.length - 1 && (
                    <div className="w-3 h-0.5 flex-shrink-0" style={{ background: date < today && count > 0 ? '#58CC02' : 'rgba(123,63,0,0.2)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── FEED ── */}
      <div className="flex-1 mx-4 mb-16 rounded-[16px] overflow-hidden flex flex-col bg-white/80 backdrop-blur-sm" style={{ border: '3px solid #7B3F00', boxShadow: '0 4px 0 #7B3F00' }}>
        <div className="px-4 py-2 flex-shrink-0 flex items-center justify-between" style={{ borderBottom: '2px solid #7B3F00', background: '#FFE08A' }}>
          <span className="text-[11px] font-black text-[#7B3F00] uppercase">
            {(() => { const d = new Date(selectedDay + 'T12:00:00'); return `${DAY_NAMES[d.getDay()]} · ${(entriesByDay[selectedDay]||[]).length} finds` })()}
          </span>
          <span className="text-[16px]">🗺️</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(entriesByDay[selectedDay] || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-4">
              <div className="text-[44px]">🔍</div>
              <p className="text-[13px] font-black text-[#7B3F00]/50">{selectedDay > today ? 'Adventure awaits!' : 'Nothing spotted yet'}</p>
              {selectedDay === today && <p className="text-[11px] text-[#7B3F00]/30 mt-1">/sh &lt;what you found&gt;</p>}
            </div>
          ) : (
            (entriesByDay[selectedDay] || []).map((e, i) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(123,63,0,0.1)' }}>
                <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5" style={{ border: '2px solid #7B3F00' }}>
                  <span className="text-[10px] font-black text-[#7B3F00]">{i+1}</span>
                </div>
                <p className="flex-1 text-[12px] text-[#7B3F00] font-semibold leading-snug">{e.description}</p>
                <span className="text-[9px] font-bold text-[#7B3F00]/40 flex-shrink-0">{formatTime(e.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Confetti overlay ─────────────────────────────────────────────────────────
function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="absolute text-[22px] animate-bounce"
          style={{ left: `${(i * 13.7) % 100}%`, top: `${(i * 17.3) % 60}%`, animationDelay: `${(i * 0.11) % 0.6}s`, animationDuration: `${0.5 + (i % 5) * 0.2}s` }}>
          {i % 3 === 0 ? '🍌' : i % 3 === 1 ? '✨' : '🎉'}
        </div>
      ))}
    </div>
  )
}
