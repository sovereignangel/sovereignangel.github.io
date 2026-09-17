import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { todayLocal } from '@/lib/ironman/plan'
import { CAMPAIGNS, type CampaignId } from '@/lib/campaign'
import { CampaignLadder } from '@/components/exec/CampaignLadder'
import type { LaneId } from '@/lib/exec/lanes'

const LANE_FOR: Record<CampaignId, LaneId> = {
  complexecon: 'complexecon',
  armstrong: 'armstrong',
}

export function generateStaticParams() {
  return Object.keys(CAMPAIGNS).map((id) => ({ id }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const campaign = CAMPAIGNS[params.id as CampaignId]
  return {
    title: campaign ? `${campaign.name} — Ladder` : 'Ladder',
    description: campaign?.lane,
  }
}

export const revalidate = 60

export default function LadderPage({ params }: { params: { id: string } }) {
  const campaign = CAMPAIGNS[params.id as CampaignId]
  if (!campaign) notFound()

  return (
    <AuthProvider>
      <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #edefea 0%, #f2ecdf 320px)' }}>
        <div className="max-w-[900px] mx-auto px-3 md:px-4 py-3 md:py-5">
          <header className="flex items-center gap-2 md:gap-3 mb-2.5">
            <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep">
              {campaign.name} <span className="text-iron-burgundy">&mdash;</span> Ladder
            </h1>
            <Link
              href="/exec"
              className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent transition-colors text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50"
            >
              Daily orders
            </Link>
            <a
              href={campaign.href}
              className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent transition-colors text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50"
            >
              The work
            </a>
          </header>

          <CampaignLadder id={campaign.id} laneId={LANE_FOR[campaign.id]} date={todayLocal()} />

          <p className="text-[10px] text-surf-muted mt-3">
            Every unit the campaign contains, in block order, with the standard each check-off is made against. The
            daily card on /exec shows only the next few open units; this is the whole thing, and it is where a tick
            gets taken back. Blocks are dated and units are ordered: nothing reschedules itself, and an unfinished
            unit stays at the head of the queue rather than disappearing off a calendar.
          </p>
        </div>
      </main>
    </AuthProvider>
  )
}
