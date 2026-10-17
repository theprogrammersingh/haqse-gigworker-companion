const pad = (n: number): string => String(n).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD (never UTC, so late-night shifts stay on the right day). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parses YYYY-MM-DD as a local date at midnight. */
export function fromISODate(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const ms = fromISODate(to).getTime() - fromISODate(from).getTime()
  return Math.round(ms / 86_400_000)
}

/** Monday-based ISO week key, e.g. "2026-W42". */
export function isoWeekKey(iso: string): string {
  const d = fromISODate(iso)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day + 3)
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    )
  return `${d.getFullYear()}-W${pad(week)}`
}

/** Formats a date for display in the user's language. */
export function formatDate(iso: string, locale: string): string {
  return fromISODate(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

export function formatDateTime(ms: number, locale: string): string {
  return new Date(ms).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
