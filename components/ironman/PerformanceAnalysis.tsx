'use client'

/**
 * Belgrade 70.3 — performance analysis.
 *
 * A post-mortem, not a plan: it changes when a race happens, which is why it
 * lives on its own tab rather than inside the training sheet.
 *
 * The page is one race read through two lenses. Aidas was scored against a
 * written document; Lori was scored against her own logged sessions, because
 * there was no document. Those are different questions and they produce
 * different tables, so the page toggles rather than laying them side by side —
 * a shared table would have to invent a standard for one of them.
 *
 * Everything above the toggle is the race itself and belongs to neither read.
 */

import { useState } from 'react'
import {
  Seam, FieldCard, Sub, Foot, Chip, Hover, Ticker, Disclosure, Tearsheet, SectionHead,
  type SheetRow,
} from '@/components/lordas/design/primitives'
import { SportIcon } from '@/components/ironman/IronmanIcons'
import {
  DEBRIEF_RACE, LEGS, OFFICIAL, GAP_SEC, ATHLETE, LENSES, ENERGY, ENERGY_TOTAL,
  CARB_BUDGET, TRIMP, TRIMP_TOTAL, TRAINING_STATUS, HISTORY, KOTOR_CAVEAT, OPEN_QUESTIONS,
  type Lens,
} from '@/lib/ironman/debrief'
import { eliteResult, eliteDisplay } from '@/lib/ironman/plan'
import '@/components/lordas/design/console.css'
import './ironsheet.css'

const OK = 'var(--lordas-ok)'
const WARN = 'var(--lordas-warn)'
const CRIT = 'var(--lordas-crit)'
const FAINT = 'var(--lordas-faint)'

