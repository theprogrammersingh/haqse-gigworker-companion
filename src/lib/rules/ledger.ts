import type { Earning, Platform } from '../schemas'
import { LOOKBACK_DAYS } from '../constants'
import { addDays, daysBetween } from '../utils/date'

/** Take-home for one entry: payout plus tips minus running costs. */
export const netOf = (e: Earning): number => e.gross + e.tips - e.fuel - e.otherCosts

/** Platform payout (before costs) per hour worked. */
export const payoutPerHour = (e: Earning): number => (e.gross + e.tips) / e.hours

/** Median of a list; NaN for an empty list. */
export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}

export interface PlatformStats {
  platform: Platform
  gross: number
  net: number
  hours: number
  days: number
  netPerHour: number
}

export interface TrendPoint {
  date: string
  net: number
}

export interface LedgerSummary {
  todayNet: number
  todayHours: number
  weekNet: number
  weekHours: number
  periodNet: number
  periodGross: number
  periodCosts: number
  periodHours: number
  /** Net per hour over the lookback window; 0 when no hours logged. */
  netPerHour: number
  /** Share of payout spent on fuel and other costs (0–1). */
  costShare: number
  perPlatform: PlatformStats[]
  trend: TrendPoint[]
  entryCount: number
}

/**
 * Aggregates the lookback window in a single pass over entries.
 * Entries outside [today - LOOKBACK_DAYS + 1, today] are ignored.
 */
export function summarizeLedger(entries: readonly Earning[], today: string): LedgerSummary {
  const start = addDays(today, -(LOOKBACK_DAYS - 1))
  const weekStart = addDays(today, -6)
  const trendMap = new Map<string, number>()
  const platforms = new Map<Platform, PlatformStats & { dates: Set<string> }>()
  const s = {
    todayNet: 0,
    todayHours: 0,
    weekNet: 0,
    weekHours: 0,
    net: 0,
    gross: 0,
    costs: 0,
    hours: 0,
    count: 0,
  }

  for (const e of entries) {
    if (e.date < start || e.date > today) continue
    const net = netOf(e)
    s.count += 1
    s.net += net
    s.gross += e.gross + e.tips
    s.costs += e.fuel + e.otherCosts
    s.hours += e.hours
    if (e.date === today) {
      s.todayNet += net
      s.todayHours += e.hours
    }
    if (e.date >= weekStart) {
      s.weekNet += net
      s.weekHours += e.hours
    }
    trendMap.set(e.date, (trendMap.get(e.date) ?? 0) + net)
    const p = platforms.get(e.platform) ?? {
      platform: e.platform,
      gross: 0,
      net: 0,
      hours: 0,
      days: 0,
      netPerHour: 0,
      dates: new Set<string>(),
    }
    p.gross += e.gross + e.tips
    p.net += net
    p.hours += e.hours
    p.dates.add(e.date)
    platforms.set(e.platform, p)
  }

  const perPlatform = [...platforms.values()]
    .map(({ dates, ...p }) => ({
      ...p,
      days: dates.size,
      netPerHour: p.hours ? p.net / p.hours : 0,
    }))
    .sort((a, b) => b.net - a.net)

  const trend: TrendPoint[] = []
  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const date = addDays(start, i)
    trend.push({ date, net: trendMap.get(date) ?? 0 })
  }

  return {
    todayNet: s.todayNet,
    todayHours: s.todayHours,
    weekNet: s.weekNet,
    weekHours: s.weekHours,
    periodNet: s.net,
    periodGross: s.gross,
    periodCosts: s.costs,
    periodHours: s.hours,
    netPerHour: s.hours ? s.net / s.hours : 0,
    costShare: s.gross ? s.costs / s.gross : 0,
    perPlatform,
    trend,
    entryCount: s.count,
  }
}

/** True when `date` falls within the lookback window ending at `today`. */
export const inLookback = (date: string, today: string): boolean => {
  const d = daysBetween(date, today)
  return d >= 0 && d < LOOKBACK_DAYS
}
