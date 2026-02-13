// Number formatters
export function currency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`
  return `$${val.toFixed(0)}`
}

export function percent(val: number): string {
  return `${val.toFixed(0)}%`
}

// Date formatters - re-exported from date-utils for backwards compatibility
export {
  localDateString,
  todayString,
  yesterdayString,
  weekStartDate,
  dateShort,
  dateFull,
  dayOfWeekShort,
  getLast7Days,
} from './date-utils'
