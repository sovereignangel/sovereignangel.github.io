'use client'

/**
 * The Races half: Belgrade 70.3, read as Lori's race alone.
 *
 * Four panels on one seam. The race against the winner of her category — the
 * one outsider kept, because a reference from the front of the field is what
 * makes a split mean anything. The read against her own best comparable
 * sessions. What the day cost and what went in. And every half-iron she has
 * raced, ranked by colour. Every argument behind those numbers sits in a
 * detail drawer rather than under the tables.
 */

import {
  Seam, FieldCard, Lede, Sub, Hover, Ticker, Disclosure, Tearsheet, type SheetRow,
} from '@/components/lordas/design/primitives'
import { DetailTrigger, DrawerRule } from '@/components/lordas/design/DetailPanel'
import { PerfTabs, type PerfSection } from './PerfTabs'
import { RaceProgression } from './RaceProgression'
import type { PerfRace } from './types'
import { CRIT, FAINT, INK, MUTED, OK, WARN, clock, ratioColor, signedClock } from './format'

const TONE: Record<string, string> = { ok: OK, warn: WARN, crit: CRIT, none: INK }

function RaceSheet({ race }: { race: PerfRace }) {
  const { legs, elite } = race
  const rows: SheetRow[] = legs.map((l) => ({
    label: l.leg,
    emphasis: l.leg === 'Finish',
    cells: [
      clock(l.sec),
      l.vsBestSec == null ? <span key="b" style={{ color: FAINT }}>—</span> : (
        <Hover
          key="b"
          panel={
            <>
              <div className="hd">{l.leg} · previous best</div>
              <div className="k"><span>Before Belgrade</span><b>{l.prevBestSec != null ? clock(l.prevBestSec) : '—'}</b></div>
              <div className="k"><span>Belgrade</span><b>{clock(l.sec)}</b></div>
            </>
          }
        >
          <span style={{ color: l.vsBestSec <= 0 ? OK : CRIT }}>{signedClock(l.vsBestSec)}</span>
        </Hover>
      ),
      <span key="e" style={{ color: MUTED }}>{l.eliteSec != null ? clock(l.eliteSec) : '—'}</span>,
      l.vsEliteSec == null ? <span key="g" style={{ color: FAINT }}>—</span> : (
        <span key="g" style={{ color: ratioColor(l.eliteRatio) }}>
          {signedClock(l.vsEliteSec)}
          {l.eliteRatio != null && (
            <span style={{ color: FAINT, fontWeight: 400 }}> {l.eliteRatio.toFixed(2)}x</span>
          )}
        </span>
      ),
    ],
  }))

  return (
    <Tearsheet
      className="is-dense"
      columns={[
        { key: 'own', label: race.athlete.name },
        { key: 'pb', label: 'vs prev best' },
        {
          key: 'w',
          label: elite ? (
            <Hover
              panel={
                <>
                  <div className="hd">{elite.name} · women&apos;s winner</div>
                  <div className="k"><span>Swim</span><b>{elite.swimPace}</b></div>
                  <div className="k"><span>Bike</span><b>{elite.bikeSpeed}</b></div>
                  <div className="k"><span>Run</span><b>{elite.runPace}</b></div>
                  <div className="k"><span>Transitions</span><b>{clock(elite.transitionSec)}</b></div>
                </>
              }
            >
              {elite.name.split(' ').slice(-1)[0]}
            </Hover>
          ) : 'Winner',
        },
        { key: 'm', label: 'vs winner' },
      ]}
      rows={rows}
    />
  )
}

