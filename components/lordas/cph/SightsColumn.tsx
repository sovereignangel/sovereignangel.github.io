import { ColumnHeading, Card, CardTitle, Tag } from './shared'
import { MUTED, INK, SAGE, AMBER, ROSE } from '../goals-theme'

interface Item {
  name: string
  note: string
  tag: string
}

const MUSEUMS: Item[] = [
  { name: 'SMK — National Gallery', note: '700 years of Danish & European art, free permanent collection', tag: 'Museum' },
  { name: 'Cisterns', note: 'immersive underground art space in a former water reservoir', tag: 'Museum' },
  { name: 'Design Museum Denmark', note: 'Danish design lineage, chairs to ceramics', tag: 'Museum' },
]

const PARKS: Item[] = [
  { name: 'Frederiksberg Gardens', note: 'rococo park, hilltop palace, canal rowboats, zoo elephants at the wall', tag: 'Park' },
  { name: 'Superkilen', note: 'Nørrebro — zig-zag pink park with objects from 60 countries', tag: 'Park' },
  { name: "Kongens Have (King's Garden)", note: 'Rosenborg Castle grounds, shaded lawns', tag: 'Park' },
  { name: 'Naturpark Amager', note: 'wild heath & wetland reserve — also the south cycling corridor', tag: 'Park' },
]

const COFFEE: Item[] = [
  { name: 'Coffee Collective', note: 'Jægersborggade 57 flagship, Nørrebro — since 2008', tag: 'Coffee' },
  { name: 'La Cabra', note: 'Møntergade, inside Another Aspect — crisp bright brews', tag: 'Coffee' },
  { name: 'Prolog Coffee Bar', note: 'Vesterbro / Frederiksberg / Papirøen — single-origin, slow bar', tag: 'Coffee' },
  { name: 'April Coffee', note: 'Østerbro — Danish design meets Japanese minimalism', tag: 'Coffee' },
]

const VINTAGE: Item[] = [
  { name: 'Jægersborggade', note: 'Nørrebro — ~40 galleries/design studios incl. Tú a Tú vintage, right by Coffee Collective', tag: 'Vintage' },
  { name: 'Elmegade', note: 'Nørrebro — Fremtiden (Red Cross) at the Nørrebrogade corner', tag: 'Vintage' },
  { name: 'Prag Secondhand', note: 'Nørrebrogade — huge vintage selection', tag: 'Vintage' },
  { name: 'Ravnsborggade', note: 'Nørrebro antiques strip', tag: 'Vintage' },
]

const TAG_COLOR: Record<string, string> = { Museum: SAGE, Park: SAGE, Coffee: AMBER, Vintage: ROSE }

function ItemRow({ item }: { item: Item }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[12px] font-medium" style={{ color: INK }}>
        {item.name}
      </p>
      <p className="text-[10px] leading-snug" style={{ color: MUTED }}>
        {item.note}
      </p>
    </div>
  )
}

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <Card accent={TAG_COLOR[items[0]?.tag] ?? MUTED}>
      <div className="flex items-center justify-between mb-2">
        <CardTitle>{title}</CardTitle>
        <Tag color={TAG_COLOR[items[0]?.tag] ?? MUTED}>{items[0]?.tag}</Tag>
      </div>
      {items.map((item) => (
        <ItemRow key={item.name} item={item} />
      ))}
    </Card>
  )
}

export function SightsColumn() {
  return (
    <div>
      <ColumnHeading title="Key Sights & Interests" subtitle="Museums · parks · specialty coffee · vintage" />
      <Group title="Museums" items={MUSEUMS} />
      <Group title="Parks" items={PARKS} />
      <Group title="Specialty Coffee" items={COFFEE} />
      <Group title="Vintage Stores" items={VINTAGE} />
      <p className="text-[10px] leading-snug italic" style={{ color: MUTED }}>
        Jægersborggade covers three columns in one stop — vintage racks, design studios, and the Coffee Collective flagship on the same block. Good anchor for a slow morning.
      </p>
    </div>
  )
}