function clock(sec: number): string {
  const a = Math.abs(Math.round(sec))
  const h = Math.floor(a / 3600)
  const m = Math.floor((a % 3600) / 60)
  const s = a % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

/** A signed gap reads as its sign: time gained is a win, time lost is a cost. */
function signed(sec: number): { text: string; color: string } {
  const r = Math.round(sec)
  if (r === 0) return { text: '—', color: FAINT }
  return { text: `${r > 0 ? '+' : '−'}${clock(r)}`, color: r > 0 ? CRIT : OK }
}

const TONE: Record<string, string | undefined> = { ok: OK, warn: WARN, crit: CRIT, none: undefined }

// ── The race ──────────────────────────────────────────────────────────────

/**
 * Both races on one clock. Share of gap is the column that matters: it says
 * which leg the fifty-eight minutes actually came from, which no pair of raw
 * splits ever says on its own.
 */
function RaceGapSheet() {
  const rows: SheetRow[] = LEGS.map((l) => {
    const d = l.loriSec - l.aidasSec
    const g = signed(d)
    return {
      label: l.leg,
      cells: [
        clock(l.aidasSec),
        clock(l.loriSec),
        <span key="g" style={{ color: g.color }}>{g.text}</span>,
        <span key="s" style={{ color: g.color }}>{((d / GAP_SEC) * 100).toFixed(1)}%</span>,
      ],
    }
  })

  rows.push({
    label: 'Total — official',
    emphasis: true,
    cells: [clock(OFFICIAL.aidasSec), clock(OFFICIAL.loriSec), `+${clock(GAP_SEC)}`, '100%'],
  })

  return (
    <Tearsheet
      columns={[
        { key: 'a', label: 'Aidas' },
        { key: 'l', label: 'Lori' },
        { key: 'g', label: 'Gap' },
        { key: 's', label: 'Share of gap' },
      ]}
      rows={rows}
    />
  )
}

/**
 * The winners of both categories on the same course, as multiples.
 *
 * A raw elite split says little — everyone is slower than the winner. The
 * multiple is what ranks the legs: a swim at 1.7x the winner and a bike at
 * 1.4x are not the same problem, and the raw times never say which is which.
 */
function EliteSheet() {
  const men = eliteResult('men')
  const women = eliteResult('women')
  if (!men || !women) return null

  const legs = [
    { key: 'Swim', e: (w: typeof men) => w.swimSec, a: LEGS[0].aidasSec, l: LEGS[0].loriSec },
    { key: 'Bike', e: (w: typeof men) => w.bikeSec, a: LEGS[2].aidasSec, l: LEGS[2].loriSec },
    { key: 'Run', e: (w: typeof men) => w.runSec, a: LEGS[4].aidasSec, l: LEGS[4].loriSec },
  ]

  const ratio = (own: number, elite: number) => own / elite
  const ratioColor = (r: number) => (r < 1.3 ? OK : r < 1.7 ? WARN : CRIT)

  const rows: SheetRow[] = legs.map((leg) => {
    const rm = ratio(leg.a, leg.e(men))
    const rw = ratio(leg.l, leg.e(women))
    return {
      label: leg.key,
      cells: [
        clock(leg.e(men)),
        <span key="a" style={{ color: ratioColor(rm) }}>{rm.toFixed(2)}x</span>,
        clock(leg.e(women)),
        <span key="l" style={{ color: ratioColor(rw) }}>{rw.toFixed(2)}x</span>,
      ],
    }
  })

  rows.push({
    label: 'Finish',
    emphasis: true,
    cells: [
      clock(men.totalSec),
      `${(OFFICIAL.aidasSec / men.totalSec).toFixed(2)}x`,
      clock(women.totalSec),
      `${(OFFICIAL.loriSec / women.totalSec).toFixed(2)}x`,
    ],
  })

  const dm = eliteDisplay(men)
  const dw = eliteDisplay(women)

  return (
    <>
      <Tearsheet
        columns={[
          { key: 'm', label: men.name },
          { key: 'am', label: 'Aidas ÷' },
          { key: 'w', label: women.name },
          { key: 'lw', label: 'Lori ÷' },
        ]}
        rows={rows}
      />
      <Sub>
        {men.name} won the men&apos;s race in {clock(men.totalSec)} — {clock(dm.swimSecPer100m)}/100m,{' '}
        {dm.bikeKmh.toFixed(1)} km/h, {clock(dm.runMinPerKm * 60)}/km. {women.name} won the women&apos;s in{' '}
        {clock(women.totalSec)} — {clock(dw.swimSecPer100m)}/100m, {dw.bikeKmh.toFixed(1)} km/h,{' '}
        {clock(dw.runMinPerKm * 60)}/km. Same water, same road, same morning.
      </Sub>
      <Sub>
        The swim is the closest leg on both cards and the bike the furthest. That ordering, not the
        absolute times, is the useful part — it is the same ranking both lenses below arrive at from
        their own evidence.
      </Sub>
    </>
  )
}

// ── One lens ──────────────────────────────────────────────────────────────

function LensPanel({ lens }: { lens: Lens }) {
  const a = LENSES[lens]
  const who = ATHLETE[lens].name

  const scoreRows: SheetRow[] = a.score.map((r) => ({
    label: r.leg,
    cells: [
      r.expected,
      r.stretch ?? '—',
      r.actual,
      <span key="v" style={{ color: TONE[r.tone] }}>{r.verdict}</span>,
    ],
    emphasis: r.leg === 'Finish',
  }))

  const leverRows: SheetRow[] = a.levers.map((l) => ({
    label: l.lever,
    cells: [l.worth, l.cost, <span key="w" style={{ fontWeight: 400 }}>{l.why}</span>],
  }))

  return (
    <>
      <FieldCard label={`${who} · the read`} tone="accent">
        <div className="font-serif text-[15px] md:text-[17px] text-iron-deep leading-snug mb-1">
          {a.card.headline}
        </div>
        <Sub>{a.card.verdict}</Sub>
        <Foot>Measured against — {a.card.standard}</Foot>
      </FieldCard>

      <FieldCard label={a.scoreTitle}>
        <Tearsheet
          columns={[
            { key: 'e', label: lens === 'aidas' ? 'Plan band' : 'Best comparable' },
            { key: 's', label: 'Stretch' },
            { key: 'a', label: 'Actual' },
            { key: 'v', label: 'Verdict' },
          ]}
          rows={scoreRows}
        />
        <Sub>{a.scoreNote}</Sub>
      </FieldCard>

      <FieldCard label="Findings" meta={`${a.findings.length} · in the order they cost time`}>
        {a.findings.map((f) => (
          <Disclosure key={f.title} summary={f.title} meta={f.tag}>
            {f.body.map((p, i) => <Sub key={i}>{p}</Sub>)}
          </Disclosure>
        ))}
      </FieldCard>

      <FieldCard label="Improvement, ranked by minutes per unit of effort">
        <Tearsheet
          columns={[
            { key: 'w', label: 'Worth' },
            { key: 'c', label: 'Cost' },
            { key: 'y', label: 'Why' },
          ]}
          rows={leverRows}
        />
        {a.notOnTheList && <Foot>Not on the list, deliberately — {a.notOnTheList}</Foot>}
      </FieldCard>
    </>
  )
}

// ── Shared evidence ───────────────────────────────────────────────────────

function EnergyCard() {
  const rows: SheetRow[] = ENERGY.map((e) => ({
    label: e.leg,
    cells: [e.aidas, e.aidasRate, e.lori, e.loriRate, <span key="m" style={{ fontWeight: 400 }}>{e.method}</span>],
  }))
  rows.push({
    label: 'Race total',
    emphasis: true,
    cells: [
      ENERGY_TOTAL.aidas, ENERGY_TOTAL.aidasRate, ENERGY_TOTAL.lori, ENERGY_TOTAL.loriRate,
      <span key="n" style={{ fontWeight: 400, color: WARN }}>{ENERGY_TOTAL.note}</span>,
    ],
  })

  return (
    <FieldCard label="The energy budget" meta="kcal · rebuilt from published equations">
      <Tearsheet
        columns={[
          { key: 'a', label: 'Aidas' },
          { key: 'ar', label: 'Rate' },
          { key: 'l', label: 'Lori' },
          { key: 'lr', label: 'Rate' },
          { key: 'm', label: 'Method' },
        ]}
        rows={rows}
      />
      <Sub>
        The bike and the run cost almost exactly the same — 41% and 42% of the day for both athletes,
        which is not what a 2:48 bike and a 2:02 run look like on the clock, and is the reason a
        run-focused block was the right call.
      </Sub>
      <Disclosure summary="The carbohydrate budget" meta="~905 g required">
        <Tearsheet
          columns={[
            { key: 'p', label: 'As planned' },
            { key: 'a', label: 'If three feeds' },
            { key: 'n', label: 'Note' },
          ]}
          rows={CARB_BUDGET.map((c) => ({
            label: c.source,
            emphasis: c.source === 'Available',
            cells: [c.planned, c.actual, <span key="n" style={{ fontWeight: 400 }}>{c.note}</span>],
          }))}
        />
        <Sub>
          Executed as written, the plan finishes with about 160 g of carbohydrate in hand — not
          comfortable, but positive. At the intake the power trace implies, availability lands at or
          just below the requirement, and the shortfall arrives once the stores are drawn down: the
          back half of the bike. That is exactly where the power went.
        </Sub>
        <Sub>
          This does not prove the fade was fuel — the arithmetic is a budget, not a measurement, and
          the store estimates carry ±20% easily. What it establishes is that the 75–80 g/h target was
          not padding. Half of it is not half a plan; it is no margin at all.
        </Sub>
      </Disclosure>
    </FieldCard>
  )
}

function LoadCard() {
  const rows: SheetRow[] = TRIMP.map((t) => ({
    label: t.leg,
    cells: [t.aidas, t.aidasPerHour, t.aidasHrr, t.lori, t.loriPerHour, t.loriHrr],
  }))
  rows.push({
    label: 'Race',
    emphasis: true,
    cells: [TRIMP_TOTAL.aidas, TRIMP_TOTAL.aidasPerHour, '—', TRIMP_TOTAL.lori, TRIMP_TOTAL.loriPerHour, '—'],
  })

  return (
    <FieldCard label="Training load" meta="Banister TRIMP, each athlete's own HR reserve">
      <Tearsheet
        columns={[
          { key: 'a', label: 'Aidas' },
          { key: 'ah', label: '/h' },
          { key: 'ap', label: '%HRR' },
          { key: 'l', label: 'Lori' },
          { key: 'lh', label: '/h' },
          { key: 'lp', label: '%HRR' },
        ]}
        rows={rows}
      />
      <Sub>
        Lori&apos;s race carried 22% more training load than Aidas&apos;s despite producing less than
        two-thirds of the mechanical work, because TRIMP scores against heart-rate reserve rather than
        watts. She spent longer at a higher fraction of her own ceiling on every leg but the run.
      </Sub>
      <Disclosure summary="What it did to their training status">
        <Tearsheet
          columns={[
            { key: 'b', label: 'Acute, Sep 12' },
            { key: 'a', label: 'Sep 13' },
            { key: 'c', label: 'Chronic' },
            { key: 'f', label: 'Form (TSB)' },
            { key: 'r', label: 'Read' },
          ]}
          rows={TRAINING_STATUS.map((t) => ({
            label: t.who,
            cells: [t.acuteBefore, t.acuteAfter, t.chronic, t.form, <span key="r" style={{ fontWeight: 400 }}>{t.read}</span>],
          }))}
        />
      </Disclosure>
      <Disclosure summary="Two reasons not to read Garmin's own numbers here">
        <Sub>
          Aerobic Training Effect saturates. The FIT records it as a running total, not per leg, and it
          tops out at 5.0. Lori reached the ceiling in the water, 45 minutes into a 6:52 race, and the
          metric then had nothing to say about the remaining six hours. Both finished at exactly 5.0 —
          the same score a hard two-hour ride earns.
        </Sub>
        <Sub>
          And the activity load double-counts: Garmin logged 515 for Lori&apos;s multisport and 343 for
          the Edge recording of the same bike leg. Summing them inflates her day by two-thirds.
        </Sub>
      </Disclosure>
    </FieldCard>
  )
}

function HistoryCard() {
  return (
    <FieldCard label="Lori · five 70.3s, 2022 to 2026" meta="device splits, one basis">
      <Tearsheet
        columns={[
          { key: 's', label: 'Swim' },
          { key: 't1', label: 'T1' },
          { key: 'b', label: 'Bike' },
          { key: 't2', label: 'T2' },
          { key: 'r', label: 'Run' },
          { key: 'tot', label: 'Total' },
        ]}
        rows={HISTORY.map((r) => ({
          label: (
            <Hover
              align="left"
              panel={
                <>
                  <div className="hd">{r.race}</div>
                  <div className="k"><span>Date</span><b>{r.date}</b></div>
                  <div className="k"><span>Swim pace</span><b>{r.swimPace}</b></div>
                  <div className="k"><span>Bike speed</span><b>{r.bikeSpeed}</b></div>
                  <div className="k"><span>Run pace</span><b>{r.runPace}</b></div>
                  {r.note && <div className="k"><span>Note</span><b>{r.note}</b></div>}
                </>
              }
            >
              {r.race.split(',')[0]} {r.date.slice(0, 4)}
            </Hover>
          ),
          emphasis: r.date === '2026-09-13',
          cells: [r.swim, r.t1, r.bike, r.t2, r.run, r.total],
        }))}
      />
      <Sub>
        Belgrade is her second-fastest complete 70.3, four minutes behind Wilmington — whose swim was
        fifteen minutes quicker at 1:57/100m, a pace that says tidal current rather than form. The bike
        is transformed: 26.3 km/h against a previous best of 24.8, fourteen minutes quicker, at heart
        rate 147 where Wilmington cost her 159.
      </Sub>
      <Disclosure summary="Kotor is not a 5:59 half-iron">
        <Sub>{KOTOR_CAVEAT}</Sub>
      </Disclosure>
    </FieldCard>
  )
}

function QuestionsCard({ lens }: { lens: Lens }) {
  const mine = OPEN_QUESTIONS.filter((q) => q.who === lens || q.who === 'both')
  return (
    <FieldCard label="What the files can't tell us" meta={`${mine.length} open · ${OPEN_QUESTIONS.length} in total`}>
      <Sub>
        Several conclusions above are hypotheses the data supports rather than facts. These are the
        answers that would settle them, in the order they would change the page.
      </Sub>
      {mine.map((q) => (
        <Disclosure key={q.n} summary={q.question} meta={q.n}>
          <Sub>{q.why}</Sub>
        </Disclosure>
      ))}
    </FieldCard>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PerformanceAnalysis() {
  const [lens, setLens] = useState<Lens>('lori')

  return (
    <div className="iron-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Ticker
        items={[
          { label: 'Race', value: `${DEBRIEF_RACE.venue} · ${DEBRIEF_RACE.date}` },
          { label: 'Distance', value: `${DEBRIEF_RACE.swimKm} / ${DEBRIEF_RACE.bikeKm} / ${DEBRIEF_RACE.runKm} km` },
          { label: 'Conditions', value: `water ${DEBRIEF_RACE.waterC} °C · air ${DEBRIEF_RACE.airFromC} → ${DEBRIEF_RACE.airToC} °C` },
          { label: 'Aidas', value: clock(OFFICIAL.aidasSec) },
          { label: 'Lori', value: clock(OFFICIAL.loriSec) },
          { label: 'Gap', value: clock(GAP_SEC), color: WARN },
        ]}
      />

      <Seam cols={1}>
        <FieldCard
          label="Where the fifty-eight minutes went"
          meta={`${ATHLETE.aidas.kg} kg · ${ATHLETE.lori.kg} kg`}
          tone="accent"
        >
          <Sub>
            Leg by leg from the FIT files and the bike computers, not the Connect summary. Lori left T1
            seven minutes and eight seconds ahead, and then lost 64:56 across the bike, T2 and the run.
          </Sub>
          <RaceGapSheet />
          <Foot>
            Gap is Lori minus Aidas; a negative number is time she gained. Both watches were started
            about 33 seconds before the timing mat, so the legs sum 32–33 s long against the official
            finish.
          </Foot>
          <Disclosure summary="Against the winners" meta="men's and women's, same course">
            <EliteSheet />
          </Disclosure>
        </FieldCard>
      </Seam>

      <SectionHead
        title="The two reads"
        meta={lens === 'lori' ? 'scored against her own sessions' : 'scored against IRONMAN_PREP.md'}
        right={
          <span style={{ display: 'inline-flex', gap: 4 }}>
            {(['lori', 'aidas'] as const).map((l) => (
              <Chip
                key={l}
                active={lens === l}
                onClick={() => setLens(l)}
                title={LENSES[l].card.standard}
              >
                {ATHLETE[l].name}
              </Chip>
            ))}
          </span>
        }
      />

      <Seam cols={1}>
        <LensPanel lens={lens} />
      </Seam>

      <SectionHead title="Shared evidence" meta="one method, both athletes" />

      <Seam cols={1}>
        <EnergyCard />
        <LoadCard />
        {lens === 'lori' && <HistoryCard />}
        <QuestionsCard lens={lens} />
      </Seam>

      <Foot>
        Built from the race-day FIT files and the bike computers. Where Garmin&apos;s own figure
        disagrees — the calorie model, the activity load, Aerobic Training Effect, the FTP the watch
        changed six days out — the disagreement is stated where it occurs rather than quietly
        corrected. Source: Belgrade 70.3 Debrief, Aidas, September 2026.
      </Foot>
    </div>
  )
}
