'use client'

import { AnchorIcon, SpiralIcon, CompassIcon } from './pillar-icons'

/**
 * Empty state showing the full outline of what the dashboard will display
 * once relational transcripts are processed.
 */
export function EmptyOutline() {
  return (
    <div className="space-y-6">
      {/* How to start */}
      <div className="border rounded-sm p-4 text-center" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
        <p className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#b85c38' }}>
          Getting Started
        </p>
        <p className="text-[11px] leading-relaxed max-w-[500px] mx-auto" style={{ color: '#8a7e72' }}>
          Record a conversation with Wave.ai and say <strong style={{ color: '#2a2420' }}>&ldquo;relational transcript&rdquo;</strong> or <strong style={{ color: '#2a2420' }}>&ldquo;relationship transcript&rdquo;</strong> near
          the beginning. The transcript will be automatically processed and the dashboard will update within minutes.
        </p>
      </div>

      {/* Safety outline */}
      <PillarOutline
        icon={<AnchorIcon size={18} color="#2d5f4a" />}
        title="Safety"
        color="#2d5f4a"
        subtitle="Can we be vulnerable without punishment?"
        cards={[
          {
            title: 'Four Horsemen',
            description: 'Gottman\'s four toxic communication patterns tracked per person per session',
            items: [
              'Criticism — character attacks vs specific complaints',
              'Contempt — sarcasm, mockery, superiority (#1 predictor of separation)',
              'Defensiveness — counter-attacking, denying responsibility',
              'Stonewalling — shutting down, emotional withdrawal',
            ],
            metric: 'Count per person · Trend over sessions',
          },
          {
            title: 'Repair & Resilience',
            description: 'How well you recover from conflict — the #1 predictor of relationship success',
            items: [
              'Repair attempts: humor, affection, accountability, de-escalation',
              'Success rate per session and rolling average',
              'Vulnerability moments — self-disclosure, admitting fault',
            ],
            metric: 'Repair success rate % · Vulnerability count',
          },
        ]}
      />

      {/* Growth outline */}
      <PillarOutline
        icon={<SpiralIcon size={18} color="#b85c38" />}
        title="Growth"
        color="#b85c38"
        subtitle="Are we evolving together?"
        cards={[
          {
            title: 'Curiosity vs Assumption',
            description: 'Are you asking genuine questions or assuming intent?',
            items: [
              'Genuine questions: open-ended, driven by curiosity',
              'Assumptions: projecting feelings or intent onto partner',
              'Ratio tracked per person with session trend',
            ],
            metric: 'Curiosity ratio % per person',
          },
          {
            title: 'Accountability vs Blame',
            description: 'Owning your part vs externalizing responsibility',
            items: [
              'Ownership: "I realize I...", "My part in this was..."',
              'Blame: "It\'s because you...", "If you hadn\'t..."',
              'Ratio tracked per person with session trend',
            ],
            metric: 'Accountability ratio % per person',
          },
          {
            title: 'Dynamics',
            description: 'Pursue-withdraw patterns and new insights',
            items: [
              'Pursue/withdraw detection — who chases, who shuts down',
              'Pattern intensity (mild / moderate / strong)',
              'New understandings gained about each other',
            ],
            metric: 'Pattern type · Intensity · Understanding count',
          },
        ]}
      />

      {/* Alignment outline */}
      <PillarOutline
        icon={<CompassIcon size={18} color="#c4873a" />}
        title="Alignment"
        color="#c4873a"
        subtitle="Do we want the same life?"
        cards={[
          {
            title: 'Theme Map',
            description: 'Recurring friction topics clustered by life domain',
            items: [
              'Domains: money, family, career, lifestyle, intimacy, social, values, household, health',
              'Status tracking: active friction → improving → resolved',
              'Position mapping — each person\'s stance per topic',
            ],
            metric: 'Domain count · Resolution status',
          },
          {
            title: 'Values Ledger',
            description: 'Values surfaced through conversation over time',
            items: [
              'Shared values — expressed by both partners',
              'Individual values — unique to Lori or Aidas',
              'Mention frequency and context tracking',
              'Shared vision statements — moments of alignment on the future',
            ],
            metric: 'Shared vs individual value count · Vision statements',
          },
        ]}
      />

      {/* Sessions outline */}
      <div>
        <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#d8cfc4' }}>
          <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#2a2420' }}>
            Sessions
          </h2>
        </div>
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          <p className="text-[11px] mb-2" style={{ color: '#8a7e72' }}>
            Each conversation appears as an expandable card showing:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: '#8a7e72' }}>
            <div>• Date and trigger topic</div>
            <div>• Overall tone (constructive / tense / breakthrough)</div>
            <div>• Life domain (money, career, etc.)</div>
            <div>• Composite score (0-10)</div>
            <div>• Safety / Growth / Alignment breakdown</div>
            <div>• Key takeaways and action items</div>
          </div>
        </div>
      </div>

      {/* Scoring formula */}
      <div className="border rounded-sm p-3" style={{ backgroundColor: 'rgba(184, 92, 56, 0.04)', borderColor: '#d8cfc4' }}>
        <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#b85c38' }}>
          How Scoring Works
        </p>
        <p className="text-[10px] font-mono mb-1" style={{ color: '#2a2420' }}>
          health = 10 × safety<sup>0.4</sup> × growth<sup>0.3</sup> × alignment<sup>0.3</sup>
        </p>
        <p className="text-[10px]" style={{ color: '#8a7e72' }}>
          Safety weighted highest because without it, nothing else is honest.
          Metrics use 5-session rolling averages so one bad conversation doesn&apos;t define the relationship.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface CardOutline {
  title: string
  description: string
  items: string[]
  metric: string
}

function PillarOutline({
  icon, title, color, subtitle, cards,
}: {
  icon: React.ReactNode
  title: string
  color: string
  subtitle: string
  cards: CardOutline[]
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#d8cfc4' }}>
        {icon}
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color }}>
          {title}
        </h2>
        <span className="text-[10px] ml-auto" style={{ color: '#8a7e72' }}>
          {subtitle}
        </span>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${cards.length > 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {cards.map((card) => (
          <div key={card.title} className="border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
            <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#2a2420' }}>
              {card.title}
            </h3>
            <p className="text-[10px] mb-2" style={{ color: '#8a7e72' }}>
              {card.description}
            </p>
            <div className="space-y-0.5 mb-2">
              {card.items.map((item, i) => (
                <p key={i} className="text-[10px]" style={{ color: '#8a7e72' }}>
                  • {item}
                </p>
              ))}
            </div>
            <div className="pt-1.5 border-t" style={{ borderColor: '#e8e0d6' }}>
              <p className="text-[9px] font-mono uppercase" style={{ color: '#c0b8aa' }}>
                {card.metric}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
