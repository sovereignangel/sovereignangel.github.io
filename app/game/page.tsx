import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { GameBoard } from '@/components/game/GameBoard'
import { todayLocal } from '@/lib/ironman/plan'

export const metadata: Metadata = {
  title: 'The Long Game · Arete Technologies',
  description:
    'A progression board on one screen: one main quest, three side lines, eleven trees of five rungs, and unlocks that only open where two trees meet.',
}

/**
 * The board. /mastery argues why the fronts matter; this scores them.
 *
 * Deliberately chrome-free: no cover, no standfirst, no section furniture.
 * A tearsheet is a single fitted page, so every pixel of height that is not
 * data has to justify itself, and a hero does not. The identity line is the
 * one piece of prose that earns its place, and it sits inline in the masthead.
 *
 * Rendered per request so the week and month are never a cached yesterday —
 * the page is pure formatting over code data, so that costs nothing.
 */

export const dynamic = 'force-dynamic'

export default function GamePage() {
  return (
    <AuthProvider>
      <GameBoard today={todayLocal()} />
    </AuthProvider>
  )
}
