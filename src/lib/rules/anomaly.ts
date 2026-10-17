import type { Earning, Platform } from '../schemas'
import { ANOMALY_RATIO, LOOKBACK_DAYS, MIN_PRIOR_DAYS } from '../constants'
import { addDays } from '../utils/date'
import { median, payoutPerHour } from './ledger'

export interface Anomaly {
  entryId: string
  date: string
  platform: Platform
  hours: number
  actualPayout: number
  payoutPerHour: number
  expectedPerHour: number
  /** Payout the worker would have received at the median rate. */
  expectedPayout: number
  shortfall: number
  /** actual / expected per hour (0–1). */
  ratio: number
}

/**
 * Flags an entry whose payout per hour is below ANOMALY_RATIO of the median
 * of the same platform's previous LOOKBACK_DAYS days. Needs MIN_PRIOR_DAYS of history.
 */
export function checkAnomaly(entry: Earning, history: readonly Earning[]): Anomaly | null {
  // ISO dates compare as strings, so the window test allocates no Date objects.
  const from = addDays(entry.date, -LOOKBACK_DAYS)
  const prior: number[] = []
  for (const h of history) {
    if (h.platform !== entry.platform || h.id === entry.id) continue
    if (h.date < entry.date && h.date >= from) prior.push(payoutPerHour(h))
  }
  if (prior.length < MIN_PRIOR_DAYS) return null

  const expectedPerHour = median(prior)
  const actualPerHour = payoutPerHour(entry)
  const ratio = actualPerHour / expectedPerHour
  if (!(ratio < ANOMALY_RATIO)) return null

  const actualPayout = entry.gross + entry.tips
  const expectedPayout = Math.round(expectedPerHour * entry.hours)
  return {
    entryId: entry.id,
    date: entry.date,
    platform: entry.platform,
    hours: entry.hours,
    actualPayout,
    payoutPerHour: Math.round(actualPerHour),
    expectedPerHour: Math.round(expectedPerHour),
    expectedPayout,
    shortfall: expectedPayout - actualPayout,
    ratio: Math.round(ratio * 100) / 100,
  }
}

/** All anomalies in the lookback window ending at `today`, newest first, excluding dismissed ids. */
export function findAnomalies(
  entries: readonly Earning[],
  today: string,
  dismissed: readonly string[] = [],
): Anomaly[] {
  const skip = new Set(dismissed)
  const windowStart = addDays(today, -(LOOKBACK_DAYS - 1))
  // One pass to group by platform, so each check scans only its own platform's history.
  const byPlatform = new Map<Platform, Earning[]>()
  for (const e of entries) {
    const list = byPlatform.get(e.platform)
    if (list) list.push(e)
    else byPlatform.set(e.platform, [e])
  }
  const out: Anomaly[] = []
  for (const e of entries) {
    if (e.date < windowStart || e.date > today || skip.has(e.id)) continue
    const a = checkAnomaly(e, byPlatform.get(e.platform) ?? [])
    if (a) out.push(a)
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}
