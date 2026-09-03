import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import {
  Colophon,
  Cover,
  Facts,
  Line,
  Masthead,
  Section,
  TearsheetStyles,
  type NavItem,
} from '@/components/arete/Tearsheet'
import { GameBoard } from '@/components/game/GameBoard'
import { THE_LINE, TREES, LEVEL_NAMES } from '@/lib/game/trees'
import { UNLOCKS } from '@/lib/game/unlocks'
import { todayLocal } from '@/lib/ironman/plan'

export const metadata: Metadata = {
  title: 'The Long Game · Arete Technologies',
  description:
    'A progression board: one main quest, three side lines, eleven trees of five rungs, and unlocks that only open where two trees meet.',
}

/**
 * The board. /mastery argues why the fronts matter; this scores them.
 *
 * Public by design, which is why Capital is shown as two percentages — months
 * of the twelve-month record banked, and launch gates cleared — rather than a
 * figure. Neither discloses anything, and both are honest.
 *
 * Rendered per request so the week and month are never a cached yesterday;
 * the page is pure formatting over code data, so that costs nothing.
 */

export const dynamic = 'force-dynamic'

const NAV: NavItem[] = [
  { numeral: 'Main', label: 'Capital', href: '#capital' },
  { numeral: 'I–III', label: 'Trees', href: '#trees' },
  { numeral: 'IV', label: 'Overlap', href: '#unlocks' },
  { numeral: 'V', label: 'Cadence', href: '#cadence' },
]

export default function GamePage() {
  const today = todayLocal()

  return (
    <AuthProvider>
      <div className="ats">
        <TearsheetStyles />
        <Masthead tagline="The long game." nav={NAV} />

        <div className="ats-sheet">
          <Cover eyebrow="The board · Lori Corpuz · MMXXVI" title="The Long Game" tagline="What compounds, endures." />

          <Line label="Who I am becoming">{THE_LINE}</Line>

          <Facts
            items={[
              { label: 'Main quest', value: 'Capital', note: 'shown as percent — this page is public' },
              { label: 'Side lines', value: 'Three', note: 'Edge · Room · Instrument' },
              { label: 'Trees', value: String(TREES.length), note: `five rungs each — ${LEVEL_NAMES[0].toLowerCase()} to ${LEVEL_NAMES[4].toLowerCase()}` },
              { label: 'Unlocks', value: String(UNLOCKS.length), note: 'each needs two trees at once' },
              { label: 'Left unscored', value: 'Aesthetic', note: 'creation is logged, never targeted' },
            ]}
          />

          <Section
            id="how"
            numeral="—"
            title="How to read this"
            note="/mastery argues · this scores"
            intro={
              <p>
                Three clauses in the line, three side quests beneath it, and one main quest they all
                eventually pay into. A rung is only worth having if its gate is written plainly enough
                to make lying to yourself uncomfortable, so every gate sits in the open next to the
                level it guards. Nothing here is sensed yet — the instruments come next, and roughly
                half these rungs already have one.
              </p>
            }
          >
            <p style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: 13, color: '#6b5f55', marginTop: 10, maxWidth: '66ch', lineHeight: 1.5 }}>
              Creation is deliberately absent. The Mental OS holds that the aesthetic runs input-only —
              logged when it arrives, never targeted — because creation needs empty space, and a board
              that scored it would be the one thing here you came to resent.
            </p>
          </Section>

          <GameBoard today={today} />

          <Colophon />
        </div>
      </div>
    </AuthProvider>
  )
}