function ReadCard({ read }: { read: PerfRace['read'] }) {
  return (
    <FieldCard
      span={2}
      label="The read"
      meta={
        <DetailTrigger
          label={`Findings · ${read.findings.length}`}
          title="Findings, and what to do about them"
          meta="In the order they cost time"
        >
          <Sub>{read.headline}</Sub>
          <Sub>Measured against {read.standard.charAt(0).toLowerCase()}{read.standard.slice(1)}</Sub>
          {read.findings.map((f) => (
            <Disclosure key={f.title} summary={f.title} meta={f.tag} open>
              {f.body.map((p, i) => <Sub key={i}>{p}</Sub>)}
            </Disclosure>
          ))}
          <DrawerRule>Improvement, ranked</DrawerRule>
          <Sub>By what each is worth on a 70.3 finish, not by how satisfying it is to train.</Sub>
          {read.levers.map((l) => (
            <div key={l.lever} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: INK, marginBottom: 1 }}>
                {l.lever} — <span className="lordas-mono" style={{ color: OK }}>{l.worth}</span>
                <span style={{ color: MUTED }}> · {l.cost}</span>
              </div>
              <Sub>{l.why}</Sub>
            </div>
          ))}
          {read.notOnTheList && <Sub>Not on the list, deliberately: {read.notOnTheList}</Sub>}
          {read.note && <Sub>{read.note}</Sub>}
        </DetailTrigger>
      }
    >
      <Lede>{read.headline}</Lede>
      <div className="iron-read">
        {read.rows.map((r) => (
          <div key={r.leg} className="iron-read-row">
            <span className="iron-read-leg">{r.leg}</span>
            <span className="iron-read-verdict" style={{ color: TONE[r.tone] }}>{r.verdict}</span>
            <Hover
              panel={
                <>
                  <div className="hd">{r.leg} · best comparable</div>
                  <div style={{ fontSize: 11, lineHeight: 1.4 }}>{r.expected}</div>
                </>
              }
            >
              <span className="lordas-mono iron-read-actual">{r.actual}</span>
            </Hover>
          </div>
        ))}
      </div>
    </FieldCard>
  )
}

function EnergyCard({ fuel }: { fuel: PerfRace['fuel'] }) {
  const dash = <span style={{ color: FAINT }}>—</span>
  const vs = (value: React.ReactNode, target: string) => (
    <span className="vs">
      {value}
      {target && target !== '—' && <span className="vs-t">{target}</span>}
    </span>
  )

  const rows: SheetRow[] = fuel.rows.map((r) => ({
    label: r.phase,
    cells: [
      vs(r.carbs == null || r.carbs === 0 ? dash : r.carbs, r.carbTargetG),
      vs(r.carbRate ?? dash, r.carbTarget),
      vs(r.caffeine == null || r.caffeine === 0 ? dash : r.caffeine, r.caffeineTarget),
      vs(r.kcal ?? dash, r.kcalPerHour ? `${r.kcalPerHour}/h` : ''),
      vs(r.trimp ?? dash, r.hrr ? `${r.hrr}% HRR` : ''),
    ],
  }))
  rows.push({
    label: 'Race',
    emphasis: true,
    cells: [
      vs(fuel.carbTotal ?? dash, fuel.carbTargetTotal),
      dash,
      vs(
        fuel.caffeineTotal == null ? dash : (
          <span style={{ color: fuel.caffeineOver ? CRIT : OK }}>{fuel.caffeineTotal}</span>
        ),
        fuel.caffeineTargetTotal
      ),
      vs(fuel.kcalTotal, `${fuel.kcalPerHourTotal}/h`),
      fuel.trimpTotal,
    ],
  })

  return (
    <FieldCard
      span={2}
      label="Fuel, cost and load"
      meta={
        <DetailTrigger title="Energy, load and fuel" meta="Method and caveats">
          <Sub><b>Fuel.</b> {fuel.verdict}</Sub>
          {fuel.gut && <Sub><b>What the gut accepted.</b> {fuel.gut}</Sub>}
          <Sub>
            The figure under each value is the target. A zero is deliberate: nothing should be
            swallowed in the water or in either transition.
            {fuel.caffeineTargetMgPerKg != null && (
              <> The caffeine ceiling of {fuel.caffeineTargetTotal} mg is {fuel.caffeineTargetMgPerKg} mg/kg, against an ergogenic window of 3–6.</>
            )}
          </Sub>
          <Sub>{fuel.basis}</Sub>
          {fuel.rows.filter((r) => r.note).map((r) => (
            <div key={r.phase} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: INK }}>{r.phase}</div>
              <Sub>{r.note}</Sub>
            </div>
          ))}

          <DrawerRule>Energy budget</DrawerRule>
          <Sub>
            Rebuilt from published equations rather than Garmin&apos;s heart-rate model — power and
            gross efficiency on the bike, the ACSM running equation on the run, compendium METs in
            the water.
          </Sub>
          {fuel.energyMethod.map((e) => (
            <div key={e.leg} style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 12, color: INK }}>{e.leg}</div>
              <Sub>{e.method}</Sub>
            </div>
          ))}
          {fuel.energyNote && <Sub>{fuel.energyNote}</Sub>}

          <DrawerRule>Training load</DrawerRule>
          <Sub>
            Banister TRIMP from her own resting and maximum heart rate, because Garmin&apos;s own
            scores for this race either saturate or double-count.
          </Sub>
          {fuel.load && (
            <Sub>
              Acute load {fuel.load.acuteBefore} → {fuel.load.acuteAfter}, chronic {fuel.load.chronic},
              form {fuel.load.form}. {fuel.load.read}
            </Sub>
          )}
          <Disclosure summary="Two reasons not to read Garmin's own numbers" open>
            {fuel.garminCaveats.map((c, i) => <Sub key={i}>{c}</Sub>)}
          </Disclosure>
        </DetailTrigger>
      }
    >
      <Tearsheet
        className="is-dense"
        columns={[
          { key: 'carbs', label: 'Carbs g' },
          { key: 'gh', label: 'g/h' },
          { key: 'caf', label: 'Caff mg' },
          { key: 'kcal', label: 'kcal' },
          { key: 'trimp', label: 'TRIMP' },
        ]}
        rows={rows}
      />
    </FieldCard>
  )
}

