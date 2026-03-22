'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'

interface HuntEntry {
  id: string
  description: string
  createdAt: string
  date: string
  pointsValue: number
  redeemed: boolean
}

interface Redemption {
  id: string
  pointsRedeemed: number
  description: string
  createdAt: string
  date: string
}

const GAME_DOC = 'aruba_2026'
const ARUBA_DATES = [
  '2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25',
  '2026-03-26', '2026-03-27', '2026-03-28',
]
const DAY_LABELS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDayLabel(dateStr: string): string {
  const idx = ARUBA_DATES.indexOf(dateStr)
  if (idx === -1) return dateStr
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAY_LABELS[idx]} · ${DAY_NAMES[d.getDay()]} ${d.getDate()}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function ScavengerHuntPage() {
  const [entries, setEntries] = useState<HuntEntry[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [prevCount, setPrevCount] = useState(0)

  useEffect(() => {
    const gameRef = doc(db, 'scavenger_hunt', GAME_DOC)
    const entriesRef = collection(gameRef, 'entries')
    const redemptionsRef = collection(gameRef, 'redemptions')

    const q1 = query(entriesRef, orderBy('createdAt', 'desc'))
    const q2 = query(redemptionsRef, orderBy('createdAt', 'desc'))

    const unsub1 = onSnapshot(q1, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as HuntEntry))
      setEntries(data)
    })

    const unsub2 = onSnapshot(q2, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Redemption))
      setRedemptions(data)
    })

    return () => { unsub1(); unsub2() }
  }, [])

  // Confetti when new entry arrives
  useEffect(() => {
    if (entries.length > prevCount && prevCount > 0) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2500)
    }
    setPrevCount(entries.length)
  }, [entries.length, prevCount])

  const totalPoints = entries.length
  const totalRedeemed = redemptions.reduce((sum, r) => sum + r.pointsRedeemed, 0)
  const available = totalPoints - totalRedeemed

  // Group entries by day
  const entriesByDay: Record<string, HuntEntry[]> = {}
  ARUBA_DATES.forEach(d => { entriesByDay[d] = [] })
  entries.forEach(e => {
    if (entriesByDay[e.date]) {
      entriesByDay[e.date].push(e)
    }
  })

  // Get today in Aruba (UTC-4)
  const getTodayAruba = useCallback(() => {
    const now = new Date()
    const aruba = new Date(now.getTime() - 4 * 60 * 60 * 1000)
    return aruba.toISOString().slice(0, 10)
  }, [])

  const today = getTodayAruba()
  const todayEntries = entriesByDay[today] || []

  // Streak calculation
  let streak = 0
  for (const date of [...ARUBA_DATES].reverse()) {
    if (date > today) continue
    if ((entriesByDay[date] || []).length > 0) streak++
    else break
  }

  const selectedDay = activeDay || today

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FFF8E1 0%, #FFF3C4 30%, #FFECB3 100%)' }}>
      {/* Banana confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 70}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.4 + Math.random() * 0.8}s`,
                fontSize: `${18 + Math.random() * 16}px`,
              }}
            >
              {['🍌', '✨', '🌴', '🍌', '🍌'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Floating banana decorations */}
      <div className="absolute top-12 left-4 text-[40px] opacity-15 rotate-[-20deg]">🍌</div>
      <div className="absolute top-32 right-6 text-[32px] opacity-10 rotate-[15deg]">🍌</div>
      <div className="absolute top-64 left-8 text-[24px] opacity-10 rotate-[30deg]">🌴</div>

      {/* Hero section */}
      <div className="relative px-4 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-4">
            <p className="text-[12px] font-bold uppercase tracking-[3px]" style={{ color: '#A1887F' }}>
              Aruba 2026
            </p>
            <h1
              className="text-[36px] font-black tracking-tight mt-1 leading-none"
              style={{
                color: '#4E342E',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '2px 2px 0px rgba(255,193,7,0.3)',
              }}
            >
              BANANA HUNT
            </h1>
            <p className="text-[13px] font-semibold mt-1" style={{ color: '#8D6E63' }}>
              Find ingenuity. Collect bananas. Redeem time.
            </p>
          </div>

          {/* Character cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* The Hunter - Aidas */}
            <div
              className="rounded-[16px] p-2 pb-3 text-center shadow-lg relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 100%)',
                border: '2px solid #66BB6A',
              }}
            >
              <div className="w-full aspect-[3/4] rounded-[12px] overflow-hidden mb-2 relative">
                <Image
                  src="/scavenger-hunt/hunter.png"
                  alt="The Hunter - Aidas"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              </div>
              <div
                className="text-[13px] font-black uppercase tracking-wide"
                style={{ color: '#2E7D32' }}
              >
                The Hunter
              </div>
              <div className="text-[10px] font-medium mt-0.5" style={{ color: '#4CAF50' }}>
                Banana Collector
              </div>
              <div className="absolute top-2 right-2 text-[14px]">🕵️</div>
            </div>

            {/* The Prize - Lori */}
            <div
              className="rounded-[16px] p-2 pb-3 text-center shadow-lg relative overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 100%)',
                border: '2px solid #FFB74D',
              }}
            >
              <div className="w-full aspect-[3/4] rounded-[12px] overflow-hidden mb-2 relative">
                <Image
                  src="/scavenger-hunt/prize.png"
                  alt="The Prize - Lori"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              </div>
              <div
                className="text-[13px] font-black uppercase tracking-wide"
                style={{ color: '#E65100' }}
              >
                The Prize
              </div>
              <div className="text-[10px] font-medium mt-0.5" style={{ color: '#FB8C00' }}>
                Minutes with Lori
              </div>
              <div className="absolute top-2 right-2 text-[14px]">🏆</div>
            </div>
          </div>

          {/* Main score card */}
          <div
            className="rounded-[16px] p-4 mb-4 shadow-xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #4E342E 0%, #3E2723 100%)',
              border: '2px solid #6D4C41',
            }}
          >
            {/* Subtle banana pattern overlay */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-2 right-4 text-[40px] rotate-[20deg]">🍌</div>
              <div className="absolute bottom-2 left-4 text-[30px] rotate-[-15deg]">🍌</div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-[36px]">🍌</div>
                  <div>
                    <div
                      className="text-[40px] font-black leading-none"
                      style={{ color: '#FFD54F' }}
                    >
                      {totalPoints}
                    </div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-[2px]"
                      style={{ color: '#A1887F' }}
                    >
                      Bananas Found
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[28px] font-black leading-none"
                    style={{ color: '#81C784' }}
                  >
                    {available}
                  </div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-[2px]"
                    style={{ color: '#A1887F' }}
                  >
                    Min Available
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="rounded-full h-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min((totalPoints / 50) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #FFC107, #FFD54F, #FFEB3B)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: '#8D6E63' }}>0</span>
                <span className="text-[10px]" style={{ color: '#8D6E63' }}>Goal: 50 bananas</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatBadge emoji="🔥" value={streak} label="Day Streak" accent="#FF7043" />
            <StatBadge emoji="📅" value={todayEntries.length} label="Today" accent="#66BB6A" />
            <StatBadge emoji="🎁" value={totalRedeemed} label="Redeemed" accent="#AB47BC" />
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div className="max-w-md mx-auto px-4 mb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {ARUBA_DATES.map((date, i) => {
            const count = (entriesByDay[date] || []).length
            const isToday = date === today
            const isSelected = date === selectedDay
            const isFuture = date > today
            return (
              <button
                key={date}
                onClick={() => setActiveDay(date)}
                disabled={isFuture}
                className="flex-shrink-0 rounded-[12px] px-3 py-2 text-center transition-all"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, #FFC107, #FFB300)'
                    : isFuture
                    ? 'rgba(78,52,46,0.05)'
                    : count > 0
                    ? 'rgba(78,52,46,0.08)'
                    : 'rgba(78,52,46,0.04)',
                  color: isSelected ? '#3E2723' : isFuture ? 'rgba(78,52,46,0.25)' : '#5D4037',
                  border: isSelected ? '2px solid #FF8F00' : '2px solid transparent',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected ? '0 4px 12px rgba(255,193,7,0.4)' : 'none',
                }}
              >
                <div className="text-[10px] font-bold uppercase">{DAY_LABELS[i]}</div>
                <div className="text-[16px] font-black">{count > 0 ? count : isToday ? '—' : isFuture ? '·' : '0'}</div>
                {count > 0 && <div className="text-[10px]">{'🍌'.repeat(Math.min(count, 3))}</div>}
                {isToday && (
                  <div
                    className="text-[8px] font-bold mt-0.5"
                    style={{ color: isSelected ? '#3E2723' : '#FF8F00' }}
                  >
                    NOW
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day entries */}
      <div className="max-w-md mx-auto px-4 pb-8">
        <div
          className="rounded-[16px] overflow-hidden shadow-md"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(78,52,46,0.1)',
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              borderBottom: '1px solid rgba(78,52,46,0.08)',
              background: 'rgba(78,52,46,0.03)',
            }}
          >
            <h2 className="text-[14px] font-black uppercase tracking-wide" style={{ color: '#4E342E' }}>
              {formatDayLabel(selectedDay)}
            </h2>
            <span className="text-[12px] font-bold" style={{ color: '#66BB6A' }}>
              {(entriesByDay[selectedDay] || []).length} find{(entriesByDay[selectedDay] || []).length !== 1 ? 's' : ''}
            </span>
          </div>

          {(entriesByDay[selectedDay] || []).length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-[40px] mb-2">🔍</div>
              <p className="text-[14px] font-semibold" style={{ color: '#8D6E63' }}>
                {selectedDay === today
                  ? 'No finds yet today. Get hunting!'
                  : selectedDay > today
                  ? "This day hasn't started yet"
                  : 'No finds this day'}
              </p>
              {selectedDay === today && (
                <p className="text-[12px] mt-2" style={{ color: '#BCAAA4' }}>
                  Send <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: 'rgba(78,52,46,0.06)' }}>/sh &lt;description&gt;</code> in Telegram
                </p>
              )}
            </div>
          ) : (
            <div>
              {(entriesByDay[selectedDay] || []).map((entry, i) => (
                <div
                  key={entry.id}
                  className="px-4 py-3 flex items-start gap-3"
                  style={{
                    borderBottom: i < (entriesByDay[selectedDay] || []).length - 1
                      ? '1px solid rgba(78,52,46,0.05)'
                      : 'none',
                  }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,193,7,0.15)' }}
                  >
                    <span className="text-[16px]">🍌</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-snug" style={{ color: '#4E342E' }}>
                      {entry.description}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: '#BCAAA4' }}>
                      {formatTime(entry.createdAt)} · +1 banana
                    </p>
                  </div>
                  <div className="text-[12px] font-black" style={{ color: '#FFB300' }}>
                    #{(entriesByDay[selectedDay] || []).length - i}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redemption history */}
        {redemptions.length > 0 && (
          <div
            className="mt-4 rounded-[16px] overflow-hidden shadow-md"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(171,71,188,0.15)',
            }}
          >
            <div
              className="px-4 py-3"
              style={{
                borderBottom: '1px solid rgba(171,71,188,0.08)',
                background: 'rgba(171,71,188,0.03)',
              }}
            >
              <h2 className="text-[14px] font-black uppercase tracking-wide" style={{ color: '#7B1FA2' }}>
                Redeemed
              </h2>
            </div>
            <div>
              {redemptions.map((r, i) => (
                <div
                  key={r.id}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{
                    borderBottom: i < redemptions.length - 1
                      ? '1px solid rgba(171,71,188,0.05)'
                      : 'none',
                  }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(171,71,188,0.1)' }}
                  >
                    <span className="text-[16px]">🎁</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: '#4E342E' }}>{r.description}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#BCAAA4' }}>{formatTime(r.createdAt)}</p>
                  </div>
                  <div className="text-[14px] font-black" style={{ color: '#AB47BC' }}>
                    -{r.pointsRedeemed} min
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to play */}
        <div
          className="mt-4 rounded-[16px] p-4 shadow-sm"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(78,52,46,0.08)',
          }}
        >
          <h3 className="text-[12px] font-black uppercase tracking-[2px] mb-3" style={{ color: '#8D6E63' }}>
            How to Play
          </h3>
          <div className="space-y-2.5">
            <HowToStep num={1} text="Spot something ingenious in Aruba" emoji="👀" />
            <HowToStep num={2} text='Send /sh <what you found> in Telegram' emoji="📱" />
            <HowToStep num={3} text="Each find = 1 banana = 1 minute" emoji="🍌" />
            <HowToStep num={4} text='Redeem with /redeem <mins> <activity>' emoji="🎁" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="text-[20px] mb-1">🍌🌴🍌</div>
          <div className="text-[10px] font-medium" style={{ color: '#BCAAA4' }}>
            Banana Hunt · Aruba 2026 · Aidas & Lori
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBadge({ emoji, value, label, accent }: { emoji: string; value: number; label: string; accent: string }) {
  return (
    <div
      className="rounded-[12px] p-2 text-center shadow-sm"
      style={{
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(78,52,46,0.06)',
      }}
    >
      <div className="text-[16px] mb-0.5">{emoji}</div>
      <div className="text-[18px] font-black" style={{ color: '#4E342E' }}>{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accent }}>{label}</div>
    </div>
  )
}

function HowToStep({ num, text, emoji }: { num: number; text: string; emoji: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FFC107, #FFB300)' }}
      >
        <span className="text-[12px] font-black" style={{ color: '#3E2723' }}>{num}</span>
      </div>
      <p className="text-[12px] font-medium flex-1" style={{ color: '#5D4037' }}>{text}</p>
      <span className="text-[16px]">{emoji}</span>
    </div>
  )
}
