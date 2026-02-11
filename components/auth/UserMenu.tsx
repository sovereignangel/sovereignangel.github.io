'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from './AuthProvider'
import RewardProofModal from '@/components/thesis/RewardProofModal'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showProof, setShowProof] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || ''}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-navy text-paper flex items-center justify-center font-mono text-[11px]">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
        <span className="font-mono text-[10px] text-ink-muted hidden sm:inline">
          {user.email}
        </span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 bg-paper border border-rule rounded-sm shadow-sm z-20 min-w-[180px]">
            <button
              onClick={() => { setShowProof(true); setShowMenu(false) }}
              className="w-full text-left px-4 py-2.5 font-serif text-[12px] text-ink-light hover:bg-cream transition-colors flex items-center gap-2 border-b border-rule-light"
            >
              <span className="font-mono text-[11px] text-navy font-semibold">g*</span>
              <span>Reward Function</span>
            </button>
            <button
              onClick={() => { signOut(); setShowMenu(false) }}
              className="w-full text-left px-4 py-2.5 font-serif text-[12px] text-ink-light hover:bg-cream transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}

      {showProof && <RewardProofModal onClose={() => setShowProof(false)} />}
    </div>
  )
}
