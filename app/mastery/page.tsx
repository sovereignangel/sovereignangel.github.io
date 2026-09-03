import type { Metadata } from 'next'
import {
  Callout,
  Colophon,
  Collapse,
  Cover,
  DeepLinks,
  Facts,
  Masthead,
  Section,
  TearsheetStyles,
  type NavItem,
} from '@/components/arete/Tearsheet'

export const metadata: Metadata = {
  title: 'Mastery on Four Fronts · Arete Technologies',
  description:
    'Elite Operator, Elite Researcher, Gravitas, Athlete — four disciplines, one outcome: alpha and relationships, converted into capital.',
}

/**
 * The doctrine. Four fronts, why each one matters, and the scoreboard that
 * says whether it is real.
 *
 * This page argues; /game scores. Prose about why a front matters does not
 * belong on a board you scan every morning, and a board does not belong in
 * the middle of an argument — so they stay two surfaces on one framework and
 * link to each other.
 *
 * Rendered on the Arete tearsheet: the thesis for each front reads at a
 * glance, and the KPI table — reference rather than argument — sits behind a
 * collapsible. Deep plans continue to live in /mastery-pyramid.html.
 */

const NAV: NavItem[] = [
  { numeral: 'I', label: 'Operator', href: '#operator' },
  { numeral: 'II', label: 'Researcher', href: '#researcher' },
  { numeral: 'III', label: 'Gravitas', href: '#gravitas' },
  { numeral: 'IV', label: 'Athlete', href: '#athlete' },
]

interface Kpi {
  kpi: string
  target: string
  artifact: string
}

function KpiTable({ caption, rows }: { caption: string; rows: Kpi[] }) {
  return (
    <Collapse summary={caption}>
      <div className="ats-scroll">
        <table className="ats-rows" style={{ minWidth: 620 }}>
          <thead>
            <tr>
              <th style={{ width: 190 }}>KPI</th>
              <th>Target</th>
              <th style={{ width: 150 }}>Falsifiable artifact</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kpi}>
                <td className="k">{r.kpi}</td>
                <td>{r.target}</td>
                <td className="art">{r.artifact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Collapse>
  )
}

const OPERATOR_KPIS: Kpi[] = [
  { kpi: 'Capital ladder', target: '$5M closed · $10M verbal (named LP, amount, date) · $60M qualified pipeline', artifact: 'wired checks + pipeline log' },
  { kpi: 'Live track record', target: '13 consecutive weekly tearsheets, no missed close', artifact: 'tearsheet archive' },
  { kpi: 'Verbal-to-wired conversion', target: 'Every verbal has a next step and a date; conversion rate reviewed monthly', artifact: 'pipeline log' },
  { kpi: 'Risk discipline', target: 'Zero rule violations through any drawdown, real or paper', artifact: 'trade log + state notes' },
  { kpi: 'Income resilience', target: 'One non-performance-contingent income stream live', artifact: 'signed engagement' },
]

const RESEARCHER_KPIS: Kpi[] = [
  { kpi: 'Signal pipeline', target: '3 ABM signals in production, at least 1 with demonstrated live edge', artifact: 'production log + live P&L' },
  { kpi: 'Hypothesis kill ratio', target: 'Killed exceeds kept; every hypothesis logged with economic rationale and verdict', artifact: 'research log' },
  { kpi: 'Validation rigor', target: 'Survivors pass walk-forward + deflated Sharpe before a dollar touches them', artifact: 'validation report' },
  { kpi: 'Publishing cadence', target: '12 weekly posts + 1 piece presented publicly', artifact: 'public artifacts' },
  { kpi: 'Inbound per artifact', target: 'Each published piece opens at least one conversation you did not initiate', artifact: 'contact log' },
]

const GRAVITAS_KPIS: Kpi[] = [
  { kpi: 'Ask cadence', target: 'Two asks per day, logged, detached from outcome', artifact: 'ask log' },
  { kpi: 'Named commitments', target: 'Every verbal commitment has a name, an amount, and a date', artifact: 'pipeline log' },
  { kpi: 'Inbound vs outbound', target: 'Inbound opportunities exceed outbound asks by end of the arc', artifact: 'contact log' },
  { kpi: 'Warm-sourced revenue', target: 'At least one engagement sourced entirely through a warm room', artifact: 'signed engagement' },
  { kpi: 'Rooms', target: 'Standing rooms kept weekly; one room convened by you', artifact: 'calendar + attendee list' },
]

