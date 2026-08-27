/** Date and window formatting shared by the week band and the spot board. */

export function fmtDay(date: string, tz: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: tz })
}

export function fmtWeekday(date: string, tz: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz })
}

export function fmtMonthDay(date: string, tz: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz })
}

export function fmtWindow(startHour: number, endHour: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(startHour)}–${pad(endHour)}h`
}
