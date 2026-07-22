import { ColumnHeading, Card, CardTitle, Tag } from './shared'
import { MUTED, INK, SAGE, TERRACOTTA, RULE } from '../goals-theme'

interface Loop {
  label: string
  distance: string
  route: string
  stops: string[]
}

interface DayPlan {
  day: string
  title: string
  short: Loop
  long: Loop
}

const DAYS: DayPlan[] = [
  {
    day: 'Aug 8',
    title: 'North Coast & Dyrehaven',
    short: {
      label: 'Short loop',
      distance: '~48 km / 30 mi',
      route: 'Center → the Lakes → Hellerup Harbor → Charlottenlund Fort → Bellevue Beach → Klampenborg → Dyrehaven (Eremitageslottet loop) → back via Ordrup',
      stops: [
        'Charlottenlund Fort — beach + old coastal battery, easy first stop',
        'Bellevue Beach — swim break, café on the sand',
        'Peter Liep\'s Hus — forest lunch inside Dyrehaven, deer wandering nearby',
      ],
    },
    long: {
      label: 'Long loop',
      distance: '~95 km / 60 mi',
      route: 'Same start, continue north past Rungsted Havn to Louisiana Museum of Modern Art in Humlebæk (~35 km one way), return the same coastal path',
      stops: [
        'Rungsted Havn — harborside break',
        'Louisiana Museum — sculpture garden + café terrace over the Øresund',
        'Bellevue Beach — second swim stop on the way back',
      ],
    },
  },
  {
    day: 'Aug 9',
    title: 'South to Dragør & Amager',
    short: {
      label: 'Short loop',
      distance: '~48 km / 30 mi',
      route: 'Center → Amager Strandpark → The Blue Planet (east side, ~16 km) → Dragør old town → back via Kalvebod Fælled (west side, ~25 km) with a Kongelunden forest detour',
      stops: [
        'Amager Strandpark — beach path, passes the kite launch',
        'Kastrup Søbad ("the Snail") — sea-bath swim stop',
        'Dragør — cobbled harbor town, thatched cottages, lunch',
        'Kongelunden — forest picnic on the way back',
      ],
    },
    long: {
      label: 'Long loop',
      distance: '~95 km / 60 mi',
      route: 'Extend the short loop with an inland pass through Store Magleby\'s farmhouses, then thread home via Frederiksberg Gardens and Superkilen for a rolling sightseeing finish',
      stops: [
        'Store Magleby — historic Dutch farming village',
        'Frederiksberg Gardens — shaded rest, canal view',
        'Superkilen — pink park, last stretch back into Nørrebro',
      ],
    },
  },
]

function LoopBlock({ loop, color }: { loop: Loop; color: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color }}>
          {loop.label}
        </p>
        <Tag color={color}>{loop.distance}</Tag>
      </div>
      <p className="text-[10px] leading-snug mb-1.5" style={{ color: INK }}>
        {loop.route}
      </p>
      {loop.stops.map((s) => (
        <p key={s} className="text-[10px] leading-snug pl-3 relative mb-0.5" style={{ color: MUTED }}>
          <span className="absolute left-0" style={{ color }}>·</span>
          {s}
        </p>
      ))}
    </div>
  )
}

export function CyclingColumn() {
  return (
    <div>
      <ColumnHeading title="Cycling" subtitle="30 mi / 60 mi options, each day" />
      {DAYS.map((d, i) => (
        <Card key={d.day} accent={i === 0 ? TERRACOTTA : SAGE}>
          <div className="flex items-center justify-between mb-2">
            <CardTitle>{d.title}</CardTitle>
            <Tag color={i === 0 ? TERRACOTTA : SAGE}>{d.day}</Tag>
          </div>
          <LoopBlock loop={d.short} color={i === 0 ? TERRACOTTA : SAGE} />
          <div className="border-t my-2" style={{ borderColor: RULE }} />
          <LoopBlock loop={d.long} color={i === 0 ? TERRACOTTA : SAGE} />
        </Card>
      ))}
      <p className="text-[10px] leading-snug italic" style={{ color: MUTED }}>
        Distances are approximate — pull the exact GPX on Komoot or Strava the morning of, and pick short vs. long based on the wind read from the kiting column.
      </p>
    </div>
  )
}