const ATHLETE_KPIS: Kpi[] = [
  { kpi: 'Kiteboarding (first)', target: 'Sessions per season on plan; one named progression milestone per season', artifact: 'session log' },
  { kpi: 'Aesthetics (second)', target: 'Posing mastered, wardrobe refit to figure, recomposition trending as intended', artifact: 'photo log + measurements' },
  { kpi: 'Triathlon (third)', target: 'Zone 2 volume and VO2-max (Norwegian 4x4) sessions kept weekly; one race finished', artifact: 'training log + race result' },
  { kpi: 'Longevity & sustainability (the base)', target: 'Sleep consistent, true rest day kept, deloads honored, zero training injuries', artifact: 'recovery log' },
]

export default function MasteryPage() {
  return (
    <div className="ats">
      <TearsheetStyles />
      <Masthead tagline="The long practice." nav={NAV} />

      <div className="ats-sheet">
        <Cover
          eyebrow="Doctrine · Lori Corpuz · MMXXVI"
          title="Four Fronts"
          tagline="Alpha and relationships, converted into capital."
        >
          Two fronts manufacture and capture alpha. One converts trust into capital. One powers the
          instrument that runs the other three. Every front terminates in the same two currencies —
          alpha and relationships — and those convert into money.
        </Cover>

        <Facts
          items={[
            { label: 'I · Operator', value: 'Capture', note: 'the machine that turns a proven edge into managed capital' },
            { label: 'II · Researcher', value: 'Manufacture', note: 'new edge, adversarially validated' },
            { label: 'III · Gravitas', value: 'Convert', note: 'sales, narrative and presence as a craft' },
            { label: 'IV · Athlete', value: 'Power', note: 'the substrate the other three are computed on' },
          ]}
        />

        {/* ══ I · OPERATOR ══ */}
        <Section
          id="operator"
          numeral="I"
          title="Elite Operator"
          note="Hedge fund"
          intro={
            <p>
              Mastery is a machine that converts a proven edge into managed capital — and keeps
              compounding through drawdowns, rejections, and regimes it did not expect.
            </p>
          }
        >
          <p style={{ maxWidth: '64ch', marginTop: 14 }}>
            The operator runs Armstrong as an institution in miniature. The craft is not the strategy
            code; it is everything that makes outside capital rational to wire: automation that never
            misses a close, a risk envelope written down precisely enough to hand off, an audit trail
            a skeptic can interrogate, and a capital pipeline managed as an operational process
            rather than a hope.
          </p>

          <Callout title="How this becomes money">
            <p style={{ marginBottom: 0 }}>
              The operator <strong>captures</strong> alpha. Revenue is fee-bearing AUM times fees and
              performance, plus the compounding of your own book. The relationship currency is LP
              trust — the conversion of a verbal commitment into a wired check. A beautiful machine
              with zero dollars raised is not an elite operation; it is an expensive hobby with good
              logging.
            </p>
          </Callout>

          <KpiTable caption="Operator KPIs — capture scoreboard" rows={OPERATOR_KPIS} />

          <DeepLinks
            links={[
              { label: 'Tooling', href: '/mastery-pyramid.html#d-tooling' },
              { label: 'Risk & Execution', href: '/mastery-pyramid.html#d-risk' },
              { label: 'Capital Formation', href: '/mastery-pyramid.html#d-capital' },
              { label: 'The belt year', href: '/mastery-pyramid.html#year' },
            ]}
          />
        </Section>

        {/* ══ II · RESEARCHER ══ */}
        <Section
          id="researcher"
          numeral="II"
          title="Elite Researcher"
          note="Complexity economics / hedge fund alpha"
          intro={
            <p>
              Mastery is manufacturing new edge through the complexity-economics lens — insight
              formalized into falsifiable hypotheses, validated adversarially, deployed as signals.
            </p>
          }
        >
          <p style={{ maxWidth: '64ch', marginTop: 14 }}>
            The researcher is where edge comes from. The lens is complexity economics — regimes,
            increasing returns, agent-based mechanism — and the discipline is adversarial honesty:
            every promising result is guilty until it survives every attempt to kill it. The
            researcher&apos;s job ends only when an insight has become a validated, deployable signal
            or a public artifact. Insight that never reaches a tearsheet or a reader is reading, not
            research.
          </p>

          <Callout title="How this becomes money">
            <p style={{ marginBottom: 0 }}>
              The researcher <strong>manufactures</strong> alpha, and the money arrives twice. First
              as performance — validated signals deployed on the book. Second as capital — published
              work is the artifact that makes LPs, collaborators, and fee-for-service clients come
              inbound. The relationship currency is reputation: each artifact is simultaneously a
              proof of craft and a magnet for the next room.
            </p>
          </Callout>

          <KpiTable caption="Researcher KPIs — manufacture scoreboard" rows={RESEARCHER_KPIS} />

          <DeepLinks
            links={[
              { label: 'Complexity Economics', href: '/mastery-pyramid.html#d-cx' },
              { label: 'Alpha Research', href: '/mastery-pyramid.html#d-alpha' },
              { label: 'Deep RL', href: '/mastery-pyramid.html#d-drl' },
              { label: 'The artifact flywheel', href: '/mastery-pyramid.html#flywheel' },
            ]}
          />
        </Section>

        {/* ══ III · GRAVITAS ══ */}
        <Section
          id="gravitas"
          numeral="III"
          title="Gravitas"
          note="Elite relationships"
          intro={
            <p>
              Mastery is becoming the node that capital, talent, and ideas route through — sales,
              narrative, and presence practiced as a craft, not carried as a personality trait.
            </p>
          }
        >
          <p style={{ maxWidth: '64ch', marginTop: 14 }}>
            Gravitas is the conversion layer. The researcher&apos;s artifacts and the
            operator&apos;s track record only become money at the moment a person decides to trust
            you — and that decision is made on presence, narrative, and the calm, repeated ask. The
            reframe that unlocks it: <em>relief comes from making and meaning the ask, not from the
            other person&apos;s yes.</em> De-shame the ask, systematize it, and the reps stop costing
            you.
          </p>

          <Callout title="How this becomes money">
            <p style={{ marginBottom: 0 }}>
              Relationships are where alpha is <strong>priced</strong>. LPs buy a person and a
              process before a number; the track record is permission, the relationship is the
              decision. Gravitas turns the other two fronts&apos; artifacts into wired capital,
              warm-sourced engagements, and rooms that route opportunity to you unprompted.
            </p>
          </Callout>

          <KpiTable caption="Gravitas KPIs — conversion scoreboard" rows={GRAVITAS_KPIS} />

          <DeepLinks
            links={[
              { label: 'Network & Access', href: '/mastery-pyramid.html#d-network' },
              { label: 'Capital Formation', href: '/mastery-pyramid.html#d-capital' },
            ]}
          />
        </Section>

        {/* ══ IV · ATHLETE ══ */}
        <Section
          id="athlete"
          numeral="IV"
          title="Athlete"
          note="Kiteboarder · aesthetics · triathlete"
          intro={
            <p>
              Mastery is a trained body that holds decision quality through drawdown and rejection —
              kiteboarding first, aesthetics second, triathlon third, all on a base of longevity and
              sustainability.
            </p>
          }
        >
          <p style={{ maxWidth: '64ch', marginTop: 14 }}>
            The athlete is Layer 0 — the substrate every decision above it is computed on. The
            priorities are ordered deliberately: kiteboarding is the craft and the joy, aesthetics is
            presence made physical (it feeds Gravitas directly), and triathlon is the engine —
            cardiovascular capacity that literally widens the window in which you stay calm and think
            clearly. Longevity and sustainability are the constraint on all three: training that
            injures or exhausts is a loan against the other fronts.
          </p>

          <Callout title="How this feeds the other three">
            <p style={{ marginBottom: 0 }}>
              The athlete front sells nothing — it <strong>finances</strong> the rest. Capacity and
              recovery are what let the operator hold composure through a losing week and a hard LP
              call in the same day; the aesthetic is presence walking into the room before the pitch
              starts. This is the one front whose KPIs are allowed to be non-monetary, because its
              return is paid to every other module at once.
            </p>
          </Callout>

          <KpiTable caption="Athlete KPIs — in priority order" rows={ATHLETE_KPIS} />

          <DeepLinks
            links={[
              { label: 'Operating State — Body, Mind & Soul', href: '/mastery-pyramid.html#d-state' },
              { label: 'The Mastery Pyramid', href: '/mastery-pyramid.html' },
            ]}
          />
        </Section>

        <Colophon />
      </div>
    </div>
  )
}
