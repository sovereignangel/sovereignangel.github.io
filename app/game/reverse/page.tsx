import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Colophon, Cover, Masthead, TearsheetStyles, type NavItem } from '@/components/arete/Tearsheet'
import { GameReverse } from '@/components/game/GameReverse'

export const metadata: Metadata = {
  title: 'The Long Game · Reverse',
  description:
    'The reverse of the board: the overlap wall in full, every ladder end to end, the sealed trees, and the idea gates.',
}

/**
 * The back of the sheet — reference, not the working surface.
 *
 * This one is allowed to scroll. The board is fitted to a screen because it is
 * read every morning; this is consulted, and consulting rewards depth over
 * compression. Everything derives from the same stored levels, so the two
 * sides cannot disagree.
 */

export const dynamic = 'force-dynamic'

const NAV: NavItem[] = [
  { numeral: '←', label: 'The board', href: '/game' },
  { numeral: 'i', label: 'Overlap', href: '#overlap' },
  { numeral: 'ii', label: 'Sealed', href: '#sealed' },
  { numeral: 'iii', label: 'Ladders', href: '#ladders' },
  { numeral: 'iv', label: 'Idea gates', href: '#gates' },
]

export default function GameReversePage() {
  return (
    <AuthProvider>
      <div className="ats">
        <TearsheetStyles />
        <Masthead tagline="The long game." nav={NAV} />
        <div className="ats-sheet">
          <Cover
            eyebrow="Reverse · reference"
            title="The Reverse"
            tagline="What the board compresses into a tooltip."
          >
            The front of the sheet carries what you act on this week. This carries what you consult: the overlap
            wall with its reasoning intact, every ladder end to end, the trees still sealed, and the gates that
            decide when an idea dies.
          </Cover>
          <GameReverse />
          <Colophon />
        </div>
      </div>
    </AuthProvider>
  )
}