function HistoryCard({ history }: { history: PerfRace['history'] }) {
  const n = history.races.length
  return (
    <FieldCard
      span={2}
      label="Race comps"
      meta={
        <DetailTrigger
          title="Reading the table"
          meta={n > 1 ? `${n} races · ${history.races[0].date.slice(0, 4)}–${history.races[n - 1].date.slice(0, 4)}` : 'One finish'}
        >
          <Sub>
            Shaded best to worst within each row. vs best is {history.latest} against her fastest
            before it.
          </Sub>
          {history.reading.map((p, i) => <Sub key={i}>{p}</Sub>)}
          {history.footnotes.length > 0 && <DrawerRule>The marked cells</DrawerRule>}
          {history.footnotes.map((p, i) => <Sub key={i}>{p}</Sub>)}
        </DetailTrigger>
      }
    >
      <RaceProgression history={history} />
    </FieldCard>
  )
}

function QuestionsTrigger({ questions }: { questions: PerfRace['questions'] }) {
  if (!questions.length) return null
  return (
    <DetailTrigger label={`Open · ${questions.length}`} title="What the files can't tell us" meta="In the order they would change the page">
      <Sub>
        Several conclusions on this page are hypotheses the data supports rather than facts. These
        are the answers that would settle them.
      </Sub>
      {questions.map((q) => (
        <div key={q.n} style={{ marginBottom: 9 }}>
          <div style={{ fontSize: 12, color: INK, marginBottom: 1 }}>
            <span className="lordas-mono" style={{ color: MUTED, marginRight: 6 }}>{q.n}</span>
            {q.question}
          </div>
          <Sub>{q.why}</Sub>
        </div>
      ))}
    </DetailTrigger>
  )
}

export function RaceSection({
  race,
  section,
  onSection,
}: {
  race: PerfRace
  section: PerfSection
  onSection: (s: PerfSection) => void
}) {
  const r = race.race
  const short = r.name.replace(/^MTS\s+/, '').replace(/^Ironman\s+/i, '')
  return (
    <>
      <PerfTabs
        section={section}
        onSection={onSection}
        right={
          <>
            <span className="iron-perf-stats">Scored against her own sessions</span>
            <QuestionsTrigger questions={race.questions} />
          </>
        }
      />
      <Ticker
        items={[
          { label: 'Race', value: `${short} · ${r.date}` },
          { label: 'Distance', value: `${r.swimKm} / ${r.bikeKm} / ${r.runKm} km` },
          { label: 'Conditions', value: `water ${r.waterC} °C · air ${r.airFromC} → ${r.airToC} °C` },
          { label: race.athlete.name, value: clock(race.athlete.finishSec) },
          { label: 'Weight', value: `${race.athlete.kg} kg` },
        ]}
      />
      <Seam cols={4}>
        <FieldCard
          span={2}
          label="Race day against the winner"
          tone="accent"
          meta={
            <DetailTrigger title="Reading the race table" meta={race.elite ? `Against ${race.elite.name}` : 'Method'}>
              {race.sheetNotes.map((p, i) => <Sub key={i}>{p}</Sub>)}
            </DetailTrigger>
          }
        >
          <RaceSheet race={race} />
        </FieldCard>
        <ReadCard read={race.read} />
        <EnergyCard fuel={race.fuel} />
        <HistoryCard history={race.history} />
      </Seam>
    </>
  )
}
