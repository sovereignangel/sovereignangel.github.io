export function currency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`
  return `$${val.toFixed(0)}`
}

export function percent(val: number): string {
  return `${val.toFixed(0)}%`
}

export function dateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function dateFull(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function weekStartDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function dayOfWeekShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

export function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}
