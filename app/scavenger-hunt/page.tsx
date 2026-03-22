'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
      setTimeout(() => setShowConfetti(false), 2000)
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
    <div className="min-h-screen bg-[#235325] relative overflow-hidden">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-[24px] animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 1}s`,
              }}
            >
              {Math.random() > 0.5 ? '🍌' : '✨'}
            </div>
          ))}
        </div>
      )}

      {/* Top hero section */}
      <div className="bg-gradient-to-b from-[#58CC02] to-[#235325] px-4 pt-6 pb-8">
        {/* Header */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-[28px] font-black text-white tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              SCAVENGER HUNT
            </h1>
            <p className="text-[14px] text-[#b8f397] font-semibold mt-0.5">
              Aruba 2026 · Mar 22-28
            </p>
          </div>

          {/* Main score card */}
          <div className="bg-white/15 backdrop-blur-sm rounded-[16px] p-4 mb-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[32px]">🍌</span>
                <div>
                  <div className="text-[36px] font-black text-white leading-none">{totalPoints}</div>
                  <div className="text-[11px] text-[#b8f397] font-bold uppercase tracking-wider">Bananas Found</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[24px] font-black text-[#FFD700] leading-none">{available}</div>
                <div className="text-[11px] text-[#b8f397] font-bold uppercase tracking-wider">Min Available</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#FFD700] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min((totalPoints / 50) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/60">0</span>
              <span className="text-[10px] text-white/60">Goal: 50 bananas</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <StatBadge emoji="🔥" value={streak} label="Day Streak" color="#FF9600" />
            <StatBadge emoji="📅" value={todayEntries.length} label="Today" color="#58CC02" />
            <StatBadge emoji="🎁" value={totalRedeemed} label="Redeemed" color="#CE82FF" />
          </div>
        </div>
      </div>

      {/* Character cards */}
      <div className="max-w-md mx-auto px-4 -mt-2 mb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* The Prize - Lori */}
          <div className="bg-[#FFF3E0] rounded-[16px] p-3 border-2 border-[#FFB74D] shadow-lg">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-1 rounded-full overflow-hidden border-3 border-[#FFB74D] bg-[#FFE0B2]">
                <div className="w-full h-full flex items-center justify-center text-[40px]">🏆</div>
              </div>
              <div className="text-[12px] font-black text-[#E65100] uppercase tracking-wide">The Prize</div>
              <div className="text-[10px] text-[#BF360C] mt-0.5">Minutes with Lori</div>
            </div>
          </div>

          {/* The Hunter - Aidas */}
          <div className="bg-[#E8F5E9] rounded-[16px] p-3 border-2 border-[#66BB6A] shadow-lg">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-1 rounded-full overflow-hidden border-3 border-[#66BB6A] bg-[#C8E6C9]">
                <div className="w-full h-full flex items-center justify-center text-[40px]">🕵️</div>
              </div>
              <div className="text-[12px] font-black text-[#1B5E20] uppercase tracking-wide">The Hunter</div>
              <div className="text-[10px] text-[#2E7D32] mt-0.5">Banana Collector</div>
            </div>
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
                className={`flex-shrink-0 rounded-[12px] px-3 py-2 text-center transition-all ${
                  isSelected
                    ? 'bg-[#58CC02] text-white shadow-lg shadow-[#58CC02]/30 scale-105'
                    : isFuture
                    ? 'bg-white/5 text-white/30'
                    : count > 0
                    ? 'bg-white/15 text-white hover:bg-white/25'
                    : 'bg-white/8 text-white/50 hover:bg-white/15'
                }`}
              >
                <div className="text-[10px] font-bold uppercase">{DAY_LABELS[i]}</div>
                <div className="text-[16px] font-black">{count > 0 ? count : isToday ? '—' : isFuture ? '·' : '0'}</div>
                {count > 0 && <div className="text-[10px]">{'🍌'.repeat(Math.min(count, 3))}</div>}
                {isToday && <div className="text-[8px] font-bold text-[#FFD700] mt-0.5">NOW</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day entries */}
      <div className="max-w-md mx-auto px-4 pb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-[16px] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-[14px] font-black text-white uppercase tracking-wide">
              {formatDayLabel(selectedDay)}
            </h2>
            <span className="text-[12px] font-bold text-[#58CC02]">
              {(entriesByDay[selectedDay] || []).length} find{(entriesByDay[selectedDay] || []).length !== 1 ? 's' : ''}
            </span>
          </div>

          {(entriesByDay[selectedDay] || []).length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-[40px] mb-2">🔍</div>
              <p className="text-[14px] text-white/60 font-semibold">
                {selectedDay === today
                  ? 'No finds yet today. Get hunting!'
                  : selectedDay > today
                  ? 'This day hasn\'t started yet'
                  : 'No finds this day'}
              </p>
              {selectedDay === today && (
                <p className="text-[12px] text-white/40 mt-2">
                  Send /sh &lt;description&gt; in Telegram
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {(entriesByDay[selectedDay] || []).map((entry, i) => (
                <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#58CC02]/20 flex items-center justify-center">
                    <span className="text-[16px]">🍌</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white font-semibold leading-snug">
                      {entry.description}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">
                      {formatTime(entry.createdAt)} · +1 banana
                    </p>
                  </div>
                  <div className="text-[12px] font-black text-[#FFD700]">
                    #{(entriesByDay[selectedDay] || []).length - i}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redemption history */}
        {redemptions.length > 0 && (
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-[16px] border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-[14px] font-black text-[#CE82FF] uppercase tracking-wide">
                Redeemed
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {redemptions.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CE82FF]/20 flex items-center justify-center">
                    <span className="text-[16px]">🎁</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white font-semibold">{r.description}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{formatTime(r.createdAt)}</p>
                  </div>
                  <div className="text-[14px] font-black text-[#CE82FF]">
                    -{r.pointsRedeemed} min
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to play */}
        <div className="mt-4 bg-white/5 rounded-[16px] p-4 border border-white/10">
          <h3 className="text-[12px] font-black text-[#58CC02] uppercase tracking-wide mb-3">How to Play</h3>
          <div className="space-y-2.5">
            <HowToStep num={1} text="Spot something ingenious in Aruba" emoji="👀" />
            <HowToStep num={2} text='Send /sh <what you found> in Telegram' emoji="📱" />
            <HowToStep num={3} text="Each find = 1 banana = 1 minute" emoji="🍌" />
            <HowToStep num={4} text='Redeem with /redeem <mins> <activity>' emoji="🎁" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[10px] text-white/30">
          Scavenger Hunt · Aruba 2026 · Aidas & Lori
        </div>
      </div>
    </div>
  )
}

function StatBadge({ emoji, value, label, color }: { emoji: string; value: number; label: string; color: string }) {
  return (
    <div className="bg-white/10 rounded-[12px] p-2 text-center">
      <div className="text-[16px] mb-0.5">{emoji}</div>
      <div className="text-[18px] font-black text-white">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{label}</div>
    </div>
  )
}

function HowToStep({ num, text, emoji }: { num: number; text: string; emoji: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#58CC02] flex items-center justify-center">
        <span className="text-[12px] font-black text-white">{num}</span>
      </div>
      <p className="text-[12px] text-white/80 font-medium flex-1">{text}</p>
      <span className="text-[16px]">{emoji}</span>
    </div>
  )
}
